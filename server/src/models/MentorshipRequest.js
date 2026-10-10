import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    studentName: { type: String, required: true },
    studentAvatar: { type: String, default: '' },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlumniProfile', required: true },
    mentorName: { type: String, required: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' },
    date: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.models.MentorshipRequest || mongoose.model('MentorshipRequest', mentorshipRequestSchema);
