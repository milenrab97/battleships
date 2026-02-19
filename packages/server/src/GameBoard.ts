import type { Coordinate, ShipPlacement, ShipType, CellState, ShotResult } from '@battleships/shared';
import { GRID_SIZE, SHIPS } from '@battleships/shared';

type InternalCell = {
  shipType: ShipType | null;
  hit: boolean;
};

export class GameBoard {
  private grid: InternalCell[][];
  private shipCells = new Map<ShipType, Coordinate[]>();
  private shipHits = new Map<ShipType, number>();
  private originalPlacements: ShipPlacement[] = [];

  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({ shipType: null, hit: false }))
    );
  }

  placeShips(placements: ShipPlacement[]): void {
    this.originalPlacements = placements;
    for (const p of placements) {
      const cells = GameBoard.getShipCells(p);
      this.shipCells.set(p.shipType, cells);
      this.shipHits.set(p.shipType, 0);
      for (const c of cells) {
        this.grid[c.row][c.col].shipType = p.shipType;
      }
    }
  }

  receiveShot(coord: Coordinate): ShotResult {
    const cell = this.grid[coord.row][coord.col];
    cell.hit = true;

    if (!cell.shipType) {
      return { coordinate: coord, result: 'miss' };
    }

    const shipType = cell.shipType;
    const currentHits = (this.shipHits.get(shipType) ?? 0) + 1;
    this.shipHits.set(shipType, currentHits);

    const shipSize = SHIPS[shipType].size;
    if (currentHits >= shipSize) {
      return { coordinate: coord, result: 'sunk', sunkShip: shipType };
    }

    return { coordinate: coord, result: 'hit' };
  }

  isAlreadyShot(coord: Coordinate): boolean {
    return this.grid[coord.row][coord.col].hit;
  }

  allShipsSunk(): boolean {
    for (const [shipType, cells] of this.shipCells) {
      const hits = this.shipHits.get(shipType) ?? 0;
      if (hits < cells.length) return false;
    }
    return this.shipCells.size > 0;
  }

  getPublicView(): CellState[][] {
    return this.grid.map(row =>
      row.map(cell => {
        if (!cell.hit) return 'empty';
        if (!cell.shipType) return 'miss';
        // Check if the ship is sunk
        const hits = this.shipHits.get(cell.shipType) ?? 0;
        const size = SHIPS[cell.shipType].size;
        return hits >= size ? 'sunk' : 'hit';
      })
    );
  }

  getOwnerView(): CellState[][] {
    return this.grid.map(row =>
      row.map(cell => {
        if (!cell.hit && !cell.shipType) return 'empty';
        if (!cell.hit && cell.shipType) return 'ship';
        if (cell.hit && !cell.shipType) return 'miss';
        const hits = this.shipHits.get(cell.shipType!) ?? 0;
        const size = SHIPS[cell.shipType!].size;
        return hits >= size ? 'sunk' : 'hit';
      })
    );
  }

  getPlacements(): ShipPlacement[] {
    return this.originalPlacements;
  }

  getShipCellsMap(): Map<ShipType, Coordinate[]> {
    return new Map(this.shipCells);
  }

  static getShipCells(placement: ShipPlacement): Coordinate[] {
    const cells: Coordinate[] = [];
    const size = SHIPS[placement.shipType].size;
    for (let i = 0; i < size; i++) {
      cells.push({
        row: placement.start.row + (placement.orientation === 'vertical' ? i : 0),
        col: placement.start.col + (placement.orientation === 'horizontal' ? i : 0),
      });
    }
    return cells;
  }
}
