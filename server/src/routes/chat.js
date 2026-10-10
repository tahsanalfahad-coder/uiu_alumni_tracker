import express from 'express';
import ChatThread from '../models/ChatThread.js';
import User from '../models/User.js';
import AlumniProfile from '../models/AlumniProfile.js';
import StudentProfile from '../models/StudentProfile.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { getIdentityIds, isThreadParticipant } from '../utils/access.js';

const MAX_MESSAGE_LENGTH = 2000;

const router = express.Router();

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// Helper to format thread for the requesting user
const formatThreadForUser = (threadDoc, currentUserId) => {
  const thread = threadDoc.toObject ? threadDoc.toObject() : { ...threadDoc };
  const currentIdStr = currentUserId.toString();
  const creatorIdStr = thread.creatorId ? thread.creatorId.toString() : '';

  // If current user is the creator, show the target's details
  if (creatorIdStr && currentIdStr === creatorIdStr) {
    thread.displayName = thread.participantName;
    thread.displayAvatar = thread.participantAvatar || DEFAULT_AVATAR;
    thread.displayRole = thread.participantRole || 'Verified Member';
  } else if (thread.creatorName) {
    // If current user is the target, show the creator's details
    thread.displayName = thread.creatorName;
    thread.displayAvatar = thread.creatorAvatar || DEFAULT_AVATAR;
    thread.displayRole = thread.creatorRole || 'UIU Member';
  } else {
    thread.displayName = thread.participantName;
    thread.displayAvatar = thread.participantAvatar || DEFAULT_AVATAR;
    thread.displayRole = thread.participantRole || 'Verified Member';
  }

  return thread;
};

