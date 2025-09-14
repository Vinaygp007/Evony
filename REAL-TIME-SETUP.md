# 🤖 **Real-time Evony Data Acquisition Setup Guide**

## **Overview**
This system enables real-time monster data collection from Evony: The King's Return using automated browser technology and network interception techniques.

## **🛠 Technology Stack**
- **Puppeteer**: Automated browser control and DOM scraping
- **Chrome DevTools Protocol**: Network traffic interception
- **WebSocket**: Real-time data streaming
- **Next.js**: Frontend integration

---

## **📦 Quick Setup**

### **Step 1: Install Dependencies**
```bash
# Install data acquisition packages
npm install puppeteer ws

# Or use the provided script
npm run setup-acquisition
```

### **Step 2: Environment Configuration**
Create a `.env.local` file:
```env
# Evony Account Credentials (Optional - for auto-login)
EVONY_USERNAME_US=your_username
EVONY_PASSWORD_US=your_password
EVONY_USERNAME_EU=your_username_eu
EVONY_PASSWORD_EU=your_password_eu

# Data Acquisition Settings
ACQUISITION_PORT=8080
SCAN_INTERVAL=30000
MAX_RECONNECT_ATTEMPTS=10
```

### **Step 3: Start Data Acquisition**
```bash
# Start the data acquisition server
npm run data-acquisition

# Or manually
node services/evony-data-acquisition.js
```

### **Step 4: Access Dashboard**
1. Start your Next.js application: `npm run dev`
2. Go to `http://localhost:3000/tracker`
3. Click the **🤖 Real-time Data** tab
4. Click **Connect** to start receiving live data

---

## **🔧 Advanced Configuration**

### **Server Configuration**
Edit `services/evony-data-acquisition.js`:

```javascript
const servers = [
  {
    serverId: 'us1',
    region: 'US',
    url: 'https://game.evony.com/game/us1',
    username: process.env.EVONY_USERNAME_US,
    password: process.env.EVONY_PASSWORD_US
  },
  {
    serverId: 'eu1', 
    region: 'EU',
    url: 'https://game.evony.com/game/eu1',
    username: process.env.EVONY_USERNAME_EU,
    password: process.env.EVONY_PASSWORD_EU
  }
  // Add more servers as needed
];
```

### **Data Collection Settings**
```javascript
const config = {
  scanInterval: 30000,        // 30 seconds between scans
  cleanupInterval: 600000,    // 10 minutes before removing old monsters
  maxPages: 5,                // Maximum concurrent browser pages
  enableLogging: true,        // Console logging
  screenshotOnError: true     // Take screenshots when errors occur
};
```

---

## **📊 Data Flow Architecture**

```
[Evony Game Client] → [Browser Automation] → [Network Interception] → [WebSocket Server] → [Next.js Dashboard]
```

### **1. Browser Automation Layer**
- **Puppeteer** launches headless Chrome instances
- Navigates to Evony game servers
- Handles authentication automatically
- Monitors DOM changes for monster elements

### **2. Network Interception Layer**
- **Chrome DevTools Protocol** captures network traffic
- Intercepts API calls containing monster data
- Filters relevant JSON responses
- Processes multiple data formats

### **3. Data Processing Layer**
- Normalizes monster data from different sources
- Tracks monster lifecycle (spawn/update/remove)
- Maintains server-specific monster collections
- Implements cleanup for stale data

### **4. Real-time Distribution Layer**
- **WebSocket Server** on port 8080
- Broadcasts updates to connected clients
- Handles client connections/disconnections
- Provides initial data dump for new connections

---

## **🎯 Supported Data Sources**

### **DOM Scraping Targets**
```javascript
const monsterSelectors = [
  '.monster-marker',
  '.world-monster', 
  '[data-monster-id]',
  '.map-entity[data-type="monster"]',
  '.creature-marker'
];
```

