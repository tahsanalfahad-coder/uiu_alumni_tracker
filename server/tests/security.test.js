// These tests need NO database. Model methods are stubbed, so the real route handlers,
// middleware and Socket.IO server run, but nothing talks to MongoDB.
import http from 'http';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as ioClient } from 'socket.io-client';

import app from '../src/app.js';
import { attachSocket } from '../src/socket.js';
import { signToken } from '../src/utils/jwt.js';
import { getJwtSecret, LEGACY_DEFAULT_SECRET } from '../src/config/env.js';
import { isOriginAllowed } from '../src/config/cors.js';
import { assertSafeForTests, redactUri } from '../src/config/db.js';
import { asString, escapeRegex } from '../src/utils/query.js';
import { isThreadParticipant, ownsMentorshipRequest, ownsJob } from '../src/utils/access.js';
import { createRateLimiter } from '../src/middleware/rateLimit.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

import ChatThread from '../src/models/ChatThread.js';
import MentorshipRequest from '../src/models/MentorshipRequest.js';
import AlumniProfile from '../src/models/AlumniProfile.js';
import StudentProfile from '../src/models/StudentProfile.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Fund from '../src/models/Fund.js';
import Donation from '../src/models/Donation.js';

const oid = () => new mongoose.Types.ObjectId().toString();
const tokenFor = (id, role) => signToken({ _id: id, email: `${role}@uiu.test`, role, status: 'active' });

// ---- stubbing helpers -------------------------------------------------------
const restorers = [];
const stub = (target, key, fn) => {
  const hadOwn = Object.prototype.hasOwnProperty.call(target, key);
  const original = target[key];
  target[key] = fn;
  restorers.push(() => (hadOwn ? (target[key] = original) : delete target[key]));
};
afterEach(() => {
  while (restorers.length) restorers.pop()();
});

// Mongoose-style chainable, awaitable query
const chain = (rows, calls = []) => {
  const c = {
    sort: () => c,
    limit: () => c,
    select: (arg) => (calls.push(arg), c),
    then: (res, rej) => Promise.resolve(rows).then(res, rej)
  };
  return c;
};

// Profiles keyed by userId, for the identity lookup used by access checks
const stubProfiles = ({ alumni = {}, student = {} } = {}) => {
  stub(AlumniProfile, 'findOne', async (q) => (alumni[q.userId] ? { _id: alumni[q.userId] } : null));
  stub(StudentProfile, 'findOne', async (q) => (student[q.userId] ? { _id: student[q.userId] } : null));
};

