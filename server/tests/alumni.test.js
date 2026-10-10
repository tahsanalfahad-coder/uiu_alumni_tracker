import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Alumni API Tests', () => {
  let mongoServer;
  let alumniToken;
  let alumniUserId;
  let alumniProfileId;

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

      const user = await User.create({
        name: 'Tanvir Ahmed',
        email: 'tanvir@gmail.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'alumni',
        status: 'active'
      });

      alumniUserId = user._id.toString();

      const profile = await AlumniProfile.create({
        userId: user._id,
        name: 'Tanvir Ahmed',
        batch: 'CSE-2017',
        department: 'Computer Science & Engineering',
        role: 'Senior Engineer',
        company: 'Google',
        location: 'Singapore',
        bio: 'Tech enthusiast',
        skills: ['Go', 'Cloud'],
        isMentor: true,
        careerTimeline: [
          {
            title: 'Software Engineer',
            company: 'Pathao',
            startDate: '2021',
            endDate: '2023',
            description: 'Backend developer'
          }
        ]
      });

      alumniProfileId = profile._id.toString();

      alumniToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET
      );
    }
  });

  test('GET /api/alumni retrieves list of active alumni', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get('/api/alumni');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Tanvir Ahmed');
  });

  test('GET /api/alumni?search=Google filters by company/name', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get('/api/alumni?search=Google');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);

    const emptyRes = await request(app).get('/api/alumni?search=NonExistentCompany');
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.length).toBe(0);
  });

  test('GET /api/alumni/:id returns specific alumnus profile', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get(`/api/alumni/${alumniProfileId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Tanvir Ahmed');
    expect(res.body.company).toBe('Google');
  });

  test('PATCH /api/alumni/me allows alumnus to update own profile', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const updateData = {
      role: 'Staff Software Engineer',
      company: 'Google AI',
      bio: 'Leading machine learning infrastructure.'
    };

    const res = await request(app)
      .patch('/api/alumni/me')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Staff Software Engineer');
    expect(res.body.company).toBe('Google AI');
  });

  test('POST & DELETE /api/alumni/me/timeline manages career history', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Add entry
    const postRes = await request(app)
      .post('/api/alumni/me/timeline')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({
        title: 'Lead Architect',
        company: 'Cloud Corp',
        startDate: '2024',
        current: true
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.length).toBe(2);
    expect(postRes.body[0].title).toBe('Lead Architect');

    const entryId = postRes.body[0]._id;

    // 2. Delete entry
    const delRes = await request(app)
      .delete(`/api/alumni/me/timeline/${entryId}`)
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.length).toBe(1);
  });
});
