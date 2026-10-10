import mongoose from 'mongoose';

const careerTimelineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, default: 'Present' },
  description: { type: String, default: '' },
  current: { type: Boolean, default: false }
});

const alumniProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, default: '' },
    batch: { type: String, default: '' },
    year: { type: String, default: '' },
    department: { type: String, default: '' },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    higherStudies: { type: String, default: '' },
    skills: [{ type: String }],
    achievements: [{ type: String }],
    isMentor: { type: Boolean, default: false },
    mentorshipTopics: [{ type: String }],
    totalDonated: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    email: { type: String, default: '' },
    careerTimeline: [careerTimelineSchema]
  },
  { timestamps: true }
);

export default mongoose.models.AlumniProfile || mongoose.model('AlumniProfile', alumniProfileSchema);
