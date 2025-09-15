import { useEffect, useRef } from 'react';
import { Monster } from '../types/monster';

interface UseSocketProps {
  onMonsterSpawn: (monster: Monster) => void;
  onMonsterUpdate: (monster: Monster) => void;
  onMonsterRemove: (monsterId: string) => void;
}

export const useSocket = ({ onMonsterSpawn, onMonsterUpdate, onMonsterRemove }: UseSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize socket connection to the monster server
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('Connected to monster server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'map_data' && data.monsters) {
          // Initial map data received
          data.monsters.forEach((monster: Monster) => {
            onMonsterSpawn(monster);
          });
        } else if (data.type === 'monster_spawn') {
          onMonsterSpawn(data.monster);
        } else if (data.type === 'monster_update') {
          onMonsterUpdate(data.monster);
        } else if (data.type === 'monster_remove') {
          onMonsterRemove(data.monsterId);
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from monster server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Store reference to the raw WebSocket
    socketRef.current = ws;

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onMonsterSpawn, onMonsterUpdate, onMonsterRemove]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN
  };
};
