import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    typeBadge: { type: String, default: 'Official Event' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    cost: { type: String, default: 'Free' },
    registered: { type: Number, default: 0 },
    capacity: { type: Number, default: 100 },
    image: { type: String, default: '' },
    tags: [{ type: String }],
    description: { type: String, required: true },
    scope: { type: String, enum: ['public', 'alumni-only'], default: 'public' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