// GET /api/chat/threads
router.get('/threads', requireAuth, async (req, res, next) => {
  try {
    const userIds = await getIdentityIds(req.user.id);

    const threads = await ChatThread.find({
      participantIds: { $in: userIds }
    }).sort({ updatedAt: -1 });

    const formatted = threads.map((t) => formatThreadForUser(t, req.user.id));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/threads
router.post('/threads', requireAuth, async (req, res, next) => {
  try {
    const { targetUserId, targetName, targetAvatar, targetRole, initialMessage } = req.body;

    if (!targetName) {
      return res.status(400).json({
        error: { message: 'Participant details required', code: 'VALIDATION_ERROR' }
      });
    }

    // Resolve creator details
    const creatorUser = await User.findById(req.user.id);
    let creatorName = creatorUser?.name || 'UIU Member';
    let creatorAvatar = DEFAULT_AVATAR;
    let creatorRole = creatorUser?.role === 'alumni' ? 'Verified Graduate' : 'Enrolled Student';

    const creatorAlumni = await AlumniProfile.findOne({ userId: req.user.id });
    const creatorStudent = await StudentProfile.findOne({ userId: req.user.id });
    if (creatorAlumni) {
      if (creatorAlumni.name) creatorName = creatorAlumni.name;
      if (creatorAlumni.avatar) creatorAvatar = creatorAlumni.avatar;
      if (creatorAlumni.company || creatorAlumni.batch) {
        creatorRole = `${creatorAlumni.batch || ''} • ${creatorAlumni.company || ''}`;
      }
    } else if (creatorStudent) {
      if (creatorStudent.name) creatorName = creatorStudent.name;
      if (creatorStudent.avatar) creatorAvatar = creatorStudent.avatar;
      if (creatorStudent.department) {
        creatorRole = `${creatorStudent.department} Student`;
      }
    }

    // Resolve target details
    let resolvedTargetUserId = targetUserId;
    if (targetUserId) {
      const isUser = await User.findById(targetUserId);
      if (!isUser) {
        const alumniProf = await AlumniProfile.findById(targetUserId);
        if (alumniProf) {
          resolvedTargetUserId = alumniProf.userId ? alumniProf.userId.toString() : targetUserId;
        } else {
          const studentProf = await StudentProfile.findById(targetUserId);
          if (studentProf) {
            resolvedTargetUserId = studentProf.userId ? studentProf.userId.toString() : targetUserId;
          }
        }
      }
    }

    // Strict Rule: If student initiates messaging with an alumnus, an accepted mentorship request MUST exist!
    if (req.user.role === 'student' && resolvedTargetUserId) {
      const targetUser = await User.findById(resolvedTargetUserId);
      const isAlumniTarget = (targetUser && targetUser.role === 'alumni') || (targetUserId && await AlumniProfile.findById(targetUserId));
      
      if (isAlumniTarget) {
        const studentProf = await StudentProfile.findOne({ userId: req.user.id });
        const studentIds = [req.user.id];
        if (studentProf) studentIds.push(studentProf._id.toString());

        const alumniProf = await AlumniProfile.findOne({
          $or: [{ userId: resolvedTargetUserId }, { _id: targetUserId }]
        });
        const mentorIds = [resolvedTargetUserId];
        if (targetUserId) mentorIds.push(targetUserId.toString());
        if (alumniProf) mentorIds.push(alumniProf._id.toString());

        const acceptedReq = await MentorshipRequest.findOne({
          studentId: { $in: studentIds },
          mentorId: { $in: mentorIds },
          status: 'Accepted'
        });

        if (!acceptedReq) {
          return res.status(403).json({
            error: {
              message: 'Direct messaging requires the alumnus to accept your mentorship request first.',
              code: 'MENTORSHIP_REQUIRED'
            }
          });
        }
      }
    }

    const participants = [req.user.id];
    if (resolvedTargetUserId && resolvedTargetUserId !== req.user.id) {
      participants.push(resolvedTargetUserId);
    }

    let existing = null;
    if (resolvedTargetUserId) {
      existing = await ChatThread.findOne({
        participantIds: { $all: [req.user.id, resolvedTargetUserId] }
      });
    }

    if (!existing && !resolvedTargetUserId && targetName) {
      existing = await ChatThread.findOne({
        participantName: targetName,
        participantIds: req.user.id
      });
    }

    if (existing) {
      const formattedExisting = formatThreadForUser(existing, req.user.id);
      return res.json(formattedExisting);
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgText = initialMessage || 'Hello! I would love to connect with you.';

    const thread = await ChatThread.create({
      participantIds: participants,
      creatorId: req.user.id,
      creatorName,
      creatorAvatar,
      creatorRole,
      participantName: targetName,
      participantAvatar: targetAvatar || DEFAULT_AVATAR,
      participantRole: targetRole || 'Verified Member',
      lastMessage: msgText,
      lastMessageAt: 'Just now',
      messages: [
        {
          sender: req.user.id,
          text: msgText,
          timestamp: nowStr
        }
      ]
    });

    const io = req.app.get('io');
    if (io) {
      participants.forEach((pId) => {
        const formattedForP = formatThreadForUser(thread, pId);
        io.to(`user:${pId.toString()}`).emit('new_thread', { thread: formattedForP });
      });
    }

    const formattedNew = formatThreadForUser(thread, req.user.id);
    res.status(201).json(formattedNew);
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/threads/:id/messages
router.post('/threads/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim() || text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: { message: `Message must be 1-${MAX_MESSAGE_LENGTH} characters`, code: 'VALIDATION_ERROR' }
      });
    }

    const thread = await ChatThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({
        error: { message: 'Chat thread not found', code: 'NOT_FOUND' }
      });
    }

    // Only members of a conversation may post to it.
    const identityIds = await getIdentityIds(req.user.id);
    if (!isThreadParticipant(thread, identityIds)) {
      return res.status(403).json({
        error: { message: 'You are not a participant in this conversation', code: 'FORBIDDEN' }
      });
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      sender: req.user.id,
      text: text.trim(),
      timestamp: nowStr
    };

    thread.messages.push(newMessage);
    thread.lastMessage = text.trim();
    thread.lastMessageAt = 'Just now';
    await thread.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`thread:${thread._id}`).emit('new_message', {
        threadId: thread._id.toString(),
        message: newMessage,
        thread
      });

      if (Array.isArray(thread.participantIds)) {
        thread.participantIds.forEach((pId) => {
          const formatted = formatThreadForUser(thread, pId);
          io.to(`user:${pId.toString()}`).emit('new_message', {
            threadId: thread._id.toString(),
            message: newMessage,
            thread: formatted
          });
        });
      }
    }

    const formattedResult = formatThreadForUser(thread, req.user.id);
    res.json(formattedResult);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chat/threads/:id
router.delete('/threads/:id', requireAuth, async (req, res, next) => {
  try {
    const userIds = await getIdentityIds(req.user.id);

    const thread = await ChatThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({
        error: { message: 'Chat thread not found', code: 'NOT_FOUND' }
      });
    }

    if (!isThreadParticipant(thread, userIds)) {
      return res.status(403).json({
        error: { message: 'You are not authorized to delete this conversation', code: 'FORBIDDEN' }
      });
    }

    await ChatThread.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      thread.participantIds.forEach((pId) => {
        io.to(`user:${pId.toString()}`).emit('thread_deleted', { threadId: req.params.id });
      });
    }

    res.json({ message: 'Conversation deleted successfully', threadId: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
