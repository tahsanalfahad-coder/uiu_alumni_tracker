import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../utils/jwt.js';
import { loginAccountLimiter, loginIpLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const generateToken = signToken;

// Used to keep login timing the same whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

// POST /api/auth/register/student
router.post('/register/student', registerLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2, 'Name is required').max(100),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
      studentId: z.string().min(3, 'Student ID is required'),
      department: z.string().optional().default('Computer Science & Engineering')
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          message: parsed.error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { name, email, password, studentId, department } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: {
          message: 'An account with this email address already exists',
          code: 'DUPLICATE_EMAIL'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'student',
      status: 'active'
    });

    await StudentProfile.create({
      userId: user._id,
      studentId,
      department,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register/alumni
router.post('/register/alumni', registerLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2, 'Name is required').max(100),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
      batch: z.string().min(2, 'Batch code is required'),
      department: z.string().min(2, 'Department is required'),
      currentRole: z.string().optional().default('Graduate'),
      company: z.string().optional().default('Not specified')
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          message: parsed.error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { name, email, password, batch, department, currentRole, company } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: {
          message: 'An account with this email address already exists',
          code: 'DUPLICATE_EMAIL'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'alumni',
      status: 'pending'
    });

    const todayStr = new Date().toISOString().split('T')[0];
    await PendingRegistration.create({
      userId: user._id,
      name,
      email: email.toLowerCase(),
      batch,
      department,
      currentRole,
      company,
      submittedDate: todayStr,
      status: 'Pending'
    });

    await AlumniProfile.create({
      userId: user._id,
      name,
      email: email.toLowerCase(),
      batch,
      department,
      role: currentRole || 'Software Professional',
      company: company || 'Tech Organization',
      location: 'Dhaka, Bangladesh',
      bio: `UIU Graduate (${batch}) from ${department}.`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['Software Engineering', 'Professional Practice'],
      careerTimeline: [
        {
          title: currentRole || 'Software Professional',
          company: company || 'Tech Organization',
          startDate: new Date().getFullYear().toString(),
          endDate: 'Present',
          description: `UIU Alumni (${batch}) at ${company || 'Tech Organization'}`,
          current: true
        }
      ]
    });

    res.status(202).json({
      message: 'Alumni registration submitted successfully. Pending admin approval.',
      status: 'pending',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginIpLimiter, loginAccountLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required')
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          message: parsed.error.issues[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() });

    const isMatch = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !isMatch) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        error: {
          message: 'Your alumni account is pending admin approval. You will receive access once verified.',
          code: 'ACCOUNT_PENDING'
        }
      });
    }

    if (user.status === 'declined') {
      return res.status(403).json({
        error: {
          message: 'Your registration request was declined by the administrator.',
          code: 'ACCOUNT_DECLINED'
        }
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User profile not found',
          code: 'NOT_FOUND'
        }
      });
    }

    let profile = null;
    if (user.role === 'alumni') {
      profile = await AlumniProfile.findOne({ userId: user._id });
    } else if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      profile
    });
  } catch (err) {
    next(err);
  }
});

export default router;
