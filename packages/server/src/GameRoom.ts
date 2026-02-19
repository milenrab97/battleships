import type { GamePhase, PlayerInfo, ShipPlacement, ShotResult } from '@battleships/shared';
import { GameBoard } from './GameBoard.js';
import { validatePlacements, validateCoordinate } from './validation.js';
import { RECONNECT_TIMEOUT_MS } from '@battleships/shared';

type RoomPlayer = {
  id: string;
  socketId: string;
  name: string;
  ready: boolean;
  board: GameBoard | null;
  connected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
};

export class GameRoom {
  code: string;
  phase: GamePhase = 'LOBBY';
  players: Map<string, RoomPlayer> = new Map();
  currentTurn: string = '';
  winner: string = '';
  playAgainVotes = new Set<string>();

  private onRoomClosed?: () => void;

  constructor(code: string, hostId: string, hostName: string) {
    this.code = code;
    this.players.set(hostId, {
      id: hostId,
      socketId: '',
      name: hostName,
      ready: false,
      board: null,
      connected: true,
    });
  }

  setOnRoomClosed(cb: () => void) {
    this.onRoomClosed = cb;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isFull(): boolean {
    return this.players.size >= 2;
  }

  addPlayer(playerId: string, socketId: string, name: string): boolean {
    if (this.isFull()) return false;
    this.players.set(playerId, {
      id: playerId,
      socketId,
      name,
      ready: false,
      board: null,
      connected: true,
    });
    return true;
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player?.disconnectTimer) clearTimeout(player.disconnectTimer);
    this.players.delete(playerId);
  }

  setSocketId(playerId: string, socketId: string): void {
    const p = this.players.get(playerId);
    if (p) p.socketId = socketId;
  }

  getSocketId(playerId: string): string | undefined {
    return this.players.get(playerId)?.socketId;
  }

  getOpponentId(playerId: string): string | undefined {
    for (const [id] of this.players) {
      if (id !== playerId) return id;
    }
    return undefined;
  }

  getPlayerInfos(): PlayerInfo[] {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
    }));
  }

  setReady(playerId: string, ready: boolean): void {
    const p = this.players.get(playerId);
    if (p) p.ready = ready;
  }

  allReady(): boolean {
    if (this.players.size < 2) return false;
    return Array.from(this.players.values()).every(p => p.ready);
  }

  startPlacement(): void {
    this.phase = 'PLACEMENT';
    for (const p of this.players.values()) {
      p.ready = false;
      p.board = null;
    }
  }

  placeShips(playerId: string, placements: ShipPlacement[]): string | null {
    if (this.phase !== 'PLACEMENT') return 'Not in placement phase';
    const player = this.players.get(playerId);
    if (!player) return 'Player not found';
    if (player.board) return 'Ships already placed';

    const error = validatePlacements(placements);
    if (error) return error;

    const board = new GameBoard();
    board.placeShips(placements);
    player.board = board;
    return null;
  }

  allShipsPlaced(): boolean {
    return Array.from(this.players.values()).every(p => p.board !== null);
  }

  startBattle(): void {
    this.phase = 'BATTLE';
    // Random first turn
    const playerIds = Array.from(this.players.keys());
    this.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
  }

  fireShot(shooterId: string, coord: { row: number; col: number }): { error?: string; result?: ShotResult; gameOver?: boolean } {
    if (this.phase !== 'BATTLE') return { error: 'Not in battle phase' };
    if (this.currentTurn !== shooterId) return { error: 'Not your turn' };
    if (!validateCoordinate(coord)) return { error: 'Invalid coordinate' };

    const targetId = this.getOpponentId(shooterId);
    if (!targetId) return { error: 'No opponent' };

    const targetBoard = this.players.get(targetId)?.board;
    if (!targetBoard) return { error: 'Opponent board not set' };

    if (targetBoard.isAlreadyShot(coord)) return { error: 'Already shot there' };

    const result = targetBoard.receiveShot(coord);
    const gameOver = targetBoard.allShipsSunk();

    if (gameOver) {
      this.phase = 'FINISHED';
      this.winner = shooterId;
    } else if (result.result === 'miss') {
      // Only switch turns on a miss; hits/sinks give another turn
      this.currentTurn = targetId;
    }

    return { result, gameOver };
  }

  handleDisconnect(playerId: string, onTimeout: () => void): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;

    if (this.phase === 'LOBBY') {
      // Just remove from room
      this.removePlayer(playerId);
      if (this.players.size === 0) {
        this.onRoomClosed?.();
      }
      return;
    }

    // In-game: start reconnection timer
    player.disconnectTimer = setTimeout(() => {
      onTimeout();
    }, RECONNECT_TIMEOUT_MS);
  }

  handleReconnect(playerId: string, socketId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = undefined;
    }

    player.connected = true;
    player.socketId = socketId;
    return true;
  }

  requestPlayAgain(playerId: string): boolean {
    this.playAgainVotes.add(playerId);
    return this.playAgainVotes.size >= 2;
  }

  resetForNewGame(): void {
    this.phase = 'LOBBY';
    this.currentTurn = '';
    this.winner = '';
    this.playAgainVotes.clear();
    for (const p of this.players.values()) {
      p.ready = false;
      p.board = null;
    }
  }
}
