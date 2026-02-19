import type { ShipType } from '@battleships/shared';
import { SHIPS, SHIP_TYPES } from '@battleships/shared';
import styles from './ShipStatusPanel.module.css';

type ShipStatusPanelProps = {
  label: string;
  shipsStatus: Record<ShipType, { sunk: boolean }>;
};

export function ShipStatusPanel({ label, shipsStatus }: ShipStatusPanelProps) {
  return (
    <div className={styles.panel}>
      <h4 className={styles.heading}>{label}</h4>
      {SHIP_TYPES.map((type) => {
        const ship = SHIPS[type];
        const sunk = shipsStatus[type]?.sunk;
        return (
          <div key={type} className={`${styles.ship} ${sunk ? styles.sunk : ''}`}>
            <span className={styles.name}>{ship.name}</span>
            <div className={styles.dots}>
              {Array.from({ length: ship.size }, (_, i) => (
                <span key={i} className={styles.dot} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
