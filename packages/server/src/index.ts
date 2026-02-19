import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@battleships/shared';
import { setupSocketHandlers } from './socketHandler.js';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
