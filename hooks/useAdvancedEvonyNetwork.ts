'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Monster } from '../types/monster';

interface AdvancedNetworkData {
  type: 'initial_data' | 'real_monster_found' | 'extraction_error' | 'authentication_status';
  monster?: any;
  monsters?: any[];
  status?: {
    authenticated: boolean;
    server353Connected: boolean;
    extractionActive: boolean;
    antiDetectionActive: boolean;
  };
  error?: string;
  timestamp: string;
  source: string;
  verified?: boolean;
}

export function useAdvancedEvonyNetwork() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [authenticationStatus, setAuthenticationStatus] = useState<{
    authenticated: boolean;
    server353Connected: boolean;
    extractionActive: boolean;
    antiDetectionActive: boolean;
  }>({
    authenticated: false,
    server353Connected: false,
    extractionActive: false,
    antiDetectionActive: false
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [extractionStats, setExtractionStats] = useState({
    totalExtracted: 0,
    verifiedMonsters: 0,
    networkCaptures: 0,
    domExtractions: 0,
    lastExtractionTime: null as Date | null,
    authenticationRequired: true
  });
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const addLog = useCallback((message: string) => {
    setSystemLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 49)]);
  }, []);

  const connectToAdvancedMonitor = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔗 Connecting to Advanced Evony Network Monitor...');
    addLog('Connecting to Advanced Evony Network Monitor...');
    setConnectionStatus('connecting');

    try {
      wsRef.current = new WebSocket('ws://localhost:8080');

      wsRef.current.onopen = () => {
        console.log('✅ Connected to advanced network monitor');
        addLog('✅ Connected to advanced network monitor');
        setConnectionStatus('connected');
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: AdvancedNetworkData = JSON.parse(event.data);
          console.log('📡 Advanced network data received:', data);

          if (data.type === 'initial_data') {
            if (data.monsters) {
              const convertedMonsters = data.monsters.map(convertAdvancedNetworkMonster);
              setMonsters(convertedMonsters);
              setLastUpdate(new Date());
              addLog(`🔥 Loaded ${convertedMonsters.length} monsters from advanced extractor`);
            }
            
            if (data.status) {
              setAuthenticationStatus(data.status);
              addLog(`🔐 Auth status: ${data.status.authenticated ? 'Authenticated' : 'Not authenticated'}`);
              addLog(`🎯 Server 353: ${data.status.server353Connected ? 'Connected' : 'Not connected'}`);
              addLog(`🔬 Extraction: ${data.status.extractionActive ? 'Active' : 'Inactive'}`);
            }
          } 
          else if (data.type === 'real_monster_found' && data.monster) {
            const newMonster = convertAdvancedNetworkMonster(data.monster);
            setMonsters(prev => {
              const updated = [newMonster, ...prev.filter(m => m.id !== newMonster.id)];
              return updated.slice(0, 100); // Keep last 100 monsters
            });
            
            setLastUpdate(new Date());
            
            // Update extraction stats
            setExtractionStats(prev => ({
              ...prev,
              totalExtracted: prev.totalExtracted + 1,
              verifiedMonsters: data.verified ? prev.verifiedMonsters + 1 : prev.verifiedMonsters,
              networkCaptures: data.monster.extractionMethod?.includes('network') ? prev.networkCaptures + 1 : prev.networkCaptures,
              domExtractions: data.monster.extractionMethod?.includes('dom') ? prev.domExtractions + 1 : prev.domExtractions,
              lastExtractionTime: new Date(),
              authenticationRequired: !authenticationStatus.authenticated
            }));

            addLog(`🎯 NEW VERIFIED MONSTER: ${newMonster.monster} Level ${newMonster.level} at (${newMonster.x}, ${newMonster.y})`);
          }
          else if (data.type === 'extraction_error') {
            addLog(`❌ Extraction error: ${data.error}`);
            console.error('❌ Extraction error:', data.error);
          }
          else if (data.type === 'authentication_status' && data.status) {
            setAuthenticationStatus(data.status);
            addLog(`🔐 Authentication updated: ${data.status.authenticated ? 'Success' : 'Required'}`);
          }
        } catch (error) {
          console.error('❌ Error parsing advanced network data:', error);
          addLog(`❌ Error parsing network data: ${error}`);
        }
      };

      wsRef.current.onclose = () => {
        console.log('❌ Advanced network monitor connection closed');
        addLog('❌ Network monitor connection closed');
        setConnectionStatus('disconnected');
        
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to advanced monitor...');
          addLog('🔄 Attempting to reconnect...');
          connectToAdvancedMonitor();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Advanced network WebSocket error:', error);
        addLog(`❌ WebSocket error: ${error}`);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('❌ Failed to connect to advanced monitor:', error);
      addLog(`❌ Connection failed: ${error}`);
      setConnectionStatus('disconnected');
    }
  }, [addLog, authenticationStatus.authenticated]);

  // Convert network monster to frontend format
  const convertAdvancedNetworkMonster = useCallback((networkMonster: any): Monster => {
    return {
      id: networkMonster.id || `adv_${Date.now()}_${Math.random()}`,
      monster: networkMonster.monster || networkMonster.type || 'Unknown',
      level: networkMonster.level || 1,
      x: networkMonster.x || 0,
      y: networkMonster.y || 0,
      timestamp: networkMonster.timestamp || Date.now(),
      serverId: networkMonster.serverId || 'Server_353',
      server: networkMonster.server || 'EU Server 353',
      region: networkMonster.region || 'Server 353',
      reportedBy: networkMonster.reportedBy || 'Advanced Extractor',
      verified: networkMonster.verified || false,
      source: networkMonster.source || 'advanced_extraction'
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connectToAdvancedMonitor();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectToAdvancedMonitor]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnectionStatus('disconnected');
    setTimeout(() => connectToAdvancedMonitor(), 1000);
  }, [connectToAdvancedMonitor]);

  // Get monsters by type
  const getMonstersByType = useCallback((type: string) => {
    if (type === 'all') return monsters;
    return monsters.filter(monster => monster.monster === type);
  }, [monsters]);

  // Get real-time statistics
  const getAdvancedNetworkStats = useCallback(() => {
    const now = Date.now();
    const recentMonsters = monsters.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    return {
      totalMonsters: monsters.length,
      recentMonsters: recentMonsters.length,
      verifiedMonsters: monsters.filter(m => m.verified).length,
      connectionStatus,
      authenticationStatus,
      lastUpdate,
      extractionStats,
      uniqueTypes: [...new Set(monsters.map(m => m.monster))],
      averageLevel: monsters.length > 0 ? Math.round(monsters.reduce((sum, m) => sum + m.level, 0) / monsters.length) : 0,
      extractionMethods: {
        network: monsters.filter(m => m.source?.includes('network')).length,
        dom: monsters.filter(m => m.source?.includes('dom')).length,
        api: monsters.filter(m => m.source?.includes('api')).length
      }
    };
  }, [monsters, connectionStatus, authenticationStatus, lastUpdate, extractionStats]);

  return {
    monsters,
    connectionStatus,
    authenticationStatus,
    lastUpdate,
    extractionStats,
    systemLogs,
    reconnect,
    getMonstersByType,
    getAdvancedNetworkStats,
    isConnected: connectionStatus === 'connected',
    isAuthenticated: authenticationStatus.authenticated,
    isRealTime: true,
    requiresAuthentication: extractionStats.authenticationRequired
  };
}