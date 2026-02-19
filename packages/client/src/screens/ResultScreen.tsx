import { useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Grid } from '../components/Board/Grid';
import { Button } from '../components/common/Button';
import styles from './ResultScreen.module.css';

export function ResultScreen() {
  const { socket } = useSocket();
  const { playerId } = usePlayer();
  const { state, dispatch } = useGame();
  const [requestedPlayAgain, setRequestedPlayAgain] = useState(false);
  const [opponentWantsPlayAgain, setOpponentWantsPlayAgain] = useState(false);

  const isWinner = state.winner === playerId;
  const accuracy = state.totalShots > 0 ? Math.round((state.hits / state.totalShots) * 100) : 0;

  useSocketEvent('playAgainRequested', useCallback((_data) => {
    setOpponentWantsPlayAgain(true);
  }, []));

  useSocketEvent('gameRestarted', useCallback(() => {
    dispatch({ type: 'RESET_FOR_NEW_GAME' });
  }, [dispatch]));

  useSocketEvent('playerLeft', useCallback((_data) => {
    setOpponentWantsPlayAgain(false);
  }, []));

  function handlePlayAgain() {
    socket.emit('playAgain');
    setRequestedPlayAgain(true);
  }

  function handleLeave() {
    socket.emit('leaveRoom');
    dispatch({ type: 'RESET_TO_HOME' });
  }

  const myBoardCells = state.myBoard.map(row =>
    row.map(cell => ({ state: cell.state }))
  );
  const oppBoardCells = state.opponentBoard.map(row =>
    row.map(cell => ({ state: cell.state }))
  );

  return (
    <div className={styles.container}>
      <h1 className={`${styles.result} ${isWinner ? styles.victory : styles.defeat}`}>
        {isWinner ? 'VICTORY!' : 'DEFEAT'}
      </h1>
      <p className={styles.subtitle}>
        {isWinner ? 'You destroyed the enemy fleet!' : `${state.winnerName} destroyed your fleet.`}
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.totalShots}</span>
          <span className={styles.statLabel}>Shots Fired</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.hits}</span>
          <span className={styles.statLabel}>Hits</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{accuracy}%</span>
          <span className={styles.statLabel}>Accuracy</span>
        </div>
      </div>

      <div className={styles.boards}>
        <Grid cells={myBoardCells} label="Your Board" placements={state.myPlacements} />
        <Grid cells={oppBoardCells} label="Enemy Board" placements={state.opponentPlacements} />
      </div>

      <div className={styles.actions}>
        {opponentWantsPlayAgain && !requestedPlayAgain && (
          <p className={styles.hint}>Opponent wants to play again!</p>
        )}
        {requestedPlayAgain && !opponentWantsPlayAgain && (
          <p className={styles.hint}>Waiting for opponent...</p>
        )}
        <Button onClick={handlePlayAgain} disabled={requestedPlayAgain} size="lg">
          Play Again
        </Button>
        <Button variant="secondary" onClick={handleLeave} size="lg">
          Leave
        </Button>
      </div>
    </div>
  );
}
