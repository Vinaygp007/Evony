'use client';

import { useState, useCallback, useEffect } from 'react';
import { MonsterMap } from '../../components/MonsterMapWrapper';
import SimpleMap from '../../components/SimpleMap';
import { MonsterSidebar } from '../../components/MonsterSidebar';
import ServerSelector from '../../components/ServerSelector';
import DataAcquisitionDashboard from '../../components/DataAcquisitionDashboard';
import { useMonsters } from '../../hooks/useMonsters';
import { useSocket } from '../../hooks/useSocket';
import { Monster, MapBounds } from '../../types/monster';
import { EvonyServer } from '../../types/evonyServers';
import Link from 'next/link';

interface WebSocketMonsterData {
  id: string;
  monster: string;
  level: number;
  x: number;
  y: number;
  timestamp: number;
  serverId: string;
  server?: string;
  alliance?: string;
  health?: number;
  location?: string;
}

export default function TrackerPage() {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [selectedMonsterType, setSelectedMonsterType] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<EvonyServer | null>(null);
  const [useSimpleMap, setUseSimpleMap] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracker' | 'acquisition'>('tracker');
  
  const { monsters, loading, addMonster, updateMonster, removeMonster } = useMonsters();
  
  // WebSocket connection for Server 353 data
  useEffect(() => {
    console.log('🔌 Connecting to Server 353 WebSocket...');
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('✅ Connected to Server 353 WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📦 Received data from Server 353:', data.type, data.monsters?.length || 0, 'monsters');
        
        if (data.monsters && Array.isArray(data.monsters)) {
          data.monsters.forEach((monsterData: WebSocketMonsterData) => {
            const processedMonster: Monster = {
              id: monsterData.id,
              monster: monsterData.monster,
              level: monsterData.level,
              x: monsterData.x,
              y: monsterData.y,
              timestamp: monsterData.timestamp,
              serverId: monsterData.serverId || 'Server_353'
            };
            addMonster(processedMonster);
          });
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket data:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('❌ Disconnected from Server 353 WebSocket');
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [addMonster]);
  
  useSocket({
    onMonsterSpawn: addMonster,
    onMonsterUpdate: updateMonster,
    onMonsterRemove: removeMonster
  });

  const filteredMonsters = monsters.filter((monster: Monster) => {
    const typeMatch = selectedMonsterType === 'all' || monster.monster === selectedMonsterType;
    const serverMatch = !selectedServer || monster.serverId === selectedServer.id;
    
    if (!mapBounds) return typeMatch && serverMatch;
    
    const inBounds = 
      monster.x >= mapBounds.west &&
      monster.x <= mapBounds.east &&
      monster.y >= mapBounds.south &&
      monster.y <= mapBounds.north;
    
    return typeMatch && serverMatch && inBounds;
  });

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const monsterTypes = [
    'all',
    ...new Set(monsters.map(m => m.monster))
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/homepage">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <span className="text-2xl">⚔️</span>
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Evony Monster Tracker</h1>
              <p className="text-gray-400 text-sm">Real-time monster hunting companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('tracker')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'tracker'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🗺️ Tracker
              </button>
              <button
                onClick={() => setActiveTab('acquisition')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'acquisition'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🤖 Real-time Data
              </button>
            </div>
            
            {activeTab === 'tracker' && (
              <button
                onClick={() => setUseSimpleMap(!useSimpleMap)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                title={`Switch to ${useSimpleMap ? 'React-Leaflet' : 'Simple'} Map`}
              >
                {useSimpleMap ? '🗺️ Simple' : '⚛️ React'} Map
              </button>
            )}
            
            <Link href="/homepage">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors">
                🏠 Home
              </button>
            </Link>
            
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-md">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-300">
                {filteredMonsters.length} monsters
              </span>
            </div>
          </div>
        </div>
        
        {activeTab === 'tracker' && (
          <div className="mt-6 flex items-center space-x-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monster Type
              </label>
              <select
                value={selectedMonsterType}
                onChange={(e) => setSelectedMonsterType(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monsterTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Monsters' : type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Filter
              </label>
              <ServerSelector
                selectedServer={selectedServer}
                onServerSelect={setSelectedServer}
              />
            </div>
            
            {selectedServer && (
              <div className="bg-blue-900/50 px-4 py-2 rounded-md border border-blue-500/30">
                <div className="text-sm text-blue-300">
                  Filtering by: <span className="font-semibold text-white">{selectedServer.region} {selectedServer.name}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex h-[calc(100vh-160px)]">
        {activeTab === 'tracker' ? (
          <>
            <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-hidden">
              <MonsterSidebar
                monsters={filteredMonsters}
                loading={loading}
              />
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-4 rounded-lg overflow-hidden shadow-lg border border-gray-700">
                {useSimpleMap ? (
                  <SimpleMap
                    monsters={filteredMonsters}
                    onBoundsChange={handleBoundsChange}
                    className="h-full w-full rounded-lg"
                  />
                ) : (
                  <MonsterMap
                    monsters={filteredMonsters}
                    onBoundsChange={handleBoundsChange}
                    className="h-full w-full rounded-lg"
                  />
                )}
              </div>
              
              <div className="absolute top-8 right-8 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 min-w-[200px]">
                <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active Monsters:</span>
                    <span className="text-blue-400 font-bold">{filteredMonsters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Server Status:</span>
                    <span className="text-green-400">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Map Engine:</span>
                    <span className="text-blue-400">{useSimpleMap ? 'Simple' : 'React'}</span>
                  </div>
                  {selectedServer && (
                    <div className="pt-2 border-t border-gray-600">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Server:</span>
                        <span className="text-purple-400">{selectedServer.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {loading && (
                <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading monsters...</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Real-time Data Acquisition</h2>
                <p className="text-gray-400">Monitor live monster data streams</p>
              </div>
              <div className="p-6">
                <DataAcquisitionDashboard />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
