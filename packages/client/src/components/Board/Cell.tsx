import type { CellState } from '@battleships/shared';
import styles from './Cell.module.css';

type CellProps = {
  state: CellState;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  preview?: 'valid' | 'invalid' | null;
  clickable?: boolean;
  isLastShot?: boolean;
};

export function Cell({ state, onClick, onMouseEnter, onMouseLeave, preview, clickable, isLastShot }: CellProps) {
  const classNames = [
    styles.cell,
    styles[state],
    preview ? styles[`preview_${preview}`] : '',
    clickable ? styles.clickable : '',
    isLastShot ? styles.lastShot : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {state === 'hit' && <span className={styles.marker}>✕</span>}
      {state === 'miss' && <span className={styles.marker}>○</span>}
      {state === 'sunk' && <span className={styles.marker}>✕</span>}
    </div>
  );
}
