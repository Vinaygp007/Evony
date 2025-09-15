import { useState } from 'react';
import { Monster } from '../types/monster';

export const useMonsters = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const loading = false;
  const error = null;

  const addMonster = (monster: Monster) => {
    setMonsters(prev => {
      // Avoid duplicates
      const exists = prev.some(m => m.id === monster.id);
      if (exists) {
        return prev;
      }
      return [...prev, monster];
    });
  };

  const updateMonster = (updatedMonster: Monster) => {
    setMonsters(prev => 
      prev.map(monster => 
        monster.id === updatedMonster.id ? updatedMonster : monster
      )
    );
  };

  const removeMonster = (monsterId: string) => {
    setMonsters(prev => prev.filter(monster => monster.id !== monsterId));
  };

  const clearMonsters = () => {
    setMonsters([]);
  };

  return {
    monsters,
    loading,
    error,
    addMonster,
    updateMonster,
    removeMonster,
    clearMonsters
  };
};
