import { useMemo } from 'react';
import type { CellState, Coordinate, ShipPlacement, ShipType, Orientation } from '@battleships/shared';
import { GRID_SIZE, COLUMN_LABELS, SHIPS } from '@battleships/shared';
import { Cell } from './Cell';
import styles from './Grid.module.css';

export type ShipInfo = {
  type: ShipType;
  size: number;
  segmentIndex: number;
  orientation: Orientation;
};

type CellData = {
  state: CellState;
  preview?: 'valid' | 'invalid' | null;
};

type GridProps = {
  cells: CellData[][];
  onCellClick?: (row: number, col: number) => void;
  onCellEnter?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  clickable?: boolean;
  label?: string;
  lastShot?: Coordinate | null;
  placements?: ShipPlacement[];
};

export function Grid({ cells, onCellClick, onCellEnter, onCellLeave, clickable, label, lastShot, placements }: GridProps) {
  const shipInfoMap = useMemo(() => {
    if (!placements || placements.length === 0) return null;
    const map: (ShipInfo | null)[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    );
    for (const p of placements) {
      const size = SHIPS[p.shipType].size;
      for (let i = 0; i < size; i++) {
        const r = p.start.row + (p.orientation === 'vertical' ? i : 0);
        const c = p.start.col + (p.orientation === 'horizontal' ? i : 0);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          map[r][c] = { type: p.shipType, size, segmentIndex: i, orientation: p.orientation };
        }
      }
    }
    return map;
  }, [placements]);

  return (
    <div className={styles.wrapper}>
      {label && <h3 className={styles.label}>{label}</h3>}
      <div className={styles.grid}>
        {/* Corner */}
        <div className={styles.corner} />
        {/* Column headers */}
        {COLUMN_LABELS.slice(0, GRID_SIZE).map((l) => (
          <div key={l} className={styles.header}>{l}</div>
        ))}
        {/* Rows */}
        {Array.from({ length: GRID_SIZE }, (_, row) => (
          <div key={row} className={styles.row}>
            <div className={styles.rowLabel}>{row + 1}</div>
            {Array.from({ length: GRID_SIZE }, (_, col) => {
              const cellData = cells[row]?.[col] ?? { state: 'empty' as CellState };
              const isLastShot = lastShot?.row === row && lastShot?.col === col;
              return (
                <Cell
                  key={col}
                  state={cellData.state}
                  preview={cellData.preview}
                  clickable={clickable}
                  isLastShot={isLastShot}
                  shipInfo={shipInfoMap?.[row]?.[col] ?? undefined}
                  onClick={() => onCellClick?.(row, col)}
                  onMouseEnter={() => onCellEnter?.(row, col)}
                  onMouseLeave={onCellLeave}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
