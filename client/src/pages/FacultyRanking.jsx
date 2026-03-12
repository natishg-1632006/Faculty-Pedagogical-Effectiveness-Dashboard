import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Filter } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';

const FacultyRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [semester]);

  const fetchRankings = async () => {
    try {
      const { data } = await hodAPI.getFacultyRanking(semester);
      setRankings(data);
    } catch (error) {
      toast.error('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (index === 1) return <Medal className="w-8 h-8 text-gray-400" />;
    if (index === 2) return <Award className="w-8 h-8 text-orange-600" />;
    return <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>;
  };

  const getRankBadge = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-blue-500 to-indigo-600';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Faculty Ranking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Performance leaderboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {rankings.slice(0, 3).map((faculty, index) => (
          <motion.div
            key={faculty.facultyId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card p-6 text-center ${index === 0 ? 'md:order-2 transform md:scale-110' : index === 1 ? 'md:order-1' : 'md:order-3'}`}
          >
            <div className="flex justify-center mb-4">
              {getRankIcon(index)}
            </div>
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${getRankBadge(index)} flex items-center justify-center text-white text-2xl font-bold`}>
              {faculty.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold mb-1">{faculty.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{faculty.email}</p>
            <div className="text-4xl font-bold text-blue-600 mb-2">{faculty.averageScore}</div>
            <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
          </motion.div>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6">Complete Rankings</h2>
        <div className="space-y-3">
          {rankings.map((faculty, index) => (
            <motion.div
              key={faculty.facultyId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                index < 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="w-12 flex justify-center">
                {index < 3 ? (
                  getRankIcon(index)
                ) : (
                  <span className="text-xl font-bold text-gray-500">#{index + 1}</span>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full ${getRankBadge(index)} flex items-center justify-center text-white font-bold`}>
                {faculty.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{faculty.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{faculty.email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{faculty.averageScore}</p>
                <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
              </div>
              <div className="w-32">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${(faculty.averageScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No rankings available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyRanking;
