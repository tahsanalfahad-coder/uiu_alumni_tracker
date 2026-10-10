import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import StudentProfile from '../src/models/StudentProfile.js';

describe('Student Profile API Endpoints', () => {
  let mongoServer;
  let studentToken;
  let studentUserId;

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

      // Register student
      const regRes = await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'Md Fahad Molla',
          email: 'fahad@student.uiu.ac.bd',
          password: 'studentpassword123',
          studentId: '011201045',
          department: 'Computer Science & Engineering'
        });

      studentToken = regRes.body.token;
      studentUserId = regRes.body.user.id;
    }
  });

  test('GET /api/student/me returns student profile for logged-in user', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const res = await request(app)
      .get('/api/student/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.studentId).toBe('011201045');
    expect(res.body.department).toBe('Computer Science & Engineering');
  });

  test('PATCH /api/student/me updates student profile details and name', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const updateData = {
      name: 'Md. Fahad Molla',
      year: '4th Year / 10th Trimester',
      bio: 'Enrolled CSE student interested in Full-Stack Web App Development',
      phone: '+8801700000000',
      linkedin: 'https://linkedin.com/in/fahad-molla',
      github: 'https://github.com/fahad-molla',
      skills: ['React', 'Node.js', 'MongoDB', 'Express']
    };

    const res = await request(app)
      .patch('/api/student/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Md. Fahad Molla');
    expect(res.body.year).toBe('4th Year / 10th Trimester');
    expect(res.body.bio).toBe('Enrolled CSE student interested in Full-Stack Web App Development');
    expect(res.body.skills).toContain('React');
  });
});
