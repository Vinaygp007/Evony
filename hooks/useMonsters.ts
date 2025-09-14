import { useEffect, useState } from 'react';
import { Monster } from '../types/monster';

export const useMonsters = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonsters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monsters');
      if (!response.ok) {
        throw new Error('Failed to fetch monsters');
      }
      const data = await response.json();
      setMonsters(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addMonster = (monster: Monster) => {
    setMonsters(prev => [...prev, monster]);
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

  useEffect(() => {
    fetchMonsters();
  }, []);

  return {
    monsters,
    loading,
    error,
    addMonster,
    updateMonster,
    removeMonster,
    refetch: fetchMonsters
  };
};
