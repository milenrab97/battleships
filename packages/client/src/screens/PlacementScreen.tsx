import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame, type BoardCell } from '../context/GameContext';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { usePlacement } from '../hooks/usePlacement';
import { Grid } from '../components/Board/Grid';
import { ShipTray } from '../components/ShipTray';
import { Button } from '../components/common/Button';
import { GRID_SIZE, SHIPS } from '@battleships/shared';
import type { CellState, ShipType } from '@battleships/shared';
import styles from './PlacementScreen.module.css';

export function PlacementScreen() {
  const { socket } = useSocket();
  const { playerId } = usePlayer();
  const { state, dispatch } = useGame();
  const [submitted, setSubmitted] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [error, setError] = useState('');

  const {
    placements,
    selectedShip,
    setSelectedShip,
    orientation,
    toggleOrientation,
    boardCells,
    placedShips,
    placeShip,
    resetPlacements,
    setHoverCell,
    allPlaced,
  } = usePlacement();

  useSocketEvent('opponentPlacedShips', useCallback(() => {
    setOpponentReady(true);
  }, []));

  useSocketEvent('phaseChanged', useCallback((data) => {
    dispatch({ type: 'SET_PHASE', phase: data.phase, currentTurn: data.currentTurn });
  }, [dispatch]));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') {
        toggleOrientation();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOrientation]);

  function handleConfirm() {
    if (!allPlaced || submitted) return;
    setError('');

    socket.emit('placeShips', { placements }, (res) => {
      if (res.success) {
        setSubmitted(true);
        // Build the board for game context
        const board: BoardCell[][] = Array.from({ length: GRID_SIZE }, () =>
          Array.from({ length: GRID_SIZE }, () => ({ state: 'empty' as CellState }))
        );
        for (const p of placements) {
          const size = SHIPS[p.shipType].size;
          for (let i = 0; i < size; i++) {
            const row = p.start.row + (p.orientation === 'vertical' ? i : 0);
            const col = p.start.col + (p.orientation === 'horizontal' ? i : 0);
            board[row][col] = { state: 'ship', shipType: p.shipType as ShipType };
          }
        }
        dispatch({ type: 'SET_MY_BOARD', board });
        dispatch({ type: 'SET_MY_PLACEMENTS', placements });
      } else {
        setError(res.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Ships Placed!</h2>
        <p className={styles.waitingText}>
          {opponentReady ? 'Starting battle...' : 'Waiting for opponent to place ships...'}
        </p>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Place Your Ships</h2>
      <p className={styles.hint}>Select a ship, then click the grid to place. Press <kbd>R</kbd> to rotate.</p>

      <div className={styles.layout}>
        <ShipTray
          selectedShip={selectedShip}
          placedShips={placedShips}
          onSelect={setSelectedShip}
        />

        <Grid
          cells={boardCells}
          onCellClick={(r, c) => placeShip(r, c)}
          onCellEnter={(r, c) => setHoverCell({ row: r, col: c })}
          onCellLeave={() => setHoverCell(null)}
          clickable={!!selectedShip}
        />

        <div className={styles.controls}>
          <p className={styles.orientationLabel}>
            Orientation: <strong>{orientation}</strong>
          </p>
          <Button variant="secondary" onClick={toggleOrientation} size="sm">
            Rotate (R)
          </Button>
          <Button variant="secondary" onClick={resetPlacements} size="sm">
            Reset All
          </Button>
          <Button onClick={handleConfirm} disabled={!allPlaced} size="lg">
            Confirm Placement
          </Button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
