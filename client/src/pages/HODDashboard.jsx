import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Trophy, TrendingDown, Users, Award } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';

const HODDashboard = () => {
  const [ranking, setRanking] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rankingRes, lowPerformersRes] = await Promise.all([
        hodAPI.getFacultyRanking(),
        hodAPI.getLowPerformers()
      ]);
      setRanking(rankingRes.data);
      setLowPerformers(lowPerformersRes.data);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HOD Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Department Performance Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Faculty</p>
              <p className="text-3xl font-bold mt-2">{ranking.length}</p>
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Top Performer</p>
              <p className="text-xl font-bold mt-2">{ranking[0]?.name || 'N/A'}</p>
              <p className="text-sm text-green-600">{ranking[0]?.averageScore || 0} avg</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Trophy className="w-8 h-8 text-white" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Need Attention</p>
              <p className="text-3xl font-bold mt-2">{lowPerformers.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Faculty Ranking Leaderboard
          </h3>
          <div className="space-y-3">
            {ranking.slice(0, 5).map((faculty, index) => (
              <div key={faculty.facultyId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-blue-500'
                }`}>
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageScore" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {lowPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-red-600">
            <TrendingDown className="w-6 h-6" />
            Faculty Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowPerformers.map((faculty) => (
              <div key={faculty.facultyId} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold">{faculty.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{faculty.email}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">{faculty.averageScore}</span>
                  <span className="text-xs text-gray-500">{faculty.feedbackCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HODDashboard;
