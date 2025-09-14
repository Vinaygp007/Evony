// Real-time Evony Data Dashboard
'use client';

import React from 'react';
import { useRealTimeEvonyData } from '@/hooks/useRealTimeEvonyData';

interface DataAcquisitionDashboardProps {
  className?: string;
}

export default function DataAcquisitionDashboard({ className = '' }: DataAcquisitionDashboardProps) {
  const {
    monsters,
    connectionStatus,
    lastUpdate,
    stats,
    connect,
    disconnect,
    forceReconnect,
    getMonstersByServer,
    getMonstersByType,
    getRecentMonsters,
    isConnected,
    isConnecting,
    hasError
  } = useRealTimeEvonyData({
    enableLogging: true,
    serverUrl: 'ws://localhost:8080'
  });

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const recentMonsters = getRecentMonsters(10); // Last 10 minutes
  const monsterTypes = Array.from(new Set(monsters.map(m => m.monster))).sort();
  const activeServers = Array.from(new Set(monsters.map(m => m.serverId))).filter(Boolean);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🤖 Real-time Data Acquisition System
          </h2>
          <div className={`flex items-center gap-2 ${getStatusColor()}`}>
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-medium capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 
                         text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isConnecting ? '🔄' : '🚀'} 
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                         transition-colors flex items-center gap-2"
            >
              🛑 Disconnect
            </button>
          )}
          
          <button
            onClick={forceReconnect}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                       transition-colors flex items-center gap-2"
          >
            🔄 Reconnect
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-purple-900/30 rounded-lg border border-purple-500/30 p-4">
          <div className="text-purple-400 text-sm font-medium">Total Monsters</div>
          <div className="text-2xl font-bold text-white">{stats.totalMonsters}</div>
        </div>
        
        <div className="bg-blue-900/30 rounded-lg border border-blue-500/30 p-4">
          <div className="text-blue-400 text-sm font-medium">Active Servers</div>
          <div className="text-2xl font-bold text-white">{stats.activeServers}</div>
        </div>
        
        <div className="bg-green-900/30 rounded-lg border border-green-500/30 p-4">
          <div className="text-green-400 text-sm font-medium">Updates Received</div>
          <div className="text-2xl font-bold text-white">{stats.updatesReceived}</div>
        </div>
        
        <div className="bg-orange-900/30 rounded-lg border border-orange-500/30 p-4">
          <div className="text-orange-400 text-sm font-medium">Recent Activity</div>
          <div className="text-2xl font-bold text-white">{recentMonsters.length}</div>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
          <div className="text-gray-400 text-sm">Last Update:</div>
          <div className="text-white font-medium">{lastUpdate.toLocaleString()}</div>
          {stats.lastHeartbeat && (
            <div className="text-gray-400 text-sm mt-1">
              Heartbeat: {stats.lastHeartbeat.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Active Servers */}
      {activeServers.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🌍 Active Servers ({activeServers.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServers.map(serverId => {
              const serverMonsters = getMonstersByServer(serverId);
              return (
                <div key={serverId} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="font-medium text-white">{serverId}</div>
                  <div className="text-gray-400 text-sm">{serverMonsters.length} monsters</div>
                  <div className="mt-2">
                    {Array.from(new Set(serverMonsters.map(m => m.monster))).slice(0, 3).map(type => (
                      <span key={type} className="inline-block bg-purple-600/30 text-purple-300 
                                                   text-xs px-2 py-1 rounded mr-1 mb-1">
                        {type}
                      </span>
                    ))}
                    {Array.from(new Set(serverMonsters.map(m => m.monster))).length > 3 && (
                      <span className="text-gray-400 text-xs">
                        +{Array.from(new Set(serverMonsters.map(m => m.monster))).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monster Types */}
      {monsterTypes.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🐉 Monster Types ({monsterTypes.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {monsterTypes.map(type => {
              const typeMonsters = getMonstersByType(type);
              const avgLevel = Math.round(
                typeMonsters.reduce((sum, m) => sum + m.level, 0) / typeMonsters.length
              );
              
              return (
                <div key={type} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                  <div className="font-medium text-white text-sm">{type}</div>
                  <div className="text-gray-400 text-xs">{typeMonsters.length} active</div>
                  <div className="text-yellow-400 text-xs">Avg L{avgLevel}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentMonsters.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            ⚡ Recent Activity (Last 10 minutes)
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentMonsters.slice(0, 20).map(monster => (
              <div key={`${monster.serverId}_${monster.id}`} 
                   className="flex items-center justify-between bg-gray-700/30 rounded p-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-white font-medium">{monster.monster}</div>
                    <div className="text-gray-400 text-sm">
                      Level {monster.level} • Server {monster.serverId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-xs">
                    {monster.timestamp ? new Date(monster.timestamp).toLocaleTimeString() : 'Unknown'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    ({monster.x}, {monster.y})
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recentMonsters.length > 20 && (
            <div className="text-center text-gray-400 text-sm mt-4">
              +{recentMonsters.length - 20} more recent updates
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            ❌ <span className="font-bold">Connection Error</span>
          </div>
          <div className="text-red-300 text-sm mb-4">
            Failed to connect to the real-time data acquisition server. 
            Make sure the server is running on localhost:8080.
          </div>
          <button
            onClick={forceReconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                       transition-colors flex items-center gap-2"
          >
            🔄 Retry Connection
          </button>
        </div>
      )}

      {/* Getting Started */}
      {!isConnected && !hasError && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            💡 <span className="font-bold">Getting Started</span>
          </div>
          <div className="text-blue-300 text-sm space-y-2">
            <p>To start receiving real-time monster data from Evony:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Install required packages: <code className="bg-gray-700 px-2 py-1 rounded">npm install puppeteer ws</code></li>
              <li>Run the data acquisition server: <code className="bg-gray-700 px-2 py-1 rounded">node services/evony-data-acquisition.js</code></li>
              <li>Configure your Evony account credentials</li>
              <li>Click the Connect button above</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
