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
      console.log('🔍 Monster data structure:', {
        firstMonster: monsters[0],
        hasCoordinates: monsters[0]?.x !== undefined && monsters[0]?.y !== undefined,
        hasName: monsters[0]?.monster !== undefined,
        hasLevel: monsters[0]?.level !== undefined
      });
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
    console.log('🔍 Filtering monster:', monster);
    console.log('🔍 Monster serverId:', monster.serverId, 'Selected server:', selectedServer?.id);
    
    const typeMatch = selectedMonsterType === 'all' || monster.monster === selectedMonsterType;
    const serverMatch = !selectedServer || monster.serverId === selectedServer.id || !monster.serverId;
    
    console.log('🔍 Type match:', typeMatch, 'Server match:', serverMatch);
    
    if (!mapBounds) {
      const result = typeMatch && serverMatch;
      console.log('🔍 Final result (no bounds):', result);
      return result;
    }
    
    const inBounds = 
      monster.x >= mapBounds.west &&
      monster.x <= mapBounds.east &&
      monster.y >= mapBounds.south &&
      monster.y <= mapBounds.north;
    
    const result = typeMatch && serverMatch && inBounds;
    console.log('🔍 Final result (with bounds):', result);
    return result;
  });

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const monsterTypes = [
    'all',
    ...new Set(monsters.map(m => m.monster))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white overflow-hidden relative">
      {/* Animated Neural Network Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic Moving Orbs */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl animate-pulse"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Floating Particles */}
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Glassmorphism Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Dynamic Gradient Overlays */}
      <div className="absolute inset-0">
        <div className="absolute -top-96 -right-96 w-[1000px] h-[1000px] bg-gradient-to-br from-purple-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-96 -left-96 w-[1000px] h-[1000px] bg-gradient-to-tr from-cyan-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-600/8 to-transparent rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-96 -right-96 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-96 -left-96 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/10 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-600/5 to-transparent rounded-full animate-ping delay-2000"></div>
      </div>

      {/* Ultra-Modern Glassmorphism Header */}
      <header className="relative z-20 bg-black/40 backdrop-blur-3xl border-b border-gradient-to-r from-purple-500/30 via-cyan-500/30 to-purple-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-cyan-600/10"></div>
        <div className="max-w-7xl mx-auto px-8 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/homepage">
                <div className="relative group">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-500 shadow-2xl animate-pulse group-hover:animate-none">
                    <span className="text-4xl relative z-10 group-hover:scale-125 transition-transform duration-300">🎯</span>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-30"></div>
                </div>
              </Link>
              
              <div className="relative">
                <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                  NEXUS COMMAND
                </h1>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 blur-sm rounded-lg"></div>
                <p className="text-gray-300 text-xl font-medium mt-1 tracking-wide">Elite Monster Intelligence System</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-green-400 text-sm font-semibold">QUANTUM SYNCHRONIZED</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Status Dashboard */}
            <div className="flex items-center space-x-6">
              <div className="bg-black/60 backdrop-blur-2xl border border-purple-500/40 rounded-3xl px-8 py-4 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className={`w-6 h-6 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/50' : 
                      connectionStatus === 'connecting' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50 animate-pulse' : 
                      'bg-gradient-to-r from-red-400 to-red-600 shadow-lg shadow-red-400/50'
                    } relative`}>
                      <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20"></div>
                    </div>
                    <div>
                      <span className="text-white font-bold text-lg">
                        {connectionStatus === 'connected' ? 'NEXUS ONLINE' :
                         connectionStatus === 'connecting' ? 'SYNCHRONIZING...' : 'NEXUS OFFLINE'}
                      </span>
                      <div className="text-xs text-gray-400">
                        {monsters.length} ACTIVE TARGETS • {totalExtracted} SCANNED
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/homepage">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-[2px] rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
                  <button className="bg-black/90 backdrop-blur-xl px-8 py-4 rounded-2xl text-white font-bold hover:bg-black/70 transition-all duration-300 flex items-center space-x-3">
                    <span className="text-2xl">🏠</span>
                    <span>COMMAND CENTER</span>
                  </button>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="relative z-10 flex h-[calc(100vh-140px)]">
        {/* Ultra-Modern Sidebar */}
        <div className="w-[420px] bg-black/30 backdrop-blur-3xl border-r border-gradient-to-b from-purple-500/40 via-cyan-500/20 to-purple-500/40 shadow-2xl flex flex-col relative overflow-hidden">
          {/* Animated Sidebar Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 animate-gradient-x"></div>
          </div>
          
          <div className="p-8 border-b border-purple-500/30 flex-shrink-0 relative z-10">
            <div className="relative">
              <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                TACTICAL NEXUS
              </h2>
              <p className="text-purple-300 font-medium">Real-Time Battle Intelligence</p>
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
            </div>
            
            {/* Enhanced Real-Time Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <span className="text-cyan-400 text-sm font-semibold">TARGETS</span>
                  </div>
                  <div className="text-4xl font-black text-cyan-300 mb-1">{monsters.length}</div>
                  <div className="text-xs text-cyan-500/80">ACTIVE HOSTILES</div>
                  <div className="mt-2 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📡</span>
                    </div>
                    <span className="text-purple-400 text-sm font-semibold">SCANNED</span>
                  </div>
                  <div className="text-4xl font-black text-purple-300 mb-1">{totalExtracted}</div>
                  <div className="text-xs text-purple-500/80">TOTAL PROCESSED</div>
                  <div className="mt-2 h-1 bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">⚡</span>
                    </div>
                    <span className="text-emerald-400 text-sm font-semibold">STATUS</span>
                  </div>
                  <div className="text-lg font-black text-emerald-300 mb-1">
                    {connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
                  </div>
                  <div className="text-xs text-emerald-500/80">QUANTUM LINK</div>
                  <div className="mt-2 h-1 bg-emerald-900/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full w-full ${
                      connectionStatus === 'connected' 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-300 animate-pulse' 
                        : 'bg-gradient-to-r from-red-500 to-red-300'
                    }`}></div>
                  </div>
                </div>
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-600/20 rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/40 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🌐</span>
                    </div>
                    <span className="text-orange-400 text-sm font-semibold">SERVER</span>
                  </div>
                  <div className="text-lg font-black text-orange-300 mb-1 truncate">
                    {currentServer || 'UNKNOWN'}
                  </div>
                  <div className="text-xs text-orange-500/80">ACTIVE REALM</div>
                  <div className="mt-2 h-1 bg-orange-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-300 rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Debug Console */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl blur-sm"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-gray-600/40 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔧</span>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-400">DIAGNOSTIC CONSOLE</h3>
                </div>
                <div className="text-sm text-gray-300 space-y-2 font-mono">
                  <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                    <span className="text-gray-400">Neural Link:</span>
                    <span className={`font-bold ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                    <span className="text-gray-400">Active Hostiles:</span>
                    <span className="text-cyan-400 font-bold">{monsters.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                    <span className="text-gray-400">Quantum Realm:</span>
                    <span className="text-purple-400 font-bold">{currentServer || 'UNKNOWN'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                    <span className="text-gray-400">Filter Mode:</span>
                    <span className="text-orange-400 font-bold">{selectedMonsterType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                    <span className="text-gray-400">Data Packets:</span>
                    <span className="text-green-400 font-bold">{totalExtracted}</span>
                  </div>
                  {monsters.length > 0 && (
                    <div className="p-2 bg-gray-900/50 rounded">
                      <span className="text-gray-400">Latest Signal:</span>
                      <div className="text-cyan-400 font-bold text-xs mt-1">
                        {monsters[0]?.monster} [{monsters[0]?.x}, {monsters[0]?.y}]
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Elite Control Interface */}
            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-2xl blur-sm"></div>
                <div className="relative bg-black/60 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-6">
                  <label className="block text-lg font-bold text-purple-300 mb-4 flex items-center space-x-2">
                    <span>🎯</span>
                    <span>TARGET CLASSIFICATION</span>
                  </label>
                  <select
                    value={selectedMonsterType}
                    onChange={(e) => setSelectedMonsterType(e.target.value)}
                    className="w-full bg-black/80 backdrop-blur-md border border-purple-500/40 text-white rounded-xl px-6 py-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg font-medium"
                  >
                    {monsterTypes.map(type => (
                      <option key={type} value={type} className="bg-gray-900 text-white">
                        {type === 'all' ? '🌟 ALL HOSTILES' : `🐲 ${type.toUpperCase()}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl blur-sm"></div>
                <div className="relative bg-black/60 backdrop-blur-xl border border-cyan-500/40 rounded-2xl overflow-hidden">
                  <div className="p-6">
                    <label className="block text-lg font-bold text-cyan-300 mb-4 flex items-center space-x-2">
                      <span>🌐</span>
                      <span>QUANTUM REALM</span>
                    </label>
                    <ServerSelector
                      selectedServer={selectedServer}
                      onServerSelect={setSelectedServer}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ultimate Action Center */}
            <div className="mt-8 space-y-4">
              {monsters.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('⚠️ INITIATE QUANTUM PURGE? This will erase all tactical data and cannot be undone.')) {
                      clearAllMonsters();
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-700 hover:via-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-red-500/30 hover:scale-105 flex items-center justify-center space-x-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 animate-pulse"></div>
                  <span className="text-2xl relative z-10 group-hover:animate-bounce">🔥</span>
                  <span className="relative z-10 text-lg">QUANTUM PURGE PROTOCOL</span>
                </button>
              )}

              {connectionStatus !== 'connected' && (
                <button
                  onClick={reconnect}
                  className="w-full bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 hover:from-yellow-700 hover:via-orange-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-yellow-500/30 hover:scale-105 flex items-center justify-center space-x-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse"></div>
                  <span className="text-2xl relative z-10 group-hover:animate-spin">⚡</span>
                  <span className="relative z-10 text-lg">NEURAL LINK RESTORATION</span>
                </button>
              )}
            </div>
          </div>

          {/* Monster List */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MonsterSidebar
              monsters={monsters}
              loading={loading}
            />
          </div>
        </div>

        {/* Ultra-Advanced Map Interface */}
        <div className="flex-1 relative overflow-hidden">
          {/* Holographic Interface Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-purple-900/20 pointer-events-none"></div>
          
          {/* Elite Map Controls */}
          <div className="absolute top-8 left-8 right-8 z-30 flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-3xl border border-purple-500/40 rounded-3xl px-8 py-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
                  <span className="text-3xl">🗺️</span>
                  <span>QUANTUM BATTLEFIELD</span>
                </h3>
                <p className="text-purple-300 font-medium">Multi-Dimensional Threat Analysis</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-300 text-sm">REAL-TIME QUANTUM SYNC</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setUseSimpleMap(!useSimpleMap)}
                className="bg-black/60 backdrop-blur-3xl border border-purple-500/40 hover:bg-black/80 text-white font-bold px-8 py-6 rounded-3xl transition-all duration-300 shadow-2xl hover:scale-105 relative overflow-hidden group"
                title={`Switch to ${useSimpleMap ? 'Neural' : 'Classic'} Interface`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                <div className="relative z-10 flex items-center space-x-3">
                  <span className="text-2xl">{useSimpleMap ? '⚛️' : '🗺️'}</span>
                  <span>{useSimpleMap ? 'NEURAL MODE' : 'CLASSIC MODE'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Holographic Map Container */}
          <div className="absolute inset-8 top-32 rounded-3xl overflow-hidden shadow-2xl border border-purple-500/40 bg-black/30 backdrop-blur-sm relative z-10">
            {/* Map Scanning Lines Effect */}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse delay-1000"></div>
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse delay-500"></div>
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-pulse delay-1500"></div>
            </div>
            
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400 rounded-tl-lg z-20"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400 rounded-tr-lg z-20"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-purple-400 rounded-bl-lg z-20"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-purple-400 rounded-br-lg z-20"></div>
            
            {/* Map Component - Ensured Visibility */}
            <div className="absolute inset-0 z-10">
              {/* Debug overlay for monster data */}
              {monsters.length > 0 && (
                <div className="absolute top-4 left-4 z-30 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
                  <div>Monsters: {monsters.length}</div>
                  {monsters.slice(0, 3).map((m, i) => (
                    <div key={i}>
                      {m.monster} L{m.level} ({m.x?.toFixed(1)}, {m.y?.toFixed(1)})
                    </div>
                  ))}
                </div>
              )}
              
              {useSimpleMap ? (
                <SimpleMap
                  monsters={monsters}
                  onBoundsChange={handleBoundsChange}
                  className="h-full w-full rounded-3xl"
                />
              ) : (
                <MonsterMap
                  monsters={monsters}
                  onBoundsChange={handleBoundsChange}
                  className="h-full w-full rounded-3xl"
                />
              )}
            </div>
          </div>
          
          {/* Advanced Intelligence Panel */}
          <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-3xl border border-purple-500/40 rounded-3xl p-8 min-w-[350px] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <span className="text-3xl">📊</span>
                <span>NEXUS INTELLIGENCE</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-cyan-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span>🎯</span>
                    </div>
                    <span className="text-gray-300 font-medium">Active Targets:</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-2xl">{filteredMonsters.length}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-emerald-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                      <span>📡</span>
                    </div>
                    <span className="text-gray-300 font-medium">Data Source:</span>
                  </div>
                  <span className="text-emerald-400 font-bold">QUANTUM LINK</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-purple-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span>⚡</span>
                    </div>
                    <span className="text-gray-300 font-medium">Interface:</span>
                  </div>
                  <span className="text-purple-400 font-bold">{useSimpleMap ? 'NEURAL' : 'CLASSIC'}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-orange-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span>📈</span>
                    </div>
                    <span className="text-gray-300 font-medium">Total Scanned:</span>
                  </div>
                  <span className="text-orange-400 font-bold">{stats.totalMonsters}</span>
                </div>
                
                {currentServer && (
                  <div className="pt-4 border-t border-purple-500/30">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-2xl border border-yellow-500/40">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                          <span>🌐</span>
                        </div>
                        <span className="text-gray-300 font-medium">Active Realm:</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{currentServer}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Epic Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="text-center relative">
                {/* Holographic Loading Ring */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-2 border-b-4 border-cyan-500 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                  <div className="absolute inset-4 border-4 border-blue-500/30 rounded-full"></div>
                  <div className="absolute inset-4 border-r-4 border-blue-500 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
                  
                  {/* Central Pulsing Core */}
                  <div className="absolute inset-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
                </div>
                
                <div className="text-4xl font-black text-white mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  QUANTUM NEXUS INITIALIZING
                </div>
                <p className="text-gray-300 text-xl mb-4">Establishing Neural Link...</p>
                
                {/* Progress Bar */}
                <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full animate-gradient-x"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
            </div>
          )}

          {/* Spectacular No Data State */}
          {!loading && monsters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-2xl relative">
                {/* Animated Monster Icon */}
                <div className="relative mb-8">
                  <div className="text-9xl mb-6 animate-float">🐲</div>
                  <div className="absolute inset-0 text-9xl text-purple-500/20 animate-pulse">🐲</div>
                  <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl animate-pulse"></div>
                </div>
                
                <h3 className="text-5xl font-black text-white mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  NEXUS AWAITING QUANTUM SIGNALS
                </h3>
                
                <p className="text-gray-300 mb-8 text-2xl leading-relaxed">
                  The Quantum Monster Detection Array is primed and ready. <br/>
                  Launch Evony: The King&apos;s Return to begin real-time threat assessment.
                </p>
                
                {/* Pulsing Call-to-Action */}
                <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/50 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="text-6xl mb-4">🎮</div>
                    <p className="text-purple-300 text-xl font-semibold">
                      🚀 Activate Evony Game Client for Quantum Monster Detection
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Orbs */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
