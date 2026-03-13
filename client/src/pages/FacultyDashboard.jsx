import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, BookOpen, Award, Target } from 'lucide-react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const FacultyDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, trendRes] = await Promise.all([
        facultyAPI.getDashboard(),
        facultyAPI.getSemesterTrend()
      ]);
      setDashboard(dashboardRes.data);
      setTrend(trendRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const radarData = dashboard?.feedbacks.slice(0, 1).map(fb => [
    { subject: 'Content', score: fb.feedbackScores.contentKnowledge },
    { subject: 'Methodology', score: fb.feedbackScores.teachingMethodology },
    { subject: 'Communication', score: fb.feedbackScores.communication },
    { subject: 'Punctuality', score: fb.feedbackScores.punctuality },
    { subject: 'Engagement', score: fb.feedbackScores.studentEngagement },
  ])[0] || [];
  const scoreGap = dashboard ? Number(((dashboard?.overallAverage || 0) - (dashboard?.departmentAverage || 0)).toFixed(2)) : 0;
  const latestTrend = trend.length ? trend[trend.length - 1]?.averageScore : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Faculty Insights"
        title="Track your teaching performance with clearer momentum and benchmark signals."
        description="You can now compare your current standing, latest semester trajectory, and feedback depth from a single view."
        highlights={[
          { label: 'Overall Score', value: dashboard?.overallAverage || 0 },
          { label: 'Vs Department', value: `${scoreGap > 0 ? '+' : ''}${scoreGap}`, helper: 'difference from department average' },
          { label: 'Latest Trend', value: latestTrend || 0, helper: 'most recent semester score' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Overall Score</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.overallAverage || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Dept Average</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.departmentAverage || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Courses</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.courses.length || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Feedbacks</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.feedbacks.length || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Semester-wise Trend" subtitle="Follow performance movement across semesters.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="semester" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
              <Line type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Performance Radar" subtitle="Quick view of your strongest and weakest teaching dimensions.">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
            </RadarChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-6">Recent Feedback Comments</h3>
        <div className="space-y-4">
          {dashboard?.feedbacks.slice(0, 5).map((feedback, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{feedback.courseId?.courseName}</p>
                <span className="text-sm font-bold text-blue-600">{feedback.averageScore.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feedback.comment || 'No comment provided'}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {dashboard?.metrics.length > 0 && dashboard.metrics[0].suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-blue-50 dark:bg-blue-900/20"
        >
          <h3 className="text-xl font-semibold mb-4">Improvement Suggestions</h3>
          <ul className="space-y-2">
            {dashboard.metrics[0].suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default FacultyDashboard;
