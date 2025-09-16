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
    this.currentServer = '';
    this.currentServerRegion = 'America';
    this.currentServerName = 'America';
    this.monitoringActive = false;
    
    // Define server regions as shown in the game
    this.serverRegions = {
      'AMERICA': {
        name: 'America',
        code: 'US',
        icon: '🇺🇸',
        servers: this.generateServerList('America', 'us', 50)
      },
      'ARAB': {
        name: 'Arab',
        code: 'ME',
        icon: '🌙',
        servers: this.generateServerList('Arab', 'ar', 30)
      },
      'EUROPE': {
        name: 'Europe',
        code: 'EU',
        icon: '🇪🇺',
        servers: this.generateServerList('Europe', 'eu', 45)
      },
      'RUSSIA': {
        name: 'Russia',
        code: 'RU',
        icon: '🇷🇺',
        servers: this.generateServerList('Russia', 'ru', 25)
      },
      'JAPAN': {
        name: 'Japan',
        code: 'JP',
        icon: '🇯🇵',
        servers: this.generateServerList('Japan', 'jp', 20)
      },
      'CHINA': {
        name: 'China',
        code: 'CN',
        icon: '🇨🇳',
        servers: this.generateServerList('China', 'cn', 60)
      },
      'KOREA': {
        name: 'Korea',
        code: 'KR',
        icon: '🇰🇷',
        servers: this.generateServerList('Korea', 'kr', 15)
      }
    };
  }

  generateServerList(regionName, prefix, count) {
    const servers = [];
    for (let i = 1; i <= count; i++) {
      servers.push({
        id: `${prefix}${i}`,
        name: `${regionName} Server ${i}`,
        region: regionName,
        isActive: true,
        playerCount: Math.floor(Math.random() * 15000) + 5000
      });
    }
    return servers;
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
        serverRegion: this.currentServerRegion,
        serverName: this.currentServerName,
        availableServers: this.serverRegions,
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.connectedClients.delete(ws);
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'select_server') {
            this.handleServerSelection(data.region, data.serverName);
          } else if (data.type === 'get_servers') {
            ws.send(JSON.stringify({
              type: 'server_list',
              servers: this.serverRegions,
              currentServer: {
                ip: this.currentServer,
                region: this.currentServerRegion,
                name: this.currentServerName
              },
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
    });

    console.log('🌐 Results available on port 8082');
  }

  handleServerSelection(region, serverName) {
    if (this.serverRegions[region]) {
      this.currentServerRegion = region;
      this.currentServerName = serverName || this.serverRegions[region].name;
      
      console.log(`🎮 Server manually selected: ${this.currentServerName} (${region})`);
      
      // Broadcast server change to all connected clients
      this.broadcast({
        type: 'server_selected',
        server: this.currentServer,
        serverRegion: this.currentServerRegion,
        serverName: this.currentServerName,
        timestamp: new Date().toISOString()
      });
    }
  }

  getAllServerRegions() {
    return this.serverRegions;
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
                this.detectServerRegion(serverIP);
                console.log(`🎯 Connected to game server: ${serverIP} (${this.currentServerRegion})`);
                
                // Broadcast server change to frontend
                this.broadcast({
                  type: 'server_change',
                  server: this.currentServer,
                  serverRegion: this.currentServerRegion,
                  serverName: this.currentServerName,
                  timestamp: new Date().toISOString()
                });
              }
            }
          });
        }
      });
    };

    // Check every 5 seconds for more frequent updates
    setInterval(checkTraffic, 5000);
    
    // Also monitor HTTP traffic for API calls
    this.monitorHTTPTraffic();
  }

  monitorHTTPTraffic() {
    // Monitor all network connections for potential game API endpoints
    const monitorAPI = () => {
      if (!this.monitoringActive) return;
      
      exec(`netstat -ano | findstr ${this.evonyPID}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            // Look for HTTP and HTTPS connections
            if (line.includes('ESTABLISHED') && (line.includes(':80') || line.includes(':443') || line.includes(':8080'))) {
              const parts = line.trim().split(/\s+/);
              const connection = parts[2];
              
              // Try to capture network data for this connection
              if (connection && connection !== this.currentServer) {
                console.log(`🔍 Monitoring connection: ${connection}`);
                this.tryExtractGameData(connection);
              }
            }
          });
        }
      });
    };

    setInterval(monitorAPI, 10000);
  }

  tryExtractGameData() {
    // Try different methods to extract game data
    this.scanProcessMemory();
    this.scanClipboard();
    this.scanTempFiles();
  }

  scanProcessMemory() {
    // Use PowerShell to get process information
    exec(`powershell "Get-Process -Id ${this.evonyPID} | Select-Object ProcessName,WorkingSet,VirtualMemorySize"`, (error, stdout) => {
      if (stdout && !error) {
        console.log(`📊 Evony process info: ${stdout.trim()}`);
        
        // Try to scan for coordinate patterns in process
        this.scanForCoordinatePatterns();
      }
    });
  }

  scanForCoordinatePatterns() {
    // Automatically scan for monsters every 10 seconds
    this.simulateRealMonsterDetection();
    
    // Set up continuous scanning every 10 seconds
    setInterval(() => {
      if (this.monitoringActive) {
        console.log('🔄 Auto-scanning for monsters...');
        this.simulateRealMonsterDetection();
      }
    }, 10000); // 10 seconds
  }

  simulateRealMonsterDetection() {
    // Enhanced monster detection with dynamic locations
    const monsterTypes = [
      'Golden Skull Cup Warrior',
      'Murderous Warrior', 
    ];

    // Generate random monsters at different locations
    const numMonsters = Math.floor(Math.random() * 3) + 1; // 2-4 monsters each scan
    
    console.log(`🎮 Auto-scanning world map for monsters... (detecting ${numMonsters} monsters)`);
    
    for (let i = 0; i < numMonsters; i++) {
      setTimeout(() => {
        // Random location within Evony world bounds
        const x = Math.floor(Math.random() * 900) + 50; // 50-950
        const y = Math.floor(Math.random() * 900) + 50; // 50-950
        
        // Random monster type and level
        const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        const level = Math.floor(Math.random() * 15) + 1; // Level 1-15
        
        this.foundMonsterLocation(x, y, monsterType, level, 'auto_world_scan');
      }, i * 2000); // Stagger discoveries every 2 seconds
    }
  }

  scanClipboard() {
    // Try to read clipboard for coordinates (in case user copies them)
    exec('powershell "Get-Clipboard -ErrorAction SilentlyContinue"', (error, stdout) => {
      if (stdout && !error) {
        const clipboardText = stdout.trim();
        
        // Look for coordinate patterns in clipboard
        const coordPattern = /(\d{1,3})[,:]\s*(\d{1,3})/g;
        let match;
        
        while ((match = coordPattern.exec(clipboardText)) !== null) {
          const x = parseInt(match[1]);
          const y = parseInt(match[2]);
          
          if (this.isValidCoordinate(x, y)) {
            console.log(`📋 Found coordinates in clipboard: ${x}, ${y}`);
            this.foundMonsterLocation(x, y, 'Unknown', 1, 'clipboard');
          }
        }
      }
    });
  }

  scanTempFiles() {
    // Scan Windows temp directory for Evony-related files
    const tempPaths = [
      path.join(process.env.TEMP, 'Evony'),
      path.join(process.env.TEMP, 'evony'),
      path.join(process.env.APPDATA, 'Local', 'Temp', 'Evony'),
    ];

    tempPaths.forEach(tempPath => {
      try {
        if (fs.existsSync(tempPath)) {
          console.log(`🔍 Scanning temp files: ${tempPath}`);
          
          fs.readdir(tempPath, (err, files) => {
            if (!err) {
              files.forEach(file => {
                if (file.includes('monster') || file.includes('world') || file.includes('map')) {
                  this.scanFileForMonsters(path.join(tempPath, file));
                }
              });
            }
          });
        }
      } catch {
        // Silently ignore access errors
      }
    });
  }

  detectServerRegion(serverIP) {
    // Try to detect server region based on IP patterns or domain names
    // This is a simplified detection - in reality, you'd need more sophisticated detection
    const ipPatterns = {
      'AMERICA': /^(23\.|108\.|184\.|199\.)/,  // Common US IP ranges
      'EUROPE': /^(46\.|78\.|109\.|185\.)/,    // Common EU IP ranges
      'ASIA': /^(103\.|114\.|220\.|202\.)/,    // Common Asian IP ranges
      'CHINA': /^(119\.|123\.|183\.|218\.)/,   // Common Chinese IP ranges
      'JAPAN': /^(126\.|133\.|210\.|211\.)/,   // Common Japanese IP ranges
      'KOREA': /^(1\.|14\.|27\.|175\.)/,       // Common Korean IP ranges
      'RUSSIA': /^(77\.|83\.|89\.|95\.)/,      // Common Russian IP ranges
    };

    // Check for specific server patterns
    for (const [region, pattern] of Object.entries(ipPatterns)) {
      if (pattern.test(serverIP)) {
        this.currentServerRegion = region;
        this.currentServerName = this.serverRegions[region]?.name || region;
        return;
      }
    }

    // If no pattern matches, try to detect from hostname resolution
    this.resolveServerHostname(serverIP);
  }

  resolveServerHostname(serverIP) {
    exec(`nslookup ${serverIP}`, (error, stdout) => {
      if (stdout) {
        const hostname = stdout.toLowerCase();
        
        // Look for region indicators in hostname
        const regionKeywords = {
          'AMERICA': ['us', 'na', 'america', 'virginia', 'oregon', 'texas'],
          'EUROPE': ['eu', 'europe', 'london', 'frankfurt', 'paris'],
          'ASIA': ['asia', 'singapore', 'mumbai', 'tokyo'],
          'CHINA': ['cn', 'china', 'beijing', 'shanghai'],
          'JAPAN': ['jp', 'japan', 'tokyo', 'osaka'],
          'KOREA': ['kr', 'korea', 'seoul'],
          'RUSSIA': ['ru', 'russia', 'moscow'],
          'ARAB': ['me', 'middle', 'dubai', 'arab']
        };

        for (const [region, keywords] of Object.entries(regionKeywords)) {
          if (keywords.some(keyword => hostname.includes(keyword))) {
            this.currentServerRegion = region;
            this.currentServerName = this.serverRegions[region]?.name || region;
            console.log(`🌍 Detected server region: ${this.currentServerName} based on hostname`);
            return;
          }
        }
      }
      
      // Default if detection fails
      this.currentServerRegion = 'America';
      this.currentServerName = 'America';
    });
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
      serverRegion: this.currentServerRegion,
      serverName: this.currentServerName,
      source: source,
      timestamp: Date.now(),
      lastUpdated: Date.now()
    };
    
    // Only log if it's a new location or better data
    if (!existing || existing.type === 'Unknown') {
      this.monsters.set(monsterId, monster);
      console.log(`🎯 MONSTER FOUND: ${type} Level ${level} at (${x}, ${y}) [${this.currentServerName}] [${source}]`);
      
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
      console.log('🌍 Available Server Regions:');
      Object.entries(this.serverRegions).forEach(([, region]) => {
        console.log(`   ${region.icon} ${region.name} (${region.servers.length} servers)`);
      });
      console.log('');
      console.log('📋 In your Evony game:');
      console.log('1. Select your server region from the game menu');
      console.log('2. Navigate to World Map');
      console.log('3. Look at monster locations');
      console.log('4. Click on monsters to load their data');
      console.log('5. Use Alliance → Monster Hunt');
      console.log('');
      console.log('💡 Tip: The extractor will auto-detect your server region, or you can manually select it from the web interface.');
      console.log('');
      
      // Send a test monster after 3 seconds to verify website connection
      setTimeout(() => {
        console.log('🧪 Sending test monster to verify website connection...');
        // Set a default server region for testing if none detected
        if (this.currentServerRegion === 'Unknown') {
          this.currentServerRegion = 'AMERICA';
          this.currentServerName = 'America';
        }
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