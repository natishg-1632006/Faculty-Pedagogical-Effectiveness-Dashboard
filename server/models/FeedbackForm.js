import mongoose from 'mongoose';

const feedbackFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  facultyList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  questions: [{
    question: String,
    type: { type: String, enum: ['rating', 'multiple', 'text'], default: 'rating' },
    options: [String]
  }],
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('FeedbackForm', feedbackFormSchema);
