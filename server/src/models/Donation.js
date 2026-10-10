import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlumniProfile', required: true },
    fundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    txId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Completed', 'Pending'], default: 'Completed' },
    paymentMethod: { type: String, default: 'bKash / Credit Card' },
    recurring: { type: Boolean, default: false },
    anonymous: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Donation || mongoose.model('Donation', donationSchema);
