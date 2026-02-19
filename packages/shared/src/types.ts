export type Coordinate = { row: number; col: number };

export type Orientation = 'horizontal' | 'vertical';

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export type ShipPlacement = {
  shipType: ShipType;
  start: Coordinate;
  orientation: Orientation;
};

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type GamePhase = 'LOBBY' | 'PLACEMENT' | 'BATTLE' | 'FINISHED';

export type PlayerInfo = {
  id: string;
  name: string;
  ready: boolean;
};

export type ShotResult = {
  coordinate: Coordinate;
  result: 'hit' | 'miss' | 'sunk';
  sunkShip?: ShipType;
  sunkShipPlacement?: ShipPlacement;
};

export type GameState = {
  phase: GamePhase;
  players: PlayerInfo[];
  currentTurn?: string;
  winner?: string;
};
