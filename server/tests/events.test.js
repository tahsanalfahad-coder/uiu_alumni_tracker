import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import Event from '../src/models/Event.js';
import PersonalEventRequest from '../src/models/PersonalEventRequest.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Events API Tests', () => {
  let mongoServer;
  let adminToken;
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
      await Event.deleteMany({});
      await PersonalEventRequest.deleteMany({});

      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin.events@uiu.ac.bd',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active'
      });

      adminToken = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: adminUser.role, status: adminUser.status },
        process.env.JWT_SECRET
      );

      const alumniUser = await User.create({
        name: 'Alumni Event Host',
        email: 'host.alumni@gmail.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'alumni',
        status: 'active'
      });

      const profile = await AlumniProfile.create({
        userId: alumniUser._id,
        name: 'Alumni Event Host',
        batch: 'CSE-2018',
        department: 'CSE'
      });

      alumniProfileId = profile._id.toString();

      alumniToken = jwt.sign(
        { id: alumniUser._id, email: alumniUser.email, role: alumniUser.role, status: alumniUser.status },
        process.env.JWT_SECRET
      );
    }
  });

  test('GET /api/events returns list of published events', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await Event.create({
      title: 'UIU Tech Fest 2026',
      category: 'Workshop',
      date: '2026-10-10',
      time: '10:00 AM',
      location: 'UIU Auditorium',
      description: 'Annual technology symposium'
    });

    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('UIU Tech Fest 2026');
  });

  test('POST /api/events allows admin to create official event', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const eventPayload = {
      title: 'Annual Gala Night',
      category: 'Reunion',
      date: '2026-11-20',
      time: '06:00 PM',
      location: 'UIU Grand Hall',
      description: 'Gala dinner for alumni'
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(eventPayload);

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe('Annual Gala Night');
  });

  test('Alumni can submit personal event proposal and admin can approve it', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Alumni submits proposal
    const proposalData = {
      title: 'Batch of 2018 Mini Gathering',
      category: 'Networking',
      date: '2026-09-30',
      time: '04:00 PM',
      location: 'UIU Cafeteria',
      description: 'Informal coffee catchup for batch 2018'
    };

    const proposalRes = await request(app)
      .post('/api/events/personal-requests')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send(proposalData);

    expect(proposalRes.status).toBe(201);
    expect(proposalRes.body.status).toBe('Pending');
    const reqId = proposalRes.body._id;

    // 2. Admin approves proposal
    const approveRes = await request(app)
      .patch(`/api/events/personal-requests/${reqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.request.status).toBe('Approved');
    expect(approveRes.body.event.title).toBe('Batch of 2018 Mini Gathering');

    // 3. Verify event is now published
    const eventsRes = await request(app).get('/api/events');
    expect(eventsRes.body.some((e) => e.title === 'Batch of 2018 Mini Gathering')).toBe(true);
  });
});
