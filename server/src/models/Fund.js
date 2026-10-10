import mongoose from 'mongoose';

const fundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    raised: { type: Number, default: 0 },
    goal: { type: Number, required: true },
    icon: { type: String, default: 'graduationCap' }
  },
  { timestamps: true }
);

export default mongoose.models.Fund || mongoose.model('Fund', fundSchema);
