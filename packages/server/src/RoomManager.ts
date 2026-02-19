import { GameRoom } from './GameRoom.js';
import { ROOM_CODE_LENGTH } from '@battleships/shared';

export class RoomManager {
  private rooms = new Map<string, GameRoom>();

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId: string, hostName: string): GameRoom {
    const code = this.generateCode();
    const room = new GameRoom(code, hostId, hostName);
    this.rooms.set(code, room);
    console.log(`Room created: ${code} by ${hostName}`);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code);
  }

  removeRoom(code: string): void {
    this.rooms.delete(code);
    console.log(`Room removed: ${code}`);
  }

  findRoomByPlayerId(playerId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(playerId)) return room;
    }
    return undefined;
  }

  get size(): number {
    return this.rooms.size;
  }
}
