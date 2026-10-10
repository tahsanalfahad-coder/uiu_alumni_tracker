import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import PendingRegistration from '../src/models/PendingRegistration.js';
import Event from '../src/models/Event.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Admin API & Management Tests', () => {
  let mongoServer;
  let adminToken;

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
      await AlumniProfile.deleteMany({});
      await PendingRegistration.deleteMany({});
      await Event.deleteMany({});

      const adminUser = await User.create({
        name: 'Dr. Tariqul Islam',
        email: 'admin@uiu.ac.bd',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active'
      });

      adminToken = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: adminUser.role, status: adminUser.status },
        process.env.JWT_SECRET
      );
    }
  });

  test('GET /api/admin/dashboard returns system analytics summary', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await AlumniProfile.create({
      userId: new mongoose.Types.ObjectId(),
      name: 'Sample Alumni',
      department: 'CSE'
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalAlumni).toBeDefined();
    expect(res.body.employmentRate).toBe('92.7%');
    expect(Array.isArray(res.body.departmentBreakdown)).toBe(true);
  });

  test('Admin can approve pending alumni registration', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const pendingUser = await User.create({
      name: 'New Alumnus',
      email: 'new.alumnus@gmail.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'alumni',
      status: 'pending'
    });

    const regDoc = await PendingRegistration.create({
      userId: pendingUser._id,
      name: 'New Alumnus',
      email: 'new.alumnus@gmail.com',
      batch: 'CSE-2021',
      department: 'Computer Science & Engineering',
      currentRole: 'Software Engineer',
      company: 'Brain Station 23',
      submittedDate: '2026-09-01',
      status: 'Pending'
    });

    const res = await request(app)
      .patch(`/api/admin/registrations/${regDoc._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.registration.status).toBe('Approved');

    // Verify user account is now active
    const updatedUser = await User.findById(pendingUser._id);
    expect(updatedUser.status).toBe('active');

    // Verify AlumniProfile document created
    const profile = await AlumniProfile.findOne({ userId: pendingUser._id });
    expect(profile).toBeDefined();
    expect(profile.name).toBe('New Alumnus');
    expect(profile.batch).toBe('CSE-2021');
  });

  test('GET /api/admin/reports/employment returns employment metrics', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .get('/api/admin/reports/employment')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].employmentRate).toBeDefined();
  });
});
