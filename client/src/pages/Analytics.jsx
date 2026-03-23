import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  Area,
} from 'recharts';
import { Building2, Users, BookOpen, Award, Sparkles, Radar, Activity } from 'lucide-react';
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

  const totalFaculty = analytics.reduce((sum, d) => sum + d.facultyCount, 0);
  const totalCourses = analytics.reduce((sum, d) => sum + d.courseCount, 0);
  const totalFeedback = analytics.reduce((sum, d) => sum + d.feedbackCount, 0);
  const avgScore = analytics.length > 0 ? (analytics.reduce((sum, d) => sum + d.averageScore, 0) / analytics.length).toFixed(2) : 0;
  const topDepartment = analytics.reduce((best, current) => (!best || current.averageScore > best.averageScore ? current : best), null);
  const watchDepartment = analytics.reduce((worst, current) => (!worst || current.averageScore < worst.averageScore ? current : worst), null);
  const highestCoverage = analytics.reduce((best, current) => (!best || current.facultyCount > best.facultyCount ? current : best), null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const benchmarkScore = 4.2;

  const departmentSignals = useMemo(
    () =>
      analytics.map((dept) => ({
        ...dept,
        loadPerFaculty: dept.facultyCount ? Number((dept.courseCount / dept.facultyCount).toFixed(2)) : 0,
        feedbackDensity: dept.courseCount ? Number((dept.feedbackCount / dept.courseCount).toFixed(1)) : 0,
      })),
    [analytics]
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Institution Analytics"
        title="Compare departments with a sharper and more executive-ready analytics view."
        description="Track quality, delivery load, and feedback distribution with stronger visuals and faster decision signals for admin review."
        highlights={[
          { label: 'Departments', value: analytics.length },
          { label: 'Feedback Volume', value: totalFeedback },
          { label: 'Top Department', value: topDepartment?.departmentName || 'N/A', helper: `${topDepartment?.averageScore || 0} avg score` },
          { label: 'Watch Area', value: watchDepartment?.departmentName || 'N/A', helper: `${watchDepartment?.averageScore || 0} avg score` },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
              <p className="mt-2 text-3xl font-bold">{analytics.length}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Faculty</p>
              <p className="mt-2 text-3xl font-bold">{totalFaculty}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="mt-2 text-3xl font-bold">{totalCourses}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="mt-2 text-3xl font-bold">{avgScore}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="glass-card bg-gradient-to-br from-blue-50/80 to-white p-5 dark:from-blue-900/10 dark:to-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quality Leader</p>
              <p className="mt-2 text-xl font-black text-blue-600">{topDepartment?.departmentName || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Highest average score at {topDepartment?.averageScore || 0}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:from-emerald-900/10 dark:to-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coverage Strength</p>
              <p className="mt-2 text-xl font-black text-emerald-600">{highestCoverage?.departmentName || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {highestCoverage?.facultyCount || 0} faculty supporting delivery
              </p>
            </div>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-amber-50/80 to-white p-5 dark:from-amber-900/10 dark:to-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Attention Zone</p>
              <p className="mt-2 text-xl font-black text-amber-600">{watchDepartment?.departmentName || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Lowest average score at {watchDepartment?.averageScore || 0}
              </p>
            </div>
            <Radar className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Department Performance" subtitle="Average score by department with target and feedback overlays.">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="departmentName" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis yAxisId="left" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="averageScore" fill="#3b82f6" radius={[10, 10, 0, 0]} name="Avg Score" />
                <Line yAxisId="left" type="monotone" dataKey={() => benchmarkScore} stroke="#f59e0b" dot={false} strokeWidth={2} name="Target" />
                <Area yAxisId="right" type="monotone" dataKey="feedbackCount" fill="#bfdbfe" stroke="#60a5fa" fillOpacity={0.3} name="Feedback" />
              </ComposedChart>
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
                  innerRadius={55}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartPanel title="Delivery Load Matrix" subtitle="Compare course-to-faculty load with feedback density for each department.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentSignals}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="departmentName" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
              <Legend />
              <Bar dataKey="loadPerFaculty" fill="#10b981" radius={[10, 10, 0, 0]} name="Courses / Faculty" />
              <Bar dataKey="feedbackDensity" fill="#8b5cf6" radius={[10, 10, 0, 0]} name="Feedback / Course" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Executive Signals" subtitle="Fast reading cards for strategic department analysis.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Quality Benchmark</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {Number(avgScore) >= benchmarkScore ? 'Institution is above target' : 'Institution is below target'}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Benchmark score set at {benchmarkScore}.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Best Balanced Unit</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{topDepartment?.departmentName || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Strong score plus healthy feedback activity.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Review Focus</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{watchDepartment?.departmentName || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This department may need support planning or teaching review.</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-900/30 dark:bg-violet-900/10">
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Institution Pulse</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {totalFeedback > totalCourses ? 'Feedback flow is healthy relative to course volume.' : 'Feedback collection may need stronger participation follow-up.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ChartPanel>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h3 className="mb-6 text-xl font-semibold">Department Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">HOD</th>
                <th className="px-4 py-3 text-center">Faculty</th>
                <th className="px-4 py-3 text-center">Courses</th>
                <th className="px-4 py-3 text-center">Feedback</th>
                <th className="px-4 py-3 text-center">Avg Score</th>
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
                  <td className="px-4 py-4 font-semibold">{dept.departmentName}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{dept.hodName}</td>
                  <td className="px-4 py-4 text-center">{dept.facultyCount}</td>
                  <td className="px-4 py-4 text-center">{dept.courseCount}</td>
                  <td className="px-4 py-4 text-center">{dept.feedbackCount}</td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        dept.averageScore >= 4.5
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : dept.averageScore >= 4
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : dept.averageScore >= 3
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
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
