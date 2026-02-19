import type { ShipType } from '@battleships/shared';
import { SHIPS, SHIP_TYPES } from '@battleships/shared';
import styles from './ShipTray.module.css';

type ShipTrayProps = {
  selectedShip: ShipType | null;
  placedShips: Set<ShipType>;
  onSelect: (ship: ShipType) => void;
};

export function ShipTray({ selectedShip, placedShips, onSelect }: ShipTrayProps) {
  return (
    <div className={styles.tray}>
      <h3 className={styles.heading}>Ships</h3>
      {SHIP_TYPES.map((type) => {
        const ship = SHIPS[type];
        const placed = placedShips.has(type);
        const selected = selectedShip === type;
        return (
          <button
            key={type}
            className={`${styles.ship} ${placed ? styles.placed : ''} ${selected ? styles.selected : ''}`}
            onClick={() => !placed && onSelect(type)}
            disabled={placed}
          >
            <span className={styles.name}>{ship.name}</span>
            <div className={styles.blocks}>
              <img
                src={`/assets/ships/${type}.png`}
                alt={ship.name}
                className={styles.shipImage}
                style={{ width: `${ship.size * 16}px` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
