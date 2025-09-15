export interface Monster {
  id: string;
  monster: string;
  level: number;
  x: number;
  y: number;
  timestamp?: number;
  serverId?: string; // Add serverId for server filtering
  server?: string; // Server name
  region?: string; // Region name
  regionType?: string; // Region type
}

export interface RealTimeMonster extends Monster {
  type: string; // Alias for monster field for real-time API compatibility
  health?: string;
  alliance?: string;
  lastUpdated: number;
}

export interface MonsterFilter {
  type: string;
  minLevel: number;
  maxLevel: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
