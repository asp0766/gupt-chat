import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { registerSocketHandlers } from './controllers/socketController.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.clientOrigin, methods: ['GET', 'POST'], credentials: true },
  maxHttpBufferSize: 100_000,
  transports: ['websocket', 'polling']
});
registerSocketHandlers(io);

async function start() {
  // The database connection completes before the public listener accepts requests.
  await connectDatabase();
  httpServer.listen(env.port, () => console.log(`Gupt Chat API listening on port ${env.port}`));
}

start().catch(error => { console.error('Startup failed:', error); process.exit(1); });
