import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target, BookOpen, MessageSquare } from 'lucide-react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const FacultyPerformance = () => {
  const [dashboard, setDashboard] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [semesterTrend, setSemesterTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, subjectRes, trendRes] = await Promise.all([
        facultyAPI.getDashboard(),
        facultyAPI.getSubjectPerformance(),
        facultyAPI.getSemesterTrend()
      ]);
      setDashboard(dashRes.data);
      setSubjectPerformance(subjectRes.data);
      setSemesterTrend(trendRes.data);
    } catch (error) {
      toast.error('Failed to load performance data');
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

  const radarData = dashboard?.parameterScores?.map(p => ({
    parameter: p.parameter,
    score: p.score,
    fullMark: 5
  })) || [];
  const strongestParameter = radarData.reduce((best, current) => (current.score > (best?.score ?? -1) ? current : best), null);
  const recentSemester = semesterTrend.length ? semesterTrend[semesterTrend.length - 1]?.score : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Personal Performance"
        title="Review your teaching quality with stronger visual signals and focused insight."
        description="This page now highlights your strongest parameter, current semester level, and score position with a cleaner chart system."
        highlights={[
          { label: 'Overall Score', value: dashboard?.overallScore || 0 },
          { label: 'Strongest Skill', value: strongestParameter?.parameter || 'N/A', helper: strongestParameter ? `${strongestParameter.score}/5` : 'no parameter data' },
          { label: 'Recent Semester', value: recentSemester || 0 },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Overall Score</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.overallScore || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Dept Average</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.departmentAverage || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Courses</p>
              <p className="text-3xl font-bold mt-2">{subjectPerformance.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Feedback Count</p>
              <p className="text-3xl font-bold mt-2">{dashboard?.feedbackCount || 0}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Parameter-wise Performance" subtitle="Dimension-level breakdown of your teaching effectiveness.">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="parameter" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
            </RadarChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Semester-wise Trend" subtitle="Performance movement over time with smoother visual emphasis.">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={semesterTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="semester" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>
      </div>

      {/* Subject Performance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <ChartPanel title="Subject-wise Performance" subtitle="Course-level performance comparison with clearer chart styling.">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectPerformance}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="courseName" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
            <Bar dataKey="averageScore" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </ChartPanel>
      </motion.div>

      {/* Improvement Suggestions */}
      {dashboard?.suggestions && dashboard.suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Improvement Suggestions
          </h3>
          <ul className="space-y-2">
            {dashboard.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default FacultyPerformance;
