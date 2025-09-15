'use client';

import { useState, useEffect, useCallback } from 'react';
import { realMonsterDataService, RealMonsterData } from '../services/real-monster-data';
import { Monster } from '../types/monster';

export function useRealMonsterData() {
  const [monsters, setMonsters] = useState<RealMonsterData[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data and subscribe to changes
  useEffect(() => {
    setLoading(true);
    setMonsters(realMonsterDataService.getMonsters());
    setLoading(false);

    // Subscribe to data changes
    const unsubscribe = realMonsterDataService.subscribe(() => {
      setMonsters(realMonsterDataService.getMonsters());
    });

    // Cleanup old monsters on mount
    realMonsterDataService.cleanupOldMonsters();

    return unsubscribe;
  }, []);

  const addMonster = useCallback((monster: Omit<RealMonsterData, 'id' | 'timestamp' | 'lastSeen'>) => {
    setLoading(true);
    realMonsterDataService.addMonster(monster);
    setLoading(false);
  }, []);

  const updateMonster = useCallback((id: string, updates: Partial<RealMonsterData>) => {
    setLoading(true);
    realMonsterDataService.updateMonster(id, updates);
    setLoading(false);
  }, []);

  const removeMonster = useCallback((id: string) => {
    setLoading(true);
    realMonsterDataService.removeMonster(id);
    setLoading(false);
  }, []);

  const clearAllMonsters = useCallback(() => {
    setLoading(true);
    realMonsterDataService.clearAllMonsters();
    setLoading(false);
  }, []);

  const exportData = useCallback(() => {
    return realMonsterDataService.exportData();
  }, []);

  const importData = useCallback((jsonData: string) => {
    setLoading(true);
    try {
      realMonsterDataService.importData(jsonData);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStandardMonsters = useCallback((): Monster[] => {
    return realMonsterDataService.getMonstersAsStandard();
  }, [monsters]);

  const getStats = useCallback(() => {
    return realMonsterDataService.getStats();
  }, [monsters]);

  return {
    monsters,
    loading,
    addMonster,
    updateMonster,
    removeMonster,
    clearAllMonsters,
    exportData,
    importData,
    getStandardMonsters,
    getStats
  };
}