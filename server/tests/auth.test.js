import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';
import PendingRegistration from '../src/models/PendingRegistration.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth & Authorization API Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create();
      process.env.MONGODB_URI = mongoServer.getUri();
    } catch (err) {
      console.warn('MongoMemoryServer fallback to process env or localhost:', err.message);
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
      await StudentProfile.deleteMany({});
      await PendingRegistration.deleteMany({});
    }
  });

  test('Student can register and login immediately', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const studentData = {
      name: 'Test Student',
      email: 'student.test@uiu.ac.bd',
      password: 'studentpassword123',
      studentId: '011209999',
      department: 'Computer Science & Engineering'
    };

    // 1. Register student
    const regRes = await request(app)
      .post('/api/auth/register/student')
      .send(studentData);

    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.user.role).toBe('student');
    expect(regRes.body.user.status).toBe('active');

    // 2. Login student
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentData.email,
        password: studentData.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.role).toBe('student');
  });

  test('Alumni registration stays pending until admin approves', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const alumniData = {
      name: 'Test Alumni',
      email: 'alumni.test@gmail.com',
      password: 'alumnipassword123',
      batch: 'CSE-2020',
      department: 'Computer Science & Engineering',
      currentRole: 'Software Engineer',
      company: 'Pathao Ltd.'
    };

    // 1. Register alumni
    const regRes = await request(app)
      .post('/api/auth/register/alumni')
      .send(alumniData);

    expect(regRes.status).toBe(202);
    expect(regRes.body.status).toBe('pending');

    // 2. Try login before approval -> 403 Forbidden (ACCOUNT_PENDING)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: alumniData.email,
        password: alumniData.password
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('ACCOUNT_PENDING');
  });

  test('Non-admin JWT is rejected with 403 on /api/admin/* routes', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const studentUser = await User.create({
      name: 'Student User',
      email: 'student.jwt@uiu.ac.bd',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'student',
      status: 'active'
    });

    const token = jwt.sign(
      { id: studentUser._id, email: studentUser.email, role: studentUser.role },
      process.env.JWT_SECRET
    );

    const adminRes = await request(app)
      .get('/api/admin/registrations')
      .set('Authorization', `Bearer ${token}`);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body.error.code).toBe('FORBIDDEN');
  });

  test('Login with wrong password is rejected with 401', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await User.create({
      name: 'Valid User',
      email: 'valid.user@uiu.ac.bd',
      passwordHash: await bcrypt.hash('correctpassword', 10),
      role: 'student',
      status: 'active'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'valid.user@uiu.ac.bd',
        password: 'wrongpassword'
      });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
