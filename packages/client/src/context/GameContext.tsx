import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { GamePhase, PlayerInfo, ShotResult, ShipPlacement, Coordinate, CellState, ShipType } from '@battleships/shared';
import { GRID_SIZE, SHIPS } from '@battleships/shared';

export type Screen = 'home' | 'lobby' | 'placement' | 'battle' | 'result';

export type BoardCell = {
  state: CellState;
  shipType?: ShipType;
};

export type GameState = {
  screen: Screen;
  roomCode: string;
  phase: GamePhase;
  players: PlayerInfo[];
  currentTurn: string;
  myBoard: BoardCell[][];
  opponentBoard: BoardCell[][];
  myPlacements: ShipPlacement[];
  opponentPlacements: ShipPlacement[];
  myShipsStatus: Record<ShipType, { sunk: boolean }>;
  opponentShipsStatus: Record<ShipType, { sunk: boolean }>;
  shotLog: Array<{ playerId: string; result: ShotResult }>;
  winner: string;
  winnerName: string;
  totalShots: number;
  hits: number;
  opponentReady: boolean;
  waitingForOpponent: boolean;
  disconnectTimeout: number | null;
  playAgainRequested: Record<string, boolean>;
  lastShotOnMyBoard: Coordinate | null;
  lastShotOnOpponentBoard: Coordinate | null;
};

function createEmptyBoard(): BoardCell[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ state: 'empty' as CellState }))
  );
}

function initShipStatus(): Record<ShipType, { sunk: boolean }> {
  return {
    carrier: { sunk: false },
    battleship: { sunk: false },
    cruiser: { sunk: false },
    submarine: { sunk: false },
    destroyer: { sunk: false },
  };
}

const initialState: GameState = {
  screen: 'home',
  roomCode: '',
  phase: 'LOBBY',
  players: [],
  currentTurn: '',
  myBoard: createEmptyBoard(),
  opponentBoard: createEmptyBoard(),
  myPlacements: [],
  opponentPlacements: [],
  myShipsStatus: initShipStatus(),
  opponentShipsStatus: initShipStatus(),
  shotLog: [],
  winner: '',
  winnerName: '',
  totalShots: 0,
  hits: 0,
  opponentReady: false,
  waitingForOpponent: false,
  disconnectTimeout: null,
  playAgainRequested: {},
  lastShotOnMyBoard: null,
  lastShotOnOpponentBoard: null,
};

