import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceArea, LabelList, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, Filter, RefreshCw, LayoutDashboard, Calendar, BookOpen, Activity, Sparkles, Target, BrainCircuit, Gauge, ArrowUpRight } from 'lucide-react';
import { hodAPI } from '../services/api';
import toast from 'react-hot-toast';

const PerformancePage = () => {
  const [rankings, setRankings] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('all');
  const [year, setYear] = useState('all');
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFacultyForWaterfall, setSelectedFacultyForWaterfall] = useState('all');
  const [radarData, setRadarData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [semester, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await hodAPI.getDepartmentPerformance();
      const allFeedbacks = data.feedbacks || [];
      const allFaculty = data.faculty || [];

      // Filter Feedbacks by Semester and Year
      const filteredFeedbacks = allFeedbacks.filter(fb => {
        const matchesSemester = semester === 'all' || fb.semester.toString() === semester.toString();
        
        let matchesYear = true;
        if (year !== 'all') {
          const fbDate = new Date(fb.submittedAt || fb.createdAt);
          matchesYear = fbDate.getFullYear().toString() === year;
        }

        return matchesSemester && matchesYear;
      });

      setFeedbacks(filteredFeedbacks);

      // Calculate Rankings Client-Side based on filtered data
      const computedRankings = allFaculty.map(f => {
        const facultyFeedbacks = filteredFeedbacks.filter(fb => fb.facultyId._id === f._id);
        const totalScore = facultyFeedbacks.reduce((sum, fb) => sum + fb.averageScore, 0);
        const avg = facultyFeedbacks.length ? (totalScore / facultyFeedbacks.length) : 0;
        
        return {
          facultyId: f._id,
          name: f.name,
          email: f.email,
          averageScore: avg.toFixed(2),
          feedbackCount: facultyFeedbacks.length
        };
      }).sort((a, b) => b.averageScore - a.averageScore);

      setRankings(computedRankings);

      // Calculate Low Performers Client-Side
      const computedLowPerformers = computedRankings.filter(r => parseFloat(r.averageScore) < 3.0 && r.feedbackCount > 0);
      setLowPerformers(computedLowPerformers);

      // Process Radar Data from all feedbacks
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

      filteredFeedbacks.forEach(fb => {
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
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const waterfallData = useMemo(() => {
    const relevantFeedbacks = selectedFacultyForWaterfall === 'all' 
      ? feedbacks 
      : feedbacks.filter(fb => fb.facultyId._id === selectedFacultyForWaterfall);

    if (relevantFeedbacks.length === 0) return [];

    // Group by week
    const weeklyGroups = {};
    relevantFeedbacks.forEach(fb => {
      const date = new Date(fb.submittedAt || fb.createdAt);
      // Simple week number calculation
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
      const key = `${d.getUTCFullYear()}-W${weekNo}`;
      
      if (!weeklyGroups[key]) weeklyGroups[key] = { sum: 0, count: 0 };
      weeklyGroups[key].sum += fb.averageScore;
      weeklyGroups[key].count += 1;
    });

    const sortedWeeks = Object.keys(weeklyGroups).sort();
    let previousScore = 0;

    return sortedWeeks.map((week, index) => {
      const currentScore = weeklyGroups[week].sum / weeklyGroups[week].count;
      const change = index === 0 ? currentScore : currentScore - previousScore;
      
      let bottom = 0;
      let barHeight = 0;
      let color = '#3b82f6';

      if (index === 0) {
        bottom = 0;
        barHeight = currentScore;
        color = '#3b82f6'; // Start
      } else {
        bottom = change >= 0 ? previousScore : currentScore;
        barHeight = Math.abs(change);
        color = change >= 0 ? '#10b981' : '#ef4444'; // Green for up, Red for down
      }

      previousScore = currentScore;

      return {
        name: week,
        score: parseFloat(currentScore.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        bottom: parseFloat(bottom.toFixed(2)),
        barHeight: parseFloat(barHeight.toFixed(2)),
        fill: color
      };
    });
  }, [feedbacks, selectedFacultyForWaterfall]);

  const monthlyData = useMemo(() => {
    const groups = {};
    feedbacks.forEach(fb => {
      const d = new Date(fb.submittedAt || fb.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { date: key, scoreSum: 0, count: 0 };
      groups[key].scoreSum += fb.averageScore;
      groups[key].count += 1;
    });
    return Object.values(groups)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(g => ({
        month: new Date(g.date).toLocaleDateString('default', { month: 'short', year: '2-digit' }),
        avgScore: Number((g.scoreSum / g.count).toFixed(2)),
        volume: g.count
      }));
  }, [feedbacks]);

  const courseData = useMemo(() => {
    const groups = {};
    feedbacks.forEach(fb => {
      const name = fb.courseId?.courseName || 'Unknown';
      if (!groups[name]) groups[name] = { name, total: 0, count: 0 };
      groups[name].total += fb.averageScore;
      groups[name].count += 1;
    });
    return Object.values(groups)
      .map(c => ({ ...c, score: Number((c.total / c.count).toFixed(2)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [feedbacks]);

  const semesterBreakdownData = useMemo(() => {
    const groups = {};
    feedbacks.forEach((fb) => {
      const key = `Sem ${fb.semester || 'N/A'}`;
      if (!groups[key]) groups[key] = { semester: key, total: 0, count: 0 };
      groups[key].total += fb.averageScore;
      groups[key].count += 1;
    });

    return Object.values(groups)
      .sort((a, b) => a.semester.localeCompare(b.semester, undefined, { numeric: true }))
      .map((item) => ({
        semester: item.semester,
        avgScore: Number((item.total / item.count).toFixed(2)),
        feedbackCount: item.count,
      }));
  }, [feedbacks]);

  const recentTrendData = useMemo(() => monthlyData.slice(-6), [monthlyData]);

  const totalFeedbackCount = feedbacks.length;
  const topPerformer = rankings[0] || null;
  const bottomPerformer = rankings[rankings.length - 1] || null;

  const scoreSpread = useMemo(() => {
    if (rankings.length < 2) return 0;
    return Number((parseFloat(rankings[0].averageScore) - parseFloat(rankings[rankings.length - 1].averageScore)).toFixed(2));
  }, [rankings]);

  const consistencyIndex = useMemo(() => {
    if (!rankings.length) return 0;
    const scores = rankings.map((item) => parseFloat(item.averageScore));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + ((score - mean) ** 2), 0) / scores.length;
    const deviation = Math.sqrt(variance);
    return Number((5 - deviation).toFixed(2));
  }, [rankings]);

  const momentumDelta = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const previous = monthlyData[monthlyData.length - 2].avgScore;
    const current = monthlyData[monthlyData.length - 1].avgScore;
    return Number((current - previous).toFixed(2));
  }, [monthlyData]);

  const facultyImpactData = useMemo(() => (
    rankings
      .filter((faculty) => faculty.feedbackCount > 0)
      .map((faculty) => ({
        x: faculty.feedbackCount,
        y: Number(faculty.averageScore),
        z: Math.max(Number((faculty.feedbackCount * 10).toFixed(0)), 80),
        name: faculty.name,
      }))
  ), [rankings]);

  const strongestSkill = useMemo(() => {
    if (!radarData.length) return null;
    return radarData.reduce((best, current) => (current.A > best.A ? current : best), radarData[0]);
  }, [radarData]);

  const improvementSkill = useMemo(() => {
    if (!radarData.length) return null;
    return radarData.reduce((lowest, current) => (current.A < lowest.A ? current : lowest), radarData[0]);
  }, [radarData]);

  const strongestCourse = courseData[0] || null;
  const radialDistributionData = distributionData.map((item, index) => ({
    ...item,
    fill: item.color,
    sortOrder: distributionData.length - index
  }));
  const impactAverageCount = useMemo(() => {
    if (!facultyImpactData.length) return 0;
    return Number((facultyImpactData.reduce((sum, item) => sum + item.x, 0) / facultyImpactData.length).toFixed(1));
  }, [facultyImpactData]);
  const analysisMatrixData = useMemo(() => {
    const excellentCount = rankings.filter((item) => Number(item.averageScore) >= 4.5).length;
    const strongCount = rankings.filter((item) => Number(item.averageScore) >= 4 && Number(item.averageScore) < 4.5).length;
    const watchCount = rankings.filter((item) => Number(item.averageScore) >= 3 && Number(item.averageScore) < 4).length;

    return [
      {
        title: 'Department Quality',
        value: avgScore,
        accent: 'from-emerald-500 to-green-600',
        status: Number(avgScore) >= 4 ? 'Strong' : 'Needs push',
        summary: 'Overall teaching score across the selected filters.',
        recommendation: Number(avgScore) >= 4 ? 'Maintain current best practices and reward top performers.' : 'Run coaching cycles for low-performing faculty.',
      },
      {
        title: 'Performance Stability',
        value: consistencyIndex,
        accent: 'from-sky-500 to-cyan-600',
        status: consistencyIndex >= 4.2 ? 'Stable' : 'Uneven',
        summary: 'Shows how evenly faculty performance is distributed.',
        recommendation: consistencyIndex >= 4.2 ? 'Continue monthly monitoring.' : 'Use peer mentoring between strong and weak performers.',
      },
      {
        title: 'Attention Load',
        value: lowPerformers.length,
        accent: 'from-rose-500 to-red-600',
        status: lowPerformers.length <= 2 ? 'Controlled' : 'High',
        summary: `${watchCount} faculty are in the watch band.`,
        recommendation: lowPerformers.length <= 2 ? 'Focus on preventive support.' : 'Prioritize review plans for low-performing faculty.',
      },
      {
        title: 'Top Talent Pool',
        value: excellentCount,
        accent: 'from-violet-500 to-purple-600',
        status: excellentCount >= 3 ? 'Healthy' : 'Limited',
        summary: `${strongCount} more faculty are close to the elite band.`,
        recommendation: excellentCount >= 3 ? 'Use top faculty as internal exemplars.' : 'Create targeted growth goals for the strong band.',
      }
    ];
  }, [avgScore, consistencyIndex, lowPerformers.length, rankings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-700 dark:text-gray-200">{label}</p>
          <p className="text-blue-600 dark:text-blue-400 font-bold">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const WaterfallTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-gray-500">Average Score:</span>
              <span className="font-bold">{data.score}</span>
            </p>
            <p className={`flex justify-between gap-4 font-medium ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Weekly Change:</span>
              <span>{data.change > 0 ? '+' : ''}{data.change}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

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

  const DistributionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Faculty count: {item.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Department Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Deep dive into performance metrics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm text-sm"
              >
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm text-sm"
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.35),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.22),_transparent_28%)]" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Performance Intelligence Hub
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight md:text-4xl">See who is improving, who is stable, and where the department needs support.</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                This view now blends snapshot KPIs with trend momentum and an impact graph, so decisions can come from patterns instead of raw scores alone.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Trend Momentum</p>
                <p className={`mt-1 flex items-center gap-2 text-xl font-bold ${momentumDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {momentumDelta >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {momentumDelta > 0 ? '+' : ''}{momentumDelta}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Consistency Index</p>
                <p className="mt-1 text-xl font-bold text-cyan-200">{consistencyIndex}/5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Feedback Signals</p>
                <p className="mt-1 text-xl font-bold text-white">{totalFeedbackCount}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Best Skill</p>
                  <p className="font-semibold">{strongestSkill?.subject || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-3 text-2xl font-black">{strongestSkill?.A || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Needs Focus</p>
                  <p className="font-semibold">{improvementSkill?.subject || 'N/A'}</p>
                </div>
              </div>
              <p className="mt-3 text-2xl font-black">{improvementSkill?.A || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-sky-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Score Spread</p>
                  <p className="font-semibold">Top to Bottom</p>
                </div>
              </div>
              <p className="mt-3 text-2xl font-black">{scoreSpread}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full md:w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'faculty', label: 'Faculty', icon: Users },
          { id: 'courses', label: 'Courses', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-l-4 border-blue-500 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Total Faculty</p><p className="text-3xl font-bold mt-2">{rankings.length}</p></div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none"><Users className="w-6 h-6 text-blue-600" /></div>
              </div>
            </div>
            <div className="glass-card p-6 border-l-4 border-green-500 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Avg Score</p><p className="text-3xl font-bold mt-2">{avgScore}</p></div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-lg shadow-green-200 dark:shadow-none"><Award className="w-6 h-6 text-green-600" /></div>
              </div>
            </div>
            <div className="glass-card p-6 border-l-4 border-purple-500 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Top Performers</p><p className="text-3xl font-bold mt-2">{rankings.filter(r => r.averageScore >= 4.5).length}</p></div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
              </div>
            </div>
            <div className="glass-card p-6 border-l-4 border-red-500 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10">
              <div className="flex items-center justify-between">
                <div><p className="text-gray-500 text-sm">Need Attention</p><p className="text-3xl font-bold mt-2">{lowPerformers.length}</p></div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-lg shadow-red-200 dark:shadow-none"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-900/10 dark:to-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Recent Trend Pulse</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{recentTrendData.at(-1)?.avgScore || avgScore}</p>
                </div>
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentTrendData}>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} />
                    <Line type="monotone" dataKey="avgScore" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Last 6 months of average score movement.</p>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/10 dark:to-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Best Course Signal</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white line-clamp-1">{strongestCourse?.name || 'No course data'}</p>
                </div>
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Score</p>
                  <p className="text-3xl font-black text-violet-600">{strongestCourse?.score || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Feedback Count</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{strongestCourse?.count || 0}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Semester Coverage</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{semesterBreakdownData.length}</p>
                </div>
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-3">
                {semesterBreakdownData.slice(0, 4).map((item) => (
                  <div key={item.semester}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{item.semester}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.avgScore}</span>
                    </div>
                    <div className="h-2 rounded-full bg-amber-100 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${(item.avgScore / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/60 via-transparent to-blue-50/60 dark:from-cyan-500/5 dark:to-blue-500/10 pointer-events-none" />
              <div className="relative">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-cyan-600" />
                      Faculty Impact Matrix
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Compare average score against feedback volume to spot reliable high performers.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                    Bubble size = feedback count
                  </div>
                </div>
                <div className="h-[340px]">
                  {facultyImpactData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                        <defs>
                          <linearGradient id="impactFill" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <ReferenceArea x1={0} x2={impactAverageCount || 1} y1={0} y2={4} fill="#fee2e2" fillOpacity={0.42} />
                        <ReferenceArea x1={impactAverageCount || 1} x2={Math.max((impactAverageCount || 1) * 3, (impactAverageCount || 1) + 5, 10)} y1={0} y2={4} fill="#fef3c7" fillOpacity={0.3} />
                        <ReferenceArea x1={0} x2={impactAverageCount || 1} y1={4} y2={5} fill="#dbeafe" fillOpacity={0.42} />
                        <ReferenceArea x1={impactAverageCount || 1} x2={Math.max((impactAverageCount || 1) * 3, (impactAverageCount || 1) + 5, 10)} y1={4} y2={5} fill="#dcfce7" fillOpacity={0.42} />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Feedback Count"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Average Score"
                          domain={[0, 5]}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ReferenceLine x={impactAverageCount || 1} stroke="#64748b" strokeDasharray="4 4" />
                        <ReferenceLine y={4} stroke="#10b981" strokeDasharray="4 4" />
                        <ZAxis type="number" dataKey="z" range={[120, 900]} />
                        <Tooltip content={<ImpactTooltip />} cursor={{ strokeDasharray: '4 4' }} />
                        <Scatter data={facultyImpactData} fill="url(#impactFill)" fillOpacity={0.9} stroke="#0284c7" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">No impact data available</div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">High Score + High Volume</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Recognition and mentoring zone.</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Low Score + High Volume</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Highest urgency because more students are affected.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="glass-card p-6 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-900/10 dark:to-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold">Top Faculty Spotlight</h3>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{topPerformer?.name || 'No data'}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average score</p>
                    <p className="text-3xl font-bold text-emerald-600">{topPerformer?.averageScore || '0.00'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Reviews</p>
                    <p className="text-lg font-semibold">{topPerformer?.feedbackCount || 0}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className={`w-5 h-5 ${momentumDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <h3 className="text-lg font-semibold">Department Momentum</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compared with the previous available month in this filter window.
                </p>
                <p className={`mt-4 text-3xl font-black ${momentumDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {momentumDelta > 0 ? '+' : ''}{momentumDelta}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {momentumDelta >= 0 ? 'Performance is trending upward.' : 'Recent scores need closer intervention.'}
                </p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/10 dark:to-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-semibold">Watchlist Snapshot</h3>
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{bottomPerformer?.name || 'No data'}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Lowest current average within the selected filters.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Score</span>
                  <span className="text-xl font-bold text-rose-600">{bottomPerformer?.averageScore || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-transparent to-indigo-50 dark:from-slate-800/10 dark:to-indigo-900/10 pointer-events-none" />
            <div className="relative">
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Analysis Matrix</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A quick strategic reading of the department so the next action is easier to decide.</p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Decision Support</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {analysisMatrixData.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-5 shadow-sm">
                    <div className={`inline-flex rounded-full bg-gradient-to-r ${item.accent} px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white`}>
                      {item.status}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                    <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{item.value}</p>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{item.summary}</p>
                    <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Recommendation</p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{item.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500"/> Skill Analysis</h3>
              <div className="h-[300px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <defs>
                      <linearGradient id="radarGlow" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#e5e7eb" radialLines={false} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Department" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="url(#radarGlow)" fillOpacity={1} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6">Rating Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-center">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="18%"
                      outerRadius="95%"
                      barSize={18}
                      data={radialDistributionData}
                      startAngle={180}
                      endAngle={-180}
                    >
                      <RadialBar background clockWise dataKey="value" cornerRadius={12}>
                        {radialDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </RadialBar>
                      <Tooltip content={<DistributionTooltip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {distributionData.map((item) => (
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
            </div>
          </div>
        </motion.div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Monthly Volume & Performance Trend</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <defs>
                    <linearGradient id="monthlyVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#eff6ff" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="monthlyScore" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" domain={[0, 5]} axisLine={false} tickLine={false} label={{ value: 'Avg Score', angle: -90, position: 'insideLeft', fill: '#10b981' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} label={{ value: 'Volume', angle: 90, position: 'insideRight', fill: '#3b82f6' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={4} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopRight', fill: '#f59e0b', fontSize: 11 }} />
                  <Area yAxisId="right" type="monotone" dataKey="volume" name="Feedback Volume" fill="url(#monthlyVolume)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} />
                  <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Avg Score" stroke="url(#monthlyScore)" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6">Semester Trend Map</h3>
              <div className="h-[320px]">
                {semesterBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={semesterBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="left" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Bar yAxisId="right" dataKey="feedbackCount" name="Feedback Count" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Average Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">No semester data available</div>
                )}
              </div>
            </div>

            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-transparent to-transparent dark:from-emerald-500/5 pointer-events-none" />
              <div className="relative">
                <h3 className="text-xl font-semibold mb-2">Trend Insight Summary</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A quick reading of how the department is moving across the current filter window.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/80 dark:bg-emerald-900/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Momentum</p>
                    <p className={`mt-2 text-3xl font-black ${momentumDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{momentumDelta > 0 ? '+' : ''}{momentumDelta}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Based on the latest two months of average scores.</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/80 dark:bg-blue-900/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Stability</p>
                    <p className="mt-2 text-3xl font-black text-blue-600">{consistencyIndex}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Higher values indicate more even faculty performance.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-900/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">Skill Strength</p>
                    <p className="mt-2 text-xl font-black text-gray-900 dark:text-white">{strongestSkill?.subject || 'N/A'}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{strongestSkill?.A || 0}/5 average score.</p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/80 dark:bg-rose-900/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">Support Area</p>
                    <p className="mt-2 text-xl font-black text-gray-900 dark:text-white">{improvementSkill?.subject || 'N/A'}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Lowest department skill area right now.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Weekly Waterfall Analysis</h3>
              <select
                value={selectedFacultyForWaterfall}
                onChange={(e) => setSelectedFacultyForWaterfall(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Faculty</option>
                {rankings.map(f => <option key={f.facultyId} value={f.facultyId}>{f.name}</option>)}
              </select>
            </div>
            <div className="h-[350px]">
              {waterfallData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip content={<WaterfallTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="bottom" stackId="a" fill="transparent" />
                    <Bar dataKey="barHeight" stackId="a" radius={[4, 4, 4, 4]}>
                      {waterfallData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-gray-500">No weekly data available</div>}
            </div>
          </div>
        </motion.div>
      )}

      {/* FACULTY TAB */}
      {activeTab === 'faculty' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 relative overflow-hidden"
        >
          <h3 className="text-xl font-semibold mb-6">Faculty Performance Comparison</h3>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} barSize={32}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <ReferenceLine y={parseFloat(avgScore)} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Dept Avg', position: 'insideTopRight', fill: '#10b981', fontSize: 11 }} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                domain={[0, 5]} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              <Bar dataKey="score" fill="url(#colorScore)" radius={[6, 6, 6, 6]} animationDuration={1500}>
                <LabelList dataKey="score" position="top" fill="#475569" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

          {lowPerformers.length > 0 && (
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">Faculty Requiring Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowPerformers.map((faculty) => (
              <div key={faculty.facultyId} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{faculty.name}</p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{faculty.feedbackCount} reviews</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-lg">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{faculty.averageScore}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
          )}

          {/* Top Performers List (Simulated Table) */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600"/> Top Performers Leaderboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.slice(0, 5).map((faculty, index) => (
                <div key={faculty.facultyId} className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-default ${
                  index === 0 ? 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800' :
                  index === 1 ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700' :
                  index === 2 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' :
                  'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>{index === 0 ? <Award className="w-6 h-6" /> : index + 1}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{faculty.name}</p>
                    <p className="text-xs text-gray-500">{faculty.feedbackCount} reviews</p>
                  </div>
                  <div className="text-2xl font-black text-gray-800 dark:text-white bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm">{faculty.averageScore}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* COURSES TAB */}
      {activeTab === 'courses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-6">Top Performing Courses</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb"/>
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                     {courseData.map((entry, index) => <Cell key={`cell-${index}`} fill={index < 3 ? '#10b981' : '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-6">Course Score vs Feedback Volume</h3>
            <div className="h-[360px]">
              {courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={courseData}>
                    <defs>
                      <linearGradient id="courseScoreLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={70} />
                    <YAxis yAxisId="left" domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar yAxisId="right" dataKey="count" name="Feedback Count" fill="#bfdbfe" radius={[8, 8, 0, 0]} />
                    <ReferenceLine yAxisId="left" y={4} stroke="#10b981" strokeDasharray="4 4" />
                    <Line yAxisId="left" type="monotone" dataKey="score" name="Average Score" stroke="url(#courseScoreLine)" strokeWidth={4} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">No course comparison data available</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default PerformancePage;
