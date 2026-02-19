import type { ShotResult } from '@battleships/shared';
import { COLUMN_LABELS, SHIPS } from '@battleships/shared';
import styles from './GameLog.module.css';

type LogEntry = {
  playerId: string;
  result: ShotResult;
};

type GameLogProps = {
  entries: LogEntry[];
  myId: string;
};

function formatCoord(row: number, col: number): string {
  return `${COLUMN_LABELS[col]}${row + 1}`;
}

export function GameLog({ entries, myId }: GameLogProps) {
  return (
    <div className={styles.log}>
      <h4 className={styles.heading}>Battle Log</h4>
      <div className={styles.entries}>
        {entries.length === 0 && (
          <p className={styles.empty}>No shots fired yet</p>
        )}
        {[...entries].reverse().map((entry, i) => {
          const isMe = entry.playerId === myId;
          const coord = formatCoord(entry.result.coordinate.row, entry.result.coordinate.col);
          const who = isMe ? 'You' : 'Enemy';
          let text: string;
          if (entry.result.result === 'miss') {
            text = `${who} fired at ${coord} — Miss`;
          } else if (entry.result.result === 'sunk' && entry.result.sunkShip) {
            text = `${who} fired at ${coord} — Sunk ${SHIPS[entry.result.sunkShip].name}!`;
          } else {
            text = `${who} fired at ${coord} — Hit!`;
          }
          return (
            <div
              key={entries.length - 1 - i}
              className={`${styles.entry} ${styles[entry.result.result]} ${isMe ? styles.mine : styles.enemy}`}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
