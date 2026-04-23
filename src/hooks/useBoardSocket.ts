import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

export const useBoardSocket = (boardId?: string) => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !isConnected || !boardId) return;

    // Join board room
    socket.emit('join_board', boardId);

    // Listen for card events
    socket.on('card:moved', (payload) => {
      console.log('Real-time: Card moved', payload);
      // Dispatch a custom event to notify components to refresh data
      window.dispatchEvent(new CustomEvent('lumins:board-updated', { detail: { boardId, ...payload } }));
    });

    socket.on('card:updated', (payload) => {
      console.log('Real-time: Card updated', payload);
      window.dispatchEvent(new CustomEvent('lumins:board-updated', { detail: { boardId, ...payload } }));
      window.dispatchEvent(new CustomEvent('lumins:card-updated', { detail: payload }));
    });

    socket.on('board:deleted', (payload) => {
      console.log('Real-time: Board deleted', payload);
      if (payload.boardId === boardId) {
        navigate('/dashboard');
      }
    });

    return () => {
      socket.emit('leave_board', boardId);
      socket.off('card:moved');
      socket.off('card:updated');
      socket.off('board:deleted');
    };
  }, [socket, isConnected, boardId, navigate]);

  return { isConnected };
};
