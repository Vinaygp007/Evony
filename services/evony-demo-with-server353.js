// Enhanced Evony Monster Demo with Server 353 Integration
const { WebSocketServer } = require('ws');

class EvonyDemoWithServer353 {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Set();
    this.monsters = new Map();
    this.serverInfo = {
      id: 'Server_353',
      name: 'EU Server 1',
      region: 'Europe',
      playerCount: 16000
    };
    this.monsterTypes = ['Dragon', 'Behemoth', 'Hydra', 'Phoenix', 'Manticore', 'Cyclops', 'Centaur', 'Gryphon', 'Cerberus'];
    this.locations = [
      { name: 'Thessaly', x: 350, y: 280 },
      { name: 'Abedam', x: 520, y: 180 },
      { name: 'Navafsa', x: 680, y: 320 },
      { name: 'Equatorial Guinea', x: 920, y: 450 },
      { name: 'Port Harcourt', x: 1100, y: 350 },
      { name: 'Abuja', x: 1200, y: 280 },
      { name: 'Delta', x: 1150, y: 400 },
      { name: 'Gabon', x: 980, y: 520 },
      { name: 'Cameroon', x: 850, y: 480 }
    ];
  }

  async initialize() {
    console.log('🚀 Starting Enhanced Evony Demo with Server 353 Data...');
    this.setupWebSocketServer();
    this.generateInitialMonsters();
    this.startMonsterSimulation();
  }

  setupWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log(`📡 Frontend connected to Server 353 demo feed`);
      this.connectedClients.add(ws);
      
      // Send current monsters to new client
      const monstersArray = Array.from(this.monsters.values());
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: monstersArray,
        server: this.serverInfo,
        timestamp: new Date().toISOString()
      }));

      console.log(`📊 Sent ${monstersArray.length} monsters to new client`);

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('❌ Frontend disconnected from Server 353 demo');
      });
    });

    console.log('🌐 Enhanced WebSocket server running on port 8080');
  }

  generateInitialMonsters() {
    console.log('🐉 Generating initial Server 353 monsters...');
    
    // Generate 25-35 monsters across the map
    const monsterCount = 25 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < monsterCount; i++) {
      const location = this.locations[Math.floor(Math.random() * this.locations.length)];
      const monster = this.createRandomMonster(location);
      this.monsters.set(monster.id, monster);
    }

    console.log(`✅ Generated ${this.monsters.size} initial monsters for Server 353`);
    this.broadcastMonsters('initial_generation');
  }

  createRandomMonster(baseLocation) {
    const monsterType = this.monsterTypes[Math.floor(Math.random() * this.monsterTypes.length)];
    const level = 30 + Math.floor(Math.random() * 70); // Level 30-100 for Server 353
    
    // Add some randomness around the base location
    const x = baseLocation.x + (Math.random() - 0.5) * 100;
    const y = baseLocation.y + (Math.random() - 0.5) * 100;
    
    return {
      id: `s353_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      monster: monsterType,
      level: level,
      x: Math.max(50, Math.min(1350, x)), // Keep within bounds
      y: Math.max(50, Math.min(600, y)),   // Keep within bounds
      timestamp: Date.now(),
      serverId: 'Server_353',
      server: 'EU Server 1',
      location: baseLocation.name,
      health: Math.floor(Math.random() * 40) + 60, // 60-100% health
      alliance: Math.random() > 0.7 ? this.getRandomAlliance() : null,
      source: 'server_353_demo'
    };
  }

  getRandomAlliance() {
    const alliances = ['WAR', 'FIRE', 'KING', 'DARK', 'GOLD', 'LION', 'WOLF', 'STAR'];
    return alliances[Math.floor(Math.random() * alliances.length)];
  }

  startMonsterSimulation() {
    console.log('⚡ Starting dynamic Server 353 monster simulation...');
    
    // Add new monsters periodically
    setInterval(() => {
      if (this.monsters.size < 40 && Math.random() > 0.3) {
        const location = this.locations[Math.floor(Math.random() * this.locations.length)];
        const monster = this.createRandomMonster(location);
        this.monsters.set(monster.id, monster);
        
        console.log(`🐲 New ${monster.monster} spawned at ${monster.location} (Level ${monster.level})`);
        this.broadcastMonsters('monster_spawn', [monster]);
      }
    }, 8000); // Every 8 seconds

    // Update existing monsters
    setInterval(() => {
      this.updateRandomMonster();
    }, 12000); // Every 12 seconds

    // Remove some monsters (defeated)
    setInterval(() => {
      if (this.monsters.size > 15 && Math.random() > 0.6) {
        this.removeRandomMonster();
      }
    }, 15000); // Every 15 seconds

    // Monster movement
    setInterval(() => {
      this.moveRandomMonster();
    }, 10000); // Every 10 seconds
  }

  updateRandomMonster() {
    const monsters = Array.from(this.monsters.values());
    if (monsters.length === 0) return;

    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    
    // Update health or level
    if (Math.random() > 0.5) {
      monster.health = Math.max(10, monster.health - Math.floor(Math.random() * 20));
    } else {
      monster.level = Math.min(100, monster.level + Math.floor(Math.random() * 3));
    }
    
    monster.timestamp = Date.now();
    this.monsters.set(monster.id, monster);
    
    console.log(`🔄 ${monster.monster} updated - Level ${monster.level}, Health ${monster.health}%`);
    this.broadcastMonsters('monster_update', [monster]);
  }

  removeRandomMonster() {
    const monsters = Array.from(this.monsters.values());
    if (monsters.length === 0) return;

    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    this.monsters.delete(monster.id);
    
    console.log(`💀 ${monster.monster} defeated at ${monster.location}`);
    this.broadcastMonsters('monster_defeat', [monster]);
  }

  moveRandomMonster() {
    const monsters = Array.from(this.monsters.values());
    if (monsters.length === 0) return;

    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    
    // Move to a new random location
    const newLocation = this.locations[Math.floor(Math.random() * this.locations.length)];
    monster.x = newLocation.x + (Math.random() - 0.5) * 80;
    monster.y = newLocation.y + (Math.random() - 0.5) * 80;
    monster.location = newLocation.name;
    monster.timestamp = Date.now();
    
    this.monsters.set(monster.id, monster);
    
    console.log(`🚶 ${monster.monster} moved to ${monster.location}`);
    this.broadcastMonsters('monster_move', [monster]);
  }

  broadcastMonsters(eventType, specificMonsters = null) {
    const data = {
      type: eventType,
      monsters: specificMonsters || Array.from(this.monsters.values()),
      count: this.monsters.size,
      server: this.serverInfo,
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(data);
    this.connectedClients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  async start() {
    await this.initialize();
    
    console.log('🎮 Enhanced Server 353 Demo is now active!');
    console.log('🏰 Simulating real monster activity on EU Server 1');
    console.log('🌐 Frontend can connect to ws://localhost:8080');
    console.log('📱 Open http://localhost:3000/tracker to see monsters');
    console.log('🎯 Select "EU Server 1" from the server filter');
    console.log(`📊 Current monsters: ${this.monsters.size}`);
  }
}

// Start the enhanced demo
async function startEnhancedDemo() {
  const demo = new EvonyDemoWithServer353();
  try {
    await demo.start();
  } catch (error) {
    console.error('❌ Failed to start enhanced demo:', error);
  }
}

if (require.main === module) {
  startEnhancedDemo();
}

module.exports = { EvonyDemoWithServer353 };