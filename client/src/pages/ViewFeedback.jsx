import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Filter, Search } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';

const ViewFeedback = () => {
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [filters, setFilters] = useState({
    facultyId: '',
    courseId: '',
    semester: '',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const perfRes = await hodAPI.getDepartmentPerformance();
      const feedbacks = perfRes.data.feedbacks || [];
      const faculty = perfRes.data.faculty || [];

      setAllFeedbacks(feedbacks);
      setFilteredFeedbacks(feedbacks);
      setFacultyList(faculty);

      // Derive unique courses and semesters for filters
      const uniqueCourses = [...new Map(feedbacks.map(item => [item.courseId?._id, item.courseId])).values()].filter(Boolean);
      const uniqueSemesters = [...new Set(feedbacks.map(item => item.semester))].sort();
      setCourseList(uniqueCourses);
      setSemesterList(uniqueSemesters);

    } catch (error) {
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = allFeedbacks;

    if (filters.facultyId) {
      result = result.filter(fb => fb.facultyId?._id === filters.facultyId);
    }
    if (filters.courseId) {
      result = result.filter(fb => fb.courseId?._id === filters.courseId);
    }
    if (filters.semester) {
      result = result.filter(fb => fb.semester === parseInt(filters.semester));
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(fb => 
        fb.comment?.toLowerCase().includes(term) ||
        fb.studentRegNumber?.toLowerCase().includes(term)
      );
    }
    setFilteredFeedbacks(result);
  }, [filters, allFeedbacks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const renderStars = (score) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

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
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and filter all feedback submitted by students</p>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="searchTerm"
              placeholder="Search comments or Reg No..."
              value={filters.searchTerm}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            name="facultyId"
            value={filters.facultyId}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Faculty</option>
            {facultyList.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <select
            name="courseId"
            value={filters.courseId}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courseList.map(c => <option key={c._id} value={c._id}>{c.courseName}</option>)}
          </select>
          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesterList.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeedbacks.map((feedback) => (
          <motion.div
            key={feedback._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{feedback.facultyId?.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feedback.courseId?.courseName} • Semester {feedback.semester}
                </p>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(feedback.averageScore)}`}>
                {feedback.averageScore.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
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
              <div className="sm:col-span-2">
                <p className="text-sm font-medium mb-1">Student Engagement</p>
                {renderStars(feedback.feedbackScores.studentEngagement)}
              </div>
            </div>

            {feedback.comment && (
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex-grow">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{feedback.comment}"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
              <span>Reg No: {feedback.studentRegNumber}</span>
              <span>{new Date(feedback.submittedAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}

        {filteredFeedbacks.length === 0 && (
          <div className="lg:col-span-2 xl:col-span-3 text-center py-16 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">No feedback found</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewFeedback;
