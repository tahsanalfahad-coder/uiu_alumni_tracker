import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { verifyToken } from './utils/jwt.js';
import { corsOriginCheck } from './config/cors.js';
import { getIdentityIds, isThreadParticipant } from './utils/access.js';
import ChatThread from './models/ChatThread.js';

const MAX_MESSAGE_LENGTH = 2000;

export function attachSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: { origin: corsOriginCheck, credentials: true }
  });

  app.set('io', io);

  // Handshake authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Loads a thread and confirms the socket's user belongs to it.
  const loadThreadForUser = async (socket, threadId) => {
    if (!mongoose.isValidObjectId(threadId)) return null;
    const thread = await ChatThread.findById(threadId);
    if (!thread) return null;
    const identityIds = await getIdentityIds(socket.user.id);
    return isThreadParticipant(thread, identityIds) ? thread : null;
  };

  io.on('connection', (socket) => {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);

    socket.on('join_thread', async (threadId) => {
      try {
        const thread = await loadThreadForUser(socket, threadId);
        if (!thread) {
          socket.emit('chat_error', { code: 'FORBIDDEN', threadId });
          return;
        }
        socket.join(`thread:${threadId}`);
      } catch (err) {
        console.error('[Socket join_thread error]:', err.message);
      }
    });

    socket.on('send_message', async (payload) => {
      try {
        const { threadId, text } = payload || {};
        if (typeof text !== 'string' || !text.trim() || text.length > MAX_MESSAGE_LENGTH) return;

        const thread = await loadThreadForUser(socket, threadId);
        if (!thread) {
          socket.emit('chat_error', { code: 'FORBIDDEN', threadId });
          return;
        }

        const newMessage = {
          sender: socket.user.id,
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        thread.messages.push(newMessage);
        thread.lastMessage = newMessage.text;
        thread.lastMessageAt = 'Just now';
        await thread.save();

        io.to(`thread:${threadId}`).emit('new_message', { threadId, message: newMessage, thread });

        (thread.participantIds || []).forEach((pId) => {
          io.to(`user:${pId.toString()}`).emit('new_message', { threadId, message: newMessage, thread });
        });
      } catch (err) {
        console.error('[Socket send_message error]:', err.message);
      }
    });
  });

  return io;
}
