import { NextRequest, NextResponse } from 'next/server';
import { Monster } from '../../../types/monster';
import WebSocket from 'ws';

// Function to fetch monsters from the WebSocket server
const fetchMonstersFromServer = (): Promise<Monster[]> => {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.on('open', () => {
        // WebSocket connection opened
      });
      
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.type === 'map_data' && response.monsters) {
            // Transform the data to match our Monster interface
            const monsters: Monster[] = response.monsters.map((monster: any) => ({
              id: monster.id,
              monster: monster.monster,
              level: monster.level,
              x: monster.x,
              y: monster.y,
              timestamp: monster.timestamp,
              serverId: monster.serverId || 'Server_353',
              server: monster.server,
              region: monster.region,
              regionType: monster.regionType
            }));
            resolve(monsters);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
          resolve([]);
        } finally {
          ws.close();
        }
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        resolve([]);
      });
      
      ws.on('close', () => {
        // Connection closed
      });
      
      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve([]);
      }, 5000);
      
    } catch (error) {
      console.error('Error connecting to monster server:', error);
      resolve([]);
    }
  });
};

export async function GET(request: NextRequest) {
  try {
    // Fetch monsters from the WebSocket server
    const monsters = await fetchMonstersFromServer();

    // You can add query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const minLevel = searchParams.get('minLevel');
    const maxLevel = searchParams.get('maxLevel');
    const serverId = searchParams.get('serverId');

    let filteredMonsters = monsters;

    // Apply filters if provided
    if (type) {
      filteredMonsters = filteredMonsters.filter((monster: Monster) => 
        monster.monster.toLowerCase() === type.toLowerCase()
      );
    }

    if (minLevel) {
      const min = parseInt(minLevel);
      filteredMonsters = filteredMonsters.filter((monster: Monster) => 
        monster.level >= min
      );
    }

    if (maxLevel) {
      const max = parseInt(maxLevel);
      filteredMonsters = filteredMonsters.filter((monster: Monster) => 
        monster.level <= max
      );
    }

    if (serverId) {
      filteredMonsters = filteredMonsters.filter((monster: Monster) => 
        monster.serverId === serverId
      );
    }

    return NextResponse.json(filteredMonsters, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching monsters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monsters' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the monster data
    if (!body.monster || typeof body.level !== 'number' || 
        typeof body.x !== 'number' || typeof body.y !== 'number') {
      return NextResponse.json(
        { error: 'Invalid monster data' }, 
        { status: 400 }
      );
    }

    const newMonster: Monster = {
      id: Date.now().toString(),
      monster: body.monster,
      level: body.level,
      x: body.x,
      y: body.y,
      timestamp: Date.now()
    };

    // In a real application, you would save this to a database
    // For now, we'll just return the created monster
    
    return NextResponse.json(newMonster, { status: 201 });
  } catch (error) {
    console.error('Error creating monster:', error);
    return NextResponse.json(
      { error: 'Failed to create monster' }, 
      { status: 500 }
    );
  }
}
