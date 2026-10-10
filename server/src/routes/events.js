import express from 'express';
import Event from '../models/Event.js';
import PersonalEventRequest from '../models/PersonalEventRequest.js';
import AlumniProfile from '../models/AlumniProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// POST /api/events (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, category, typeBadge, date, time, location, cost, capacity, image, tags, description, scope } = req.body;

    if (!title || !category || !date || !time || !location || !description) {
      return res.status(400).json({
        error: { message: 'Title, category, date, time, location, and description are required', code: 'VALIDATION_ERROR' }
      });
    }

    const event = await Event.create({
      title,
      category,
      typeBadge: typeBadge || 'Official University Event',
      date,
      time,
      location,
      cost: cost || 'Free',
      capacity: capacity || 200,
      registered: 0,
      image: image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      tags: tags || ['Reunion', 'Networking'],
      description,
      scope: scope || 'public',
      createdBy: req.user.id
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/:id (admin only)
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const allowed = ['title', 'category', 'typeBadge', 'date', 'time', 'location', 'cost',
      'capacity', 'image', 'tags', 'description', 'scope'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const event = await Event.findByIdAndUpdate(req.params.id, { $set: updates }, {
      new: true,
      runValidators: true
    });
    if (!event) {
      return res.status(404).json({
        error: { message: 'Event not found', code: 'NOT_FOUND' }
      });
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        error: { message: 'Event not found', code: 'NOT_FOUND' }
      });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/personal-requests (alumni only)
router.post('/personal-requests', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const { title, category, date, time, location, cost, description, tags } = req.body;

    if (!title || !date || !time || !location || !description) {
      return res.status(400).json({
        error: { message: 'Title, date, time, location, and description are required', code: 'VALIDATION_ERROR' }
      });
    }

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    const submittedBy = alumniProfile
      ? `${alumniProfile.name} (${alumniProfile.batch || 'Alumni'})`
      : user?.name || 'Alumnus';

    const reqDoc = await PersonalEventRequest.create({
      title,
      category: category || 'Alumni Gathering',
      date,
      time,
      location,
      cost: cost || 'Free',
      description,
      submittedBy,
      alumniId: alumniProfile ? alumniProfile._id : req.user.id,
      status: 'Pending',
      tags: tags || ['Alumni', 'Campus']
    });

    res.status(201).json(reqDoc);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/personal-requests
router.get('/personal-requests', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const requests = await PersonalEventRequest.find({}).sort({ createdAt: -1 });
      return res.json(requests);
    }

    if (req.user.role === 'alumni') {
      const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (alumniProfile) ids.push(alumniProfile._id);
      const requests = await PersonalEventRequest.find({ alumniId: { $in: ids } }).sort({ createdAt: -1 });
      return res.json(requests);
    }

    return res.status(403).json({
      error: { message: 'Access denied', code: 'FORBIDDEN' }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/personal-requests/:id/approve (admin only)
router.patch('/personal-requests/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const reqDoc = await PersonalEventRequest.findById(req.params.id);
    if (!reqDoc) {
      return res.status(404).json({
        error: { message: 'Event request proposal not found', code: 'NOT_FOUND' }
      });
    }

    reqDoc.status = 'Approved';
    await reqDoc.save();

    const createdEvent = await Event.create({
      title: reqDoc.title,
      category: reqDoc.category || 'Alumni Reunion',
      typeBadge: 'Approved Alumni Event',
      date: reqDoc.date,
      time: reqDoc.time,
      location: reqDoc.location,
      cost: reqDoc.cost || 'Free',
      registered: 1,
      capacity: 100,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      tags: reqDoc.tags || ['Alumni', 'Campus'],
      description: reqDoc.description,
      scope: 'public',
      createdBy: req.user.id
    });

    // Notify the alumnus who created the event request via Socket.io
    const io = req.app.get('io');
    if (io) {
      try {
        const alumniProf = await AlumniProfile.findById(reqDoc.alumniId);
        const targetUserId = alumniProf?.userId ? alumniProf.userId.toString() : reqDoc.alumniId.toString();

        io.to(`user:${targetUserId}`).emit('event_request_approved', {
          requestId: reqDoc._id,
          title: reqDoc.title,
          event: createdEvent,
          message: `🎉 Great news! Your event proposal "${reqDoc.title}" has been ACCEPTED by UIU Admin!`
        });
      } catch (notifyErr) {
        console.error('[Event approval notification error]:', notifyErr.message);
      }
    }

    res.json({ request: reqDoc, event: createdEvent });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/personal-requests/:id/decline (admin only)
router.patch('/personal-requests/:id/decline', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { suggestion } = req.body;
    const reqDoc = await PersonalEventRequest.findById(req.params.id);
    if (!reqDoc) {
      return res.status(404).json({
        error: { message: 'Event request proposal not found', code: 'NOT_FOUND' }
      });
    }

    reqDoc.status = 'Declined';
    if (suggestion !== undefined) reqDoc.suggestion = suggestion;
    await reqDoc.save();

    // Notify the alumnus who created the request via Socket.io
    const io = req.app.get('io');
    if (io) {
      try {
        const alumniProf = await AlumniProfile.findById(reqDoc.alumniId);
        const targetUserId = alumniProf?.userId ? alumniProf.userId.toString() : reqDoc.alumniId.toString();

        io.to(`user:${targetUserId}`).emit('event_request_declined', {
          requestId: reqDoc._id,
          title: reqDoc.title,
          suggestion: reqDoc.suggestion,
          message: `Your event proposal "${reqDoc.title}" was updated by UIU Admin.`
        });
      } catch (notifyErr) {
        console.error('[Event decline notification error]:', notifyErr.message);
      }
    }

    res.json(reqDoc);
  } catch (err) {
    next(err);
  }
});

export default router;
