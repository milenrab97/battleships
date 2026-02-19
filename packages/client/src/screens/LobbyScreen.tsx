import { useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Button } from '../components/common/Button';
import styles from './LobbyScreen.module.css';

export function LobbyScreen() {
  const { socket } = useSocket();
  const { playerId } = usePlayer();
  const { state, dispatch } = useGame();
  const { roomCode, players } = state;

  const me = players.find(p => p.id === playerId);
  const opponent = players.find(p => p.id !== playerId);

  useSocketEvent('playerJoined', useCallback((data) => {
    dispatch({ type: 'ADD_PLAYER', player: data.player });
  }, [dispatch]));

  useSocketEvent('playerLeft', useCallback((data) => {
    dispatch({ type: 'REMOVE_PLAYER', playerId: data.playerId });
  }, [dispatch]));

  useSocketEvent('playerReadyChanged', useCallback((data) => {
    dispatch({ type: 'SET_PLAYER_READY', playerId: data.playerId, ready: data.ready });
  }, [dispatch]));

  useSocketEvent('phaseChanged', useCallback((data) => {
    dispatch({ type: 'SET_PHASE', phase: data.phase, currentTurn: data.currentTurn });
  }, [dispatch]));

  useSocketEvent('roomClosed', useCallback((_data) => {
    dispatch({ type: 'RESET_TO_HOME' });
  }, [dispatch]));

  // Also listen for gameRestarted (play again)
  useSocketEvent('gameRestarted', useCallback(() => {
    dispatch({ type: 'RESET_FOR_NEW_GAME' });
  }, [dispatch]));

  function toggleReady() {
    const newReady = !(me?.ready ?? false);
    socket.emit('playerReady', { ready: newReady });
    // Optimistically update
    dispatch({ type: 'SET_PLAYER_READY', playerId, ready: newReady });
  }

  function handleLeave() {
    socket.emit('leaveRoom');
    dispatch({ type: 'RESET_TO_HOME' });
  }

  // Copy room code to clipboard
  function copyCode() {
    navigator.clipboard.writeText(roomCode);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Game Lobby</h2>

      <div className={styles.codeSection}>
        <span className={styles.codeLabel}>Room Code</span>
        <button className={styles.code} onClick={copyCode} title="Click to copy">
          {roomCode}
        </button>
        <span className={styles.copyHint}>Click to copy</span>
      </div>

      <div className={styles.players}>
        <div className={`${styles.playerCard} ${me?.ready ? styles.ready : ''}`}>
          <span className={styles.playerName}>{me?.name ?? '...'} (You)</span>
          <span className={styles.readyBadge}>{me?.ready ? 'READY' : 'NOT READY'}</span>
        </div>

        <div className={styles.vs}>VS</div>

        <div className={`${styles.playerCard} ${opponent?.ready ? styles.ready : ''}`}>
          {opponent ? (
            <>
              <span className={styles.playerName}>{opponent.name}</span>
              <span className={styles.readyBadge}>{opponent.ready ? 'READY' : 'NOT READY'}</span>
            </>
          ) : (
            <span className={styles.waiting}>Waiting for opponent...</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          onClick={toggleReady}
          variant={me?.ready ? 'secondary' : 'primary'}
          size="lg"
          disabled={!opponent}
        >
          {me?.ready ? 'Cancel Ready' : 'Ready Up'}
        </Button>
        <Button variant="danger" onClick={handleLeave} size="sm">
          Leave Room
        </Button>
      </div>
    </div>
  );
}
