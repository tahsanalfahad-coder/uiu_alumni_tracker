import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'alumni', 'student'], required: true },
    status: { type: String, enum: ['active', 'pending', 'declined'], default: 'active' }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
