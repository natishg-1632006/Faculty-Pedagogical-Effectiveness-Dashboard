import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, ComposedChart, Area, Line, ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceArea, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Trophy, TrendingDown, Users, Award, Send, MessageSquare, X, Filter, RefreshCw, TrendingUp, Search, ShieldAlert, Target } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const HODDashboard = () => {
  const [ranking, setRanking] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all'); // 'all' or 'specific'
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [sending, setSending] = useState(false);
  const [semester, setSemester] = useState('all');
  const [radarData, setRadarData] = useState([]);
  const [deptAverage, setDeptAverage] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [facultySearch, setFacultySearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [semester]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const semParam = semester === 'all' ? '' : semester;
      const [rankingRes, lowPerformersRes, perfRes] = await Promise.all([
        hodAPI.getFacultyRanking(semParam),
        hodAPI.getLowPerformers(),
        hodAPI.getDepartmentPerformance()
      ]);
      setRanking(rankingRes.data);
      setLowPerformers(lowPerformersRes.data);

      // Calculate Department Average
      if (rankingRes.data.length > 0) {
        const total = rankingRes.data.reduce((acc, curr) => acc + parseFloat(curr.averageScore), 0);
        setDeptAverage((total / rankingRes.data.length).toFixed(2));
      } else {
        setDeptAverage(0);
      }

      // Process Radar Data
      const feedbacks = perfRes.data.feedbacks || [];
      setFeedbacks(feedbacks.filter((fb) => semester === 'all' || fb.semester.toString() === semester));
      const categories = {
        'contentKnowledge': 'Knowledge',
        'teachingMethodology': 'Methodology',
        'communication': 'Communication',
        'punctuality': 'Punctuality',
        'studentEngagement': 'Engagement'
      };
      const totals = { ...categories };
      const counts = { ...categories };
      // Reset values
      Object.keys(categories).forEach(k => { totals[k] = 0; counts[k] = 0; });

      feedbacks.forEach(fb => {
        if (semester !== 'all' && fb.semester.toString() !== semester) return;
        if (!fb.feedbackScores) return;
        
        Object.keys(categories).forEach(key => {
          if (fb.feedbackScores[key]) {
            totals[key] += fb.feedbackScores[key];
            counts[key]++;
          }
        });
      });

      const processedRadar = Object.keys(categories).map(key => ({
        subject: categories[key],
        A: counts[key] ? Number((totals[key] / counts[key]).toFixed(2)) : 0,
        fullMark: 5
      }));
      setRadarData(processedRadar);

    } catch (error) {
      console.error('Fetch Data Error:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const performanceSpread = ranking.length > 1
    ? Number((parseFloat(ranking[0].averageScore) - parseFloat(ranking[ranking.length - 1].averageScore)).toFixed(2))
    : 0;
  const topPerformer = ranking[0] || null;
  const strongestSkill = radarData.reduce((best, current) => (current.A > (best?.A ?? -1) ? current : best), null);
  const supportSkill = radarData.reduce((lowest, current) => (current.A < (lowest?.A ?? Infinity) ? current : lowest), null);

  const monthlyTrend = useMemo(() => {
    const groups = {};
    feedbacks.forEach((fb) => {
      const date = new Date(fb.submittedAt || fb.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { date: key, scoreSum: 0, count: 0 };
      groups[key].scoreSum += fb.averageScore;
      groups[key].count += 1;
    });

    return Object.values(groups)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        month: new Date(item.date).toLocaleDateString('default', { month: 'short', year: '2-digit' }),
        avgScore: Number((item.scoreSum / item.count).toFixed(2)),
        volume: item.count,
      }));
  }, [feedbacks]);

  const facultyImpactData = useMemo(() => (
    ranking
      .filter((faculty) => faculty.feedbackCount > 0)
      .map((faculty) => ({
        x: faculty.feedbackCount,
        y: Number(faculty.averageScore),
        z: Math.max(faculty.feedbackCount * 12, 100),
        name: faculty.name,
      }))
  ), [ranking]);

  const impactAverageCount = useMemo(() => {
    if (!facultyImpactData.length) return 1;
    return Number((facultyImpactData.reduce((sum, item) => sum + item.x, 0) / facultyImpactData.length).toFixed(1));
  }, [facultyImpactData]);

  const radialTierData = useMemo(() => ([
    { name: 'Elite', value: ranking.filter((item) => Number(item.averageScore) >= 4.5).length, fill: '#10b981' },
    { name: 'Strong', value: ranking.filter((item) => Number(item.averageScore) >= 4 && Number(item.averageScore) < 4.5).length, fill: '#3b82f6' },
    { name: 'Watch', value: ranking.filter((item) => Number(item.averageScore) >= 3 && Number(item.averageScore) < 4).length, fill: '#f59e0b' },
    { name: 'Risk', value: ranking.filter((item) => Number(item.averageScore) < 3 && item.feedbackCount > 0).length, fill: '#ef4444' },
  ]), [ranking]);

  const analysisMatrix = useMemo(() => ([
    {
      title: 'Department Momentum',
      value: monthlyTrend.length > 1 ? Number((monthlyTrend.at(-1).avgScore - monthlyTrend.at(-2).avgScore).toFixed(2)) : 0,
      accent: 'from-emerald-500 to-green-600',
      status: monthlyTrend.length > 1 && monthlyTrend.at(-1).avgScore >= monthlyTrend.at(-2).avgScore ? 'Improving' : 'Watch',
      note: 'Change between the last two available months.',
    },
    {
      title: 'Performance Spread',
      value: performanceSpread,
      accent: 'from-sky-500 to-cyan-600',
      status: performanceSpread <= 1 ? 'Balanced' : 'Wide',
      note: 'Gap between the highest and lowest faculty scores.',
    },
    {
      title: 'Strongest Skill',
      value: strongestSkill?.subject || 'N/A',
      accent: 'from-violet-500 to-purple-600',
      status: strongestSkill?.A >= 4 ? 'Strong' : 'Moderate',
      note: `${strongestSkill?.A || 0}/5 department average`,
    },
    {
      title: 'Support Area',
      value: supportSkill?.subject || 'N/A',
      accent: 'from-rose-500 to-red-600',
      status: lowPerformers.length <= 2 ? 'Controlled' : 'Priority',
      note: `${lowPerformers.length} faculty currently need attention`,
    },
  ]), [monthlyTrend, performanceSpread, strongestSkill, supportSkill, lowPerformers.length]);

  const actionBoard = useMemo(() => {
    const latestMomentum = monthlyTrend.length > 1
      ? Number((monthlyTrend.at(-1).avgScore - monthlyTrend.at(-2).avgScore).toFixed(2))
      : 0;

    return [
      {
        title: 'Review Risk Faculty',
        state: lowPerformers.length > 0 ? 'Priority' : 'Stable',
        accent: lowPerformers.length > 0 ? 'from-rose-500 to-red-600' : 'from-emerald-500 to-green-600',
        summary: lowPerformers.length > 0
          ? `${lowPerformers.length} faculty are below the safe threshold.`
          : 'No urgent low-performance cases detected.',
      },
      {
        title: 'Track Momentum',
        state: latestMomentum >= 0 ? 'Positive' : 'Declining',
        accent: latestMomentum >= 0 ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-orange-600',
        summary: latestMomentum >= 0
          ? `Department moved by +${latestMomentum} in the latest period.`
          : `Department moved by ${latestMomentum} in the latest period.`,
      },
      {
        title: 'Skill Intervention',
        state: supportSkill?.A >= 3.5 ? 'Monitor' : 'Act Now',
        accent: supportSkill?.A >= 3.5 ? 'from-sky-500 to-cyan-600' : 'from-violet-500 to-purple-600',
        summary: `${supportSkill?.subject || 'Support area'} is the weakest teaching dimension.`,
      },
    ];
  }, [lowPerformers.length, monthlyTrend, supportSkill]);

  const filteredFaculty = useMemo(() => {
    const term = facultySearch.trim().toLowerCase();
    if (!term) return ranking.slice(0, 8);
    return ranking
      .filter((faculty) =>
        faculty.name.toLowerCase().includes(term) ||
        faculty.email.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [facultySearch, ranking]);

  const ImpactTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{point.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Feedback volume: {point.x}</p>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Average score: {point.y}</p>
        </div>
      );
    }
    return null;
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyMessage.trim()) return toast.error('Message is required');
    if (recipientType === 'specific' && selectedFaculty.length === 0) return toast.error('Select at least one faculty');

    setSending(true);
    try {
      await hodAPI.sendNotification({
        recipientType,
        facultyIds: selectedFaculty,
        message: notifyMessage
      });
      toast.success('Notification sent successfully');
      setShowNotifyModal(false);
      setNotifyMessage('');
      setSelectedFaculty([]);
      setRecipientType('all');
    } catch (error) {
      console.error('Notification Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to send notification');
    } finally {
      setSending(false);
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
      <PageHero
        eyebrow="Department Command Center"
        title="Run the department with clearer ranking, risk, and skill-distribution signals."
        description="This dashboard now surfaces department average, leaderboard spread, and attention zones before you drill into the details."
        highlights={[
          { label: 'Department Avg', value: deptAverage || 0 },
          { label: 'Performance Spread', value: performanceSpread, helper: 'gap between top and bottom faculty' },
          { label: 'Attention Count', value: lowPerformers.length, helper: 'faculty below threshold' },
          { label: 'Top Performer', value: topPerformer?.name || 'N/A', helper: `${topPerformer?.averageScore || 0} avg` },
        ]}
        actions={
          <button onClick={() => setShowNotifyModal(true)} className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg shadow-blue-500/30">
            <Send className="w-4 h-4" />
            Notify Faculty
          </button>
        }
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HOD Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Department Performance Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button onClick={fetchData} className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 shadow-sm transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-8 h-8 text-white" />
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Dept. Average</p>
              <p className="text-3xl font-bold mt-2">{deptAverage}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">Top Performer</p>
              <p className="text-xl font-bold mt-2">{ranking[0]?.name || 'N/A'}</p>
              <p className="text-sm text-green-600">{ranking[0]?.averageScore || 0} avg</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Trophy className="w-8 h-8 text-white" />
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
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
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <TrendingDown className="w-8 h-8 text-white" />
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.95fr] gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="2026 Department Pulse" subtitle="A premium trend panel for score momentum and feedback movement.">
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="hodVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#dbeafe" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="hodScore" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId="left" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }} />
                  <Area yAxisId="right" type="monotone" dataKey="volume" name="Feedback Volume" fill="url(#hodVolume)" stroke="#3b82f6" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Average Score" stroke="url(#hodScore)" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Analysis Matrix" subtitle="Quick decision signals for planning actions and interventions.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysisMatrix.map((item) => (
                <div key={item.title} className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-5 shadow-sm">
                  <div className={`inline-flex rounded-full bg-gradient-to-r ${item.accent} px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white`}>
                    {item.status}
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                  <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{item.note}</p>
                </div>
              ))}
            </div>
          </ChartPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ChartPanel title="Smart Action Board" subtitle="A quick priority queue generated from the current department data.">
            <div className="space-y-4">
              {actionBoard.map((item) => (
                <div key={item.title} className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.summary}</p>
                    </div>
                    <div className={`rounded-full bg-gradient-to-r ${item.accent} px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white`}>
                      {item.state}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ChartPanel title="Quick Faculty Finder" subtitle="Search and scan faculty performance without leaving the dashboard.">
            <div className="mb-4 relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search by faculty name or email..."
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-11 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-3">
              {filteredFaculty.length > 0 ? filteredFaculty.map((faculty) => (
                <div key={faculty.facultyId} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/70 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{faculty.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{faculty.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${Number(faculty.averageScore) >= 4 ? 'text-emerald-600' : Number(faculty.averageScore) >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {faculty.averageScore}
                    </p>
                    <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500">
                  No faculty match your search.
                </div>
              )}
            </div>
          </ChartPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Faculty Ranking Leaderboard" subtitle="Top department performers with faster visual comparison.">
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
                } shadow-lg shadow-gray-400/20`}>
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
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <ChartPanel title="Performance Distribution" subtitle="Compare top faculty scores with upgraded visual hierarchy.">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fill: '#6b7280'}} />
                <YAxis tick={{fill: '#6b7280'}} domain={[0, 5]} />
                <ReferenceLine y={Number(deptAverage)} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Dept Avg', position: 'insideTopRight', fill: '#10b981', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="averageScore" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {ranking.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </ChartPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ChartPanel title="Faculty Impact Matrix" subtitle="See which faculty combine higher student reach with stronger scores.">
            <div className="h-[360px]">
              {facultyImpactData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                    <defs>
                      <linearGradient id="hodImpactFill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <ReferenceArea x1={0} x2={impactAverageCount} y1={0} y2={4} fill="#fee2e2" fillOpacity={0.35} />
                    <ReferenceArea x1={impactAverageCount} x2={Math.max(impactAverageCount * 3, impactAverageCount + 5, 10)} y1={0} y2={4} fill="#fef3c7" fillOpacity={0.28} />
                    <ReferenceArea x1={0} x2={impactAverageCount} y1={4} y2={5} fill="#dbeafe" fillOpacity={0.35} />
                    <ReferenceArea x1={impactAverageCount} x2={Math.max(impactAverageCount * 3, impactAverageCount + 5, 10)} y1={4} y2={5} fill="#dcfce7" fillOpacity={0.35} />
                    <XAxis type="number" dataKey="x" name="Feedback Count" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="y" name="Average Score" domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <ReferenceLine x={impactAverageCount} stroke="#64748b" strokeDasharray="4 4" />
                    <ReferenceLine y={4} stroke="#10b981" strokeDasharray="4 4" />
                    <ZAxis type="number" dataKey="z" range={[120, 900]} />
                    <Tooltip content={<ImpactTooltip />} cursor={{ strokeDasharray: '4 4' }} />
                    <Scatter data={facultyImpactData} fill="url(#hodImpactFill)" fillOpacity={0.9} stroke="#0284c7" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">No impact data available</div>
              )}
            </div>
          </ChartPanel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ChartPanel title="Talent Distribution" subtitle="Advanced tier view for department quality bands.">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="18%" outerRadius="95%" barSize={18} data={radialTierData} startAngle={180} endAngle={-180}>
                  <RadialBar background clockWise dataKey="value" cornerRadius={12}>
                    {radialTierData.map((entry, index) => <Cell key={`tier-${index}`} fill={entry.fill} />)}
                  </RadialBar>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(15,23,42,0.12)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {radialTierData.map((item) => (
                <div key={item.name} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                    </div>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <ChartPanel title="Department Skills Analysis" subtitle="Radar view of departmental teaching strengths and gaps.">
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar name="Department" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          </ChartPanel>
        </motion.div>

        {lowPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 lg:col-span-2 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-transparent to-transparent dark:from-red-900/5 pointer-events-none" />
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-red-600">
            <TrendingDown className="w-6 h-6" />
            Faculty Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowPerformers.map((faculty) => (
              <div key={faculty.facultyId} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-xl flex justify-between items-center group hover:shadow-md transition-all">
                <div>
                <p className="font-semibold">{faculty.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{faculty.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-red-600 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm block">{faculty.averageScore}</span>
                  <span className="text-xs text-gray-500">{faculty.feedbackCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Send Notification
              </h2>
              <button onClick={() => setShowNotifyModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Recipients</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="recipientType" 
                      value="all" 
                      checked={recipientType === 'all'}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500" 
                    />
                    <span>All Department Faculty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="recipientType" 
                      value="specific" 
                      checked={recipientType === 'specific'}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500" 
                    />
                    <span>Specific Faculty</span>
                  </label>
                </div>

                {recipientType === 'specific' && (
                  <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                    {ranking.map(faculty => (
                      <label key={faculty.facultyId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
                        <input
                          type="checkbox"
                          value={faculty.facultyId}
                          checked={selectedFaculty.includes(faculty.facultyId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFaculty([...selectedFaculty, faculty.facultyId]);
                            } else {
                              setSelectedFaculty(selectedFaculty.filter(id => id !== faculty.facultyId));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{faculty.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={sending} className="w-full btn-primary flex items-center justify-center gap-2">
                  {sending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Notification</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
