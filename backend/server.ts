// Express.js Backend Server with Socket.IO and PostgreSQL
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface MonsterData {
  id: string;
  monster_type: string;
  level: number;
  x: number;
  y: number;
  health: string;
  alliance?: string;
  server_id: string;
  timestamp: Date;
  last_updated: Date;
}

class EvonyBackendServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private dbPool: Pool;
  private port: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = parseInt(process.env.BACKEND_PORT || '3001');
    
    // PostgreSQL connection with PostGIS support
    this.dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'evony_monsters',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.setupMiddleware();
    this.setupDatabase();
    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private async setupDatabase(): Promise<void> {
    try {
      // Create database tables with PostGIS support
      await this.dbPool.query(`
        CREATE EXTENSION IF NOT EXISTS postgis;
        
        CREATE TABLE IF NOT EXISTS monsters (
          id VARCHAR(255) PRIMARY KEY,
          monster_type VARCHAR(100) NOT NULL,
          level INTEGER NOT NULL,
          position GEOMETRY(POINT, 4326) NOT NULL,
          health VARCHAR(50),
          alliance VARCHAR(100),
          server_id VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_monsters_server_id ON monsters(server_id);
        CREATE INDEX IF NOT EXISTS idx_monsters_type ON monsters(monster_type);
        CREATE INDEX IF NOT EXISTS idx_monsters_level ON monsters(level);
        CREATE INDEX IF NOT EXISTS idx_monsters_position ON monsters USING GIST(position);
        CREATE INDEX IF NOT EXISTS idx_monsters_timestamp ON monsters(timestamp);

        CREATE TABLE IF NOT EXISTS monster_history (
          id SERIAL PRIMARY KEY,
          monster_id VARCHAR(255) NOT NULL,
          action VARCHAR(20) NOT NULL, -- 'spawn', 'update', 'remove'
          data JSONB NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_monster_history_monster_id ON monster_history(monster_id);
        CREATE INDEX IF NOT EXISTS idx_monster_history_timestamp ON monster_history(timestamp);

        CREATE TABLE IF NOT EXISTS servers (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          region VARCHAR(50) NOT NULL,
          url VARCHAR(255),
          active BOOLEAN DEFAULT true,
          last_scan TIMESTAMP WITH TIME ZONE,
          monster_count INTEGER DEFAULT 0
        );
      `);

      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Database setup error:', error);
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // Get all monsters
    this.app.get('/api/monsters', async (req, res) => {
      try {
        const { server_id, monster_type, min_level, max_level, bounds } = req.query;
        
        let query = `
          SELECT 
            id, 
            monster_type, 
            level, 
            ST_X(position) as x, 
            ST_Y(position) as y, 
            health, 
            alliance, 
            server_id, 
            timestamp, 
            last_updated 
          FROM monsters 
          WHERE 1=1
        `;
        const queryParams: any[] = [];
        let paramCounter = 1;

        if (server_id) {
          query += ` AND server_id = $${paramCounter++}`;
          queryParams.push(server_id);
        }

        if (monster_type) {
          query += ` AND monster_type = $${paramCounter++}`;
          queryParams.push(monster_type);
        }

        if (min_level) {
          query += ` AND level >= $${paramCounter++}`;
          queryParams.push(parseInt(min_level as string));
        }

        if (max_level) {
          query += ` AND level <= $${paramCounter++}`;
          queryParams.push(parseInt(max_level as string));
        }

        // Spatial query for map bounds
        if (bounds) {
          const [west, south, east, north] = (bounds as string).split(',').map(Number);
          query += ` AND ST_Within(position, ST_MakeEnvelope($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++}, 4326))`;
          queryParams.push(west, south, east, north);
        }

        query += ` ORDER BY last_updated DESC LIMIT 1000`;

        const result = await this.dbPool.query(query, queryParams);
        res.json({
          monsters: result.rows,
          count: result.rows.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error fetching monsters:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Add or update monster
    this.app.post('/api/monsters', async (req, res) => {
      try {
        const monsters: MonsterData[] = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];

        for (const monster of monsters) {
          const result = await this.upsertMonster(monster);
          results.push(result);
          
          // Emit real-time update
          this.io.emit('monster_update', {
            type: 'monster_spawn',
            monster: result
          });
        }

        res.json({
          success: true,
          processed: results.length,
          monsters: results
        });
      } catch (error) {
        console.error('❌ Error adding monsters:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Remove monster
    this.app.delete('/api/monsters/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { server_id } = req.query;

        const result = await this.dbPool.query(
          'DELETE FROM monsters WHERE id = $1 AND server_id = $2 RETURNING *',
          [id, server_id]
        );

        if (result.rows.length > 0) {
          // Log to history
          await this.dbPool.query(
            'INSERT INTO monster_history (monster_id, action, data) VALUES ($1, $2, $3)',
            [id, 'remove', JSON.stringify(result.rows[0])]
          );

          // Emit real-time update
          this.io.emit('monster_update', {
            type: 'monster_remove',
            monsterId: id,
            serverId: server_id
          });

          res.json({ success: true, monster: result.rows[0] });
        } else {
          res.status(404).json({ error: 'Monster not found' });
        }
      } catch (error) {
        console.error('❌ Error removing monster:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get server statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.dbPool.query(`
          SELECT 
            COUNT(*) as total_monsters,
            COUNT(DISTINCT server_id) as active_servers,
            COUNT(DISTINCT monster_type) as monster_types,
            AVG(level) as avg_level,
            MAX(last_updated) as last_activity
          FROM monsters
        `);

        const serverStats = await this.dbPool.query(`
          SELECT 
            server_id,
            COUNT(*) as monster_count,
            COUNT(DISTINCT monster_type) as type_count,
            AVG(level) as avg_level,
            MAX(last_updated) as last_activity
          FROM monsters 
          GROUP BY server_id
          ORDER BY monster_count DESC
        `);

        res.json({
          overall: stats.rows[0],
          servers: serverStats.rows,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Cleanup old monsters
    this.app.post('/api/cleanup', async (req, res) => {
      try {
        const { olderThan = 10 } = req.body; // minutes
        
        const result = await this.dbPool.query(`
          DELETE FROM monsters 
          WHERE last_updated < NOW() - INTERVAL '${olderThan} minutes'
          RETURNING id, monster_type, server_id
        `);

        // Emit cleanup notification
        this.io.emit('cleanup_completed', {
          removedCount: result.rows.length,
          monsters: result.rows
        });

        res.json({
          success: true,
          removedCount: result.rows.length,
          removedMonsters: result.rows
        });
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  private async upsertMonster(monster: MonsterData): Promise<any> {
    const query = `
      INSERT INTO monsters (id, monster_type, level, position, health, alliance, server_id, timestamp, last_updated)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        monster_type = EXCLUDED.monster_type,
        level = EXCLUDED.level,
        position = EXCLUDED.position,
        health = EXCLUDED.health,
        alliance = EXCLUDED.alliance,
        last_updated = EXCLUDED.last_updated
      RETURNING id, monster_type, level, ST_X(position) as x, ST_Y(position) as y, health, alliance, server_id, timestamp, last_updated
    `;

    const values = [
      monster.id,
      monster.monster_type,
      monster.level,
      monster.x,
      monster.y,
      monster.health,
      monster.alliance,
      monster.server_id,
      monster.timestamp,
      monster.last_updated
    ];

    const result = await this.dbPool.query(query, values);
    
    // Log to history
    await this.dbPool.query(
      'INSERT INTO monster_history (monster_id, action, data) VALUES ($1, $2, $3)',
      [monster.id, 'upsert', JSON.stringify(result.rows[0])]
    );

    return result.rows[0];
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Send initial data
      socket.emit('connected', {
        message: 'Connected to Evony Monster Tracker',
        timestamp: new Date().toISOString()
      });

      // Handle client requests
      socket.on('request_monsters', async (data) => {
        try {
          const monsters = await this.dbPool.query(`
            SELECT 
              id, monster_type, level, 
              ST_X(position) as x, ST_Y(position) as y, 
              health, alliance, server_id, timestamp, last_updated 
            FROM monsters 
            WHERE server_id = $1 OR $1 IS NULL
            ORDER BY last_updated DESC 
            LIMIT 500
          `, [data.serverId || null]);

          socket.emit('initial_monsters', {
            monsters: monsters.rows,
            count: monsters.rows.length
          });
        } catch (error) {
          console.error('❌ Error sending initial monsters:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    // Periodic cleanup
    setInterval(async () => {
      try {
        const result = await this.dbPool.query(`
          DELETE FROM monsters 
          WHERE last_updated < NOW() - INTERVAL '10 minutes'
          RETURNING COUNT(*)
        `);
        
        if (result.rows[0].count > 0) {
          console.log(`🧹 Cleaned up ${result.rows[0].count} old monsters`);
          this.io.emit('cleanup_notification', {
            removedCount: result.rows[0].count
          });
        }
      } catch (error) {
        console.error('❌ Cleanup error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.dbPool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');

      this.server.listen(this.port, () => {
        console.log(`🚀 Evony Backend Server running on port ${this.port}`);
        console.log(`📊 API available at http://localhost:${this.port}/api`);
        console.log(`⚡ Socket.IO available at http://localhost:${this.port}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 Shutting down server...');
    await this.dbPool.end();
    this.server.close();
  }
}

// Start server
const server = new EvonyBackendServer();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

export default EvonyBackendServer;
