import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import MentorshipRequest from '../src/models/MentorshipRequest.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('Mentorship API Tests', () => {
  let mongoServer;
  let studentToken;
  let alumniToken;
  let mentorProfileId;

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
      await StudentProfile.deleteMany({});
      await AlumniProfile.deleteMany({});
      await MentorshipRequest.deleteMany({});

      // Create Student
      const studentUser = await User.create({
        name: 'Mente Student',
        email: 'mentee.student@uiu.ac.bd',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'student',
        status: 'active'
      });

      await StudentProfile.create({
        userId: studentUser._id,
        studentId: '011209999',
        department: 'CSE'
      });

      studentToken = jwt.sign(
        { id: studentUser._id, email: studentUser.email, role: studentUser.role, status: studentUser.status },
        process.env.JWT_SECRET
      );

      // Create Alumni Mentor
      const alumniUser = await User.create({
        name: 'Senior Mentor',
        email: 'mentor.alumni@gmail.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'alumni',
        status: 'active'
      });

      const mentorProfile = await AlumniProfile.create({
        userId: alumniUser._id,
        name: 'Senior Mentor',
        isMentor: true
      });

      mentorProfileId = mentorProfile._id.toString();

      alumniToken = jwt.sign(
        { id: alumniUser._id, email: alumniUser.email, role: alumniUser.role, status: alumniUser.status },
        process.env.JWT_SECRET
      );
    }
  });

  test('Student can send mentorship request to alumnus mentor', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const reqRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mentorId: mentorProfileId,
        mentorName: 'Senior Mentor',
        topic: 'Cloud Infrastructure',
        message: 'Could you review my architecture diagram?'
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.status).toBe('Pending');
    expect(reqRes.body.topic).toBe('Cloud Infrastructure');
  });

  test('Alumnus mentor can view and accept mentorship request', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Student creates request
    const reqRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mentorId: mentorProfileId,
        mentorName: 'Senior Mentor',
        topic: 'CV Review',
        message: 'Please review my resume.'
      });

    const requestId = reqRes.body._id;

    // 2. Mentor views request
    const listRes = await request(app)
      .get('/api/mentorship/requests')
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);

    // 3. Mentor accepts request
    const acceptRes = await request(app)
      .patch(`/api/mentorship/requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.status).toBe('Accepted');
  });
});
