// Streamlined Real Monster Location Extractor
// Only essential code for extracting monster coordinates

const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

class MonsterLocationExtractor {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Set();
    this.monsters = new Map();
    this.evonyPID = null;
    this.currentServer = 'Unknown';
    this.monitoringActive = false;
  }

  async initialize() {
    console.log('🎯 Starting Monster Location Extractor');
    
    // Setup WebSocket for results
    this.setupWebSocket();
    
    // Find Evony process
    await this.findEvonyProcess();
    
    // Start monitoring for monster data
    this.startMonitoring();
    
    console.log('✅ Monster location extractor ready');
  }

  setupWebSocket() {
    this.wsServer = new WebSocketServer({ port: 8082 });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Frontend connected');
      this.connectedClients.add(ws);
      
      ws.send(JSON.stringify({
        type: 'monster_data',
        monsters: Array.from(this.monsters.values()),
        server: this.currentServer,
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.connectedClients.delete(ws);
      });
    });

    console.log('🌐 Results available on port 8082');
  }

  async findEvonyProcess() {
    console.log('🔍 Finding Evony process...');
    
    return new Promise((resolve) => {
      exec('powershell "Get-Process evony -ErrorAction SilentlyContinue | Select-Object Id"', (error, stdout) => {
        if (stdout && stdout.trim()) {
          const pidMatch = stdout.match(/\b\d+\b/);
          if (pidMatch) {
            this.evonyPID = parseInt(pidMatch[0]);
            console.log(`✅ Found Evony process: PID ${this.evonyPID}`);
          }
        }
        
        if (!this.evonyPID) {
          console.log('❌ Evony not found. Please start Evony game.');
        }
        
        resolve();
      });
    });
  }

  startMonitoring() {
    if (!this.evonyPID) {
      console.log('❌ Cannot monitor without Evony process');
      return;
    }

    console.log('🔄 Starting monster location monitoring...');
    this.monitoringActive = true;
    
    // Monitor network traffic for monster data
    this.monitorNetworkTraffic();
    
    // Monitor game files for cached monster data
    this.monitorGameFiles();
    
    console.log('👀 Watching for monster coordinates...');
  }

  monitorNetworkTraffic() {
    const checkTraffic = () => {
      if (!this.monitoringActive) return;
      
      exec(`netstat -ano | findstr ${this.evonyPID}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            if (line.includes('ESTABLISHED') && line.includes(':443')) {
              const parts = line.trim().split(/\s+/);
              const serverIP = parts[2];
              
              // Only log when server changes
              if (serverIP && serverIP !== this.currentServer) {
                this.currentServer = serverIP;
                console.log(`🎯 Connected to game server: ${serverIP}`);
              }
            }
          });
        }
      });
    };

    // Check every 30 seconds instead of 5 to reduce spam
    setInterval(checkTraffic, 30000);
  }

  monitorGameFiles() {
    // Watch common Evony data locations
    const watchPaths = [
      path.join(process.env.APPDATA, 'Evony'),
      path.join(process.env.LOCALAPPDATA, 'Evony'),
      path.join(process.env.USERPROFILE, 'Documents', 'Evony')
    ];

    watchPaths.forEach(watchPath => {
      try {
        if (fs.existsSync(watchPath)) {
          console.log(`📁 Watching: ${watchPath}`);
          
          fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.includes('data') || filename.includes('cache') || filename.includes('monster'))) {
              this.scanFileForMonsters(path.join(watchPath, filename));
            }
          });
        }
      } catch {
        // Path not accessible, silently ignore
      }
    });
  }

  scanFileForMonsters(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      
      // Look for coordinate patterns: {"x":123,"y":456}
      const coordRegex = /\{[^}]*"x"\s*:\s*(\d+)[^}]*"y"\s*:\s*(\d+)[^}]*\}/g;
      let match;
      
      while ((match = coordRegex.exec(data)) !== null) {
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);
        
        if (this.isValidCoordinate(x, y)) {
          this.extractMonsterFromContext(data, match.index, x, y);
        }
      }
      
      // Look for simple coordinate pairs: 123,456
      const simpleCoordRegex = /\b(\d{1,3}),\s*(\d{1,3})\b/g;
      while ((match = simpleCoordRegex.exec(data)) !== null) {
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);
        
        if (this.isValidCoordinate(x, y)) {
          this.foundMonsterLocation(x, y, 'Unknown', 1, 'file_scan');
        }
      }
      
    } catch {
      // File not readable or binary, silently ignore
    }
  }

  extractMonsterFromContext(data, index, x, y) {
    // Look around the coordinate for monster information
    const contextStart = Math.max(0, index - 200);
    const contextEnd = Math.min(data.length, index + 200);
    const context = data.substring(contextStart, contextEnd);
    
    // Extract monster type
    let monsterType = 'Unknown';
    const typeMatches = context.match(/"type"\s*:\s*"([^"]+)"|"monster"\s*:\s*"([^"]+)"|"name"\s*:\s*"([^"]+)"/i);
    if (typeMatches) {
      monsterType = typeMatches[1] || typeMatches[2] || typeMatches[3];
    }
    
    // Extract level
    let level = 1;
    const levelMatches = context.match(/"level"\s*:\s*(\d+)|"lv"\s*:\s*(\d+)|"lvl"\s*:\s*(\d+)/i);
    if (levelMatches) {
      level = parseInt(levelMatches[1] || levelMatches[2] || levelMatches[3]);
    }
    
    this.foundMonsterLocation(x, y, monsterType, level, 'api_data');
  }

  isValidCoordinate(x, y) {
    return x > 0 && x < 1000 && y > 0 && y < 1000;
  }

  foundMonsterLocation(x, y, type, level, source) {
    const monsterId = `${x}_${y}`;  // Simplified ID without timestamp
    
    // Check if we already have this monster location
    const existing = this.monsters.get(monsterId);
    if (existing && existing.type !== 'Unknown' && type === 'Unknown') {
      return; // Don't overwrite good data with unknown data
    }
    
    const monster = {
      id: monsterId,
      x: x,
      y: y,
      type: type,
      level: level,
      server: this.currentServer,
      source: source,
      timestamp: Date.now(),
      lastUpdated: Date.now()
    };
    
    // Only log if it's a new location or better data
    if (!existing || existing.type === 'Unknown') {
      this.monsters.set(monsterId, monster);
      console.log(`🎯 MONSTER FOUND: ${type} Level ${level} at (${x}, ${y}) [${source}]`);
      
      // Broadcast to frontend
      this.broadcast({
        type: 'new_monster',
        monster: monster,
        timestamp: new Date().toISOString()
      });
    } else {
      // Just update timestamp if it's the same monster
      existing.lastUpdated = Date.now();
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connectedClients.forEach(client => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  }

  async start() {
    try {
      await this.initialize();
      
      console.log('');
      console.log('🎮 MONSTER LOCATION EXTRACTOR ACTIVE!');
      console.log('📊 Monster data: http://localhost:8082');
      console.log('');
      console.log('📋 In your Evony game:');
      console.log('1. Navigate to World Map');
      console.log('2. Look at monster locations');
      console.log('3. Click on monsters to load their data');
      console.log('4. Use Alliance → Monster Hunt');
      console.log('');
      
      // Send a test monster after 3 seconds to verify website connection
      setTimeout(() => {
        console.log('🧪 Sending test monster to verify website connection...');
        this.foundMonsterLocation(250, 350, 'Cerberus', 7, 'connection_test');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Failed to start extractor:', error);
    }
  }

  stop() {
    console.log('⏹️  Stopping monster extractor...');
    this.monitoringActive = false;
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('✅ Monster extractor stopped');
  }
}

// Start the streamlined extractor
const extractor = new MonsterLocationExtractor();

extractor.start().catch(error => {
  console.error('💥 Critical error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  extractor.stop();
  process.exit(0);
});

module.exports = MonsterLocationExtractor;