import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@battleships/shared';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socket: TypedSocket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
