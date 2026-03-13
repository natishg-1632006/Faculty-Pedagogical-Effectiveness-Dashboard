import mongoose from 'mongoose';

const studentFeedbackSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackForm', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Number, required: true },
  studentName: { type: String, required: true, trim: true },
  studentRegNumber: { type: String, required: true, trim: true, uppercase: true },
  studentEmail: { type: String, required: true, trim: true, lowercase: true },
  feedbackScores: { type: mongoose.Schema.Types.Mixed, required: true },
  averageScore: { type: Number },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

studentFeedbackSchema.index({ formId: 1, facultyId: 1, studentRegNumber: 1 }, { unique: true });

studentFeedbackSchema.pre('save', function(next) {
  if (this.feedbackScores) {
    const scores = Object.values(this.feedbackScores).map(val => Number(val)).filter(val => !isNaN(val));
    if (scores.length > 0) {
      this.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    } else {
      this.averageScore = 0;
    }
  }
  next();
});

export default mongoose.model('StudentFeedback', studentFeedbackSchema);
