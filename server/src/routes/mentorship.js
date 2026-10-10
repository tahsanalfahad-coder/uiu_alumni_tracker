import express from 'express';
import mongoose from 'mongoose';
import MentorshipRequest from '../models/MentorshipRequest.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import User from '../models/User.js';
import ChatThread from '../models/ChatThread.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getIdentityIds, ownsMentorshipRequest } from '../utils/access.js';
import { isTest } from '../config/env.js';

const router = express.Router();

// GET /api/mentorship/requests
router.get('/requests', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (studentProfile) ids.push(studentProfile._id);
      const requests = await MentorshipRequest.find({ studentId: { $in: ids } }).sort({ createdAt: -1 });
      return res.json(requests);
    }

    if (req.user.role === 'alumni') {
      const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (alumniProfile) ids.push(alumniProfile._id);
      const requests = await MentorshipRequest.find({ mentorId: { $in: ids } }).sort({ createdAt: -1 });
      return res.json(requests);
    }

    if (req.user.role === 'admin') {
      const requests = await MentorshipRequest.find({}).sort({ createdAt: -1 });
      return res.json(requests);
    }

    res.json([]);
  } catch (err) {
    next(err);
  }
});

// POST /api/mentorship/requests (student only)
router.post('/requests', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { mentorId, mentorName, topic, message } = req.body;

    if (!mentorId || !topic || !message) {
      return res.status(400).json({
        error: { message: 'Mentor ID, topic, and message are required', code: 'VALIDATION_ERROR' }
      });
    }

    const studentProfile = await StudentProfile.findOne({ userId: req.user.id });
    const user = await User.findById(req.user.id);
    const alumni = await AlumniProfile.findById(mentorId);
    if (!alumni) {
      return res.status(404).json({
        error: { message: 'Mentor not found', code: 'NOT_FOUND' }
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newReq = await MentorshipRequest.create({
      studentId: studentProfile ? studentProfile._id : req.user.id,
      studentName: user?.name || 'Current Student',
      studentAvatar: studentProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      mentorId: mentorId,
      mentorName: mentorName || alumni?.name || 'Alumni Mentor',
      topic,
      message,
      status: 'Pending',
      date: todayStr
    });

    res.status(201).json(newReq);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/mentorship/requests/:id/accept (alumni only)
router.patch('/requests/:id/accept', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const mentorshipReq = await MentorshipRequest.findById(req.params.id);
    if (!mentorshipReq) {
      return res.status(404).json({
        error: { message: 'Mentorship request not found', code: 'NOT_FOUND' }
      });
    }

    // Only the mentor the request was addressed to may respond to it.
    const identityIds = await getIdentityIds(req.user.id);
    if (!ownsMentorshipRequest(mentorshipReq, identityIds)) {
      return res.status(403).json({
        error: { message: 'You can only respond to requests addressed to you', code: 'FORBIDDEN' }
      });
    }

    mentorshipReq.status = 'Accepted';
    await mentorshipReq.save();

    // Auto-create chat thread when mentorship is accepted and DB is connected
    if (!isTest() && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const studentProf = await StudentProfile.findById(mentorshipReq.studentId);
        const studentUserId = studentProf?.userId ? studentProf.userId.toString() : mentorshipReq.studentId.toString();

        const alumniProf = await AlumniProfile.findById(mentorshipReq.mentorId);
        const mentorUserId = alumniProf?.userId ? alumniProf.userId.toString() : req.user.id.toString();

        const participants = [studentUserId, mentorUserId];

        let thread = await ChatThread.findOne({
          participantIds: { $all: participants }
        });

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const initialText = `Assalamu Alaikum! I have accepted your mentorship request regarding: "${mentorshipReq.topic}". Feel free to message me here.`;

        if (!thread) {
          thread = await ChatThread.create({
            participantIds: participants,
            creatorId: mentorUserId,
            creatorName: mentorshipReq.mentorName || 'Alumni Mentor',
            creatorAvatar: alumniProf?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            creatorRole: 'Alumni Mentor',
            participantName: mentorshipReq.studentName || 'Student',
            participantAvatar: mentorshipReq.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            participantRole: 'UIU Student',
            lastMessage: initialText,
            lastMessageAt: 'Just now',
            messages: [
              {
                sender: mentorUserId,
                text: initialText,
                timestamp: nowStr
              }
            ]
          });
        }

        const io = req.app.get('io');
        if (io) {
          participants.forEach((pId) => {
            io.to(`user:${pId}`).emit('new_thread', { thread });
          });
        }
      } catch (chatErr) {
        console.error('[Mentorship accept auto-chat error]:', chatErr.message);
      }
    }

    res.json(mentorshipReq);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/mentorship/requests/:id/decline (alumni only)
router.patch('/requests/:id/decline', requireAuth, requireRole('alumni'), async (req, res, next) => {
  try {
    const mentorshipReq = await MentorshipRequest.findById(req.params.id);
    if (!mentorshipReq) {
      return res.status(404).json({
        error: { message: 'Mentorship request not found', code: 'NOT_FOUND' }
      });
    }

    // Only the mentor the request was addressed to may respond to it.
    const identityIds = await getIdentityIds(req.user.id);
    if (!ownsMentorshipRequest(mentorshipReq, identityIds)) {
      return res.status(403).json({
        error: { message: 'You can only respond to requests addressed to you', code: 'FORBIDDEN' }
      });
    }

    mentorshipReq.status = 'Declined';
    await mentorshipReq.save();
    res.json(mentorshipReq);
  } catch (err) {
    next(err);
  }
});

export default router;
