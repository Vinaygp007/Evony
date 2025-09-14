// Real-time Evony Data Hook
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealTimeMonster } from '@/types/monster';

interface RealTimeMonsterUpdate {
  type: 'monster_spawn' | 'monster_update' | 'monster_remove' | 'initial_data';
  monster?: RealTimeMonster;
  monsters?: RealTimeMonster[];
  monsterId?: string;
  serverId?: string;
}

interface UseRealTimeEvonyDataOptions {
  serverUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableLogging?: boolean;
}

export function useRealTimeEvonyData(options: UseRealTimeEvonyDataOptions = {}) {
  const {
    serverUrl = 'ws://localhost:8080',
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    enableLogging = false
  } = options;

  const [monsters, setMonsters] = useState<RealTimeMonster[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalMonsters: 0,
    activeServers: 0,
    updatesReceived: 0,
    lastHeartbeat: null as Date | null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback((message: string, data?: unknown) => {
    if (enableLogging) {
      console.log(`🔴 [RealTimeEvony] ${message}`, data || '');
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

  const handleMonsterUpdate = useCallback((update: RealTimeMonsterUpdate) => {
    log(`📊 Received update: ${update.type}`, update);

    switch (update.type) {
      case 'initial_data':
        if (update.monsters) {
          setMonsters(update.monsters);
          updateStats(update.monsters);
          log(`📥 Loaded ${update.monsters.length} initial monsters`);
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
          log(`🐉 New monster spawned: ${update.monster.monster} Level ${update.monster.level}`);
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
          log(`🔄 Monster updated: ${update.monster.monster}`);
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
          log(`💀 Monster removed: ${update.monsterId}`);
        }
        break;
    }
  }, [log, updateStats]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    log('Connecting to Evony real-time server...');

    try {
      wsRef.current = new WebSocket(serverUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        log('✅ Connected to real-time monster feed');
        
        setStats(prev => ({
          ...prev,
          lastHeartbeat: new Date()
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const update: RealTimeMonsterUpdate = JSON.parse(event.data);
          handleMonsterUpdate(update);
          
          setStats(prev => ({
            ...prev,
            updatesReceived: prev.updatesReceived + 1,
            lastHeartbeat: new Date()
          }));
          
          setLastUpdate(new Date());
        } catch (error) {
          console.error('❌ Error parsing monster update:', error);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        log('❌ Disconnected from monster feed');
        handleReconnect();
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        log('❌ WebSocket error:', error);
      };

    } catch (error) {
      setConnectionStatus('error');
      log('❌ Failed to create WebSocket connection:', error);
      handleReconnect();
    }
  }, [serverUrl, log, handleMonsterUpdate]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      log('❌ Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current++;
    log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [maxReconnectAttempts, log, reconnectInterval, connect]);

  const disconnect = useCallback(() => {
    log('🛑 Manually disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [log]);

  const forceReconnect = useCallback(() => {
    log('🔄 Force reconnecting...');
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [log, disconnect, connect]);

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
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

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
    
    // Filters
    getMonstersByServer,
    getMonstersByType,
    getMonstersByLevel,
    getRecentMonsters,
    
    // Status
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error'
  };
}
