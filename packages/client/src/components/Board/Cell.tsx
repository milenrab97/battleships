import type { CellState } from '@battleships/shared';
import type { ShipInfo } from './Grid';
import styles from './Cell.module.css';

type CellProps = {
  state: CellState;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  preview?: 'valid' | 'invalid' | null;
  clickable?: boolean;
  isLastShot?: boolean;
  shipInfo?: ShipInfo;
};

export function Cell({ state, onClick, onMouseEnter, onMouseLeave, preview, clickable, isLastShot, shipInfo }: CellProps) {
  const classNames = [
    styles.cell,
    preview ? styles[`preview_${preview}`] : '',
    clickable ? styles.clickable : '',
    isLastShot ? styles.lastShot : '',
    isLastShot && (state === 'hit' || state === 'sunk') ? styles.hit : '',
    isLastShot && state === 'miss' ? styles.miss : '',
  ].filter(Boolean).join(' ');

  const showShip = shipInfo && (state === 'ship' || state === 'hit' || state === 'sunk');

  const shipStyle = showShip ? {
    backgroundImage: `url(/assets/ships/${shipInfo.type}.png)`,
    backgroundSize: `${shipInfo.size * 100}% 100%`,
    backgroundPosition: `${shipInfo.size > 1 ? (shipInfo.segmentIndex / (shipInfo.size - 1)) * 100 : 0}% 0%`,
    backgroundRepeat: 'no-repeat' as const,
    transform: shipInfo.orientation === 'vertical' ? 'rotate(90deg)' : undefined,
  } : undefined;

  return (
    <div
      className={classNames}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showShip && <div className={styles.shipLayer} style={shipStyle} />}
      {state === 'hit' && <div className={`${styles.stateOverlay} ${styles.hitOverlay}`} />}
      {state === 'miss' && <div className={`${styles.stateOverlay} ${styles.missOverlay}`} />}
      {state === 'sunk' && <div className={`${styles.stateOverlay} ${styles.sunkOverlay}`} />}
      {state === 'sunk' && <div className={styles.sunkTint} />}
    </div>
  );
}
