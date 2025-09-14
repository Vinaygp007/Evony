// Enhanced Socket.IO hook for backend integration
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RealTimeMonster } from '@/types/monster';

interface BackendMonsterUpdate {
  type: 'monster_spawn' | 'monster_update' | 'monster_remove' | 'initial_monsters' | 'cleanup_notification';
  monster?: RealTimeMonster;
  monsters?: RealTimeMonster[];
  monsterId?: string;
  serverId?: string;
  count?: number;
  removedCount?: number;
}

interface UseBackendSocketOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  enableLogging?: boolean;
}

export function useBackendSocket(options: UseBackendSocketOptions = {}) {
  const {
    serverUrl = 'http://localhost:3001',
    autoConnect = true,
    enableLogging = false
  } = options;

  const [monsters, setMonsters] = useState<RealTimeMonster[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalMonsters: 0,
    activeServers: 0,
    updatesReceived: 0,
    lastHeartbeat: null as Date | null,
    backendConnected: false
  });

  const socketRef = useRef<Socket | null>(null);

  const log = useCallback((message: string, data?: unknown) => {
    if (enableLogging) {
      console.log(`🔵 [BackendSocket] ${message}`, data || '');
    }
  }, [enableLogging]);

  const updateStats = useCallback((currentMonsters: RealTimeMonster[]) => {
    const uniqueServers = new Set(currentMonsters.map(m => m.serverId)).size;
    
    setStats(prev => ({
      ...prev,
      totalMonsters: currentMonsters.length,
      activeServers: uniqueServers
    }));
  }, []);

  const handleMonsterUpdate = useCallback((update: BackendMonsterUpdate) => {
    log(`📊 Received backend update: ${update.type}`, update);

    switch (update.type) {
      case 'initial_monsters':
        if (update.monsters) {
          setMonsters(update.monsters);
          updateStats(update.monsters);
          log(`📥 Loaded ${update.monsters.length} initial monsters from backend`);
        }
        break;

      case 'monster_spawn':
        if (update.monster) {
          setMonsters(prev => {
            const filtered = prev.filter(m => 
              !(m.id === update.monster?.id && m.serverId === update.monster?.serverId)
            );
            const newMonsters = [...filtered, update.monster] as RealTimeMonster[];
            updateStats(newMonsters);
            return newMonsters;
          });
          log(`🐉 Monster spawned via backend: ${update.monster.monster} Level ${update.monster.level}`);
        }
        break;

      case 'monster_update':
        if (update.monster) {
          setMonsters(prev => {
            const newMonsters = prev.map(monster => 
              monster.id === update.monster?.id && monster.serverId === update.monster?.serverId
                ? { ...monster, ...update.monster }
                : monster
            );
            updateStats(newMonsters);
            return newMonsters;
          });
          log(`🔄 Monster updated via backend: ${update.monster.monster}`);
        }
        break;

      case 'monster_remove':
        if (update.monsterId && update.serverId) {
          setMonsters(prev => {
            const newMonsters = prev.filter(monster => 
              !(monster.id === update.monsterId && monster.serverId === update.serverId)
            );
            updateStats(newMonsters);
            return newMonsters;
          });
          log(`💀 Monster removed via backend: ${update.monsterId}`);
        }
        break;

      case 'cleanup_notification':
        if (update.removedCount) {
          log(`🧹 Backend cleanup: ${update.removedCount} monsters removed`);
        }
        break;
    }

    setStats(prev => ({
      ...prev,
      updatesReceived: prev.updatesReceived + 1,
      lastHeartbeat: new Date()
    }));
    
    setLastUpdate(new Date());
  }, [log, updateStats]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionStatus('connecting');
    log('Connecting to backend server...');

    try {
      socketRef.current = io(serverUrl, {
        autoConnect: false,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        setConnectionStatus('connected');
        log('✅ Connected to backend server');
        
        setStats(prev => ({
          ...prev,
          backendConnected: true,
          lastHeartbeat: new Date()
        }));

        // Request initial monster data
        socketRef.current?.emit('request_monsters', { serverId: null });
      });

      socketRef.current.on('disconnect', () => {
        setConnectionStatus('disconnected');
        log('❌ Disconnected from backend server');
        setStats(prev => ({ ...prev, backendConnected: false }));
      });

      socketRef.current.on('connect_error', (error) => {
        setConnectionStatus('error');
        log('❌ Backend connection error:', error);
        setStats(prev => ({ ...prev, backendConnected: false }));
      });

      // Backend-specific event handlers
      socketRef.current.on('connected', (data) => {
        log('🎉 Backend connection confirmed:', data);
      });

      socketRef.current.on('initial_monsters', (data) => {
        handleMonsterUpdate({
          type: 'initial_monsters',
          monsters: data.monsters,
          count: data.count
        });
      });

      socketRef.current.on('monster_update', (data) => {
        handleMonsterUpdate(data);
      });

      socketRef.current.on('cleanup_completed', (data) => {
        handleMonsterUpdate({
          type: 'cleanup_notification',
          removedCount: data.removedCount
        });
      });

      socketRef.current.on('cleanup_notification', (data) => {
        handleMonsterUpdate({
          type: 'cleanup_notification',
          removedCount: data.removedCount
        });
      });

      // Connect to the backend
      socketRef.current.connect();

    } catch (error) {
      setConnectionStatus('error');
      log('❌ Failed to create backend connection:', error);
    }
  }, [serverUrl, log, handleMonsterUpdate]);

  const disconnect = useCallback(() => {
    log('🛑 Manually disconnecting from backend...');
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus('disconnected');
    setStats(prev => ({ ...prev, backendConnected: false }));
  }, [log]);

  const forceReconnect = useCallback(() => {
    log('🔄 Force reconnecting to backend...');
    disconnect();
    setTimeout(connect, 1000);
  }, [log, disconnect, connect]);

  const requestMonstersByServer = useCallback((serverId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request_monsters', { serverId });
      log(`📡 Requested monsters for server: ${serverId || 'all'}`);
    }
  }, [log]);

  // Filter monsters by various criteria
  const getMonstersByServer = useCallback((serverId: string) => {
    return monsters.filter(monster => monster.serverId === serverId);
  }, [monsters]);

  const getMonstersByType = useCallback((type: string) => {
    return monsters.filter(monster => monster.monster.toLowerCase() === type.toLowerCase());
  }, [monsters]);

  const getMonstersByLevel = useCallback((minLevel: number, maxLevel?: number) => {
    return monsters.filter(monster => {
      if (maxLevel) {
        return monster.level >= minLevel && monster.level <= maxLevel;
      }
      return monster.level >= minLevel;
    });
  }, [monsters]);

  const getRecentMonsters = useCallback((minutes: number = 5) => {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return monsters.filter(monster => 
      monster.timestamp && monster.timestamp > cutoff
    );
  }, [monsters]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // Data
    monsters,
    connectionStatus,
    lastUpdate,
    stats,
    
    // Actions
    connect,
    disconnect,
    forceReconnect,
    requestMonstersByServer,
    
    // Filters
    getMonstersByServer,
    getMonstersByType,
    getMonstersByLevel,
    getRecentMonsters,
    
    // Status
    isConnected: connectionStatus === 'connected' && stats.backendConnected,
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error',
    backendConnected: stats.backendConnected
  };
}
