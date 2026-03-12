import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { hodAPI, commonAPI } from '../services/api';
import toast from 'react-hot-toast';

const ViewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data } = await commonAPI.getPublishedForms();
      const allFeedback = [];
      
      // Get department performance which includes feedbacks
      const perfData = await hodAPI.getDepartmentPerformance();
      setFeedbacks(perfData.data.feedbacks);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View all feedback submitted by students</p>
      </div>

      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <motion.div
            key={feedback._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{feedback.facultyId?.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feedback.courseId?.courseName} • Semester {feedback.semester}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{feedback.averageScore.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Content Knowledge</p>
                {renderStars(feedback.feedbackScores.contentKnowledge)}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Teaching Methodology</p>
                {renderStars(feedback.feedbackScores.teachingMethodology)}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Communication</p>
                {renderStars(feedback.feedbackScores.communication)}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Punctuality</p>
                {renderStars(feedback.feedbackScores.punctuality)}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Student Engagement</p>
                {renderStars(feedback.feedbackScores.studentEngagement)}
              </div>
            </div>

            {feedback.comment && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium mb-1">Student Comment:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.comment}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
            </div>
          </motion.div>
        ))}

        {feedbacks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No feedback submitted yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewFeedback;
