import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { validateEnv } from './config/env.js';
import { attachSocket } from './socket.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = attachSocket(server, app);

const start = async () => {
  try {
    validateEnv();
    await connectDB();
  } catch (err) {
    console.error(`[Startup Failed]: ${err.message}`);
    process.exit(1); // Do not run a half-working API without secrets or a database.
  }

  server.listen(PORT, () => {
    console.log(`[UIU Alumni Backend + Socket.IO Server Running]: http://localhost:${PORT}`);
  });
};

start();

export { app, server, io };
