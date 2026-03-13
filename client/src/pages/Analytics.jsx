import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, Users, BookOpen, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const Analytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await adminAPI.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
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

  const totalFaculty = analytics.reduce((sum, d) => sum + d.facultyCount, 0);
  const totalCourses = analytics.reduce((sum, d) => sum + d.courseCount, 0);
  const totalFeedback = analytics.reduce((sum, d) => sum + d.feedbackCount, 0);
  const avgScore = analytics.length > 0 ? (analytics.reduce((sum, d) => sum + d.averageScore, 0) / analytics.length).toFixed(2) : 0;
  const topDepartment = analytics.reduce((best, current) => (!best || current.averageScore > best.averageScore ? current : best), null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Institution Analytics"
        title="Compare departments with a sharper, decision-ready analytics view."
        description="This dashboard now highlights coverage, teaching quality, and the strongest department signal in one place."
        highlights={[
          { label: 'Departments', value: analytics.length },
          { label: 'Feedback Volume', value: totalFeedback },
          { label: 'Top Department', value: topDepartment?.departmentName || 'N/A', helper: `${topDepartment?.averageScore || 0} avg score` },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Departments</p>
              <p className="text-3xl font-bold mt-2">{analytics.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Faculty</p>
              <p className="text-3xl font-bold mt-2">{totalFaculty}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Courses</p>
              <p className="text-3xl font-bold mt-2">{totalCourses}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</p>
              <p className="text-3xl font-bold mt-2">{avgScore}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Department Performance" subtitle="Average score by department with a cleaner comparison scale.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="departmentName" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
              <Legend />
              <Bar dataKey="averageScore" fill="#3b82f6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Faculty Distribution" subtitle="Department share of faculty strength across the institution.">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ departmentName, facultyCount }) => `${departmentName}: ${facultyCount}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="facultyCount"
              >
                {analytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
            </PieChart>
          </ResponsiveContainer>
          </ChartPanel>
        </motion.div>
      </div>

      {/* Department Details Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-6">Department Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Department</th>
                <th className="text-left py-3 px-4">HOD</th>
                <th className="text-center py-3 px-4">Faculty</th>
                <th className="text-center py-3 px-4">Courses</th>
                <th className="text-center py-3 px-4">Feedback</th>
                <th className="text-center py-3 px-4">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((dept, index) => (
                <motion.tr
                  key={dept.departmentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-4 px-4 font-semibold">{dept.departmentName}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{dept.hodName}</td>
                  <td className="py-4 px-4 text-center">{dept.facultyCount}</td>
                  <td className="py-4 px-4 text-center">{dept.courseCount}</td>
                  <td className="py-4 px-4 text-center">{dept.feedbackCount}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      dept.averageScore >= 4.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      dept.averageScore >= 4 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      dept.averageScore >= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {dept.averageScore || 'N/A'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
