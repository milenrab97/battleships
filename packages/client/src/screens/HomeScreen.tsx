import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { Button } from '../components/common/Button';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { socket } = useSocket();
  const { playerName, setPlayerName, setPlayerId } = usePlayer();
  const { dispatch } = useGame();
  const [nameInput, setNameInput] = useState(playerName);
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameValid = nameInput.trim().length >= 2 && nameInput.trim().length <= 20;

  function handleCreate() {
    if (!nameValid) return;
    setLoading(true);
    setError('');
    const name = nameInput.trim();
    socket.emit('createRoom', { playerName: name }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerName(name);
        setPlayerId(res.playerId);
        dispatch({ type: 'SET_ROOM', roomCode: res.roomCode });
        dispatch({ type: 'SET_PLAYERS', players: [{ id: res.playerId, name, ready: false }] });
        dispatch({ type: 'SET_SCREEN', screen: 'lobby' });
      } else {
        setError(res.error);
      }
    });
  }

  function handleJoin() {
    if (!nameValid || joinCode.trim().length === 0) return;
    setLoading(true);
    setError('');
    const name = nameInput.trim();
    socket.emit('joinRoom', { roomCode: joinCode.trim().toUpperCase(), playerName: name }, (res) => {
      setLoading(false);
      if (res.success) {
        setPlayerName(name);
        setPlayerId(res.playerId);
        dispatch({ type: 'SET_ROOM', roomCode: joinCode.trim().toUpperCase() });
        dispatch({ type: 'SET_PLAYERS', players: res.players });
        dispatch({ type: 'SET_SCREEN', screen: 'lobby' });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Battleships</h1>
      <p className={styles.subtitle}>Naval warfare awaits</p>

      <div className={styles.card}>
        <label className={styles.label}>
          Your Name
          <input
            className={styles.input}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter display name..."
            maxLength={20}
          />
        </label>

        {mode === 'choose' ? (
          <div className={styles.actions}>
            <Button onClick={handleCreate} disabled={!nameValid || loading} size="lg">
              Create Room
            </Button>
            <Button variant="secondary" onClick={() => setMode('join')} disabled={!nameValid} size="lg">
              Join Room
            </Button>
          </div>
        ) : (
          <div className={styles.joinSection}>
            <label className={styles.label}>
              Room Code
              <input
                className={styles.input}
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-letter code..."
                maxLength={6}
              />
            </label>
            <div className={styles.actions}>
              <Button onClick={handleJoin} disabled={!nameValid || joinCode.trim().length === 0 || loading} size="lg">
                Join
              </Button>
              <Button variant="secondary" onClick={() => { setMode('choose'); setError(''); }} size="lg">
                Back
              </Button>
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
