import type { ShipPlacement, Coordinate } from '@battleships/shared';
import { GRID_SIZE, SHIPS, SHIP_TYPES } from '@battleships/shared';
import { GameBoard } from './GameBoard.js';

export function validatePlacements(placements: ShipPlacement[]): string | null {
  // Must have exactly 5 ships
  if (!Array.isArray(placements) || placements.length !== SHIP_TYPES.length) {
    return `Must place exactly ${SHIP_TYPES.length} ships`;
  }

  // Must have one of each type
  const types = new Set(placements.map(p => p.shipType));
  for (const t of SHIP_TYPES) {
    if (!types.has(t)) return `Missing ship: ${SHIPS[t].name}`;
  }
  if (types.size !== SHIP_TYPES.length) return 'Duplicate ship types';

  // Validate each placement
  const occupied = new Set<string>();
  for (const p of placements) {
    if (!SHIPS[p.shipType]) return `Invalid ship type: ${p.shipType}`;
    if (p.orientation !== 'horizontal' && p.orientation !== 'vertical') {
      return `Invalid orientation: ${p.orientation}`;
    }

    const cells = GameBoard.getShipCells(p);
    for (const c of cells) {
      // Bounds check
      if (c.row < 0 || c.row >= GRID_SIZE || c.col < 0 || c.col >= GRID_SIZE) {
        return `${SHIPS[p.shipType].name} extends outside the grid`;
      }
      // Overlap check
      const key = `${c.row},${c.col}`;
      if (occupied.has(key)) {
        return `${SHIPS[p.shipType].name} overlaps with another ship`;
      }
      occupied.add(key);
    }
  }

  return null; // valid
}

export function validateCoordinate(coord: Coordinate): boolean {
  return (
    typeof coord.row === 'number' &&
    typeof coord.col === 'number' &&
    Number.isInteger(coord.row) &&
    Number.isInteger(coord.col) &&
    coord.row >= 0 &&
    coord.row < GRID_SIZE &&
    coord.col >= 0 &&
    coord.col < GRID_SIZE
  );
}
