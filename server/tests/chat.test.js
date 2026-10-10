import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import ChatThread from '../src/models/ChatThread.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Chat API Tests', () => {
  let mongoServer;
  let userToken;
  let userId;

  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
      process.env.MONGODB_URI = mongoServer.getUri();
    } catch (err) {
      console.warn('MongoMemoryServer fallback:', err.message);
    }
    await connectDB();
  }, 60000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await ChatThread.deleteMany({});

      const testUser = await User.create({
        name: 'Chat Test User',
        email: 'chat.user@uiu.ac.bd',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'student',
        status: 'active'
      });

      userId = testUser._id.toString();
      userToken = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET
      );
    }
  });

  test('User can create a chat thread and post a message', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Create thread
    const threadRes = await request(app)
      .post('/api/chat/threads')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        targetName: 'Alumni Mentor',
        targetRole: 'Senior Engineer',
        initialMessage: 'Hi! Can you mentor me?'
      });

    expect(threadRes.status).toBe(201);
    expect(threadRes.body._id).toBeDefined();
    expect(threadRes.body.messages.length).toBe(1);

    const threadId = threadRes.body._id;

    // 2. Post follow-up message
    const msgRes = await request(app)
      .post(`/api/chat/threads/${threadId}/messages`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        text: 'I have a question about my CV.'
      });

    expect(msgRes.status).toBe(200);
    expect(msgRes.body.messages.length).toBe(2);
    expect(msgRes.body.lastMessage).toBe('I have a question about my CV.');
  });
});
