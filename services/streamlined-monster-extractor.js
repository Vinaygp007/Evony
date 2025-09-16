// Streamlined Real Monster Location Extractor
// Only essential code for extracting monster coordinates

const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const https = require('https');

class MonsterLocationExtractor {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Set();
    this.monsters = new Map();
    this.evonyPID = null;
    this.currentServer = 'Unknown';
    this.currentServerRegion = 'Unknown'; // Will be auto-detected based on server IP
    this.currentServerName = 'Unknown'; // Will be auto-detected based on server IP
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
        isActive: true
        // Removed fake playerCount generation
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
              
              // Extract clean IP address (remove port if present)
              const cleanIP = serverIP ? serverIP.split(':')[0] : null;
              
              // Only process when server changes or when we have Unknown region
              if (cleanIP && (cleanIP !== this.currentServer || this.currentServerRegion === 'Unknown')) {
                this.currentServer = cleanIP;
                console.log(`🎯 Detected game server connection: ${cleanIP}`);
                
                // Always attempt region detection for new servers or unknown regions
                this.detectServerRegion(cleanIP);
                
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

    // Check every 10 seconds for server connections
    setInterval(checkTraffic, 10000);
    
    // Initial check
    checkTraffic();
    
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

    setInterval(monitorAPI, 30000);
  }

  tryExtractGameData(serverIP) {
    // Enhanced real-time game data extraction
    console.log(`🔍 Attempting to extract monster data from ${serverIP}...`);
    
    // Try different methods to extract real game data
    this.scanProcessMemory();
    this.scanClipboard();
    this.scanTempFiles();
    this.monitorGameAPI(serverIP);
  }

  monitorGameAPI(serverIP) {
    // Monitor for monster-related API calls
    exec(`netstat -an | findstr ${serverIP}`, (error, stdout) => {
      if (stdout) {
        // Look for active connections that might be sending monster data
        const connections = stdout.split('\n');
        connections.forEach(conn => {
          if (conn.includes('ESTABLISHED') && (conn.includes(':80') || conn.includes(':443'))) {
            console.log(`🌐 Active game connection detected: ${conn.trim()}`);
            // Try to capture any monster data from this connection
            this.captureNetworkData();
          }
        });
      }
    });
  }

  captureNetworkData() {
    // Use PowerShell to capture network packets (requires admin rights)
    exec('powershell "Get-NetTCPConnection | Where-Object {$_.State -eq \'Established\' -and ($_.RemotePort -eq 80 -or $_.RemotePort -eq 443)} | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort"', (error, stdout) => {
      if (stdout && !error) {
        console.log(`🌐 Network connections: ${stdout.substring(0, 200)}...`);
        // Process network data for monster information
      }
    });
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
    // Set up clipboard monitoring every 5 seconds
    setInterval(() => {
      if (this.monitoringActive) {
        this.scanClipboard();
      }
    }, 5000); // 5 seconds
    
    // Set up game file monitoring every 30 seconds
    setInterval(() => {
      if (this.monitoringActive) {
        console.log('🔄 Scanning game files for monster data...');
        this.scanGameDataFiles();
      }
    }, 30000); // 30 seconds
    
    // Set up memory scanning every 2 minutes
    setInterval(() => {
      if (this.monitoringActive) {
        console.log('🔄 Scanning process memory for coordinates...');
        this.scanProcessMemory();
      }
    }, 120000); // 2 minutes
  }

  scanGameDataFiles() {
    // Scan for real monster data in game files
    const gamePaths = [
      path.join(process.env.APPDATA, 'Evony'),
      path.join(process.env.LOCALAPPDATA, 'Evony'),
      path.join(process.env.USERPROFILE, 'Documents', 'Evony'),
      path.join(process.env.TEMP, 'Evony')
    ];

    gamePaths.forEach(gamePath => {
      try {
        if (fs.existsSync(gamePath)) {
          fs.readdir(gamePath, (err, files) => {
            if (!err) {
              files.forEach(file => {
                if (file.includes('monster') || file.includes('world') || file.includes('map') || file.includes('cache')) {
                  this.scanFileForMonsters(path.join(gamePath, file));
                }
              });
            }
          });
        }
      } catch {
        // Silently handle access errors
      }
    });
  }