### **API Endpoint Patterns**
```javascript
const apiPatterns = [
  /\/api\/world\/monsters/,
  /\/map\/entities/,
  /\/game\/world_map/,
  /monster.*\.json/,
  /world.*data/
];
```

### **Network Response Formats**
```typescript
// Format 1: Direct monster array
{
  "monsters": [
    { "id": "123", "type": "Dragon", "level": 45, "x": 100, "y": 200 }
  ]
}

// Format 2: Entity collection
{
  "entities": [
    { "type": "monster", "data": { ... } }
  ]
}

// Format 3: World map data
{
  "worldMap": {
    "monsters": { ... },
    "other": { ... }
  }
}
```

---

## **⚡ Real-time Features**

### **Live Monster Tracking**
- **Spawn Detection**: New monsters appear instantly
- **Position Updates**: Monster movement tracking
- **Health Monitoring**: Real-time health changes
- **Alliance Tracking**: Ownership changes

### **Multi-Server Support**
- Concurrent monitoring of multiple servers
- Server-specific monster filtering
- Cross-server statistics
- Region-based organization

### **Smart Cleanup**
- Auto-removal of stale monsters (10+ minutes)
- Memory usage optimization
- Connection health monitoring
- Error recovery mechanisms

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **Connection Failed**
```bash
# Check if acquisition server is running
npm run data-acquisition

# Verify WebSocket port
netstat -an | grep 8080
```

#### **No Monster Data**
1. **Login Issues**: Check credentials in `.env.local`
2. **Server Changes**: Evony may have updated their UI/API
3. **Network Blocking**: Some networks block WebSocket connections
4. **Browser Permissions**: Puppeteer needs proper permissions

#### **Performance Issues**
```javascript
// Reduce scan frequency
const config = {
  scanInterval: 60000  // 1 minute instead of 30 seconds
};

// Limit concurrent pages
const maxPages = 2;  // Reduce from 5 to 2
```

### **Debug Mode**
```bash
# Enable detailed logging
ACQUISITION_DEBUG=true npm run data-acquisition

# Monitor WebSocket connections
DEBUG=ws npm run data-acquisition
```

---

## **📈 Performance Optimization**

### **Resource Management**
- **Memory**: Monitor browser memory usage
- **CPU**: Limit concurrent browser instances
- **Network**: Optimize request frequency
- **Storage**: Implement data rotation

### **Scaling Options**
1. **Horizontal**: Multiple acquisition servers
2. **Vertical**: Increase server resources
3. **Regional**: Deploy near Evony servers
4. **Caching**: Implement Redis for data sharing

---

## **🔒 Ethical Considerations**

### **Terms of Service**
- Review Evony's Terms of Service before deployment
- This tool is for educational and research purposes
- Respect rate limits and server load
- Do not disrupt gameplay for other users

### **Data Privacy**
- Only collect publicly visible monster data
- Do not store personal player information
- Implement data retention policies
- Secure WebSocket connections in production

---

## **🚀 Deployment Options**

### **Local Development**
```bash
npm run dev & npm run data-acquisition
```

### **Production Setup**
```bash
# Use PM2 for process management
npm install -g pm2

# Start acquisition service
pm2 start services/evony-data-acquisition.js --name "evony-acquisition"

# Start Next.js app
pm2 start npm --name "evony-app" -- start
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# ... rest of Dockerfile
```

---

## **📊 Monitoring & Analytics**

### **Built-in Metrics**
- Total monsters tracked
- Updates per minute
- Server response times
- Connection health status

### **Custom Analytics**
```javascript
// Add custom metrics
const metrics = {
  monstersPerHour: 0,
  serverLatency: {},
  errorRate: 0,
  dataQuality: 0.95
};
```

---

## **🔮 Future Enhancements**

- **Machine Learning**: Predict monster spawn patterns
- **Alliance Integration**: Track alliance activities  
- **Historical Data**: Store and analyze trends
- **Mobile App**: React Native companion app
- **API Gateway**: RESTful API for third-party integrations

---

**Ready to start tracking monsters in real-time! 🐉⚔️**
