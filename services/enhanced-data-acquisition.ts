// Enhanced Data Acquisition Service with Backend Integration
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';
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

interface ServerConfig {
  serverId: string;
  region: string;
  url: string;
  username?: string;
  password?: string;
}

export class EnhancedEvonyDataAcquisition {
  private browser: puppeteer.Browser | null = null;
  private pages: Map<string, puppeteer.Page> = new Map();
  private wsServer: WebSocketServer | null = null;
  private monsters: Map<string, MonsterData> = new Map();
  private isRunning = false;
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Enhanced Evony Data Acquisition System...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.setupWebSocketServer();
    console.log('✅ Enhanced acquisition system initialized');
  }

  private setupWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ 
      port: parseInt(process.env.ACQUISITION_PORT || '8080') 
    });
    
    this.wsServer.on('connection', (ws) => {
      console.log('📡 Client connected to acquisition feed');
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        monsters: Array.from(this.monsters.values())
      }));
    });

    console.log(`🌐 WebSocket server running on port ${process.env.ACQUISITION_PORT || 8080}`);
  }

  async connectToEvonyServer(serverConfig: ServerConfig): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    const { serverId, region, url } = serverConfig;
    console.log(`🔌 Connecting to ${region} Server ${serverId}...`);

    const page = await this.browser.newPage();
    
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      if (this.isMonsterRelatedUrl(request.url())) {
        console.log('🎯 Monster API Request:', request.url());
      }
      request.continue();
    });

    page.on('response', async (response) => {
      if (this.isMonsterRelatedUrl(response.url()) && response.ok()) {
        try {
          const contentType = response.headers()['content-type'];
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            await this.processNetworkData(data, serverId, response.url());
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse response data:', error);
        }
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });
    
    if (serverConfig.username && serverConfig.password) {
      await this.performAutoLogin(page, serverConfig);
    }
    
    this.startPeriodicCollection(page, serverId);
    this.pages.set(serverId, page);
  }

  private isMonsterRelatedUrl(url: string): boolean {
    const keywords = [
      'monster', 'world_map', 'map_data', 'creature',
      'boss', 'dragon', 'behemoth', 'rally'
    ];
    
    return keywords.some(keyword => 
      url.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private async processNetworkData(data: any, serverId: string, sourceUrl: string): Promise<void> {
    console.log(`📊 Processing network data from ${sourceUrl}`);
    
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
    
    const processedMonsters: MonsterData[] = monsters.map(monster => ({
      id: monster.id || monster.monsterId || `monster_${Date.now()}_${Math.random()}`,
      monster_type: monster.type || monster.monsterType || 'Unknown',
      level: parseInt(monster.level || monster.monsterLevel) || 1,
      x: parseFloat(monster.x || monster.posX || monster.position?.x) || 0,
      y: parseFloat(monster.y || monster.posY || monster.position?.y) || 0,
      health: monster.health || monster.hp || '100%',
      alliance: monster.alliance || monster.allianceName,
      server_id: serverId,
      timestamp: new Date(monster.timestamp || Date.now()),
      last_updated: new Date()
    }));

    // Send to backend API
    await this.sendToBackend(processedMonsters);
    
    // Update local cache
    processedMonsters.forEach(monster => {
      const monsterKey = `${serverId}_${monster.id}`;
      this.monsters.set(monsterKey, monster);
    });
    
    // Broadcast via WebSocket
    this.broadcastUpdate({
      type: 'monsters_batch',
      monsters: processedMonsters,
      serverId
    });
  }

  private async sendToBackend(monsters: MonsterData[]): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/api/monsters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monsters)
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Sent ${result.processed} monsters to backend`);
    } catch (error) {
      console.error('❌ Failed to send data to backend:', error);
    }
  }

  private async performAutoLogin(page: puppeteer.Page, config: ServerConfig): Promise<void> {
    console.log('🔐 Attempting auto-login...');
    
    try {
      await page.waitForSelector('input[type="email"], input[name="username"], #username', { timeout: 10000 });
      
      const usernameSelector = await page.$('input[type="email"], input[name="username"], #username');
      const passwordSelector = await page.$('input[type="password"], input[name="password"], #password');
      
      if (usernameSelector && passwordSelector && config.username && config.password) {
        await usernameSelector.type(config.username);
        await passwordSelector.type(config.password);
        
        const loginButton = await page.$('button[type="submit"], .login-btn, #login-button');
        if (loginButton) {
          await loginButton.click();
          await page.waitForSelector('.world-map, #game-canvas, .game-container', { timeout: 30000 });
          console.log('✅ Auto-login successful');
        }
      }
    } catch (error) {
      console.log('⚠️ Auto-login failed, manual login may be required');
    }
  }

  private startPeriodicCollection(page: puppeteer.Page, serverId: string): void {
    setInterval(async () => {
      try {
        await this.performDOMScraping(page, serverId);
      } catch (error) {
        console.error(`❌ Error in periodic collection for ${serverId}:`, error);
      }
    }, parseInt(process.env.SCAN_INTERVAL || '30000'));
  }

  private async performDOMScraping(page: puppeteer.Page, serverId: string): Promise<void> {
    try {
      const monsters = await page.evaluate(() => {
        const selectors = [
          '.monster', '.monster-marker', '[data-monster-id]',
          '.world-monster', '.map-monster', '.creature'
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
                    element.getAttribute('data-type') || 'Unknown',
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

  async startMultiServerAcquisition(servers: ServerConfig[]): Promise<void> {
    console.log(`🌍 Starting enhanced acquisition for ${servers.length} servers...`);
    
    for (const server of servers) {
      try {
        await this.connectToEvonyServer(server);
        console.log(`✅ Connected to ${server.region} Server ${server.serverId}`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${server.region} Server ${server.serverId}:`, error);
      }
    }
    
    this.isRunning = true;
    console.log('🚀 Multi-server enhanced acquisition active!');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping enhanced data acquisition...');
    
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
    
    console.log('✅ Enhanced data acquisition stopped');
  }
}

// Usage with backend integration
async function startEnhancedEvonyTracking() {
  const acquisition = new EnhancedEvonyDataAcquisition();
  await acquisition.initialize();
  
  const servers: ServerConfig[] = [
    {
      serverId: 'us1',
      region: 'US',
      url: 'https://evony.com/game/us1',
      username: process.env.EVONY_USERNAME_US,
      password: process.env.EVONY_PASSWORD_US
    },
    {
      serverId: 'eu1',
      region: 'EU',
      url: 'https://evony.com/game/eu1',
      username: process.env.EVONY_USERNAME_EU,
      password: process.env.EVONY_PASSWORD_EU
    }
  ];
  
  await acquisition.startMultiServerAcquisition(servers);
}

// Only run if this file is executed directly
if (require.main === module) {
  startEnhancedEvonyTracking().catch(console.error);
}

export { startEnhancedEvonyTracking };
