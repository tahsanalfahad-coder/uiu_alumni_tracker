import express from 'express';
import Job from '../models/Job.js';
import AlumniProfile from '../models/AlumniProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asString, escapeRegex } from '../utils/query.js';
import { getIdentityIds, ownsJob } from '../utils/access.js';

const router = express.Router();

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const search = asString(req.query.search);
    const type = asString(req.query.type);
    const filter = {};

    if (type) filter.type = type;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [{ title: rx }, { company: rx }, { description: rx }];
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post('/', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const { title, company, type, location, stipend, deadline, description } = req.body;

    if (!title || !company || !type || !location || !deadline || !description) {
      return res.status(400).json({
        error: { message: 'Title, company, type, location, deadline, and description are required', code: 'VALIDATION_ERROR' }
      });
    }

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    const postedBy = alumniProfile?.name || user?.name || 'UIU Alumnus';

    const todayStr = new Date().toISOString().split('T')[0];
    const job = await Job.create({
      title,
      company,
      type,
      location,
      stipend: stipend || 'Not specified',
      postedDate: todayStr,
      deadline,
      description,
      postedBy,
      alumniId: alumniProfile ? alumniProfile._id : req.user.id
    });

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: { message: 'Job posting not found', code: 'NOT_FOUND' }
      });
    }

    // Previously the check was skipped entirely when the user had no profile.
    const identityIds = await getIdentityIds(req.user.id);
    if (!ownsJob(job, identityIds)) {
      return res.status(403).json({
        error: { message: 'You can only delete your own job postings', code: 'FORBIDDEN' }
      });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job posting deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
