import mongoose from 'mongoose';

const performanceMetricsSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  departmentAverage: { type: Number },
  trend: { type: String, enum: ['improving', 'declining', 'stable'] },
  suggestions: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('PerformanceMetrics', performanceMetricsSchema);
