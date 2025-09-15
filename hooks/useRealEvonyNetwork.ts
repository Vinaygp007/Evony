'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Monster } from '../types/monster';

interface NetworkMonsterData {
  type: 'initial_data' | 'real_monster_found' | 'process_monster_found' | 'new_monster';
  monster?: any;
  monsters?: any[];
  timestamp: string;
  source?: string;
}

export function useRealEvonyNetwork() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [extractionStats, setExtractionStats] = useState({
    totalExtracted: 0,
    networkExtractions: 0,
    processExtractions: 0,
    lastExtractionTime: null as Date | null,
    serverIP: null as string | null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connectToNetworkMonitor = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔗 Connecting to Real Evony Network Monitor...');
    setConnectionStatus('connecting');

    try {
      wsRef.current = new WebSocket('ws://localhost:8082');

      wsRef.current.onopen = () => {
        console.log('✅ Connected to Real Evony Network Monitor');
        setConnectionStatus('connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: NetworkMonsterData = JSON.parse(event.data);
          console.log('📡 Real network data received:', data);

          if (data.type === 'initial_data' && data.monsters) {
            const convertedMonsters = data.monsters.map(convertNetworkMonster);
            setMonsters(convertedMonsters);
            setLastUpdate(new Date());
            console.log(`🔥 Loaded ${convertedMonsters.length} real monsters from streamlined extractor`);
          } 
          else if ((data.type === 'real_monster_found' || data.type === 'process_monster_found' || data.type === 'new_monster') && data.monster) {
            const newMonster = convertNetworkMonster(data.monster);
            setMonsters(prev => {
              const updated = [newMonster, ...prev.filter(m => m.id !== newMonster.id)];
              return updated.slice(0, 100); // Keep last 100 monsters
            });
            
            setLastUpdate(new Date());
            
            // Update extraction stats
            setExtractionStats(prev => ({
              ...prev,
              totalExtracted: prev.totalExtracted + 1,
              networkExtractions: data.type === 'real_monster_found' || data.type === 'new_monster' ? prev.networkExtractions + 1 : prev.networkExtractions,
              processExtractions: data.type === 'process_monster_found' ? prev.processExtractions + 1 : prev.processExtractions,
              lastExtractionTime: new Date(),
              serverIP: data.monster.server || prev.serverIP
            }));

            console.log(`🎯 NEW REAL MONSTER: ${newMonster.monster} Level ${newMonster.level} at (${newMonster.x}, ${newMonster.y})`);
          }
        } catch (error) {
          console.error('❌ Error parsing network monitor data:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('❌ Network monitor connection closed');
        setConnectionStatus('disconnected');
        
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to network monitor...');
          connectToNetworkMonitor();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Network monitor WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('❌ Failed to connect to network monitor:', error);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Convert network monster data to standard Monster format
  const convertNetworkMonster = (networkMonster: any): Monster => {
    return {
      id: networkMonster.id,
      monster: networkMonster.monster,
      level: networkMonster.level,
      x: networkMonster.x,
      y: networkMonster.y,
      timestamp: networkMonster.timestamp,
      serverId: networkMonster.serverId || 'Server_353',
      server: networkMonster.server || 'EU Server 353 (Real)',
      region: networkMonster.region || 'Server 353',
      reportedBy: networkMonster.reportedBy || 'Network Monitor',
      alliance: networkMonster.alliance,
      notes: networkMonster.notes || `Extracted via ${networkMonster.source}`,
      verified: networkMonster.verified || true,
      source: networkMonster.source || 'network_monitoring'
    };
  };

  // Auto-connect on component mount
  useEffect(() => {
    connectToNetworkMonitor();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectToNetworkMonitor]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectToNetworkMonitor();
  }, [connectToNetworkMonitor]);

  // Get filtered monsters by type
  const getMonstersByType = useCallback((type: string) => {
    if (type === 'all') return monsters;
    return monsters.filter(monster => monster.monster === type);
  }, [monsters]);

  // Get monsters by region
  const getMonstersByRegion = useCallback((region: string) => {
    if (region === 'all') return monsters;
    return monsters.filter(monster => monster.region === region);
  }, [monsters]);

  // Get real-time statistics
  const getNetworkStats = useCallback(() => {
    const now = Date.now();
    const recentMonsters = monsters.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    return {
      totalMonsters: monsters.length,
      recentMonsters: recentMonsters.length,
      connectionStatus,
      lastUpdate,
      extractionStats,
      uniqueTypes: [...new Set(monsters.map(m => m.monster))],
      averageLevel: monsters.length > 0 ? Math.round(monsters.reduce((sum, m) => sum + m.level, 0) / monsters.length) : 0
    };
  }, [monsters, connectionStatus, lastUpdate, extractionStats]);

  return {
    monsters,
    connectionStatus,
    lastUpdate,
    extractionStats,
    reconnect,
    getMonstersByType,
    getMonstersByRegion,
    getNetworkStats,
    isConnected: connectionStatus === 'connected',
    isRealTime: true
  };
}