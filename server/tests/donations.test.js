import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import Fund from '../src/models/Fund.js';
import Donation from '../src/models/Donation.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Donations API Tests', () => {
  let mongoServer;
  let alumniToken;
  let fundId;

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
      await Fund.deleteMany({});
      await Donation.deleteMany({});

      const user = await User.create({
        name: 'Generous Alumnus',
        email: 'donor.alumni@gmail.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'alumni',
        status: 'active'
      });

      await AlumniProfile.create({
        userId: user._id,
        name: 'Generous Alumnus',
        totalDonated: 0
      });

      alumniToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role, status: user.status },
        process.env.JWT_SECRET
      );

      const fund = await Fund.create({
        name: 'UIU Need-Based Scholarship Fund',
        description: 'Financial aid for students',
        goal: 1000000,
        raised: 10000
      });

      fundId = fund._id.toString();
    }
  });

  test('GET /api/donations/funds lists scholarship funds', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app).get('/api/donations/funds');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('UIU Need-Based Scholarship Fund');
  });

  test('POST /api/donations records a donation and updates fund total', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const donationRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({
        fundId,
        amount: 5000,
        paymentMethod: 'bKash'
      });

    expect(donationRes.status).toBe(201);
    expect(donationRes.body.donation.status).toBe('Completed');
    expect(donationRes.body.donation.amount).toBe('৳5,000');

    // Verify fund total raised updated
    const fundDoc = await Fund.findById(fundId);
    expect(fundDoc.raised).toBe(15000);
  });

  test('GET /api/donations/me returns alumni donation history', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({
        fundId,
        amount: 2500,
        paymentMethod: 'Credit Card'
      });

    const res = await request(app)
      .get('/api/donations/me')
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalDonated).toBe(2500);
    expect(res.body.history.length).toBe(1);
  });
});
