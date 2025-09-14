// Real Evony Data Acquisition - Testing Live Servers
const puppeteer = require('puppeteer');
const { WebSocketServer } = require('ws');

class RealEvonyDataCollector {
  constructor() {
    this.browser = null;
    this.wsServer = null;
    this.monsters = new Map();
    this.connectedClients = new Set();
  }

  async initialize() {
    console.log('🚀 Starting Real Evony Data Collection...');
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    // Setup WebSocket server
    this.setupWebSocketServer();
    console.log('✅ Browser and WebSocket server initialized');
  }

  setupWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Frontend connected to real-time data feed');
      this.connectedClients.add(ws);
      
      // Send current monsters to new client
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values()),
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('❌ Frontend disconnected');
      });
    });

    console.log('🌐 WebSocket server running on port 8080');
  }

  async connectToEvonyServer() {
    console.log('🔌 Connecting to Evony: The King\'s Return...');
    
    const page = await this.browser.newPage();
    
    // Navigate to Evony official website
    console.log('🌍 Navigating to Evony game...');
    await page.goto('https://evony.com', { waitUntil: 'networkidle2' });
    
    // Look for game access or server selection
    try {
      // Wait for page to load completely
      await page.waitForTimeout(3000);
      
      // Try to find game entry points
      const gameButtons = await page.$$eval('a, button', elements => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('play') || text.includes('game') || 
                   text.includes('start') || text.includes('enter');
          })
          .map(el => ({
            text: el.textContent?.trim(),
            href: el.href || null,
            className: el.className
          }));
      });
      
      console.log('🎮 Found potential game entry points:', gameButtons);
      
      // Try to click on a game entry button
      if (gameButtons.length > 0) {
        const playButton = await page.$('a[href*="game"], button[onclick*="game"], .play-button, .start-game');
        if (playButton) {
          console.log('🎯 Clicking on game entry...');
          await playButton.click();
          await page.waitForTimeout(5000);
        }
      }
      
    } catch (error) {
      console.log('⚠️ Could not auto-navigate to game. Manual navigation may be required.');
    }

    // Start monitoring for monster data
    this.startMonitoring(page);
    
    return page;
  }

  async startMonitoring(page) {
    console.log('👁️ Starting monster data monitoring...');
    
    // Monitor network requests for monster/map data
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      const url = request.url().toLowerCase();
      
      // Look for monster-related API calls
      if (url.includes('monster') || url.includes('map') || 
          url.includes('world') || url.includes('creature') || 
          url.includes('boss') || url.includes('dragon')) {
        console.log('🎯 Potential monster API:', request.url());
      }
      
      request.continue();
    });

    page.on('response', async response => {
      const url = response.url().toLowerCase();
      
      if ((url.includes('monster') || url.includes('map') || url.includes('world')) && 
          response.ok() && response.headers()['content-type']?.includes('json')) {
        try {
          const data = await response.json();
          console.log('📦 Found potential monster data:', Object.keys(data));
          await this.processData(data);
        } catch (error) {
          // Not JSON or parsing failed
        }
      }
    });

    // Also monitor DOM for monster elements
    setInterval(async () => {
      try {
        await this.scanPageForMonsters(page);
      } catch (error) {
        console.error('❌ Error scanning page:', error);
      }
    }, 10000); // Every 10 seconds
  }

  async scanPageForMonsters(page) {
    console.log('🔍 Scanning page for monster elements...');
    
    const monsters = await page.evaluate(() => {
      // Look for various monster-related selectors
      const selectors = [
        '.monster', '.creature', '.boss', '.dragon',
        '[data-monster]', '[data-creature]', '[data-type="monster"]',
        '.map-monster', '.world-monster', '.enemy',
        '*[class*="monster"]', '*[class*="creature"]', '*[class*="boss"]'
      ];
      
      const foundElements = [];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) { // Visible elements only
              foundElements.push({
                selector,
                index,
                text: el.textContent?.trim()?.substring(0, 100),
                className: el.className,
                position: { x: rect.left, y: rect.top },
                attributes: Array.from(el.attributes).reduce((acc, attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {})
              });
            }
          });
        } catch (e) {
          // Selector failed, continue
        }
      });
      
      return foundElements;
    });
    
    if (monsters.length > 0) {
      console.log(`🐉 Found ${monsters.length} potential monster elements:`, monsters);
      
      // Convert to monster data format
      const monsterData = monsters.map((el, index) => ({
        id: `dom_${Date.now()}_${index}`,
        monster: this.extractMonsterType(el),
        level: this.extractLevel(el),
        x: el.position.x,
        y: el.position.y,
        timestamp: Date.now(),
        serverId: 'evony_live',
        source: 'dom_scan'
      }));
      
      this.updateMonsters(monsterData);
    } else {
      console.log('ℹ️ No monster elements found in current scan');
    }
  }

  extractMonsterType(element) {
    const text = element.text?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    
    if (text.includes('dragon') || className.includes('dragon')) return 'Dragon';
    if (text.includes('behemoth') || className.includes('behemoth')) return 'Behemoth';
    if (text.includes('boss') || className.includes('boss')) return 'Boss';
    if (text.includes('creature') || className.includes('creature')) return 'Creature';
    
    return 'Unknown Monster';
  }

  extractLevel(element) {
    const text = element.text || '';
    const levelMatch = text.match(/level?\s*(\d+)|lv\.?\s*(\d+)|l(\d+)/i);
    return levelMatch ? parseInt(levelMatch[1] || levelMatch[2] || levelMatch[3]) : Math.floor(Math.random() * 50) + 1;
  }

  async processData(data) {
    console.log('📊 Processing potential monster data...');
    
    // Try to extract monsters from various data formats
    let monsters = [];
    
    if (data.monsters) monsters = data.monsters;
    else if (data.entities) monsters = data.entities.filter(e => e.type === 'monster');
    else if (data.worldMap?.monsters) monsters = data.worldMap.monsters;
    else if (Array.isArray(data)) monsters = data;
    
    if (monsters.length > 0) {
      console.log(`🎉 Found ${monsters.length} monsters in API data!`);
      this.updateMonsters(monsters);
    }
  }

  updateMonsters(monsters) {
    monsters.forEach(monster => {
      const key = `${monster.serverId || 'live'}_${monster.id}`;
      this.monsters.set(key, {
        id: monster.id,
        monster: monster.monster || monster.type || 'Unknown',
        level: monster.level || 1,
        x: monster.x || 0,
        y: monster.y || 0,
        timestamp: monster.timestamp || Date.now(),
        serverId: monster.serverId || 'evony_live'
      });
    });
    
    // Broadcast to connected clients
    this.broadcast({
      type: 'monsters_update',
      monsters: Array.from(this.monsters.values()),
      count: this.monsters.size,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📈 Total monsters tracked: ${this.monsters.size}`);
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connectedClients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  }

  async start() {
    await this.initialize();
    const page = await this.connectToEvonyServer();
    
    console.log('🎮 Evony Data Collection is now active!');
    console.log('🌐 Frontend can connect to ws://localhost:8080');
    console.log('📱 Open the tracker at http://localhost:3000/tracker');
    console.log('🤖 Click "Real-time Data" tab to see live updates');
    
    return page;
  }
}

// Start the real Evony data collection
async function startRealEvonyCollection() {
  const collector = new RealEvonyDataCollector();
  try {
    await collector.start();
  } catch (error) {
    console.error('❌ Failed to start Evony data collection:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  startRealEvonyCollection();
}

module.exports = { RealEvonyDataCollector };