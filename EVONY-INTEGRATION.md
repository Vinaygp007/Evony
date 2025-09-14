# Evony Game Integration Guide

## Current Status
❌ **NOT INTEGRATED** - The current application only uses mock data for demonstration purposes.

## Integration Options

### Option 1: Official Evony API (Recommended)
**Status**: Research needed - Check if Evony provides official APIs

```typescript
// Implementation would go in lib/evony-api-client.ts
const evonyClient = new EvonyApiClient({
  apiKey: process.env.EVONY_API_KEY!,
  serverId: process.env.EVONY_SERVER_ID!,
  kingdom: process.env.EVONY_KINGDOM!
});

// Replace mock data in app/api/monsters/route.ts
const monsters = await evonyClient.getMonsters();
```

**Pros**: 
- Official support
- Reliable data
- No risk of terms violation

**Cons**: 
- May not exist
- Likely requires developer approval

### Option 2: Screen Scraping / OCR
**Status**: Complex implementation required

```typescript
// Example using OCR to extract coordinates from game screenshots
import Tesseract from 'tesseract.js';

class EvonyScreenScraper {
  async extractMonsterData(screenshot: Buffer): Promise<Monster[]> {
    const result = await Tesseract.recognize(screenshot, 'eng');
    // Parse coordinate data from recognized text
    return this.parseMonsterCoordinates(result.data.text);
  }
}
```

**Pros**: 
- Can extract real game data
- Works with any visual information

**Cons**: 
- Requires screenshot automation
- OCR accuracy issues
- Performance intensive
- May violate ToS

### Option 3: Memory Reading (Advanced)
**Status**: High complexity, legal concerns

```cpp
// Example C++ memory reader (Windows)
// Would need Node.js native addon
HANDLE processHandle = OpenProcess(PROCESS_VM_READ, FALSE, evonyProcessId);
ReadProcessMemory(processHandle, monsterArrayAddress, buffer, size, &bytesRead);
```

**Pros**: 
- Direct access to game data
- Real-time updates

**Cons**: 
- Requires reverse engineering
- May violate ToS
- Platform specific
- Anti-cheat detection risk

### Option 4: Browser Extension (Web Version)
**Status**: Feasible if Evony has web version

```javascript
// Content script for Evony web game
function extractMonsterData() {
  const monsters = [];
  document.querySelectorAll('.monster-marker').forEach(marker => {
    const coords = marker.getAttribute('data-coords');
    const type = marker.getAttribute('data-type');
    const level = marker.getAttribute('data-level');
    
    monsters.push({ coords, type, level });
  });
  
  // Send to our tracker API
  fetch('http://localhost:3000/api/monsters', {
    method: 'POST',
    body: JSON.stringify(monsters)
  });
}
```

**Pros**: 
- Works with web version
- Can inject into existing UI
- Real-time data access

**Cons**: 
- Only works with browser version
- May violate ToS
- Requires extension permissions

## Recommended Implementation Steps

### Step 1: Research Official APIs
1. Check Evony's developer documentation
2. Contact Evony support about API access
3. Look for partner/alliance management APIs

### Step 2: If No Official API
Consider these alternatives in order of preference:

1. **Community Data Sharing**: Partner with other players to manually input data
2. **Alliance Coordination**: Build tools for alliance members to share scout reports
3. **Screenshot Analysis**: Implement OCR for processing shared screenshots

### Step 3: Legal Compliance
- Review Evony's Terms of Service
- Ensure any data extraction complies with game rules
- Consider reaching out to Evony for permission

## Current Mock Data Structure

The app currently uses this monster structure:

```typescript
interface Monster {
  id: string;
  monster: string;  // Type: Griffin, Dragon, etc.
  level: number;    // Monster level
  x: number;        // X coordinate
  y: number;        // Y coordinate
  timestamp: number; // When spotted
}
```

## Converting Real Data

To integrate real Evony data, you would need to:

1. Replace the mock data in `app/api/monsters/route.ts`
2. Implement authentication for your chosen data source
3. Add error handling for external API failures
4. Consider rate limiting to respect external service limits

## Example Environment Configuration

```env
# .env.local
EVONY_API_KEY=your_api_key_here
EVONY_SERVER_ID=your_server_id
EVONY_KINGDOM=your_kingdom_id
EVONY_USERNAME=your_username
EVONY_PASSWORD=your_password
```

## Next Steps

1. **Research**: Investigate if Evony has official APIs
2. **Community**: Ask in Evony communities about existing tools
3. **Legal**: Review terms of service for data extraction
4. **Prototype**: Start with manual data entry to test the system
5. **Scale**: Implement automated data collection once legal path is clear
