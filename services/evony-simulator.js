// Demo Evony Data Simulator - Shows how real data would flow
const { WebSocketServer } = require('ws');

class EvonyDataSimulator {
  constructor() {
    this.wsServer = null;
    this.monsters = new Map();
    this.connectedClients = new Set();
    this.intervalId = null;
  }

  async initialize() {
    console.log('🎮 Starting Evony Data Simulator (Demo Mode)...');
    console.log('📡 This simulates real monster data from Evony servers');
    
    this.setupWebSocketServer();
    this.generateInitialMonsters();
    this.startSimulation();
  }

  setupWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Frontend connected to simulated Evony data feed');
      this.connectedClients.add(ws);
      
      // Send current monsters to new client
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values()),
        timestamp: new Date().toISOString(),
        source: 'evony_simulator'
      }));

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('❌ Frontend disconnected');
      });
    });

    console.log('🌐 WebSocket server running on port 8080');
  }

  generateInitialMonsters() {
    const monsterTypes = [
      'Dragon', 'Behemoth', 'Hydra', 'Phoenix', 'Manticore', 
      'Cyclops', 'Centaur', 'Gryphon', 'Cerberus', 'Minotaur'
    ];
    
    const servers = ['US East 1', 'US West 2', 'EU Central', 'Asia Pacific'];
    
    // Generate 50 initial monsters across different servers
    for (let i = 0; i < 50; i++) {
      const monster = {
        id: `monster_${i}`,
        monster: monsterTypes[Math.floor(Math.random() * monsterTypes.length)],
        level: Math.floor(Math.random() * 50) + 1,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        timestamp: Date.now() - Math.random() * 300000, // Last 5 minutes
        serverId: servers[Math.floor(Math.random() * servers.length)],
        health: `${Math.floor(Math.random() * 100)}%`,
        alliance: Math.random() > 0.7 ? `Alliance_${Math.floor(Math.random() * 10)}` : null
      };
      
      this.monsters.set(`${monster.serverId}_${monster.id}`, monster);
    }
    
    console.log(`🐉 Generated ${this.monsters.size} initial monsters across ${servers.length} servers`);
  }

  startSimulation() {
    console.log('⚡ Starting real-time monster simulation...');
    
    this.intervalId = setInterval(() => {
      this.simulateMonsterActivity();
    }, 3000); // Update every 3 seconds
    
    console.log('🎮 Evony Data Simulation is now active!');
    console.log('🌐 Frontend can connect to ws://localhost:8080');
    console.log('📱 Open http://localhost:3000/tracker and click "Real-time Data" tab');
    console.log('🔄 Monster data will update every 3 seconds');
  }

  simulateMonsterActivity() {
    const activities = ['spawn', 'move', 'update', 'remove'];
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    switch (activity) {
      case 'spawn':
        this.spawnNewMonster();
        break;
      case 'move':
        this.moveRandomMonster();
        break;
      case 'update':
        this.updateRandomMonster();
        break;
      case 'remove':
        if (this.monsters.size > 10) { // Keep minimum monsters
          this.removeRandomMonster();
        }
        break;
    }
  }

  spawnNewMonster() {
    const monsterTypes = ['Dragon', 'Behemoth', 'Hydra', 'Phoenix', 'Manticore'];
    const servers = ['US East 1', 'US West 2', 'EU Central', 'Asia Pacific'];
    
    const monster = {
      id: `monster_${Date.now()}_${Math.random()}`,
      monster: monsterTypes[Math.floor(Math.random() * monsterTypes.length)],
      level: Math.floor(Math.random() * 50) + 1,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      timestamp: Date.now(),
      serverId: servers[Math.floor(Math.random() * servers.length)],
      health: '100%'
    };
    
    const key = `${monster.serverId}_${monster.id}`;
    this.monsters.set(key, monster);
    
    this.broadcast({
      type: 'monster_spawn',
      monster: monster,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🐉 New ${monster.monster} spawned on ${monster.serverId} (Level ${monster.level})`);
  }

  moveRandomMonster() {
    const monsterKeys = Array.from(this.monsters.keys());
    if (monsterKeys.length === 0) return;
    
    const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const monster = this.monsters.get(randomKey);
    
    // Move monster slightly
    monster.x += (Math.random() - 0.5) * 100;
    monster.y += (Math.random() - 0.5) * 100;
    monster.timestamp = Date.now();
    
    this.monsters.set(randomKey, monster);
    
    this.broadcast({
      type: 'monster_update',
      monster: monster,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🚶 ${monster.monster} moved to (${Math.round(monster.x)}, ${Math.round(monster.y)})`);
  }

  updateRandomMonster() {
    const monsterKeys = Array.from(this.monsters.keys());
    if (monsterKeys.length === 0) return;
    
    const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const monster = this.monsters.get(randomKey);
    
    // Update health or level
    if (Math.random() > 0.5) {
      monster.health = `${Math.floor(Math.random() * 100)}%`;
    } else {
      monster.level = Math.max(1, monster.level + (Math.random() > 0.5 ? 1 : -1));
    }
    
    monster.timestamp = Date.now();
    this.monsters.set(randomKey, monster);
    
    this.broadcast({
      type: 'monster_update',
      monster: monster,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🔄 ${monster.monster} updated - Level ${monster.level}, Health ${monster.health}`);
  }

  removeRandomMonster() {
    const monsterKeys = Array.from(this.monsters.keys());
    if (monsterKeys.length === 0) return;
    
    const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const monster = this.monsters.get(randomKey);
    
    this.monsters.delete(randomKey);
    
    this.broadcast({
      type: 'monster_remove',
      monsterId: monster.id,
      serverId: monster.serverId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`💀 ${monster.monster} defeated on ${monster.serverId}`);
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connectedClients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('🛑 Evony Data Simulation stopped');
  }
}

// Start the simulation
const simulator = new EvonyDataSimulator();
simulator.initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simulator...');
  simulator.stop();
  process.exit(0);
});

module.exports = { EvonyDataSimulator };