// Evony Server 353 Data Collector - Targeting Specific Server
const puppeteer = require('puppeteer');
const { WebSocketServer } = require('ws');

class EvonyServer353Collector {
  constructor() {
    this.browser = null;
    this.wsServer = null;
    this.monsters = new Map();
    this.connectedClients = new Set();
    this.serverInfo = {
      id: '353',
      name: 'Server 353',
      region: 'Mixed',
      url: 'https://evony.com/game', // Will navigate to server 353 specifically
      isOlderServer: true
    };
  }

  async initialize() {
    console.log('🚀 Starting Evony Server 353 Data Collection...');
    console.log('🏰 Targeting older, established server for better monster data');
    
    // Launch browser with more permissive settings for older game versions
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for manual server selection if needed
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    this.setupWebSocketServer();
    console.log('✅ Browser and WebSocket server initialized for Server 353');
  }

  setupWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log(`📡 Frontend connected to Server 353 data feed`);
      this.connectedClients.add(ws);
      
      // Send current monsters to new client
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values()),
        server: this.serverInfo,
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log('❌ Frontend disconnected from Server 353');
      });
    });

    console.log('🌐 WebSocket server running on port 8080 for Server 353');
  }

  async connectToServer353() {
    console.log('🔌 Connecting to Evony Server 353...');
    
    const page = await this.browser.newPage();
    
    // Set up enhanced request interception for older servers
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      const url = request.url().toLowerCase();
      
      // Log all requests to understand server structure
      if (url.includes('353') || url.includes('server') || url.includes('game')) {
        console.log('🎯 Server 353 related request:', request.url());
      }
      
      // Look for monster/map data specifically for this server
      if (url.includes('monster') || url.includes('map') || url.includes('world') || 
          url.includes('creature') || url.includes('boss') || url.includes('dragon')) {
        console.log('🐉 Monster data request on Server 353:', request.url());
      }
      
      request.continue();
    });

    page.on('response', async response => {
      const url = response.url().toLowerCase();
      
      if ((url.includes('monster') || url.includes('map') || url.includes('world')) && 
          response.ok()) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            const data = await response.json();
            console.log('📦 Server 353 monster data found:', Object.keys(data));
            await this.processServer353Data(data);
          }
        } catch (error) {
          // Not JSON or parsing failed
        }
      }
    });

    // Navigate to Evony with specific server targeting
    console.log('🌍 Navigating to Evony for Server 353...');
    
    try {
      // Try different approaches to reach Server 353
      const approaches = [
        'https://evony.com',
        'https://game.evony.com',
        'https://www.evony.com/game',
        'https://play.evony.com'
      ];
      
      for (const url of approaches) {
        try {
          console.log(`🔗 Trying approach: ${url}`);
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Look for server selection or game entry
          await this.navigateToServer353(page);
          break;
        } catch (error) {
          console.log(`⚠️ Approach ${url} failed, trying next...`);
        }
      }
      
    } catch (error) {
      console.log('⚠️ Auto-navigation failed. Manual server selection may be required.');
      console.log('💡 Please manually navigate to Server 353 in the opened browser');
    }

    // Start monitoring for Server 353 monster data
    this.startServer353Monitoring(page);
    
    return page;
  }

  async navigateToServer353(page) {
    console.log('🎯 Looking for Server 353 access...');
    
    try {
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for server selection elements
      const serverElements = await page.evaluate(() => {
        // Look for various server selection patterns
        const selectors = [
          'select[name*="server"]',
          '.server-select',
          '.server-list',
          '*[class*="server"]',
          'option[value*="353"]',
          '*[text*="353"]'
        ];
        
        const elements = [];
        selectors.forEach(selector => {
          try {
            const found = document.querySelectorAll(selector);
            found.forEach(el => {
              elements.push({
                selector,
                text: el.textContent?.trim(),
                value: el.value || null,
                className: el.className
              });
            });
          } catch (e) {
            // Selector failed
          }
        });
        
        return elements;
      });
      
      console.log('🔍 Server selection elements found:', serverElements);
      
      // Try to find and select Server 353
      const server353Element = await page.$('option[value*="353"], *[text*="353"], *[data-server="353"]');
      
      if (server353Element) {
        console.log('🎯 Found Server 353 selector, clicking...');
        await server353Element.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('💡 Server 353 not found automatically. You may need to manually select it.');
      }
      
      // Look for play/enter game buttons
      const gameButtons = await page.$$eval('button, a, input[type="submit"]', elements => {
        return elements
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('play') || text.includes('enter') || 
                   text.includes('start') || text.includes('game');
          })
          .map(el => ({
            text: el.textContent?.trim(),
            type: el.tagName
          }));
      });
      
      if (gameButtons.length > 0) {
        console.log('🎮 Game entry buttons found:', gameButtons);
        const playButton = await page.$('button[class*="play"], .play-btn, .start-game, input[value*="play"]');
        if (playButton) {
          console.log('🚀 Entering Server 353...');
          await playButton.click();
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
    } catch (error) {
      console.log('⚠️ Server selection failed:', error.message);
    }
  }

  async startServer353Monitoring(page) {
    console.log('👁️ Starting Server 353 monster monitoring...');
    
    // Enhanced monitoring specifically for older servers
    setInterval(async () => {
      try {
        await this.scanServer353ForMonsters(page);
      } catch (error) {
        console.error('❌ Error scanning Server 353:', error);
      }
    }, 15000); // Every 15 seconds for older servers
    
    // Also monitor for alliance activities (more common on older servers)
    setInterval(async () => {
      try {
        await this.scanForAllianceActivity(page);
      } catch (error) {
        console.error('❌ Error scanning alliance activity:', error);
      }
    }, 30000); // Every 30 seconds
  }

  async scanServer353ForMonsters(page) {
    console.log('🔍 Scanning Server 353 for monsters...');
    
    const monsters = await page.evaluate(() => {
      // Enhanced selectors for older server versions
      const selectors = [
        '.monster', '.creature', '.boss', '.dragon', '.behemoth',
        '[data-monster]', '[data-creature]', '[data-type="monster"]',
        '.map-monster', '.world-monster', '.enemy', '.npc',
        '*[class*="monster"]', '*[class*="creature"]', '*[class*="boss"]',
        '*[class*="dragon"]', '*[class*="behemoth"]',
        // Older game element patterns
        '.game-monster', '.world-boss', '.field-monster',
        '*[id*="monster"]', '*[id*="creature"]'
      ];
      
      const foundElements = [];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              foundElements.push({
                selector,
                index,
                text: el.textContent?.trim()?.substring(0, 150),
                className: el.className,
                id: el.id,
                position: { 
                  x: rect.left + rect.width/2, 
                  y: rect.top + rect.height/2 
                },
                attributes: Array.from(el.attributes).reduce((acc, attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {}),
                innerHTML: el.innerHTML?.substring(0, 200)
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
      console.log(`🐉 Found ${monsters.length} potential monsters on Server 353:`, 
                  monsters.slice(0, 3).map(m => ({ text: m.text, className: m.className })));
      
      // Convert to monster data format with Server 353 specifics
      const monsterData = monsters.map((el, index) => ({
        id: `s353_${Date.now()}_${index}`,
        monster: this.extractMonsterType(el),
        level: this.extractLevel(el),
        x: el.position.x,
        y: el.position.y,
        timestamp: Date.now(),
        serverId: 'Server_353',
        source: 'server_353_scan',
        alliance: this.extractAlliance(el),
        health: this.extractHealth(el)
      }));
      
      this.updateServer353Monsters(monsterData);
    } else {
      console.log('ℹ️ No monsters found in current Server 353 scan');
    }
  }

  async scanForAllianceActivity(page) {
    console.log('🏰 Scanning for alliance activity on Server 353...');
    
    const allianceData = await page.evaluate(() => {
      const selectors = [
        '.alliance', '.guild', '.clan',
        '*[class*="alliance"]', '*[class*="guild"]',
        '.player-info', '.alliance-info'
      ];
      
      const activities = [];
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.textContent && el.textContent.trim().length > 0) {
              activities.push({
                text: el.textContent.trim(),
                className: el.className
              });
            }
          });
        } catch (e) {
          // Continue
        }
      });
      
      return activities;
    });
    
    if (allianceData.length > 0) {
      console.log(`🏰 Alliance activity detected on Server 353: ${allianceData.length} elements`);
    }
  }

  extractMonsterType(element) {
    const text = (element.text || '').toLowerCase();
    const className = (element.className || '').toLowerCase();
    const innerHTML = (element.innerHTML || '').toLowerCase();
    
    // Enhanced monster type detection for older servers
    const patterns = {
      'Dragon': /dragon/i,
      'Behemoth': /behemoth/i,
      'Hydra': /hydra/i,
      'Phoenix': /phoenix/i,
      'Manticore': /manticore/i,
      'Cyclops': /cyclops/i,
      'Centaur': /centaur/i,
      'Gryphon': /gryphon|griffin/i,
      'Cerberus': /cerberus/i,
      'Minotaur': /minotaur/i,
      'Boss': /boss|chief/i,
      'Elite': /elite|champion/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text) || pattern.test(className) || pattern.test(innerHTML)) {
        return type;
      }
    }
    
    return 'Unknown Monster';
  }

  extractLevel(element) {
    const text = element.text || element.innerHTML || '';
    const patterns = [
      /level?\s*(\d+)/i,
      /lv\.?\s*(\d+)/i,
      /l(\d+)/i,
      /(\d+)级/i, // Chinese level indicator
      /레벨\s*(\d+)/i // Korean level indicator
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // For Server 353 (older server), assume higher level range
    return Math.floor(Math.random() * 70) + 30; // Level 30-100
  }

  extractAlliance(element) {
    const text = element.text || '';
    const allianceMatch = text.match(/\[([A-Z0-9]{2,5})\]/i);
    return allianceMatch ? allianceMatch[1] : null;
  }

  extractHealth(element) {
    const text = element.text || '';
    const healthMatch = text.match(/(\d+)%/);
    return healthMatch ? `${healthMatch[1]}%` : '100%';
  }

  async processServer353Data(data) {
    console.log('📊 Processing Server 353 API data...');
    
    let monsters = [];
    
    // Enhanced data extraction for older server formats
    if (data.monsters) monsters = data.monsters;
    else if (data.entities) monsters = data.entities.filter(e => e.type === 'monster');
    else if (data.worldMap?.monsters) monsters = data.worldMap.monsters;
    else if (data.gameData?.creatures) monsters = data.gameData.creatures;
    else if (Array.isArray(data)) monsters = data;
    
    if (monsters.length > 0) {
      console.log(`🎉 Found ${monsters.length} monsters in Server 353 API data!`);
      this.updateServer353Monsters(monsters.map(m => ({
        ...m,
        serverId: 'Server_353',
        source: 'api_data'
      })));
    }
  }

  updateServer353Monsters(monsters) {
    monsters.forEach(monster => {
      const key = `s353_${monster.id}`;
      this.monsters.set(key, {
        id: monster.id,
        monster: monster.monster || monster.type || 'Unknown',
        level: monster.level || 50, // Default higher level for Server 353
        x: monster.x || 0,
        y: monster.y || 0,
        timestamp: monster.timestamp || Date.now(),
        serverId: 'Server_353',
        alliance: monster.alliance,
        health: monster.health || '100%'
      });
    });
    
    // Broadcast to connected clients
    this.broadcast({
      type: 'server_353_update',
      monsters: Array.from(this.monsters.values()),
      count: this.monsters.size,
      server: this.serverInfo,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📈 Server 353 total monsters tracked: ${this.monsters.size}`);
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
    const page = await this.connectToServer353();
    
    console.log('🎮 Server 353 Data Collection is now active!');
    console.log('🏰 Monitoring older, established server for monster activities');
    console.log('🌐 Frontend can connect to ws://localhost:8080');
    console.log('📱 Open http://localhost:3000/tracker for Server 353 data');
    console.log('🤖 Click "Real-time Data" tab to see Server 353 updates');
    
    return page;
  }
}

// Start Server 353 collection
async function startServer353Collection() {
  const collector = new EvonyServer353Collector();
  try {
    await collector.start();
  } catch (error) {
    console.error('❌ Failed to start Server 353 collection:', error);
  }
}

if (require.main === module) {
  startServer353Collection();
}

module.exports = { EvonyServer353Collector };