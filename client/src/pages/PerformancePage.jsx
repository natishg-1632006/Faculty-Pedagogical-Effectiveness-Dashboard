import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';

const PerformancePage = () => {
  const [performance, setPerformance] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, rankRes, lowRes] = await Promise.all([
        hodAPI.getDepartmentPerformance(),
        hodAPI.getFacultyRanking(),
        hodAPI.getLowPerformers()
      ]);
      setPerformance(perfRes.data);
      setRankings(rankRes.data);
      setLowPerformers(lowRes.data);
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

  const avgScore = rankings.length > 0
    ? (rankings.reduce((sum, r) => sum + parseFloat(r.averageScore), 0) / rankings.length).toFixed(2)
    : 0;

  const performanceData = rankings.slice(0, 10).map(r => ({
    name: r.name.split(' ')[0],
    score: parseFloat(r.averageScore)
  }));

  const distributionData = [
    { name: 'Excellent (4.5-5)', value: rankings.filter(r => r.averageScore >= 4.5).length, color: '#10b981' },
    { name: 'Good (4-4.5)', value: rankings.filter(r => r.averageScore >= 4 && r.averageScore < 4.5).length, color: '#3b82f6' },
    { name: 'Average (3-4)', value: rankings.filter(r => r.averageScore >= 3 && r.averageScore < 4).length, color: '#f59e0b' },
    { name: 'Poor (<3)', value: rankings.filter(r => r.averageScore < 3).length, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Department Performance</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive analytics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Faculty</p>
              <p className="text-3xl font-bold mt-2">{rankings.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Users className="w-8 h-8 text-white" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</p>
              <p className="text-3xl font-bold mt-2">{avgScore}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Award className="w-8 h-8 text-white" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Top Performers</p>
              <p className="text-3xl font-bold mt-2">{rankings.filter(r => r.averageScore >= 4.5).length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Need Attention</p>
              <p className="text-3xl font-bold mt-2">{lowPerformers.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6">Faculty Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Low Performers Alert */}
      {lowPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-red-600">Faculty Requiring Immediate Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowPerformers.map((faculty) => (
              <div key={faculty.facultyId} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-700">
                <p className="font-semibold text-lg">{faculty.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">{faculty.averageScore}</span>
                  <span className="text-xs text-gray-500">{faculty.feedbackCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Top 5 Performers
        </h3>
        <div className="space-y-3">
          {rankings.slice(0, 5).map((faculty, index) => (
            <div key={faculty.facultyId} className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{faculty.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faculty.email}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{faculty.averageScore}</p>
                <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PerformancePage;
