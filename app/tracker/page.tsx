'use client';

import { useState, useCallback, useEffect } from 'react';
import { MonsterMap } from '../../components/MonsterMapWrapper';
import SimpleMap from '../../components/SimpleMap';
import { MonsterSidebar } from '../../components/MonsterSidebar';
import ServerSelector from '../../components/ServerSelector';
import ManualMonsterEntry from '../../components/ManualMonsterEntry';
import { useRealEvonyNetwork } from '../../hooks/useRealEvonyNetwork';
import { Monster, MapBounds } from '../../types/monster';
import { EvonyServer } from '../../types/evonyServers';
import Link from 'next/link';

export default function TrackerPage() {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [selectedMonsterType, setSelectedMonsterType] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<EvonyServer | null>(null);
  const [useSimpleMap, setUseSimpleMap] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracker' | 'acquisition'>('tracker');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Use REAL network monitoring for Server 353 data
  const { 
    monsters,
    connectionStatus,
    lastUpdate,
    extractionStats,
    reconnect,
    getNetworkStats,
    isConnected,
    isRealTime
  } = useRealEvonyNetwork();
  
  // Define loading state based on connection status
  const loading = connectionStatus === 'connecting' || connectionStatus === 'disconnected';
  
  // Define helper functions
  const getStats = () => getNetworkStats();
  const clearAllMonsters = () => {
    // For real data, we can't clear server data, just reconnect
    reconnect();
  };
  const addMonster = () => {
    // Real data comes from server, manual add not supported in real mode
    console.log('Manual monster entry not supported in real data mode');
  };
  
  // Debug log for real network monsters
  useEffect(() => {
    console.log('🔥 REAL monsters from Server 353:', monsters.length);
    if (monsters.length > 0) {
      console.log('🎯 Latest real monsters:', monsters.slice(0, 3));
      console.log('📊 Network stats:', getNetworkStats());
    }
  }, [monsters, getNetworkStats]);
  
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
              <h1 className="text-3xl font-bold text-white">Real Evony Monster Tracker</h1>
              <p className="text-gray-400 text-sm">Track real monsters from your Evony gameplay</p>
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
                📊 Data Management
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
            
            <div className="flex items-center space-x-4">
              {/* Add Monster Button */}
              <button
                onClick={() => setShowManualEntry(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Monster</span>
              </button>

              {/* Clear Data Button */}
              {monsters.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all monster data?')) {
                      clearAllMonsters();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                >
                  🗑️ Clear All
                </button>
              )}

              {/* Network Monitor Status */}
              <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-md">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-300">
                  {isConnected ? `${monsters.length} live monsters` : 'Network monitor offline'}
                </span>
                {!isConnected && (
                  <button
                    onClick={reconnect}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Reconnect
                  </button>
                )}
              </div>

              {/* Network Stats */}
              {monsters.length > 0 && (
                <div className="text-xs text-gray-400">
                  Total: {getNetworkStats().totalMonsters} | Recent: {getNetworkStats().recentMonsters} | Avg Level: {getNetworkStats().averageLevel}
                </div>
              )}
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
                <h3 className="text-lg font-semibold text-white mb-3">Real Data Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active Monsters:</span>
                    <span className="text-blue-400 font-bold">{filteredMonsters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Data Source:</span>
                    <span className="text-red-400">DEMO ONLY - No Real Data</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Map Engine:</span>
                    <span className="text-blue-400">{useSimpleMap ? 'Simple' : 'React'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Tracked:</span>
                    <span className="text-purple-400">{getStats().totalMonsters}</span>
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
                <h2 className="text-2xl font-bold text-white">Real Monster Data Management</h2>
                <p className="text-gray-400">Manage your real Evony monster tracking data</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quick Stats */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">📊 Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Monsters:</span>
                        <span className="text-blue-400 font-bold">{getStats().totalMonsters}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Active Servers:</span>
                        <span className="text-green-400 font-bold">{extractionStats.networkExtractions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Monster Types:</span>
                        <span className="text-purple-400 font-bold">{getStats().uniqueTypes.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">⚡ Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowManualEntry(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                      >
                        ➕ Add Monster
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Clear all monster data?')) clearAllMonsters();
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                        disabled={monsters.length === 0}
                      >
                        🗑️ Clear All Data
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">📋 Instructions</h3>
                    <div className="text-sm text-gray-300 space-y-2">
                      <p>1. Tap monsters in Evony to get coordinates</p>
                      <p>2. Use &quot;Add Monster&quot; to input real data</p>
                      <p>3. Share data with your alliance</p>
                      <p>4. Track monsters on the map</p>
                    </div>
                  </div>
                </div>

                {/* No Data Message */}
                {monsters.length === 0 && (
                  <div className="mt-8 text-center py-12">
                    <div className="text-6xl mb-4">🐲</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Real Monster Data Yet</h3>
                    <p className="text-gray-400 mb-4">
                      Start tracking real monsters from your Evony gameplay!
                    </p>
                    <button
                      onClick={() => setShowManualEntry(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors"
                    >
                      Add Your First Monster
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Monster Entry Modal */}
      {showManualEntry && (
        <ManualMonsterEntry
          onAddMonster={addMonster}
          onClose={() => setShowManualEntry(false)}
        />
      )}
    </div>
  );
}