// =============================================================================
describe('Secrets and tokens', () => {
  test('server refuses a missing or legacy-default JWT secret outside tests', () => {
    const saved = { env: process.env.NODE_ENV, secret: process.env.JWT_SECRET };
    try {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
      process.env.JWT_SECRET = LEGACY_DEFAULT_SECRET;
      expect(() => getJwtSecret()).toThrow(/old public default/);
      process.env.JWT_SECRET = 'a-proper-random-secret-value-1234567890';
      expect(getJwtSecret()).toBe('a-proper-random-secret-value-1234567890');
    } finally {
      process.env.NODE_ENV = saved.env;
      process.env.JWT_SECRET = saved.secret;
    }
  });

  test('a token forged with the old README secret is rejected', async () => {
    const forged = jwt.sign({ id: oid(), role: 'admin' }, LEGACY_DEFAULT_SECRET);
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('an unsigned (alg=none) token is rejected', async () => {
    const none = jwt.sign({ id: oid(), role: 'admin' }, '', { algorithm: 'none' });
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${none}`);
    expect(res.status).toBe(401);
  });

  test('role guard still blocks a non-admin with a valid token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenFor(oid(), 'student')}`);
    expect(res.status).toBe(403);
  });
});

describe('CORS, headers and error handling', () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:5174';
  });

  test('allowlist is enforced', () => {
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed('https://evil.example')).toBe(false);
  });

  test('foreign origins get no CORS headers; allowed ones do', async () => {
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    const good = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(good.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('security headers are set and x-powered-by is hidden', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  test('malformed JSON returns 400, not 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  test('error handler maps Mongoose errors and hides internals in production', () => {
    const run = (err) => {
      let out = {};
      const res = {
        headersSent: false,
        status(c) { out.status = c; return this; },
        json(b) { out.body = b; return this; }
      };
      errorHandler(err, {}, res, () => {});
      return out;
    };
    expect(run(Object.assign(new Error('x'), { name: 'CastError' })).status).toBe(400);
    expect(run(Object.assign(new Error('dup'), { code: 11000 })).status).toBe(409);

    const saved = process.env.NODE_ENV;
    const spy = console.error;
    console.error = () => {};
    try {
      process.env.NODE_ENV = 'production';
      const out = run(new Error('mongodb://user:secret@host exploded'));
      expect(out.status).toBe(500);
      expect(out.body.error.message).toBe('Internal Server Error');
    } finally {
      process.env.NODE_ENV = saved;
      console.error = spy;
    }
  });
});

describe('Database safety', () => {
  test('tests refuse to touch a non-local database', () => {
    expect(() => assertSafeForTests('mongodb+srv://u:p@cluster0.example.mongodb.net/db')).toThrow(/non-local/);
    expect(() => assertSafeForTests('mongodb://u:p@cluster0.example.mongodb.net/db')).toThrow(/non-local/);
    expect(() => assertSafeForTests('mongodb://127.0.0.1:27017/db')).not.toThrow();
  });

  test('credentials are redacted from logged connection strings', () => {
    expect(redactUri('mongodb+srv://admin:hunter2@cluster0.example.net/db')).not.toContain('hunter2');
  });
});

describe('Query hardening and rate limiting', () => {
  test('non-string query values are ignored and regex input is escaped', () => {
    expect(asString({ $ne: 'x' })).toBeUndefined();
    expect(asString(['a'])).toBeUndefined();
    expect(asString('  CSE  ')).toBe('CSE');
    expect(escapeRegex('a.*b(c)')).toBe('a\\.\\*b\\(c\\)');
  });

  test('rate limiter returns 429 with Retry-After after the limit', async () => {
    const mini = express();
    mini.use(createRateLimiter({ windowMs: 1000, max: 3, enabled: true }));
    mini.get('/', (req, res) => res.json({ ok: true }));
    for (let i = 0; i < 3; i++) expect((await request(mini).get('/')).status).toBe(200);
    const blocked = await request(mini).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('Access helpers (pure logic)', () => {
  test('thread participation works by user id, profile id or creator', () => {
    const [a, b, c] = [oid(), oid(), oid()];
    const thread = { participantIds: [a, b], creatorId: a };
    expect(isThreadParticipant(thread, [a])).toBe(true);
    expect(isThreadParticipant(thread, [oid(), b])).toBe(true);
    expect(isThreadParticipant(thread, [c])).toBe(false);
  });

  test('mentorship and job ownership', () => {
    const profile = oid();
    expect(ownsMentorshipRequest({ mentorId: profile }, [oid(), profile])).toBe(true);
    expect(ownsMentorshipRequest({ mentorId: profile }, [oid()])).toBe(false);
    expect(ownsJob({ alumniId: profile }, [profile])).toBe(true);
    expect(ownsJob({ alumniId: profile }, [])).toBe(false);
  });
});

// =============================================================================
describe('Chat REST authorization (stubbed models)', () => {
  const alice = oid();
  const bob = oid();
  const mallory = oid();
  const threadId = oid();

  const makeThread = () => {
    const t = {
      _id: threadId,
      participantIds: [alice, bob],
      creatorId: alice,
      participantName: 'Bob',
      messages: [],
      saved: 0,
      toObject() { return { ...this }; },
      async save() { this.saved += 1; }
    };
    return t;
  };

  test('an outsider cannot post into someone else\'s thread', async () => {
    const thread = makeThread();
    stub(ChatThread, 'findById', async () => thread);
    stubProfiles();
    const res = await request(app)
      .post(`/api/chat/threads/${threadId}/messages`)
      .set('Authorization', `Bearer ${tokenFor(mallory, 'student')}`)
      .send({ text: 'let me in' });
    expect(res.status).toBe(403);
    expect(thread.messages).toHaveLength(0);
    expect(thread.saved).toBe(0);
  });

  test('a participant can post', async () => {
    const thread = makeThread();
    stub(ChatThread, 'findById', async () => thread);
    stubProfiles();
    const res = await request(app)
      .post(`/api/chat/threads/${threadId}/messages`)
      .set('Authorization', `Bearer ${tokenFor(alice, 'student')}`)
      .send({ text: 'hello Bob' });
    expect(res.status).toBe(200);
    expect(thread.messages).toHaveLength(1);
  });

  test('a participant referenced by profile id can post', async () => {
    const carolUser = oid();
    const carolProfile = oid();
    const thread = makeThread();
    thread.participantIds = [alice, carolProfile];
    stub(ChatThread, 'findById', async () => thread);
    stubProfiles({ alumni: { [carolUser]: carolProfile } });
    const res = await request(app)
      .post(`/api/chat/threads/${threadId}/messages`)
      .set('Authorization', `Bearer ${tokenFor(carolUser, 'alumni')}`)
      .send({ text: 'hi' });
    expect(res.status).toBe(200);
  });

  test('over-long and non-string messages are rejected', async () => {
    const thread = makeThread();
    stub(ChatThread, 'findById', async () => thread);
    stubProfiles();
    const auth = `Bearer ${tokenFor(alice, 'student')}`;
    const long = await request(app).post(`/api/chat/threads/${threadId}/messages`).set('Authorization', auth).send({ text: 'x'.repeat(2001) });
    const obj = await request(app).post(`/api/chat/threads/${threadId}/messages`).set('Authorization', auth).send({ text: { a: 1 } });
    expect(long.status).toBe(400);
    expect(obj.status).toBe(400);
  });

  test('an outsider cannot delete a thread', async () => {
    let deleted = false;
    stub(ChatThread, 'findById', async () => makeThread());
    stub(ChatThread, 'findByIdAndDelete', async () => { deleted = true; });
    stubProfiles();
    const res = await request(app)
      .delete(`/api/chat/threads/${threadId}`)
      .set('Authorization', `Bearer ${tokenFor(mallory, 'student')}`);
    expect(res.status).toBe(403);
    expect(deleted).toBe(false);
  });
});

describe('Mentorship ownership (stubbed models)', () => {
  const mentorUser = oid();
  const mentorProfile = oid();
  const otherUser = oid();
  const otherProfile = oid();

  const makeReq = () => ({
    mentorId: mentorProfile,
    status: 'Pending',
    async save() {}
  });

  test.each(['accept', 'decline'])('another alumnus cannot %s someone else\'s request', async (action) => {
    const doc = makeReq();
    stub(MentorshipRequest, 'findById', async () => doc);
    stubProfiles({ alumni: { [mentorUser]: mentorProfile, [otherUser]: otherProfile } });
    const res = await request(app)
      .patch(`/api/mentorship/requests/${oid()}/${action}`)
      .set('Authorization', `Bearer ${tokenFor(otherUser, 'alumni')}`);
    expect(res.status).toBe(403);
    expect(doc.status).toBe('Pending');
  });

  test('the addressed mentor can accept and decline', async () => {
    stubProfiles({ alumni: { [mentorUser]: mentorProfile } });
    const a = makeReq();
    stub(MentorshipRequest, 'findById', async () => a);
    const acc = await request(app)
      .patch(`/api/mentorship/requests/${oid()}/accept`)
      .set('Authorization', `Bearer ${tokenFor(mentorUser, 'alumni')}`);
    expect(acc.status).toBe(200);
    expect(a.status).toBe('Accepted');

    const d = makeReq();
    stub(MentorshipRequest, 'findById', async () => d);
    const dec = await request(app)
      .patch(`/api/mentorship/requests/${oid()}/decline`)
      .set('Authorization', `Bearer ${tokenFor(mentorUser, 'alumni')}`);
    expect(dec.status).toBe(200);
    expect(d.status).toBe('Declined');
  });
});

describe('Jobs ownership (stubbed models)', () => {
  const owner = oid();
  const ownerProfile = oid();
  const noProfileUser = oid();

  test('a user with no profile can no longer delete other people\'s jobs', async () => {
    let deleted = false;
    stub(Job, 'findById', async () => ({ alumniId: ownerProfile }));
    stub(Job, 'findByIdAndDelete', async () => { deleted = true; });
    stubProfiles({ alumni: { [owner]: ownerProfile } });
    const res = await request(app)
      .delete(`/api/jobs/${oid()}`)
      .set('Authorization', `Bearer ${tokenFor(noProfileUser, 'alumni')}`);
    expect(res.status).toBe(403);
    expect(deleted).toBe(false);
  });

  test('the poster can delete their job', async () => {
    stub(Job, 'findById', async () => ({ alumniId: ownerProfile }));
    stub(Job, 'findByIdAndDelete', async () => ({}));
    stubProfiles({ alumni: { [owner]: ownerProfile } });
    const res = await request(app)
      .delete(`/api/jobs/${oid()}`)
      .set('Authorization', `Bearer ${tokenFor(owner, 'alumni')}`);
    expect(res.status).toBe(200);
  });
});

describe('Alumni routes (stubbed models)', () => {
  test('GET /api/alumni/me requires auth (route order fix: not swallowed by /:id)', async () => {
    stub(AlumniProfile, 'findById', () => { throw new Error('/:id handler must not run for /me'); });
    const res = await request(app).get('/api/alumni/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/alumni/me returns the caller\'s own profile', async () => {
    const userId = oid();
    stub(AlumniProfile, 'findById', () => { throw new Error('/:id handler must not run for /me'); });
    stub(User, 'findById', () => ({ select: async () => ({ _id: userId, name: 'Me', email: 'me@x.io' }) }));
    stub(AlumniProfile, 'findOne', async () => ({ name: 'Me', email: 'me@x.io', company: 'Acme' }));
    const res = await request(app).get('/api/alumni/me').set('Authorization', `Bearer ${tokenFor(userId, 'alumni')}`);
    expect(res.status).toBe(200);
    expect(res.body.company).toBe('Acme');
  });

  test('public list hides email/userId; admins see everything', async () => {
    const calls = [];
    stub(AlumniProfile, 'find', () => chain([{ name: 'A' }], calls));
    const guest = await request(app).get('/api/alumni');
    expect(guest.status).toBe(200);
    expect(calls).toEqual(['-email -userId']);

    calls.length = 0;
    const admin = await request(app).get('/api/alumni').set('Authorization', `Bearer ${tokenFor(oid(), 'admin')}`);
    expect(admin.status).toBe(200);
    expect(calls).toEqual([]);
  });

  test('query operators are ignored and search is regex-escaped', async () => {
    let filter;
    stub(AlumniProfile, 'find', (f) => { filter = f; return chain([]); });
    await request(app).get('/api/alumni?batch[$ne]=x&department[$gt]=&search=a.*b');
    expect(filter.batch).toBeUndefined();
    expect(filter.department).toBeUndefined();
    expect(filter.$or[0].name.$regex).toBe('a\\.\\*b');
  });

  test('GET /api/alumni/:id with a malformed id is a clean 404', async () => {
    stub(AlumniProfile, 'findById', () => { throw new Error('should not query'); });
    const res = await request(app).get('/api/alumni/not-an-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/alumni/:id hides private fields for guests', async () => {
    const calls = [];
    stub(AlumniProfile, 'findById', () => chain({ name: 'A' }, calls));
    const res = await request(app).get(`/api/alumni/${oid()}`);
    expect(res.status).toBe(200);
    expect(calls).toEqual(['-email -userId']);
  });
});

describe('Donations (stubbed models)', () => {
  const userId = oid();
  const profileId = oid();
  const fundId = oid();
  let incs;

  beforeEach(() => {
    incs = [];
    stub(Fund, 'findById', async () => ({ _id: fundId, name: 'Scholarship' }));
    stub(AlumniProfile, 'findOne', async () => ({ _id: profileId }));
    stub(Donation, 'create', async (doc) => ({ _id: oid(), ...doc }));
    stub(Fund, 'updateOne', async (q, u) => incs.push(['fund', u]));
    stub(AlumniProfile, 'updateOne', async (q, u) => incs.push(['alumni', u]));
  });

  const donate = (amount) =>
    request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${tokenFor(userId, 'alumni')}`)
      .send({ fundId, amount });

  test('uses atomic $inc and a unique-looking transaction id', async () => {
    const res = await donate(5000);
    expect(res.status).toBe(201);
    expect(res.body.donation.txId).toMatch(/^TXN-[0-9A-F]{12}$/);
    expect(incs).toEqual([
      ['fund', { $inc: { raised: 5000 } }],
      ['alumni', { $inc: { totalDonated: 5000 } }]
    ]);
  });

  test.each([[0], [-5], [12.5], [99999999], ['abc']])('rejects invalid amount %p', async (amount) => {
    const res = await donate(amount);
    expect(res.status).toBe(400);
    expect(incs).toEqual([]);
  });
});

describe('Admin user creation validation', () => {
  test('rejects a weak password before touching the database', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(oid(), 'admin')}`)
      .send({ name: 'New Admin', email: 'new@uiu.ac.bd', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// =============================================================================
describe('Socket.IO chat authorization (real server, stubbed models)', () => {
  const alice = oid();
  const bob = oid();
  const mallory = oid();
  const threadId = oid();
  let server;
  let url;
  const clients = [];

  const connect = (token) =>
    new Promise((resolve, reject) => {
      const c = ioClient(url, { auth: token ? { token } : {}, transports: ['websocket'], reconnection: false });
      clients.push(c);
      c.on('connect', () => resolve(c));
      c.on('connect_error', reject);
    });
  const once = (c, evt, ms = 1500) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout waiting for ${evt}`)), ms);
      c.once(evt, (data) => { clearTimeout(t); resolve(data); });
    });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  beforeAll(async () => {
    server = http.createServer(app);
    attachSocket(server, app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    clients.forEach((c) => c.close());
    await new Promise((r) => server.close(r));
  });

  test('connections without a valid token are refused', async () => {
    await expect(connect(null)).rejects.toThrow(/No token/);
    await expect(connect(jwt.sign({ id: alice }, LEGACY_DEFAULT_SECRET))).rejects.toThrow(/Invalid token/);
  });

  test('outsiders cannot join or post; participants can, and outsiders never receive messages', async () => {
    const thread = {
      _id: threadId,
      participantIds: [alice, bob],
      creatorId: alice,
      messages: [],
      saved: 0,
      async save() { this.saved += 1; }
    };
    stub(ChatThread, 'findById', async () => thread);
    stubProfiles();

    const aliceSock = await connect(tokenFor(alice, 'student'));
    const malSock = await connect(tokenFor(mallory, 'student'));

    const leaked = [];
    malSock.on('new_message', (m) => leaked.push(m));

    // Mallory is refused on join and on post
    malSock.emit('join_thread', threadId);
    expect((await once(malSock, 'chat_error')).code).toBe('FORBIDDEN');
    malSock.emit('send_message', { threadId, text: 'injected' });
    expect((await once(malSock, 'chat_error')).code).toBe('FORBIDDEN');
    expect(thread.saved).toBe(0);

    // Alice joins and posts successfully
    aliceSock.emit('join_thread', threadId);
    await sleep(100);
    aliceSock.emit('send_message', { threadId, text: 'hello Bob' });
    const delivered = await once(aliceSock, 'new_message');
    expect(delivered.message.text).toBe('hello Bob');
    expect(thread.saved).toBe(1);

    await sleep(250);
    expect(leaked).toHaveLength(0);
  });
});
