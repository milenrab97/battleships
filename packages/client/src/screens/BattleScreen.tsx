import { useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { Grid } from '../components/Board/Grid';
import { ShipStatusPanel } from '../components/ShipStatusPanel';
import { GameLog } from '../components/GameLog';
import styles from './BattleScreen.module.css';

export function BattleScreen() {
  const { socket } = useSocket();
  const { playerId } = usePlayer();
  const { state, dispatch } = useGame();
  const [notification, setNotification] = useState<string | null>(null);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);

  const isMyTurn = state.currentTurn === playerId;
  const opponent = state.players.find(p => p.id !== playerId);

  useSocketEvent('shotFired', useCallback((data) => {
    const isMyShot = data.playerId === playerId;
    dispatch({ type: 'RECORD_SHOT', playerId: data.playerId, result: data.result, isMyShot });

    if (data.result.sunkShip) {
      const who = isMyShot ? 'You sunk' : 'Enemy sunk your';
      const shipName = data.result.sunkShip;
      setNotification(`${who} ${shipName}!`);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [playerId, dispatch]));

  useSocketEvent('gameOver', useCallback((data) => {
    dispatch({ type: 'SET_GAME_OVER', winnerId: data.winnerId, winnerName: data.winnerName, opponentShips: data.opponentShips });
  }, [dispatch]));

  useSocketEvent('opponentDisconnected', useCallback((data) => {
    let remaining = Math.ceil(data.timeout / 1000);
    setDisconnectCountdown(remaining);
    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        setDisconnectCountdown(null);
      } else {
        setDisconnectCountdown(remaining);
      }
    }, 1000);
  }, []));

  useSocketEvent('opponentReconnected', useCallback(() => {
    setDisconnectCountdown(null);
  }, []));

  function handleFire(row: number, col: number) {
    if (!isMyTurn) return;
    const cell = state.opponentBoard[row]?.[col];
    if (cell && cell.state !== 'empty') return;

    new Audio('/assets/sounds/cannon-fires.mp3').play().catch(() => {});

    socket.emit('fireShot', { coordinate: { row, col } }, (res) => {
      if (res.success) {
        dispatch({
          type: 'RECORD_SHOT',
          playerId,
          result: res.result,
          isMyShot: true,
        });

        if (res.result.sunkShip) {
          setNotification(`You sunk their ${res.result.sunkShip}!`);
          setTimeout(() => setNotification(null), 3000);
        }
      }
    });
  }

  const myBoardCells = state.myBoard.map(row =>
    row.map(cell => ({ state: cell.state }))
  );
  const oppBoardCells = state.opponentBoard.map(row =>
    row.map(cell => ({ state: cell.state }))
  );

  return (
    <div className={styles.container}>
      <div className={styles.turnBanner}>
        <span className={`${styles.turnText} ${isMyTurn ? styles.yourTurn : styles.enemyTurn}`}>
          {isMyTurn ? 'YOUR TURN' : `${opponent?.name ?? 'Opponent'}'s Turn`}
        </span>
      </div>

      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      {disconnectCountdown !== null && (
        <div className={styles.disconnectOverlay}>
          <p>Opponent disconnected</p>
          <p>Waiting for reconnection: {disconnectCountdown}s</p>
        </div>
      )}

      <div className={styles.battleArea}>
        <Grid
          cells={oppBoardCells}
          onCellClick={handleFire}
          clickable={isMyTurn}
          label="Enemy Waters"
          lastShot={state.lastShotOnOpponentBoard}
          placements={state.opponentPlacements}
        />
        <Grid
          cells={myBoardCells}
          label="Your Waters"
          lastShot={state.lastShotOnMyBoard}
          placements={state.myPlacements}
        />
      </div>

      <div className={styles.infoSection}>
        <ShipStatusPanel label="Your Fleet" shipsStatus={state.myShipsStatus} />
        <ShipStatusPanel label="Enemy Fleet" shipsStatus={state.opponentShipsStatus} />
        <GameLog entries={state.shotLog} myId={playerId} />
      </div>
    </div>
  );
}