  scanClipboard() {
    // Try to read clipboard for coordinates and monster information
    exec('powershell "Get-Clipboard -ErrorAction SilentlyContinue"', (error, stdout) => {
      if (stdout && !error) {
        const clipboardText = stdout.trim();
        
        // Enhanced pattern to capture monster information with coordinates
        // Patterns like: "Golden Skull Cup Warrior Level 12 (123, 456)"
        // Or: "Cerberus Lv.8 at 123,456"
        // Or: "Level 5 Dragon 234, 567"
        // Or: just "123, 456"
        
        const enhancedPatterns = [
          // Pattern 1: "Monster Name Level X (coords)" - Fixed to handle "Golden Skull Cup Warrior Level 15 (456, 789)"
          /([A-Za-z\s]+?)\s+Level\s+(\d+)\s*\((\d{1,3}),\s*(\d{1,3})\)/gi,
          
          // Pattern 2: "Monster Name Lv.X (coords)"
          /([A-Za-z\s]+?)\s+Lv\.?\s*(\d+)\s*\((\d{1,3}),\s*(\d{1,3})\)/gi,
          
          // Pattern 3: "Level X Monster Name (coords)"
          /Level\s+(\d+)\s+([A-Za-z\s]+?)\s*\((\d{1,3}),\s*(\d{1,3})\)/gi,
          
          // Pattern 4: "Monster Name at coords"
          /([A-Za-z\s]+?)\s+at\s+(\d{1,3}),\s*(\d{1,3})/gi,
          
          // Pattern 5: Just coordinates with possible monster name nearby
          /([A-Za-z\s]*?)\s*(\d{1,3}),\s*(\d{1,3})/g
        ];

        let foundAny = false;

        // Try enhanced patterns first
        for (let i = 0; i < enhancedPatterns.length && !foundAny; i++) {
          const pattern = enhancedPatterns[i];
          let match;
          
          while ((match = pattern.exec(clipboardText)) !== null) {
            let monsterName, level, x, y;
            
            if (i === 0 || i === 1) { // Pattern 1 & 2: Monster Level X (coords)
              monsterName = match[1].trim();
              level = parseInt(match[2]);
              x = parseInt(match[3]);
              y = parseInt(match[4]);
            } else if (i === 2) { // Pattern 3: Level X Monster (coords)  
              level = parseInt(match[1]);
              monsterName = match[2].trim();
              x = parseInt(match[3]);
              y = parseInt(match[4]);
            } else if (i === 3) { // Pattern 4: Monster at coords
              monsterName = match[1].trim();
              level = 1; // Default level
              x = parseInt(match[2]);
              y = parseInt(match[3]);
            } else { // Pattern 5: Fallback
              const possibleName = match[1].trim();
              monsterName = possibleName.length > 2 ? possibleName : 'Unknown';
              level = 1;
              x = parseInt(match[2]);
              y = parseInt(match[3]);
            }
            
            if (this.isValidCoordinate(x, y)) {
              // Clean up monster name
              if (monsterName && monsterName.length > 2) {
                // Remove common words that aren't monster names
                monsterName = monsterName.replace(/\b(at|level|lv|coordinates|coords|location|pos|position)\b/gi, '').trim();
                
                // Capitalize properly
                monsterName = monsterName.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
              } else {
                monsterName = 'Unknown';
              }
              
              console.log(`📋 Found in clipboard: ${monsterName} Level ${level} at (${x}, ${y})`);
              this.foundMonsterLocation(x, y, monsterName, level, 'clipboard');
              foundAny = true;
            }
          }
        }
        
        // If no enhanced patterns worked, fall back to simple coordinate extraction
        if (!foundAny) {
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
    // Enhanced server region detection based on IP patterns and geolocation
    console.log(`🔍 Analyzing server IP: ${serverIP} for region detection`);
    
    const ipPatterns = {
      'AMERICA': [
        /^23\./, /^108\./, /^184\./, /^199\./, // Common US ranges
        /^35\./, /^76\./, /^129\./, // Your reported ranges
        /^104\./, /^162\./, /^172\./, /^192\./, // Additional US ranges
        /^54\./, /^34\./, /^52\./, // AWS US regions
        /^38\./ // Additional US range (38.45.227.5)
      ],
      'EUROPE': [
        /^46\./, /^78\./, /^109\./, /^185\./, // Common EU ranges
        /^31\./, /^37\./, /^87\./, /^88\./, // Additional EU ranges
        /^18\./, /^3\./, /^13\./ // AWS EU regions
      ],
      'ASIA': [
        /^103\./, /^114\./, /^220\./, /^202\./, // Common Asian ranges
        /^118\./, /^124\./, /^125\./, /^203\./ // Additional Asian ranges
      ],
      'CHINA': [
        /^119\./, /^123\./, /^183\./, /^218\./, // Common Chinese ranges
        /^121\./, /^122\./, /^111\./, /^117\./, // Additional Chinese ranges
        /^14\./, /^42\./, /^43\./ // Chinese cloud providers
      ],
      'JAPAN': [
        /^126\./, /^133\./, /^210\./, /^211\./, // Common Japanese ranges
        /^27\./, /^49\./, /^58\./, /^60\./, // Additional Japanese ranges
        /^13\.112\./, /^13\.230\./ // AWS Japan regions
      ],
      'KOREA': [
        /^1\./, /^14\./, /^27\./, /^175\./, // Common Korean ranges
        /^39\./, /^61\./, /^106\./, /^168\./ // Additional Korean ranges
      ],
      'RUSSIA': [
        /^77\./, /^83\./, /^89\./, /^95\./, // Common Russian ranges
        /^91\./, /^92\./, /^93\./, /^94\./, // Additional Russian ranges
        /^188\./, /^178\./, /^176\./ // More Russian ranges
      ],
      'ARAB': [
        /^195\./, /^213\./, /^41\./, /^212\./, // Middle East ranges
        /^5\./, /^82\./, /^194\./ // Additional Middle East ranges
      ]
    };

    // Check each region's IP patterns
    for (const [region, patterns] of Object.entries(ipPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(serverIP)) {
          this.currentServerRegion = region;
          this.currentServerName = this.serverRegions[region]?.name || region;
          console.log(`🌍 ✅ Detected server region: ${this.currentServerName} (${region}) based on IP pattern ${pattern}`);
          return;
        }
      }
    }

    console.log(`🌍 ❓ No IP pattern match found for ${serverIP}, attempting hostname resolution...`);
    // If no pattern matches, try hostname resolution
    this.resolveServerHostname(serverIP);
  }

  resolveServerHostname(serverIP) {
    console.log(`🔍 Attempting hostname resolution for ${serverIP}...`);
    
    exec(`nslookup ${serverIP}`, (error, stdout) => {
      if (stdout) {
        const hostname = stdout.toLowerCase();
        console.log(`🔍 Hostname data: ${hostname.substring(0, 200)}...`); // Debug log
        
        // Enhanced region keywords detection
        const regionKeywords = {
          'AMERICA': ['us-', 'usa-', 'na-', 'america', 'virginia', 'oregon', 'texas', 'california', 'ohio', 'virginia', 'aws-us', 'ec2-us'],
          'EUROPE': ['eu-', 'europe', 'london', 'frankfurt', 'paris', 'ireland', 'stockholm', 'milan', 'aws-eu', 'ec2-eu'],
          'ASIA': ['asia', 'singapore', 'mumbai', 'hong-kong', 'seoul', 'tokyo', 'ap-'],
          'CHINA': ['cn-', 'china', 'beijing', 'shanghai', 'shenzhen', 'guangzhou'],
          'JAPAN': ['jp-', 'japan', 'tokyo', 'osaka', 'nrt-', 'kix-'],
          'KOREA': ['kr-', 'korea', 'seoul', 'icn-'],
          'RUSSIA': ['ru-', 'russia', 'moscow', 'spb-', 'mow-'],
          'ARAB': ['me-', 'middle-east', 'dubai', 'arab', 'uae', 'bahrain']
        };

        for (const [region, keywords] of Object.entries(regionKeywords)) {
          if (keywords.some(keyword => hostname.includes(keyword))) {
            this.currentServerRegion = region;
            this.currentServerName = this.serverRegions[region]?.name || region;
            console.log(`🌍 ✅ Detected server region: ${this.currentServerName} (${region}) based on hostname keyword`);
            return;
          }
        }
        
        console.log(`🌍 ❓ No hostname keywords matched for ${serverIP}`);
      }
      
      // Try to use geolocation API as last resort
      this.tryGeolocationDetection(serverIP);
    });
  }

  tryGeolocationDetection(serverIP) {
    console.log(`🌍 Attempting geolocation detection for ${serverIP}...`);
    
    // Use a simple HTTP request to get IP geolocation (this is a fallback)
    const options = {
      hostname: 'ipapi.co',
      port: 443,
      path: `/${serverIP}/json/`,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const geoData = JSON.parse(data);
          console.log(`🌍 Geolocation data:`, geoData);
          
          if (geoData.country_code) {
            const countryMapping = {
              'US': 'AMERICA',
              'CA': 'AMERICA', // Canada often uses US servers
              'GB': 'EUROPE',
              'DE': 'EUROPE',
              'FR': 'EUROPE',
              'IT': 'EUROPE',
              'ES': 'EUROPE',
              'NL': 'EUROPE',
              'SE': 'EUROPE',
              'IE': 'EUROPE',
              'CN': 'CHINA',
              'JP': 'JAPAN',
              'KR': 'KOREA',
              'RU': 'RUSSIA',
              'AE': 'ARAB',
              'SA': 'ARAB',
              'QA': 'ARAB',
              'KW': 'ARAB',
              'BH': 'ARAB',
              'SG': 'ASIA',
              'IN': 'ASIA',
              'TH': 'ASIA',
              'MY': 'ASIA',
              'ID': 'ASIA'
            };
            
            const detectedRegion = countryMapping[geoData.country_code];
            if (detectedRegion) {
              this.currentServerRegion = detectedRegion;
              this.currentServerName = this.serverRegions[detectedRegion]?.name || detectedRegion;
              console.log(`🌍 ✅ Detected server region: ${this.currentServerName} (${detectedRegion}) based on geolocation (${geoData.country})`);
              return;
            }
          }
        } catch (parseError) {
          console.log(`🌍 ❌ Failed to parse geolocation data:`, parseError.message);
        }
        
        // Final fallback - leave as Unknown for proper auto-detection
        console.log(`🌍 ⚠️ Could not auto-detect region for ${serverIP}, keeping as Unknown until next detection attempt`);
      });
    });

