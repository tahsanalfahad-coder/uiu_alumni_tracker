import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import PendingRegistration from '../models/PendingRegistration.js';
import Event from '../models/Event.js';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware: all admin routes require authentication and 'admin' role
router.use(requireAuth);
router.use(requireRole('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const totalAlumni = await AlumniProfile.countDocuments({});
    const pendingRegistrations = await PendingRegistration.countDocuments({ status: 'Pending' });
    const totalEvents = await Event.countDocuments({});

    const departmentStats = await AlumniProfile.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const departmentBreakdown = departmentStats.map((d) => ({
      department: d._id || 'Computer Science & Engineering',
      count: d.count
    }));

    res.json({
      // Real counts only (previously fell back to made-up numbers when empty).
      totalAlumni,
      pendingRegistrations,
      upcomingEvents: totalEvents,
      // The database has no employment/salary data yet; these are labelled sample values.
      employmentRate: '92.7%',
      avgSalary: '৳62,000',
      isSampleData: { employmentRate: true, avgSalary: true },
      departmentBreakdown
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/registrations
router.get('/registrations', async (req, res, next) => {
  try {
    const list = await PendingRegistration.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/registrations/:id/approve
router.patch('/registrations/:id/approve', async (req, res, next) => {
  try {
    const reg = await PendingRegistration.findById(req.params.id);
    if (!reg) {
      return res.status(404).json({
        error: { message: 'Pending registration request not found', code: 'NOT_FOUND' }
      });
    }

    reg.status = 'Approved';
    await reg.save();

    const user = await User.findById(reg.userId);
    if (user) {
      user.status = 'active';
      await user.save();
    }

    let profile = await AlumniProfile.findOne({ userId: reg.userId });
    if (profile) {
      if (reg.name) profile.name = reg.name;
      if (reg.batch) profile.batch = reg.batch;
      if (reg.department) profile.department = reg.department;
      if (reg.currentRole) profile.role = reg.currentRole;
      if (reg.company) profile.company = reg.company;
      if (reg.email) profile.email = reg.email;
      await profile.save();
    } else {
      await AlumniProfile.create({
        userId: reg.userId,
        name: reg.name,
        batch: reg.batch,
        year: '2026',
        department: reg.department,
        role: reg.currentRole || 'Software Professional',
        company: reg.company || 'Tech Company',
        location: 'Dhaka, Bangladesh',
        bio: `Verified UIU graduate alumnus (${reg.batch}).`,
        higherStudies: '',
        skills: ['Professional Practice'],
        achievements: ['Verified UIU Graduate'],
        isMentor: false,
        totalDonated: 0,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: reg.email,
        careerTimeline: [
          {
            title: reg.currentRole || 'Software Professional',
            company: reg.company || 'Tech Company',
            startDate: '2025',
            endDate: 'Present',
            description: `UIU graduate (${reg.batch}).`,
            current: true
          }
        ]
      });
    }

    res.json({ message: 'Alumni registration approved successfully', registration: reg });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/registrations/:id/decline
router.patch('/registrations/:id/decline', async (req, res, next) => {
  try {
    const reg = await PendingRegistration.findById(req.params.id);
    if (!reg) {
      return res.status(404).json({
        error: { message: 'Pending registration request not found', code: 'NOT_FOUND' }
      });
    }

    reg.status = 'Declined';
    await reg.save();

    const user = await User.findById(reg.userId);
    if (user) {
      user.status = 'declined';
      await user.save();
    }

    res.json({ message: 'Alumni registration request declined', registration: reg });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/employment
router.get('/reports/employment', async (req, res, next) => {
  try {
    const reports = [
      { year: '2025', graduates: 1240, employed: 1150, employmentRate: '92.7%', avgSalary: '৳62,000' },
      { year: '2024', graduates: 1180, employed: 1095, employmentRate: '92.8%', avgSalary: '৳58,000' },
      { year: '2023', graduates: 1050, employed: 970, employmentRate: '92.3%', avgSalary: '৳54,000' },
      { year: '2022', graduates: 990, employed: 910, employmentRate: '91.9%', avgSalary: '৳50,000' }
    ];
    res.set('X-Data-Source', 'sample');
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/industry
router.get('/reports/industry', async (req, res, next) => {
  try {
    const industryStats = await AlumniProfile.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(industryStats);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/achievers
router.get('/reports/achievers', async (req, res, next) => {
  try {
    const achievers = await AlumniProfile.find({
      achievements: { $exists: true, $not: { $size: 0 } }
    });
    res.json(achievers);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/geographic
router.get('/reports/geographic', async (req, res, next) => {
  try {
    const geoStats = await AlumniProfile.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } }
    ]);
    res.json(geoStats);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users (Create additional admin user)
router.post('/users', async (req, res, next) => {
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(2, 'Name is required').max(100),
        email: z.string().email('Invalid email address'),
        password: z.string().min(10, 'Admin password must be at least 10 characters').max(72)
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { message: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' }
      });
    }
    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: { message: 'User already exists', code: 'DUPLICATE' }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active'
    });

    res.status(201).json({
      message: 'New administrator user created successfully',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
