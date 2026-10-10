import express from 'express';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// GET /api/student/me
router.get('/me', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: { message: 'User account not found', code: 'NOT_FOUND' }
      });
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: user._id,
        name: user.name || 'Enrolled Student',
        email: user.email || '',
        studentId: '011 201 045',
        department: 'Computer Science & Engineering',
        year: '3rd Year / 7th Trimester',
        avatar: DEFAULT_AVATAR,
        bio: 'Passionate UIU Computer Science student interested in web development and software engineering.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Git']
      });
    }

    // Ensure name/email are synced if empty
    if (!profile.name && user.name) profile.name = user.name;
    if (!profile.email && user.email) profile.email = user.email;

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/student/me
router.patch('/me', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = await StudentProfile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = new StudentProfile({
        userId: req.user.id,
        studentId: req.body.studentId || '011 201 045',
        department: req.body.department || 'Computer Science & Engineering'
      });
    }

    const allowedFields = [
      'name', 'studentId', 'department', 'year', 'avatar',
      'bio', 'phone', 'linkedin', 'github', 'skills'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (req.body.name && user) {
      user.name = req.body.name;
      await user.save();
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
