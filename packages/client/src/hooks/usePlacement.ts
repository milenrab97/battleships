import { useState, useCallback, useMemo } from 'react';
import type { ShipType, ShipPlacement, Orientation, CellState, Coordinate } from '@battleships/shared';
import { GRID_SIZE, SHIPS } from '@battleships/shared';

type BoardCellData = {
  state: CellState;
  preview?: 'valid' | 'invalid' | null;
};

export function usePlacement() {
  const [placements, setPlacements] = useState<ShipPlacement[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCell, setHoverCell] = useState<Coordinate | null>(null);

  const placedShips = useMemo(() => new Set(placements.map(p => p.shipType)), [placements]);

  const getShipCells = useCallback((start: Coordinate, shipType: ShipType, orient: Orientation): Coordinate[] => {
    const size = SHIPS[shipType].size;
    const cells: Coordinate[] = [];
    for (let i = 0; i < size; i++) {
      cells.push({
        row: start.row + (orient === 'vertical' ? i : 0),
        col: start.col + (orient === 'horizontal' ? i : 0),
      });
    }
    return cells;
  }, []);

  const isValidPlacement = useCallback((start: Coordinate, shipType: ShipType, orient: Orientation): boolean => {
    const cells = getShipCells(start, shipType, orient);
    const occupied = new Set<string>();
    for (const p of placements) {
      const pCells = getShipCells(p.start, p.shipType, p.orientation);
      for (const c of pCells) occupied.add(`${c.row},${c.col}`);
    }
    return cells.every(c =>
      c.row >= 0 && c.row < GRID_SIZE &&
      c.col >= 0 && c.col < GRID_SIZE &&
      !occupied.has(`${c.row},${c.col}`)
    );
  }, [placements, getShipCells]);

  const boardCells = useMemo((): BoardCellData[][] => {
    const grid: BoardCellData[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({ state: 'empty' as CellState }))
    );

    // Draw placed ships
    for (const p of placements) {
      const cells = getShipCells(p.start, p.shipType, p.orientation);
      for (const c of cells) {
        grid[c.row][c.col] = { state: 'ship' };
      }
    }

    // Draw preview if hovering with a selected ship
    if (selectedShip && hoverCell && !placedShips.has(selectedShip)) {
      const previewCells = getShipCells(hoverCell, selectedShip, orientation);
      const valid = isValidPlacement(hoverCell, selectedShip, orientation);
      for (const c of previewCells) {
        if (c.row >= 0 && c.row < GRID_SIZE && c.col >= 0 && c.col < GRID_SIZE) {
          grid[c.row][c.col] = {
            ...grid[c.row][c.col],
            preview: valid ? 'valid' : 'invalid',
          };
        }
      }
    }

    return grid;
  }, [placements, selectedShip, hoverCell, orientation, placedShips, getShipCells, isValidPlacement]);

  const placeShip = useCallback((row: number, col: number) => {
    if (!selectedShip || placedShips.has(selectedShip)) return;
    const start = { row, col };
    if (!isValidPlacement(start, selectedShip, orientation)) return;

    setPlacements(prev => [...prev, { shipType: selectedShip, start, orientation }]);
    setSelectedShip(null);
  }, [selectedShip, placedShips, orientation, isValidPlacement]);

  const toggleOrientation = useCallback(() => {
    setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);

  const resetPlacements = useCallback(() => {
    setPlacements([]);
    setSelectedShip(null);
  }, []);

  const allPlaced = placements.length === 5;

  return {
    placements,
    selectedShip,
    setSelectedShip,
    orientation,
    toggleOrientation,
    boardCells,
    placedShips,
    placeShip,
    resetPlacements,
    setHoverCell,
    allPlaced,
  };
}
