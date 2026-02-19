import { SocketProvider } from './context/SocketContext';
import { PlayerProvider } from './context/PlayerContext';
import { GameProvider, useGame } from './context/GameContext';
import { ConnectionStatus } from './components/common/ConnectionStatus';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { PlacementScreen } from './screens/PlacementScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';

function ScreenRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'home':
      return <HomeScreen />;
    case 'lobby':
      return <LobbyScreen />;
    case 'placement':
      return <PlacementScreen />;
    case 'battle':
      return <BattleScreen />;
    case 'result':
      return <ResultScreen />;
  }
}

export default function App() {
  return (
    <SocketProvider>
      <PlayerProvider>
        <GameProvider>
          <div className="app">
            <ConnectionStatus />
            <ScreenRouter />
          </div>
        </GameProvider>
      </PlayerProvider>
    </SocketProvider>
  );
}
