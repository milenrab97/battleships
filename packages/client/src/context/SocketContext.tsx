import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { socket, type TypedSocket } from '../socket';

type SocketContextValue = {
  socket: TypedSocket;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
