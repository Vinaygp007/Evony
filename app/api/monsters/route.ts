import { NextRequest, NextResponse } from 'next/server';
import { Monster } from '../../../types/monster';

// Mock data for demonstration
const mockMonsters: Monster[] = [
  {
    id: '1',
    monster: 'Griffin',
    level: 4,
    x: 123.45,
    y: 456.78,
    timestamp: Date.now() - 300000, // 5 minutes ago
    serverId: 'us1'
  },
  {
    id: '2',
    monster: 'Dragon',
    level: 8,
    x: -45.67,
    y: 123.89,
    timestamp: Date.now() - 120000, // 2 minutes ago
    serverId: 'us1'
  },
  {
    id: '3',
    monster: 'Orc',
    level: 2,
    x: 200.12,
    y: -100.34,
    timestamp: Date.now() - 600000, // 10 minutes ago
    serverId: 'us2'
  },
  {
    id: '4',
    monster: 'Goblin',
    level: 1,
    x: -200.45,
    y: -300.67,
    timestamp: Date.now() - 180000, // 3 minutes ago
    serverId: 'eu1'
  },
  {
    id: '5',
    monster: 'Troll',
    level: 6,
    x: 350.89,
    y: 250.12,
    timestamp: Date.now() - 450000, // 7.5 minutes ago
    serverId: 'eu1'
  },
  {
    id: '6',
    monster: 'Skeleton',
    level: 3,
    x: -150.23,
    y: 400.56,
    timestamp: Date.now() - 90000, // 1.5 minutes ago
    serverId: 'asia1'
  },
  {
    id: '7',
    monster: 'Vampire',
    level: 7,
    x: 100.78,
    y: -200.34,
    timestamp: Date.now() - 240000, // 4 minutes ago
    serverId: 'asia1'
  },
  {
    id: '8',
    monster: 'Phoenix',
    level: 9,
    x: -300.12,
    y: 150.45,
    timestamp: Date.now() - 360000, // 6 minutes ago
    serverId: 'us3'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // You can add query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const minLevel = searchParams.get('minLevel');
    const maxLevel = searchParams.get('maxLevel');
    const serverId = searchParams.get('serverId');

    let filteredMonsters = mockMonsters;

    // Apply filters if provided
    if (type) {
      filteredMonsters = filteredMonsters.filter(monster => 
        monster.monster.toLowerCase() === type.toLowerCase()
      );
    }

    if (minLevel) {
      const min = parseInt(minLevel);
      filteredMonsters = filteredMonsters.filter(monster => 
        monster.level >= min
      );
    }

    if (maxLevel) {
      const max = parseInt(maxLevel);
      filteredMonsters = filteredMonsters.filter(monster => 
        monster.level <= max
      );
    }

    if (serverId) {
      filteredMonsters = filteredMonsters.filter(monster => 
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
