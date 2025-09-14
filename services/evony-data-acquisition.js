// Evony Data Acquisition Service using Puppeteer
const puppeteer = require('puppeteer');
const { WebSocketServer } = require('ws');
const fetch = require('node-fetch');

class EvonyDataAcquisition {
  constructor() {
    this.browser = null;
    this.pages = new Map(); // Map of server -> page
    this.wsServer = null;
    this.monsters = new Map(); // Current monster data
    this.isRunning = false;
  }

  async initialize() {
    console.log('🚀 Initializing Evony Data Acquisition System...');
    
    // Launch headless browser
    this.browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    // Setup WebSocket server for real-time updates
    this.setupWebSocketServer();
    
    console.log('✅ Browser and WebSocket server initialized');
  }

  setupWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Client connected to real-time monster feed');
      
      // Send current monster data to new client
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values())
      }));
    });

    console.log('🌐 WebSocket server running on port 8080');
  }

  async connectToEvonyServer(serverInfo) {
    const { serverId, region, url } = serverInfo;
    console.log(`🔌 Connecting to ${region} Server ${serverId}...`);

    const page = await this.browser.newPage();
    
    // Set up network interception
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      // Allow all requests but log API calls
      if (request.url().includes('api') || request.url().includes('monster')) {
        console.log('📦 API Request:', request.url());
      }
      request.continue();
    });

    // Intercept network responses for monster data
    page.on('response', async (response) => {
      if (response.url().includes('monster') || response.url().includes('world_map')) {
        try {
          const data = await response.json();
          await this.processMonsterData(data, serverId);
        } catch (error) {
          // Handle non-JSON responses
        }
      }
    });

    // Navigate to Evony web client
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Handle login automation (if needed)
    await this.handleLogin(page, serverInfo);
    
    // Start monitoring world map
    await this.startMapMonitoring(page, serverId);
    
    this.pages.set(serverId, page);
    return page;
  }

  async handleLogin(page, serverInfo) {
    console.log('🔐 Handling authentication...');
    
    try {
      // Wait for login elements
      await page.waitForSelector('.login-container', { timeout: 10000 });
      
      // Auto-login if credentials provided
      if (serverInfo.username && serverInfo.password) {
        await page.type('#username', serverInfo.username);
        await page.type('#password', serverInfo.password);
        await page.click('.login-button');
        
        // Wait for game to load
        await page.waitForSelector('.world-map', { timeout: 30000 });
      }
    } catch (error) {
      console.log('⚠️ Manual login required or login failed');
    }
  }

  async startMapMonitoring(page, serverId) {
    console.log(`🗺️ Starting map monitoring for server ${serverId}...`);
    
    // Inject monitoring script into the page
    await page.evaluateOnNewDocument(() => {
      // Override fetch to capture monster API calls
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('monster') || url.includes('world_map')) {
          console.log('🎯 Monster API Call:', url);
          
          return originalFetch.apply(this, args).then(response => {
            if (response.ok) {
              response.clone().json().then(data => {
                // Emit monster data to our acquisition system
                window.postMessage({
                  type: 'MONSTER_DATA',
                  data: data,
                  serverId: window.CURRENT_SERVER_ID
                }, '*');
              });
            }
            return response;
          });
        }
        
        return originalFetch.apply(this, args);
      };
    });

    // Listen for monster data messages
    page.on('console', (msg) => {
      if (msg.text().includes('🎯 Monster API Call:')) {
        console.log('📊 Detected monster data update');
      }
    });

    // Periodic map scanning
    setInterval(async () => {
      try {
        await this.scanWorldMap(page, serverId);
      } catch (error) {
        console.error('❌ Error scanning world map:', error);
      }
    }, 30000); // Scan every 30 seconds
  }

  async scanWorldMap(page, serverId) {
    console.log(`🔍 Scanning world map for server ${serverId}...`);
    
    try {
      // Extract monster data from DOM
      const monsters = await page.evaluate(() => {
        const monsterElements = document.querySelectorAll('.monster-marker, .world-monster, [data-monster-id]');
        const monsters = [];
        
        monsterElements.forEach(element => {
          const monsterData = {
            id: element.dataset.monsterId || `monster_${Date.now()}_${Math.random()}`,
            type: element.dataset.monsterType || 'Unknown',
            level: parseInt(element.dataset.level) || 1,
            x: parseFloat(element.dataset.x) || 0,
            y: parseFloat(element.dataset.y) || 0,
            timestamp: Date.now(),
            health: element.dataset.health || '100%',
            alliance: element.dataset.alliance || null
          };
          
          monsters.push(monsterData);
        });
        
        return monsters;
      });

      // Process and broadcast monster updates
      if (monsters.length > 0) {
        await this.processMonsterData({ monsters }, serverId);
      }
      
    } catch (error) {
      console.error('❌ Error extracting monster data:', error);
    }
  }

  async processMonsterData(data, serverId) {
    if (!data.monsters) return;
    
    console.log(`📊 Processing ${data.monsters.length} monsters from server ${serverId}`);
    
    data.monsters.forEach(monster => {
      const monsterKey = `${serverId}_${monster.id}`;
      const existingMonster = this.monsters.get(monsterKey);
      
      // Add server info to monster data
      monster.serverId = serverId;
      monster.lastUpdated = Date.now();
      
      // Check if this is a new monster or update
      if (!existingMonster || existingMonster.timestamp < monster.timestamp) {
        this.monsters.set(monsterKey, monster);
        
        // Broadcast update to connected clients
        this.broadcastMonsterUpdate({
          type: existingMonster ? 'monster_update' : 'monster_spawn',
          monster: monster
        });
      }
    });
    
    // Clean up old monsters (older than 10 minutes)
    this.cleanupOldMonsters();
  }

  broadcastMonsterUpdate(update) {
    const message = JSON.stringify(update);
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  cleanupOldMonsters() {
    const cutoffTime = Date.now() - (10 * 60 * 1000); // 10 minutes
    let removedCount = 0;
    
    for (const [key, monster] of this.monsters.entries()) {
      if (monster.lastUpdated < cutoffTime) {
        this.monsters.delete(key);
        removedCount++;
        
        // Broadcast monster removal
        this.broadcastMonsterUpdate({
          type: 'monster_remove',
          monsterId: monster.id,
          serverId: monster.serverId
        });
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old monsters`);
    }
  }

  async startMultiServerMonitoring(servers) {
    console.log(`🌍 Starting monitoring for ${servers.length} servers...`);
    
    for (const server of servers) {
      try {
        await this.connectToEvonyServer(server);
        console.log(`✅ Connected to ${server.region} Server ${server.serverId}`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${server.region} Server ${server.serverId}:`, error);
      }
    }
    
    this.isRunning = true;
    console.log('🚀 Multi-server monitoring active!');
  }

  async stop() {
    console.log('🛑 Stopping Evony Data Acquisition...');
    
    this.isRunning = false;
    
    // Close all browser pages
    for (const page of this.pages.values()) {
      await page.close();
    }
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
    }
    
    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('✅ Data acquisition stopped');
  }
}

// Usage example
async function startEvonyTracking() {
  const acquisition = new EvonyDataAcquisition();
  await acquisition.initialize();
  
  // Define servers to monitor
  const servers = [
    {
      serverId: 'us1',
      region: 'US',
      url: 'https://evony.com/game/us1',
      username: process.env.EVONY_USERNAME,
      password: process.env.EVONY_PASSWORD
    },
    {
      serverId: 'eu1',
      region: 'EU',
      url: 'https://evony.com/game/eu1',
      username: process.env.EVONY_USERNAME_EU,
      password: process.env.EVONY_PASSWORD_EU
    }
  ];
  
  await acquisition.startMultiServerMonitoring(servers);
}

module.exports = { EvonyDataAcquisition, startEvonyTracking };
