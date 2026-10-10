import AlumniProfile from '../models/AlumniProfile.js';
import StudentProfile from '../models/StudentProfile.js';

// A person can be referenced by their User id or by their profile id.
export const getIdentityIds = async (userId) => {
  const ids = [String(userId)];
  const [alumni, student] = await Promise.all([
    AlumniProfile.findOne({ userId }, '_id'),
    StudentProfile.findOne({ userId }, '_id')
  ]);
  if (alumni) ids.push(String(alumni._id));
  if (student) ids.push(String(student._id));
  return ids;
};

export const isThreadParticipant = (thread, identityIds) => {
  const mine = new Set(identityIds.map(String));
  const inParticipants = (thread.participantIds || []).some((p) => mine.has(String(p)));
  return inParticipants || (!!thread.creatorId && mine.has(String(thread.creatorId)));
};

export const ownsMentorshipRequest = (request, identityIds) =>
  identityIds.map(String).includes(String(request.mentorId));

export const ownsJob = (job, identityIds) =>
  identityIds.map(String).includes(String(job.alumniId));
