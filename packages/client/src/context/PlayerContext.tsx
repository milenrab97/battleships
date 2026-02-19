import { createContext, useContext, useState, type ReactNode } from 'react';

type PlayerContextValue = {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerId: string;
  setPlayerId: (id: string) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');

  return (
    <PlayerContext.Provider value={{ playerName, setPlayerName, playerId, setPlayerId }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