export type GameAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_ROOM'; roomCode: string }
  | { type: 'SET_PLAYERS'; players: PlayerInfo[] }
  | { type: 'ADD_PLAYER'; player: PlayerInfo }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'SET_PLAYER_READY'; playerId: string; ready: boolean }
  | { type: 'SET_PHASE'; phase: GamePhase; currentTurn?: string }
  | { type: 'SET_MY_PLACEMENTS'; placements: ShipPlacement[] }
  | { type: 'SET_MY_BOARD'; board: BoardCell[][] }
  | { type: 'SET_WAITING_FOR_OPPONENT'; waiting: boolean }
  | { type: 'RECORD_SHOT'; playerId: string; result: ShotResult; isMyShot: boolean }
  | { type: 'SET_GAME_OVER'; winnerId: string; winnerName: string; opponentShips: ShipPlacement[] }
  | { type: 'SET_DISCONNECT_TIMEOUT'; timeout: number | null }
  | { type: 'PLAY_AGAIN_REQUESTED'; playerId: string }
  | { type: 'RESET_FOR_NEW_GAME' }
  | { type: 'RESET_TO_HOME' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'SET_ROOM':
      return { ...state, roomCode: action.roomCode };

    case 'SET_PLAYERS':
      return { ...state, players: action.players };

    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.player] };

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.playerId) };

    case 'SET_PLAYER_READY': {
      const players = state.players.map(p =>
        p.id === action.playerId ? { ...p, ready: action.ready } : p
      );
      return { ...state, players };
    }

    case 'SET_PHASE': {
      let screen = state.screen;
      if (action.phase === 'LOBBY') screen = 'lobby';
      else if (action.phase === 'PLACEMENT') screen = 'placement';
      else if (action.phase === 'BATTLE') screen = 'battle';
      else if (action.phase === 'FINISHED') screen = 'result';
      return {
        ...state,
        phase: action.phase,
        screen,
        currentTurn: action.currentTurn ?? state.currentTurn,
        waitingForOpponent: false,
      };
    }

    case 'SET_MY_PLACEMENTS':
      return { ...state, myPlacements: action.placements };

    case 'SET_MY_BOARD':
      return { ...state, myBoard: action.board };

    case 'SET_WAITING_FOR_OPPONENT':
      return { ...state, waitingForOpponent: action.waiting };

    case 'RECORD_SHOT': {
      const { playerId, result, isMyShot } = action;
      const { coordinate, result: shotResult, sunkShip, sunkShipPlacement } = result;

      let opponentBoard = state.opponentBoard;
      let opponentPlacements = state.opponentPlacements;
      let myBoard = state.myBoard;
      let opponentShipsStatus = state.opponentShipsStatus;
      let myShipsStatus = state.myShipsStatus;
      let totalShots = state.totalShots;
      let hits = state.hits;

      if (isMyShot) {
        // I fired, update opponent board
        opponentBoard = opponentBoard.map((row, r) =>
          row.map((cell, c) => {
            if (r === coordinate.row && c === coordinate.col) {
              return { ...cell, state: shotResult === 'miss' ? 'miss' : 'hit' };
            }
            return cell;
          })
        );
        totalShots++;
        if (shotResult !== 'miss') hits++;
        if (sunkShip) {
          opponentShipsStatus = { ...opponentShipsStatus, [sunkShip]: { sunk: true } };
          // Reveal the entire sunk ship on the opponent board
          if (sunkShipPlacement) {
            opponentPlacements = [...opponentPlacements, sunkShipPlacement];
            const size = SHIPS[sunkShip].size;
            const sunkCells = new Set<string>();
            for (let i = 0; i < size; i++) {
              const sr = sunkShipPlacement.start.row + (sunkShipPlacement.orientation === 'vertical' ? i : 0);
              const sc = sunkShipPlacement.start.col + (sunkShipPlacement.orientation === 'horizontal' ? i : 0);
              sunkCells.add(`${sr},${sc}`);
            }
            opponentBoard = opponentBoard.map((row, r) =>
              row.map((cell, c) => sunkCells.has(`${r},${c}`) ? { ...cell, state: 'sunk', shipType: sunkShip } : cell)
            );
          }
        }
      } else {
        // Opponent fired, update my board
        myBoard = myBoard.map((row, r) =>
          row.map((cell, c) => {
            if (r === coordinate.row && c === coordinate.col) {
              return { ...cell, state: shotResult === 'miss' ? 'miss' : 'hit' };
            }
            return cell;
          })
        );
        if (sunkShip) {
          myShipsStatus = { ...myShipsStatus, [sunkShip]: { sunk: true } };
          // Mark all cells of the sunk ship as 'sunk'
          const sunkPlacement = state.myPlacements.find(p => p.shipType === sunkShip);
          if (sunkPlacement) {
            const size = SHIPS[sunkShip].size;
            const sunkCells = new Set<string>();
            for (let i = 0; i < size; i++) {
              const sr = sunkPlacement.start.row + (sunkPlacement.orientation === 'vertical' ? i : 0);
              const sc = sunkPlacement.start.col + (sunkPlacement.orientation === 'horizontal' ? i : 0);
              sunkCells.add(`${sr},${sc}`);
            }
            myBoard = myBoard.map((row, r) =>
              row.map((cell, c) => sunkCells.has(`${r},${c}`) ? { ...cell, state: 'sunk' } : cell)
            );
          }
        }
      }

      // Only switch turn on a miss; hits/sinks give another turn
      let currentTurn = state.currentTurn;
      if (shotResult === 'miss') {
        const otherPlayer = state.players.find(p => p.id !== playerId);
        currentTurn = otherPlayer?.id ?? state.currentTurn;
      }

      return {
        ...state,
        opponentBoard,
        opponentPlacements,
        myBoard,
        opponentShipsStatus,
        myShipsStatus,
        totalShots,
        hits,
        currentTurn,
        shotLog: [...state.shotLog, { playerId, result }],
        lastShotOnMyBoard: isMyShot ? state.lastShotOnMyBoard : coordinate,
        lastShotOnOpponentBoard: isMyShot ? coordinate : state.lastShotOnOpponentBoard,
      };
    }

    case 'SET_GAME_OVER': {
      // Reveal opponent's ships on the opponent board
      const revealedBoard = state.opponentBoard.map(row => row.map(cell => ({ ...cell })));
      if (action.opponentShips) {
        for (const p of action.opponentShips) {
          const size = SHIPS[p.shipType].size;
          for (let i = 0; i < size; i++) {
            const r = p.start.row + (p.orientation === 'vertical' ? i : 0);
            const c = p.start.col + (p.orientation === 'horizontal' ? i : 0);
            if (revealedBoard[r]?.[c] && revealedBoard[r][c].state === 'empty') {
              revealedBoard[r][c] = { state: 'ship', shipType: p.shipType };
            }
          }
        }
      }
      return { ...state, winner: action.winnerId, winnerName: action.winnerName, opponentBoard: revealedBoard, opponentPlacements: action.opponentShips ?? [], screen: 'result', phase: 'FINISHED' };
    }

    case 'SET_DISCONNECT_TIMEOUT':
      return { ...state, disconnectTimeout: action.timeout };

    case 'PLAY_AGAIN_REQUESTED':
      return { ...state, playAgainRequested: { ...state.playAgainRequested, [action.playerId]: true } };

    case 'RESET_FOR_NEW_GAME':
      return {
        ...state,
        phase: 'LOBBY',
        screen: 'lobby',
        currentTurn: '',
        myBoard: createEmptyBoard(),
        opponentBoard: createEmptyBoard(),
        myPlacements: [],
        opponentPlacements: [],
        myShipsStatus: initShipStatus(),
        opponentShipsStatus: initShipStatus(),
        shotLog: [],
        winner: '',
        winnerName: '',
        totalShots: 0,
        hits: 0,
        waitingForOpponent: false,
        playAgainRequested: {},
        lastShotOnMyBoard: null,
        lastShotOnOpponentBoard: null,
        players: state.players.map(p => ({ ...p, ready: false })),
      };

    case 'RESET_TO_HOME':
      return { ...initialState };

    default:
      return state;
  }
}

type GameContextValue = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
