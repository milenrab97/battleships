import type { ShipPlacement, Coordinate, ShotResult, GamePhase, PlayerInfo, ShipType } from './types.js';

export interface ClientToServerEvents {
  createRoom: (data: { playerName: string }, callback: (response: { success: true; roomCode: string; playerId: string } | { success: false; error: string }) => void) => void;
  joinRoom: (data: { roomCode: string; playerName: string }, callback: (response: { success: true; playerId: string; players: PlayerInfo[] } | { success: false; error: string }) => void) => void;
  playerReady: (data: { ready: boolean }) => void;
  placeShips: (data: { placements: ShipPlacement[] }, callback: (response: { success: true } | { success: false; error: string }) => void) => void;
  fireShot: (data: { coordinate: Coordinate }, callback: (response: { success: true; result: ShotResult; gameOver: boolean } | { success: false; error: string }) => void) => void;
  playAgain: () => void;
  leaveRoom: () => void;
  reconnect: (data: { roomCode: string; playerId: string }, callback: (response: { success: true } | { success: false; error: string }) => void) => void;
}

export interface ServerToClientEvents {
  playerJoined: (data: { player: PlayerInfo }) => void;
  playerLeft: (data: { playerId: string }) => void;
  playerReadyChanged: (data: { playerId: string; ready: boolean }) => void;
  phaseChanged: (data: { phase: GamePhase; currentTurn?: string }) => void;
  opponentPlacedShips: () => void;
  shotFired: (data: { playerId: string; result: ShotResult }) => void;
  gameOver: (data: { winnerId: string; winnerName: string; opponentShips: ShipPlacement[] }) => void;
  opponentDisconnected: (data: { timeout: number }) => void;
  opponentReconnected: () => void;
  roomClosed: (data: { reason: string }) => void;
  playAgainRequested: (data: { playerId: string }) => void;
  gameRestarted: () => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId: string;
  roomCode: string;
  playerName: string;
}
