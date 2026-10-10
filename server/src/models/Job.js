import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    type: { type: String, required: true },
    location: { type: String, required: true },
    stipend: { type: String, default: '' },
    postedDate: { type: String, required: true },
    deadline: { type: String, required: true },
    description: { type: String, required: true },
    postedBy: { type: String, required: true },
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlumniProfile', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
