import type { CellState, Coordinate } from '@battleships/shared';
import { GRID_SIZE, COLUMN_LABELS } from '@battleships/shared';
import { Cell } from './Cell';
import styles from './Grid.module.css';

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
};

export function Grid({ cells, onCellClick, onCellEnter, onCellLeave, clickable, label, lastShot }: GridProps) {
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
