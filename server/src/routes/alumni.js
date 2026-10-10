import express from 'express';
import mongoose from 'mongoose';
import AlumniProfile from '../models/AlumniProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { asString, escapeRegex } from '../utils/query.js';

import PendingRegistration from '../models/PendingRegistration.js';

const router = express.Router();

// Public responses never include contact email or the internal user id (admins see everything).
const PUBLIC_EXCLUDE = '-email -userId';
const applyVisibility = (query, req) => (req.user?.role === 'admin' ? query : query.select(PUBLIC_EXCLUDE));

// GET /api/alumni
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const search = asString(req.query.search);
    const batch = asString(req.query.batch);
    const department = asString(req.query.department);
    const filter = {};

    if (batch) filter.batch = batch;
    if (department) filter.department = department;
    if (req.query.mentorsOnly === 'true') filter.isMentor = true;

    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [
        { name: rx },
        { company: rx },
        { role: rx },
        { skills: { $elemMatch: rx } }
      ];
    }

    const query = AlumniProfile.find(filter).sort({ createdAt: -1 }).limit(500);
    const alumni = await applyVisibility(query, req);
    res.json(alumni);
  } catch (err) {
    next(err);
  }
});

// NOTE: '/me' routes must be declared BEFORE '/:id', otherwise Express treats "me" as an id.

// GET /api/alumni/me
router.get('/me', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: { message: 'User account not found', code: 'NOT_FOUND' }
      });
    }

    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      const pending = await PendingRegistration.findOne({
        $or: [{ userId: req.user.id }, { email: user.email.toLowerCase() }]
      });

      const batch = pending?.batch || 'CSE-2022';
      const department = pending?.department || 'Computer Science & Engineering';
      const role = pending?.currentRole || 'Software Professional';
      const company = pending?.company || 'UIU Alumni Network';
      const userName = user.name || pending?.name || 'UIU Alumnus';
      const userEmail = user.email || pending?.email || '';

      profile = await AlumniProfile.create({
        userId: user._id,
        name: userName,
        email: userEmail,
        batch,
        department,
        role,
        company,
        location: 'Dhaka, Bangladesh',
        bio: `UIU Graduate (${batch}) from ${department}.`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        skills: ['Software Engineering', 'System Architecture'],
        careerTimeline: [
          {
            title: role,
            company,
            startDate: '2025',
            endDate: 'Present',
            description: `UIU Alumni (${batch}) at ${company}`,
            current: true
          }
        ]
      });
    }

    if (!profile.name && user.name) profile.name = user.name;
    if (!profile.email && user.email) profile.email = user.email;

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alumni/me
router.patch('/me', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new AlumniProfile({
        userId: req.user.id,
        name: user?.name || 'Alumnus',
        email: user?.email || ''
      });
    }

    const allowedFields = [
      'name', 'batch', 'department', 'role', 'company', 'location',
      'bio', 'higherStudies', 'skills', 'achievements', 'isMentor',
      'mentorshipTopics', 'avatar', 'email'
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

// POST /api/alumni/me/timeline
router.post('/me/timeline', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const { title, company, startDate, endDate, description, current } = req.body;
    if (!title || !company || !startDate) {
      return res.status(400).json({
        error: { message: 'Title, company, and start date are required', code: 'VALIDATION_ERROR' }
      });
    }

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        error: { message: 'Alumni profile not found', code: 'NOT_FOUND' }
      });
    }

    const newEntry = {
      title,
      company,
      startDate,
      endDate: endDate || 'Present',
      description: description || '',
      current: !!current
    };

    profile.careerTimeline.unshift(newEntry);
    await profile.save();

    res.status(201).json(profile.careerTimeline);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alumni/me/timeline/:entryId
router.delete('/me/timeline/:entryId', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        error: { message: 'Alumni profile not found', code: 'NOT_FOUND' }
      });
    }

    profile.careerTimeline = profile.careerTimeline.filter(
      (entry) => entry._id.toString() !== req.params.entryId
    );

    await profile.save();
    res.json(profile.careerTimeline);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alumni/me/mentorship
router.patch('/me/mentorship', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const { isMentor, mentorshipTopics } = req.body;
    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        error: { message: 'Alumni profile not found', code: 'NOT_FOUND' }
      });
    }

    if (isMentor !== undefined) profile.isMentor = isMentor;
    if (mentorshipTopics !== undefined) profile.mentorshipTopics = mentorshipTopics;

    await profile.save();
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// GET /api/alumni/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        error: { message: 'Alumni record not found', code: 'NOT_FOUND' }
      });
    }
    const alumni = await applyVisibility(AlumniProfile.findById(req.params.id), req);
    if (!alumni) {
      return res.status(404).json({
        error: { message: 'Alumni record not found', code: 'NOT_FOUND' }
      });
    }
    res.json(alumni);
  } catch (err) {
    next(err);
  }
});

export default router;
