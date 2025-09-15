'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Monster } from '../types/monster';

interface StreamlinedExtractorData {
  type: 'monster_data' | 'new_monster' | 'server_connected';
  monster?: {
    id: string;
    x: number;
    y: number;
    type: string;
    level: number;
    server: string;
    source: string;
    timestamp: number;
  };
  monsters?: {
    id: string;
    x: number;
    y: number;
    type: string;
    level: number;
    server: string;
    source: string;
    timestamp: number;
  }[];
  timestamp?: string;
  serverIP?: string;
}

export function useStreamlinedExtractor() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentServer, setCurrentServer] = useState<string | null>(null);
  const [totalExtracted, setTotalExtracted] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Convert extractor monster data to standard Monster format
  const convertExtractorMonster = useCallback((extractorMonster: {
    id?: string;
    x: number;
    y: number;
    type?: string;
    level?: number;
    server?: string;
    source?: string;
    timestamp?: number;
  }): Monster => {
    return {
      id: extractorMonster.id || `${extractorMonster.x}_${extractorMonster.y}`,
      monster: extractorMonster.type || 'Unknown',
      level: extractorMonster.level || 1,
      x: extractorMonster.x,
      y: extractorMonster.y,
      timestamp: extractorMonster.timestamp || Date.now(),
      server: extractorMonster.server || currentServer || 'Unknown Server',
      source: extractorMonster.source || 'streamlined_extractor',
      reportedBy: 'Streamlined Extractor'
    };
  }, [currentServer]);

  const connectToExtractor = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔗 Connecting to Streamlined Monster Extractor...');
    setConnectionStatus('connecting');

    try {
      wsRef.current = new WebSocket('ws://localhost:8082');

      wsRef.current.onopen = () => {
        console.log('✅ Connected to Streamlined Monster Extractor');
        setConnectionStatus('connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: StreamlinedExtractorData = JSON.parse(event.data);
          console.log('📡 Real monster data received:', data);

          if (data.type === 'monster_data' && data.monsters) {
            // Initial monster data
            const convertedMonsters = data.monsters.map(convertExtractorMonster);
            setMonsters(convertedMonsters);
            setLastUpdate(new Date());
            setTotalExtracted(prev => prev + convertedMonsters.length);
            console.log(`🔥 Loaded ${convertedMonsters.length} real monsters from extractor`);
          } 
          else if (data.type === 'new_monster' && data.monster) {
            // New monster found
            const newMonster = convertExtractorMonster(data.monster);
            setMonsters(prev => {
              const updated = [newMonster, ...prev.filter(m => m.id !== newMonster.id)];
              return updated.slice(0, 100); // Keep last 100 monsters
            });
            
            setLastUpdate(new Date());
            setTotalExtracted(prev => prev + 1);
            setCurrentServer(data.monster.server || null);
            
            console.log(`🎯 NEW REAL MONSTER: ${newMonster.monster} Level ${newMonster.level} at (${newMonster.x}, ${newMonster.y})`);
          }
          else if (data.type === 'server_connected' && data.serverIP) {
            setCurrentServer(data.serverIP);
            console.log(`🌐 Connected to game server: ${data.serverIP}`);
          }
        } catch (error) {
          console.error('❌ Error parsing extractor data:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('❌ Extractor connection closed');
        setConnectionStatus('disconnected');
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to extractor...');
          connectToExtractor();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Extractor WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('❌ Failed to connect to extractor:', error);
      setConnectionStatus('disconnected');
    }
  }, [convertExtractorMonster]);

  // Auto-connect on component mount
  useEffect(() => {
    connectToExtractor();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectToExtractor]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(() => connectToExtractor(), 1000);
  }, [connectToExtractor]);

  const getNetworkStats = useCallback(() => {
    return {
      totalExtracted,
      currentServer,
      connected: connectionStatus === 'connected',
      lastUpdate
    };
  }, [totalExtracted, currentServer, connectionStatus, lastUpdate]);

  return {
    monsters,
    connectionStatus,
    lastUpdate,
    currentServer,
    totalExtracted,
    reconnect,
    getNetworkStats,
    isConnected: connectionStatus === 'connected',
    isRealTime: true
  };
}