'use client';

import { useState, useCallback, useEffect } from 'react';
import { MonsterMap } from '../../components/MonsterMapWrapper';
import SimpleMap from '../../components/SimpleMap';
import { MonsterSidebar } from '../../components/MonsterSidebar';
import ServerSelector from '../../components/ServerSelector';
import { useStreamlinedExtractor } from '../../hooks/useStreamlinedExtractor';
import { Monster, MapBounds } from '../../types/monster';
import { EvonyServer } from '../../types/evonyServers';
import Link from 'next/link';

export default function TrackerPage() {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [selectedMonsterType, setSelectedMonsterType] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<EvonyServer | null>(null);
  const [useSimpleMap, setUseSimpleMap] = useState(true);
  
  // Use REAL streamlined extractor for live monster data
  const { 
    monsters,
    connectionStatus,
    currentServer,
    totalExtracted,
    reconnect
  } = useStreamlinedExtractor();
  
  // Define loading state based on connection status
  const loading = connectionStatus === 'connecting' || connectionStatus === 'disconnected';
  
  // Define helper functions
  const clearAllMonsters = () => {
    // For real data, we can't clear server data, just reconnect
    reconnect();
  };
  
  // Debug log for real extractor monsters
  useEffect(() => {
    console.log('🔥 REAL monsters from streamlined extractor:', monsters.length);
    console.log('📊 Connection status:', connectionStatus);
    console.log('🌐 Current server:', currentServer);
    console.log('📈 Total extracted:', totalExtracted);
    if (monsters.length > 0) {
      console.log('🎯 Latest real monsters:', monsters.slice(0, 3));
    }
  }, [monsters, connectionStatus, currentServer, totalExtracted]);

  // Calculate real-time stats
  const stats = {
    totalMonsters: monsters.length,
    recentMonsters: monsters.filter(m => m.timestamp && (Date.now() - m.timestamp) < 300000).length,
    averageLevel: monsters.length > 0 ? Math.round(monsters.reduce((sum, m) => sum + m.level, 0) / monsters.length) : 0,
    uniqueTypes: [...new Set(monsters.map(m => m.monster))],
    totalExtracted: totalExtracted,
    currentServer: currentServer
  };
  
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Dynamic Particle System Background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(0.5px)',
              animation: `pulse ${2 + Math.random() * 3}s infinite ${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-96 -right-96 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-96 -left-96 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/10 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-600/5 to-transparent rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Glassmorphism Header */}
      <header className="relative z-20 bg-black/80 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/homepage">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-2xl animate-pulse">
                    <span className="text-3xl relative z-10">🎯</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-30"></div>
                </div>
              </Link>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  MONSTER NEXUS
                </h1>
                <p className="text-gray-300 text-lg font-medium">Real-Time Intelligence Dashboard</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-6">
              <div className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-3 shadow-2xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50 animate-pulse' : 
                    'bg-red-400 shadow-lg shadow-red-400/50'
                  }`}></div>
                  <span className="text-white font-medium">
                    {connectionStatus === 'connected' ? 'LIVE TRACKING' :
                     connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              
              <Link href="/homepage">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-[1px] rounded-xl">
                  <button className="bg-black px-6 py-3 rounded-xl text-white font-medium hover:bg-gray-900 transition-all duration-300">
                    🏠 HOME BASE
                  </button>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-96 bg-black/80 backdrop-blur-xl border-r border-purple-500/30 shadow-2xl">
          <div className="p-6 border-b border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Live Intelligence Feed</h2>
            
            {/* Real-Time Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-cyan-400">{filteredMonsters.length}</div>
                <div className="text-sm text-cyan-300">ACTIVE TARGETS</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-purple-400">{totalExtracted}</div>
                <div className="text-sm text-purple-300">TOTAL SCANNED</div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">CREATURE TYPE</label>
                <select
                  value={selectedMonsterType}
                  onChange={(e) => setSelectedMonsterType(e.target.value)}
                  className="w-full bg-black/70 backdrop-blur-md border border-purple-500/30 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  {monsterTypes.map(type => (
                    <option key={type} value={type} className="bg-gray-900">
                      {type === 'all' ? '🌟 All Creatures' : `🐲 ${type}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SERVER REALM</label>
                <div className="bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden">
                  <ServerSelector
                    selectedServer={selectedServer}
                    onServerSelect={setSelectedServer}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {monsters.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('🗑️ Purge all tracking data? This cannot be undone.')) {
                      clearAllMonsters();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>🔥</span>
                  <span>PURGE DATABASE</span>
                </button>
              )}

              {connectionStatus !== 'connected' && (
                <button
                  onClick={reconnect}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-500/25 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>⚡</span>
                  <span>RECONNECT NEXUS</span>
                </button>
              )}
            </div>
          </div>

          {/* Monster List */}
          <div className="h-full overflow-hidden">
            <MonsterSidebar
              monsters={filteredMonsters}
              loading={loading}
            />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
            <div className="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-3 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1">TACTICAL MAP</h3>
              <p className="text-sm text-gray-300">Real-time creature tracking</p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setUseSimpleMap(!useSimpleMap)}
                className="bg-black/80 backdrop-blur-xl border border-purple-500/30 hover:bg-black/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
                title={`Switch to ${useSimpleMap ? 'Advanced' : 'Simple'} Map`}
              >
                {useSimpleMap ? '🗺️ BASIC MODE' : '⚛️ ADVANCED MODE'}
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="absolute inset-6 top-20 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 bg-black/50 backdrop-blur-sm">
            {useSimpleMap ? (
              <SimpleMap
                monsters={filteredMonsters}
                onBoundsChange={handleBoundsChange}
                className="h-full w-full"
              />
            ) : (
              <MonsterMap
                monsters={filteredMonsters}
                onBoundsChange={handleBoundsChange}
                className="h-full w-full"
              />
            )}
          </div>
          
          {/* Stats Panel */}
          <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 min-w-[300px] shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <span>📊</span>
              <span>INTELLIGENCE BRIEFING</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Creatures:</span>
                <span className="text-cyan-400 font-bold text-xl">{filteredMonsters.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Data Source:</span>
                <span className="text-green-400 font-bold">LIVE FEED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Map Engine:</span>
                <span className="text-purple-400 font-bold">{useSimpleMap ? 'BASIC' : 'ADVANCED'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Tracked:</span>
                <span className="text-cyan-400 font-bold">{stats.totalMonsters}</span>
              </div>
              {currentServer && (
                <div className="pt-3 border-t border-purple-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Server:</span>
                    <span className="text-yellow-400 font-bold">{currentServer}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <div className="text-2xl font-bold text-white mb-2">SCANNING NEXUS...</div>
                <p className="text-gray-300">Synchronizing creature intelligence</p>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!loading && filteredMonsters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-8xl mb-6 animate-pulse">🐲</div>
                <h3 className="text-3xl font-bold text-white mb-4">NEXUS AWAITING TARGETS</h3>
                <p className="text-gray-300 mb-8 text-lg">
                  The creature intelligence network is ready. Start your Evony game to begin real-time monster tracking.
                </p>
                <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-purple-300 text-sm">
                    🎮 Launch Evony: The King&apos;s Return to detect monsters automatically
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
