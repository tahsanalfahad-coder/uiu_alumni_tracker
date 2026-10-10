import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    batch: { type: String, required: true },
    department: { type: String, required: true },
    currentRole: { type: String, default: '' },
    company: { type: String, default: '' },
    submittedDate: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' }
  },
  { timestamps: true }
);

export default mongoose.models.PendingRegistration || mongoose.model('PendingRegistration', pendingRegistrationSchema);
