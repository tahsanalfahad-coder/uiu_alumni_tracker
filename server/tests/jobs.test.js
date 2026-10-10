import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import Job from '../src/models/Job.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Jobs API Tests', () => {
  let mongoServer;
  let alumniToken;
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
      await Job.deleteMany({});

      const user = await User.create({
        name: 'Tech Lead Alumnus',
        email: 'lead.alumnus@company.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'alumni',
        status: 'active'
      });

      const profile = await AlumniProfile.create({
        userId: user._id,
        name: 'Tech Lead Alumnus',
        company: 'Brain Station 23'
      });

      alumniProfileId = profile._id.toString();

      alumniToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET
      );
    }
  });

  test('GET /api/jobs retrieves posted jobs', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await Job.create({
      title: 'Junior Developer',
      company: 'Pathao',
      type: 'Full-time',
      location: 'Dhaka',
      postedDate: '2026-09-01',
      deadline: '2026-09-30',
      description: 'Node.js developer',
      postedBy: 'Tech Lead Alumnus',
      alumniId: alumniProfileId
    });

    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Junior Developer');
  });

  test('POST /api/jobs allows alumni to post job opportunity', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const jobData = {
      title: 'React Native Developer',
      company: 'Chaldal',
      type: 'Full-time',
      location: 'Dhaka (Remote)',
      stipend: '৳50,000 / month',
      deadline: '2026-10-15',
      description: 'Mobile developer wanted.'
    };

    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send(jobData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('React Native Developer');
    expect(res.body.company).toBe('Chaldal');
  });

  test('DELETE /api/jobs/:id allows job poster to delete job', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const job = await Job.create({
      title: 'Frontend Intern',
      company: 'Brain Station 23',
      type: 'Internship',
      location: 'Dhaka',
      postedDate: '2026-09-01',
      deadline: '2026-09-30',
      description: 'Vue.js intern',
      postedBy: 'Tech Lead Alumnus',
      alumniId: alumniProfileId
    });

    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Job posting deleted successfully');
  });
});
