import mongoose from 'mongoose';

const personalEventRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    cost: { type: String, default: 'Free' },
    description: { type: String, required: true },
    submittedBy: { type: String, required: true },
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlumniProfile', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
    suggestion: { type: String, default: '' },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.models.PersonalEventRequest || mongoose.model('PersonalEventRequest', personalEventRequestSchema);
