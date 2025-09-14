import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Monster } from '../types/monster';

interface UseSocketProps {
  onMonsterSpawn: (monster: Monster) => void;
  onMonsterUpdate: (monster: Monster) => void;
  onMonsterRemove: (monsterId: string) => void;
}

export const useSocket = ({ onMonsterSpawn, onMonsterUpdate, onMonsterRemove }: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    const socket = socketRef.current;

    // Listen for monster events
    socket.on('monster:spawn', (monster: Monster) => {
      onMonsterSpawn(monster);
    });

    socket.on('monster:update', (monster: Monster) => {
      onMonsterUpdate(monster);
    });

    socket.on('monster:remove', (monsterId: string) => {
      onMonsterRemove(monsterId);
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [onMonsterSpawn, onMonsterUpdate, onMonsterRemove]);

  const emitJoinRoom = (roomId: string) => {
    socketRef.current?.emit('join:room', roomId);
  };

  const emitLeaveRoom = (roomId: string) => {
    socketRef.current?.emit('leave:room', roomId);
  };

  return {
    socket: socketRef.current,
    emitJoinRoom,
    emitLeaveRoom
  };
};
