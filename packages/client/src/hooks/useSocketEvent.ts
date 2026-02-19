import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import type { ServerToClientEvents } from '@battleships/shared';

export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E]
) {
  const { socket } = useSocket();

  useEffect(() => {
    socket.on(event, handler as any);
    return () => {
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
}
