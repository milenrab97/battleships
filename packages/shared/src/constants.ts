import type { ShipType } from './types.js';

export const GRID_SIZE = 10;

export const SHIPS: Record<ShipType, { name: string; size: number }> = {
  carrier: { name: 'Carrier', size: 5 },
  battleship: { name: 'Battleship', size: 4 },
  cruiser: { name: 'Cruiser', size: 3 },
  submarine: { name: 'Submarine', size: 3 },
  destroyer: { name: 'Destroyer', size: 2 },
};

export const SHIP_TYPES: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

export const TOTAL_SHIP_CELLS = Object.values(SHIPS).reduce((sum, s) => sum + s.size, 0);

export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

export const ROOM_CODE_LENGTH = 6;

export const RECONNECT_TIMEOUT_MS = 30_000;
