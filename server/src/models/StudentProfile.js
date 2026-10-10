import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    studentId: { type: String, required: true },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    skills: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.models.StudentProfile || mongoose.model('StudentProfile', studentProfileSchema);