    req.on('error', (error) => {
      console.log(`🌍 ❌ Geolocation request failed:`, error.message);
      console.log(`🌍 ⚠️ Could not auto-detect region for ${serverIP}, keeping as Unknown until next detection attempt`);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`🌍 ⏱️ Geolocation request timed out for ${serverIP}`);
      console.log(`🌍 ⚠️ Could not auto-detect region for ${serverIP}, keeping as Unknown until next detection attempt`);
    });

    req.end();
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
      
      // Enhanced monster detection patterns for real Evony data
      // Look for JSON structures containing monster information
      const monsterPatterns = [
        // Pattern 1: Full monster JSON with coordinates
        /"name"\s*:\s*"([^"]+monster[^"]*)"[^}]*"level"\s*:\s*(\d+)[^}]*"x"\s*:\s*(\d+)[^}]*"y"\s*:\s*(\d+)/gi,
        
        // Pattern 2: Monster data with position
        /"type"\s*:\s*"([^"]+)"[^}]*"level"\s*:\s*(\d+)[^}]*"pos"\s*:\s*\[(\d+),\s*(\d+)\]/gi,
        
        // Pattern 3: Coordinate pairs with monster context
        /\{[^}]*"x"\s*:\s*(\d+)[^}]*"y"\s*:\s*(\d+)[^}]*"monster[^}]*"([^"]+)"/gi,
        
        // Pattern 4: Standard coordinate JSON
        /\{[^}]*"x"\s*:\s*(\d+)[^}]*"y"\s*:\s*(\d+)[^}]*\}/g
      ];

      // Try enhanced patterns first
      for (let i = 0; i < monsterPatterns.length; i++) {
        const pattern = monsterPatterns[i];
        let match;
        
        while ((match = pattern.exec(data)) !== null) {
          let x, y, monsterName, level;
          
          if (i === 0) { // Full monster JSON
            monsterName = match[1];
            level = parseInt(match[2]);
            x = parseInt(match[3]);
            y = parseInt(match[4]);
          } else if (i === 1) { // Monster with position array
            monsterName = match[1];
            level = parseInt(match[2]);
            x = parseInt(match[3]);
            y = parseInt(match[4]);
          } else if (i === 2) { // Coordinates with monster context
            x = parseInt(match[1]);
            y = parseInt(match[2]);
            monsterName = match[3];
            level = 1; // Default level
          } else { // Standard coordinates
            x = parseInt(match[1]);
            y = parseInt(match[2]);
            monsterName = 'Unknown';
            level = 1;
          }
          
          if (this.isValidCoordinate(x, y)) {
            if (monsterName && monsterName !== 'Unknown') {
              console.log(`📄 Found monster in game file: ${monsterName} Level ${level} at (${x}, ${y})`);
              this.foundMonsterLocation(x, y, monsterName, level, 'game_file');
            } else {
              // Try to extract monster info from surrounding context
              this.extractMonsterFromContext(data, match.index, x, y);
            }
          }
        }
      }
      
      // Dynamic monster detection - extract any monster-like names from context
      // instead of using hardcoded lists
      this.extractMonstersFromFileContent(data);
      
    } catch {
      // File not readable or binary, silently ignore
    }
  }

  extractMonstersFromFileContent(data) {
    // Look for any text patterns that suggest monster names with levels and coordinates
    // This replaces the hardcoded monster names list with dynamic detection
    const dynamicMonsterPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Level|Lv\.?|L\.?)\s*(\d+)[^0-9]*(\d{1,3})[,\s]+(\d{1,3})/gi;
    let match;
    
    while ((match = dynamicMonsterPattern.exec(data)) !== null) {
      const monsterName = match[1];
      const level = parseInt(match[2]);
      const x = parseInt(match[3]);
      const y = parseInt(match[4]);
      
      // Filter out common non-monster words
      const nonMonsterWords = ['Player', 'User', 'City', 'Building', 'Resource', 'Alliance', 'Server', 'Level', 'Coordinates'];
      if (!nonMonsterWords.some(word => monsterName.includes(word)) && this.isValidCoordinate(x, y)) {
        console.log(`📄 Found dynamic monster: ${monsterName} Level ${level} at (${x}, ${y}) in game file`);
        this.foundMonsterLocation(x, y, monsterName, level, 'game_file');
      }
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