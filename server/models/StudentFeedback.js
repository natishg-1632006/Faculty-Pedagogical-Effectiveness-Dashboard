import mongoose from 'mongoose';

const studentFeedbackSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Number, required: true },
  studentName: { type: String, required: true, trim: true },
  studentRegNumber: { type: String, required: true, trim: true, uppercase: true },
  studentEmail: { type: String, required: true, trim: true, lowercase: true },
  feedbackScores: {
    contentKnowledge: { type: Number, min: 1, max: 5 },
    teachingMethodology: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    studentEngagement: { type: Number, min: 1, max: 5 }
  },
  averageScore: { type: Number },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

studentFeedbackSchema.index({ facultyId: 1, semester: 1, studentRegNumber: 1 }, { unique: true });

studentFeedbackSchema.pre('save', function(next) {
  const scores = this.feedbackScores;
  this.averageScore = (scores.contentKnowledge + scores.teachingMethodology + 
    scores.communication + scores.punctuality + scores.studentEngagement) / 5;
  next();
});

export default mongoose.model('StudentFeedback', studentFeedbackSchema);
