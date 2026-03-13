import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, BookOpen, TrendingUp, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getSystemStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers, color: 'from-blue-500 to-blue-600' },
    { icon: Users, label: 'Faculty', value: stats?.facultyCount, color: 'from-green-500 to-green-600' },
    { icon: Users, label: 'HODs', value: stats?.hodCount, color: 'from-purple-500 to-purple-600' },
    { icon: Building2, label: 'Departments', value: stats?.departmentCount, color: 'from-orange-500 to-orange-600' },
    { icon: BookOpen, label: 'Courses', value: stats?.courseCount, color: 'from-pink-500 to-pink-600' },
    { icon: Users, label: 'Admins', value: stats?.adminCount, color: 'from-red-500 to-red-600' },
  ];
  const userMixData = [
    { name: 'Faculty', value: stats?.facultyCount || 0, color: '#10b981' },
    { name: 'HODs', value: stats?.hodCount || 0, color: '#8b5cf6' },
    { name: 'Admins', value: stats?.adminCount || 0, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const adminSignals = [
    {
      label: 'Faculty Coverage',
      value: stats?.totalUsers ? `${Math.round(((stats?.facultyCount || 0) / stats.totalUsers) * 100)}%` : '0%',
      helper: 'share of users who are faculty',
    },
    {
      label: 'Dept Density',
      value: stats?.departmentCount ? `${((stats?.courseCount || 0) / stats.departmentCount).toFixed(1)}` : '0.0',
      helper: 'average courses per department',
    },
    {
      label: 'Leadership Layer',
      value: (stats?.hodCount || 0) + (stats?.adminCount || 0),
      helper: 'admin + HOD management roles',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin Control Center"
        title="Monitor the platform with a cleaner system-wide command dashboard."
        description="This upgraded view surfaces platform scale, user mix, and admin actions in a more advanced and faster-to-scan layout."
        highlights={[
          { label: 'Total Users', value: stats?.totalUsers || 0 },
          { label: 'Departments', value: stats?.departmentCount || 0 },
          { label: 'Courses', value: stats?.courseCount || 0 },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value || 0}</p>
              </div>
              <div className={`p-4 bg-gradient-to-br ${card.color} rounded-xl`}>
                <card.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Quick Actions" subtitle="Jump straight into the most common admin tasks.">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <button onClick={() => navigate('/admin/users')} className="w-full btn-primary text-left flex items-center justify-between">
                <span>Add New User</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/admin/departments')} className="w-full btn-secondary text-left flex items-center justify-between">
                <span>Create Department</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/admin/courses')} className="w-full btn-secondary text-left flex items-center justify-between">
                <span>Add Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/admin/analytics')} className="w-full btn-secondary text-left flex items-center justify-between">
                <span>Open Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </ChartPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <ChartPanel title="User Role Mix" subtitle="Current distribution of platform management and teaching accounts.">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-center">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userMixData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={4}>
                    {userMixData.map((entry, index) => (
                      <Cell key={`mix-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {userMixData.map((item) => (
                <div key={item.name} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                    </div>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Admin Signals" subtitle="Extra operational indicators to help spot system scale and balance.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adminSignals.map((signal) => (
              <div key={signal.label} className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-5 shadow-sm">
                <div className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Insight
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{signal.label}</p>
                <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{signal.value}</p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{signal.helper}</p>
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>
    </div>
  );
};

export default AdminDashboard;
