import { useSocket } from '../../context/SocketContext';
import styles from './ConnectionStatus.module.css';

export function ConnectionStatus() {
  const { connected } = useSocket();

  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${connected ? styles.connected : styles.disconnected}`} />
      <span className={styles.label}>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
