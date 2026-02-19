import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@battleships/shared';
import { RoomManager } from './RoomManager.js';
import { randomUUID } from 'crypto';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const roomManager = new RoomManager();

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('createRoom', ({ playerName }, callback) => {
      const playerId = randomUUID();
      const room = roomManager.createRoom(playerId, playerName);

      room.setSocketId(playerId, socket.id);
      room.setOnRoomClosed(() => roomManager.removeRoom(room.code));

      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;
      socket.data.playerName = playerName;
      socket.join(room.code);

      callback({ success: true, roomCode: room.code, playerId });
    });

    socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      if (room.isFull()) {
        callback({ success: false, error: 'Room is full' });
        return;
      }
      if (room.phase !== 'LOBBY') {
        callback({ success: false, error: 'Game already in progress' });
        return;
      }

      const playerId = randomUUID();
      room.addPlayer(playerId, socket.id, playerName);

      socket.data.playerId = playerId;
      socket.data.roomCode = roomCode;
      socket.data.playerName = playerName;
      socket.join(roomCode);

      // Notify existing players
      socket.to(roomCode).emit('playerJoined', {
        player: { id: playerId, name: playerName, ready: false },
      });

      callback({ success: true, playerId, players: room.getPlayerInfos() });
    });

    socket.on('playerReady', ({ ready }) => {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) return;

      const room = roomManager.getRoom(roomCode);
      if (!room || room.phase !== 'LOBBY') return;

      room.setReady(playerId, ready);

      socket.to(roomCode).emit('playerReadyChanged', { playerId, ready });

      if (room.allReady()) {
        room.startPlacement();
        io.to(roomCode).emit('phaseChanged', { phase: 'PLACEMENT' });
      }
    });

    socket.on('placeShips', ({ placements }, callback) => {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const error = room.placeShips(playerId, placements);
      if (error) {
        callback({ success: false, error });
        return;
      }

      callback({ success: true });

      // Notify opponent
      const opponentId = room.getOpponentId(playerId);
      if (opponentId) {
        const oppSocketId = room.getSocketId(opponentId);
        if (oppSocketId) {
          io.to(oppSocketId).emit('opponentPlacedShips');
        }
      }

      // Check if both placed
      if (room.allShipsPlaced()) {
        room.startBattle();
        io.to(roomCode).emit('phaseChanged', { phase: 'BATTLE', currentTurn: room.currentTurn });
      }
    });

    socket.on('fireShot', ({ coordinate }, callback) => {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const { error, result, gameOver } = room.fireShot(playerId, coordinate);
      if (error || !result) {
        callback({ success: false, error: error ?? 'Unknown error' });
        return;
      }

      callback({ success: true, result, gameOver: gameOver ?? false });

      // Broadcast to opponent
      socket.to(roomCode).emit('shotFired', { playerId, result });

      if (gameOver) {
        const winnerName = socket.data.playerName ?? 'Unknown';
        // Send each player their opponent's ship placements
        for (const [pid] of room.players) {
          const opponentId = room.getOpponentId(pid);
          const opponentShips = opponentId ? room.getPlayerPlacements(opponentId) : [];
          const sid = room.getSocketId(pid);
          if (sid) {
            io.to(sid).emit('gameOver', { winnerId: playerId, winnerName, opponentShips });
          }
        }
      }
    });

    socket.on('playAgain', () => {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) return;

      const room = roomManager.getRoom(roomCode);
      if (!room || room.phase !== 'FINISHED') return;

      socket.to(roomCode).emit('playAgainRequested', { playerId });

      if (room.requestPlayAgain(playerId)) {
        room.resetForNewGame();
        io.to(roomCode).emit('gameRestarted');
      }
    });

    socket.on('leaveRoom', () => {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) return;

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      socket.leave(roomCode);
      room.removePlayer(playerId);

      socket.to(roomCode).emit('playerLeft', { playerId });

      if (room.getPlayerCount() === 0) {
        roomManager.removeRoom(roomCode);
      } else if (room.phase !== 'LOBBY') {
        // If game was in progress, the other player wins by forfeit
        const remainingId = room.getOpponentId(playerId) ?? Array.from(room.players.keys())[0];
        if (remainingId) {
          const remaining = room.players.get(remainingId);
          room.phase = 'FINISHED';
          room.winner = remainingId;
          // Send opponent ships to remaining player
          const leaverShips = room.getPlayerPlacements(playerId);
          const remainingSid = room.getSocketId(remainingId);
          if (remainingSid) {
            io.to(remainingSid).emit('gameOver', {
              winnerId: remainingId,
              winnerName: remaining?.name ?? 'Unknown',
              opponentShips: leaverShips,
            });
          }
        }
      }

      socket.data.playerId = undefined as any;
      socket.data.roomCode = undefined as any;
    });

    socket.on('reconnect', ({ roomCode, playerId }, callback) => {
      const room = roomManager.getRoom(roomCode);
      if (!room || !room.hasPlayer(playerId)) {
        callback({ success: false, error: 'Room or player not found' });
        return;
      }

      const success = room.handleReconnect(playerId, socket.id);
      if (!success) {
        callback({ success: false, error: 'Reconnection failed' });
        return;
      }

      socket.data.playerId = playerId;
      socket.data.roomCode = roomCode;
      socket.join(roomCode);

      socket.to(roomCode).emit('opponentReconnected');
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      const { playerId, roomCode } = socket.data;
      console.log(`Client disconnected: ${socket.id} (player: ${playerId})`);

      if (!playerId || !roomCode) return;

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      room.handleDisconnect(playerId, () => {
        // Timeout reached - forfeit
        const opponentId = room.getOpponentId(playerId);
        if (opponentId && room.phase !== 'FINISHED' && room.phase !== 'LOBBY') {
          const opponent = room.players.get(opponentId);
          room.phase = 'FINISHED';
          room.winner = opponentId;
          const disconnectedShips = room.getPlayerPlacements(playerId);
          const oppSid = room.getSocketId(opponentId);
          if (oppSid) {
            io.to(oppSid).emit('gameOver', {
              winnerId: opponentId,
              winnerName: opponent?.name ?? 'Unknown',
              opponentShips: disconnectedShips,
            });
          }
        }
        room.removePlayer(playerId);
        if (room.getPlayerCount() === 0) {
          roomManager.removeRoom(roomCode);
        }
      });

      // Notify opponent of disconnection
      const opponentId = room.getOpponentId(playerId);
      if (opponentId && room.phase !== 'LOBBY') {
        const oppSocketId = room.getSocketId(opponentId);
        if (oppSocketId) {
          io.to(oppSocketId).emit('opponentDisconnected', { timeout: 30000 });
        }
      }

      // In lobby, just remove and notify
      if (room.phase === 'LOBBY') {
        // handleDisconnect already removes in lobby
        socket.to(roomCode).emit('playerLeft', { playerId });
        if (room.getPlayerCount() === 0) {
          roomManager.removeRoom(roomCode);
        }
      }
    });
  });
}
