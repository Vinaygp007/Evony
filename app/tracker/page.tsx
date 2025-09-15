'use client';

import { useState, useCallback, useEffect } from 'react';
import { MonsterMap } from '../../components/MonsterMapWrapper';
import SimpleMap from '../../components/SimpleMap';
import { MonsterSidebar } from '../../components/MonsterSidebar';
import ServerSelector from '../../components/ServerSelector';
import ManualMonsterEntry from '../../components/ManualMonsterEntry';
import { useStreamlinedExtractor } from '../../hooks/useStreamlinedExtractor';
import { Monster, MapBounds } from '../../types/monster';
import { EvonyServer } from '../../types/evonyServers';
import Link from 'next/link';

export default function TrackerPage() {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [selectedMonsterType, setSelectedMonsterType] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<EvonyServer | null>(null);
  const [useSimpleMap, setUseSimpleMap] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
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
  const addMonster = () => {
    // Real data comes from extractor, manual add not supported
    console.log('Manual monster entry not supported in real extractor mode');
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.3),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.2),transparent)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Glassmorphism Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/homepage">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                  <span className="text-3xl">🎯</span>
                </div>
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MONSTER NEXUS
                </h1>
                <p className="text-gray-300 text-lg font-medium">Real-Time Intelligence Dashboard</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-lg">
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
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105">
                  🏠 HOME BASE
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-96 bg-white/5 backdrop-blur-xl border-r border-white/10 shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Live Intelligence Feed</h2>
            
            {/* Real-Time Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-400">{filteredMonsters.length}</div>
                <div className="text-sm text-blue-300">ACTIVE TARGETS</div>
              </div>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
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
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {monsterTypes.map(type => (
                    <option key={type} value={type} className="bg-gray-800">
                      {type === 'all' ? '🌟 All Creatures' : `🐲 ${type}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SERVER REALM</label>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden">
                  <ServerSelector
                    selectedServer={selectedServer}
                    onServerSelect={setSelectedServer}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowManualEntry(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>✨</span>
                <span>MARK NEW TARGET</span>
              </button>
              
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-1">TACTICAL MAP</h3>
              <p className="text-sm text-gray-300">Real-time creature tracking</p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setUseSimpleMap(!useSimpleMap)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
                title={`Switch to ${useSimpleMap ? 'Advanced' : 'Simple'} Map`}
              >
                {useSimpleMap ? '🗺️ BASIC MODE' : '⚛️ ADVANCED MODE'}
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="absolute inset-6 top-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm">
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
          <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 min-w-[300px] shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <span>📊</span>
              <span>INTELLIGENCE BRIEFING</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Creatures:</span>
                <span className="text-blue-400 font-bold text-xl">{filteredMonsters.length}</span>
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
                <div className="pt-3 border-t border-white/20">
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
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
                  The creature intelligence network is ready. Begin tracking monsters from your Evony realm.
                </p>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                >
                  ⚡ INITIATE TRACKING
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <ManualMonsterEntry
              onAddMonster={addMonster}
              onClose={() => setShowManualEntry(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
