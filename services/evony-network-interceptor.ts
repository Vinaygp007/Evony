// Chrome DevTools Network Interceptor for Evony
import puppeteer from 'puppeteer';
import { WebSocketServer } from 'ws';

interface MonsterData {
  id: string;
  type: string;
  level: number;
  x: number;
  y: number;
  timestamp: number;
  health: string;
  alliance?: string;
  serverId: string;
  lastUpdated: number;
}

interface ServerConfig {
  serverId: string;
  region: string;
  url: string;
  username?: string;
  password?: string;
}

export class EvonyNetworkInterceptor {
  private browser: puppeteer.Browser | null = null;
  private pages: Map<string, puppeteer.Page> = new Map();
  private wsServer: WebSocketServer | null = null;
  private monsters: Map<string, MonsterData> = new Map();
  private isRunning = false;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Evony Network Interceptor...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      devtools: true, // Enable DevTools for network monitoring
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--enable-network-service-logging'
      ]
    });

    this.setupWebSocketServer();
    console.log('✅ Network interceptor initialized');
  }

  private setupWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ port: 8080 });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Client connected to real-time monster feed');
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values())
      }));
    });

    console.log('🌐 WebSocket server running on port 8080');
  }

  async interceptEvonyServer(serverConfig: ServerConfig): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    const { serverId, region, url } = serverConfig;
    console.log(`🔌 Intercepting network for ${region} Server ${serverId}...`);

    const page = await this.browser.newPage();
    
    // Enable DevTools domains for network monitoring
    const client = await page.createCDPSession();
    await client.send('Network.enable');
    await client.send('Runtime.enable');

    // Set up comprehensive network interception
    await page.setRequestInterception(true);
    
    // Monitor all requests
    page.on('request', (request) => {
      const url = request.url();
      
      // Log monster-related API calls
      if (this.isMonsterRelatedUrl(url)) {
        console.log('🎯 Monster API Request:', {
          url,
          method: request.method(),
          headers: request.headers()
        });
      }
      
      request.continue();
    });

    // Intercept responses with monster data
    page.on('response', async (response) => {
      const url = response.url();
      
      if (this.isMonsterRelatedUrl(url) && response.ok()) {
        try {
          const contentType = response.headers()['content-type'];
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            await this.processNetworkData(data, serverId, url);
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse response data:', error);
        }
      }
    });

    // Use CDP to monitor network events
    client.on('Network.responseReceived', async (event) => {
      const { response, requestId } = event;
      
      if (this.isMonsterRelatedUrl(response.url)) {
        try {
          const responseBody = await client.send('Network.getResponseBody', { requestId });
          
          if (responseBody.body) {
            const data = JSON.parse(responseBody.body);
            await this.processNetworkData(data, serverId, response.url);
          }
        } catch (error) {
          // Handle parsing errors silently
        }
      }
    });

    // Navigate to Evony
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Auto-login if credentials provided
    if (serverConfig.username && serverConfig.password) {
      await this.performAutoLogin(page, serverConfig);
    }
    
    // Start periodic data collection
    this.startPeriodicCollection(page, serverId);
    
    this.pages.set(serverId, page);
  }

  private isMonsterRelatedUrl(url: string): boolean {
    const monsterKeywords = [
      'monster', 'world_map', 'map_data', 'creature',
      'boss', 'dragon', 'behemoth', 'rally',
      'world/monsters', 'map/entities', 'game/world'
    ];
    
    return monsterKeywords.some(keyword => 
      url.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private async processNetworkData(data: any, serverId: string, sourceUrl: string): Promise<void> {
    console.log(`📊 Processing network data from ${sourceUrl}`);
    
    // Try to extract monster data from various API response formats
    let monsters: any[] = [];
    
    if (data.monsters) {
      monsters = data.monsters;
    } else if (data.entities) {
      monsters = data.entities.filter((entity: any) => entity.type === 'monster');
    } else if (data.worldMap?.monsters) {
      monsters = data.worldMap.monsters;
    } else if (Array.isArray(data)) {
      monsters = data.filter((item: any) => item.type === 'monster' || item.monsterType);
    }

    if (monsters.length > 0) {
      await this.processMonsterArray(monsters, serverId);
    }
  }

  private async processMonsterArray(monsters: any[], serverId: string): Promise<void> {
    console.log(`🐉 Processing ${monsters.length} monsters from server ${serverId}`);
    
    monsters.forEach(monster => {
      const monsterData: MonsterData = {
        id: monster.id || monster.monsterId || `monster_${Date.now()}_${Math.random()}`,
        type: monster.type || monster.monsterType || 'Unknown',
        level: parseInt(monster.level || monster.monsterLevel) || 1,
        x: parseFloat(monster.x || monster.posX || monster.position?.x) || 0,
        y: parseFloat(monster.y || monster.posY || monster.position?.y) || 0,
        timestamp: monster.timestamp || Date.now(),
        health: monster.health || monster.hp || '100%',
        alliance: monster.alliance || monster.allianceName || undefined,
        serverId,
        lastUpdated: Date.now()
      };
      
      const monsterKey = `${serverId}_${monsterData.id}`;
      const existingMonster = this.monsters.get(monsterKey);
      
      if (!existingMonster || existingMonster.timestamp < monsterData.timestamp) {
        this.monsters.set(monsterKey, monsterData);
        
        this.broadcastUpdate({
          type: existingMonster ? 'monster_update' : 'monster_spawn',
          monster: monsterData
        });
      }
    });
    
    this.cleanupOldMonsters();
  }

  private async performAutoLogin(page: puppeteer.Page, config: ServerConfig): Promise<void> {
    console.log('🔐 Attempting auto-login...');
    
    try {
      // Wait for login form
      await page.waitForSelector('input[type="email"], input[name="username"], #username', { timeout: 10000 });
      
      // Fill login form
      const usernameSelector = await page.$('input[type="email"], input[name="username"], #username');
      const passwordSelector = await page.$('input[type="password"], input[name="password"], #password');
      
      if (usernameSelector && passwordSelector && config.username && config.password) {
        await usernameSelector.type(config.username);
        await passwordSelector.type(config.password);
        
        // Click login button
        const loginButton = await page.$('button[type="submit"], .login-btn, #login-button');
        if (loginButton) {
          await loginButton.click();
          
          // Wait for game to load
          await page.waitForSelector('.world-map, #game-canvas, .game-container', { timeout: 30000 });
          console.log('✅ Auto-login successful');
        }
      }
    } catch (error) {
      console.log('⚠️ Auto-login failed, manual login may be required');
    }
  }

  private startPeriodicCollection(page: puppeteer.Page, serverId: string): void {
    // Inject data collection script
    setInterval(async () => {
      try {
        await this.performDOMScraping(page, serverId);
      } catch (error) {
        console.error(`❌ Error in periodic collection for ${serverId}:`, error);
      }
    }, 30000); // Every 30 seconds
  }

  private async performDOMScraping(page: puppeteer.Page, serverId: string): Promise<void> {
    try {
      const monsters = await page.evaluate(() => {
        // Try multiple selector patterns for monster elements
        const selectors = [
          '.monster', '.monster-marker', '[data-monster-id]',
          '.world-monster', '.map-monster', '.creature',
          '[data-type="monster"]', '.entity[data-entity-type="monster"]'
        ];
        
        const foundMonsters: any[] = [];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            const monsterData = {
              id: element.getAttribute('data-monster-id') || 
                  element.getAttribute('data-id') || 
                  `dom_${Date.now()}_${Math.random()}`,
              type: element.getAttribute('data-monster-type') || 
                    element.getAttribute('data-type') || 
                    element.className.match(/monster-(\w+)/)?.[1] || 'Unknown',
              level: parseInt(element.getAttribute('data-level') || '1'),
              x: parseFloat(element.getAttribute('data-x')) || rect.left,
              y: parseFloat(element.getAttribute('data-y')) || rect.top,
              health: element.getAttribute('data-health') || '100%',
              alliance: element.getAttribute('data-alliance'),
              timestamp: Date.now()
            };
            
            foundMonsters.push(monsterData);
          });
        });
        
        return foundMonsters;
      });

      if (monsters.length > 0) {
        await this.processMonsterArray(monsters, serverId);
      }
    } catch (error) {
      console.error('❌ DOM scraping error:', error);
    }
  }

  private broadcastUpdate(update: any): void {
    if (!this.wsServer) return;
    
    const message = JSON.stringify(update);
    
    this.wsServer.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  private cleanupOldMonsters(): void {
    const cutoffTime = Date.now() - (10 * 60 * 1000); // 10 minutes
    let removedCount = 0;
    
    for (const [key, monster] of this.monsters.entries()) {
      if (monster.lastUpdated < cutoffTime) {
        this.monsters.delete(key);
        removedCount++;
        
        this.broadcastUpdate({
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

  async startMultiServerInterception(servers: ServerConfig[]): Promise<void> {
    console.log(`🌍 Starting network interception for ${servers.length} servers...`);
    
    for (const server of servers) {
      try {
        await this.interceptEvonyServer(server);
        console.log(`✅ Intercepting ${server.region} Server ${server.serverId}`);
      } catch (error) {
        console.error(`❌ Failed to intercept ${server.region} Server ${server.serverId}:`, error);
      }
    }
    
    this.isRunning = true;
    console.log('🚀 Multi-server network interception active!');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping network interception...');
    
    this.isRunning = false;
    
    for (const page of this.pages.values()) {
      await page.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('✅ Network interception stopped');
  }
}
