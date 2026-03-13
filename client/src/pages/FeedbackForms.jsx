import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Trash2, X, Share2, Copy, Check, BarChart2, Filter, Download, Search, Sparkles, Clock3, Users, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { hodAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const FeedbackForms = () => {
  const { user } = useAuth();
  const defaultQuestions = [
    { question: 'Content Knowledge', type: 'rating' },
    { question: 'Teaching Methodology', type: 'rating' },
    { question: 'Communication Skills', type: 'rating' },
    { question: 'Punctuality', type: 'rating' },
    { question: 'Student Engagement', type: 'rating' }
  ];
  const [forms, setForms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedAnalyticsForm, setSelectedAnalyticsForm] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsFilter, setAnalyticsFilter] = useState({ facultyId: '' });
  const [copied, setCopied] = useState(null);
  const [formSearch, setFormSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    semester: 1,
    facultyList: [],
    questions: defaultQuestions,
    expiresAt: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const facultyRes = await hodAPI.getDepartmentFaculty();
      const formsRes = await hodAPI.getFeedbackForms();
      setFaculty(facultyRes.data);
      setForms(formsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await hodAPI.createFeedbackForm(formData);
      toast.success('Form created');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create form');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      semester: 1,
      facultyList: [],
      questions: defaultQuestions,
      expiresAt: ''
    });
  };

  const handlePublish = async (id) => {
    try {
      await hodAPI.publishForm(id);
      toast.success('Form published and faculty notified!');
      fetchData();
    } catch (error) {
      toast.error('Failed to publish');
    }
  };

  const copyShareLink = (formId) => {
    const link = `${window.location.origin}/student-feedback?form=${formId}`;
    navigator.clipboard.writeText(link);
    setCopied(formId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this form?')) return;
    try {
      await hodAPI.deleteForm(id);
      toast.success('Form deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', type: 'rating' }]
    });
  };

  const removeQuestion = (idx) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== idx)
    });
  };

  const updateQuestion = (idx, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[idx][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleViewAnalytics = async (form) => {
    try {
      setSelectedAnalyticsForm(form);
      setShowAnalytics(true);
      setLoadingAnalytics(true);
      setAnalyticsData([]);
      const { data } = await hodAPI.getFormAnalytics(form._id);
      setAnalyticsData(data || []);
      setAnalyticsFilter({ facultyId: '' });
    } catch (error) {
      console.error(error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Server unreachable. Is backend running?');
      } else {
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const getFilteredAnalytics = () => {
    let filtered = analyticsData || [];
    if (!Array.isArray(filtered)) return [];
    if (analyticsFilter.facultyId) {
      filtered = filtered.filter(f => f.facultyId?._id === analyticsFilter.facultyId);
    }
    return filtered;
  };

  const calculateStats = () => {
    const data = getFilteredAnalytics();
    const total = data.length;
    const avg = total > 0 
      ? (data.reduce((sum, item) => sum + (Number(item.averageScore) || 0), 0) / total).toFixed(2) 
      : 0;

    // Dynamic chart data based on form questions
    const ratingQuestions = selectedAnalyticsForm?.questions?.filter(q => q.type === 'rating') || [];
    
    // Backend mapping keys (legacy support for the 5 fixed categories)
    const backendKeys = ['contentKnowledge', 'teachingMethodology', 'communication', 'punctuality', 'studentEngagement'];
    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#78716c'];

    const chartData = ratingQuestions.map((q, idx) => ({
      name: q.question.length > 15 ? q.question.substring(0, 15) + '...' : q.question,
      fullQuestion: q.question,
      score: 0,
      key: backendKeys[idx], // Map index to legacy backend key
      fill: COLORS[idx % COLORS.length]
    }));

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (total > 0) {
      data.forEach(item => {
        const scores = item.feedbackScores || {};
        chartData.forEach((bar, idx) => {
          // Try to retrieve score by key, fallback to direct index if available
          const val = scores[bar.key] !== undefined ? scores[bar.key] : (scores[idx.toString()] || 0);
          bar.score += Number(val);
          
          const roundedScore = Math.round(Number(val));
          if (distribution[roundedScore] !== undefined) distribution[roundedScore]++;
        });
      });
      chartData.forEach(item => item.score = Number((item.score / total).toFixed(2)));
    }

    const pieData = [
      { name: 'Excellent (5)', value: distribution[5], fill: '#10b981' },
      { name: 'Very Good (4)', value: distribution[4], fill: '#3b82f6' },
      { name: 'Good (3)', value: distribution[3], fill: '#f59e0b' },
      { name: 'Fair (2)', value: distribution[2], fill: '#f97316' },
      { name: 'Poor (1)', value: distribution[1], fill: '#ef4444' }
    ].filter(d => d.value > 0);

    return { total, avg, chartData, pieData };
  };

  const stats = showAnalytics ? calculateStats() : { total: 0, avg: 0, chartData: [] };

  const filteredForms = useMemo(() => {
    const term = formSearch.trim().toLowerCase();
    return forms.filter((form) => {
      const matchesSearch = !term || form.title.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && form.isPublished) ||
        (statusFilter === 'draft' && !form.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [forms, formSearch, statusFilter]);

  const publishedCount = forms.filter((form) => form.isPublished).length;
  const draftCount = forms.length - publishedCount;
  const avgQuestionsPerForm = forms.length
    ? (forms.reduce((sum, form) => sum + (form.questions?.length || 0), 0) / forms.length).toFixed(1)
    : '0.0';

  const quickTemplates = [
    {
      title: 'Core Teaching 5Q',
      subtitle: 'Fast semester review with the standard 5 teaching criteria.',
      questions: defaultQuestions,
    },
    {
      title: 'Midterm Pulse',
      subtitle: 'Short check-in form for early intervention before finals.',
      questions: [
        { question: 'Concept clarity so far', type: 'rating' },
        { question: 'Classroom pace is manageable', type: 'rating' },
        { question: 'Doubt resolution quality', type: 'rating' },
        { question: 'Assignments support learning', type: 'rating' },
        { question: 'What should improve before finals?', type: 'text' }
      ],
    },
    {
      title: 'Course Deep Dive',
      subtitle: 'Use more custom questions for one specific course or concern.',
      questions: [
        { question: 'Syllabus coverage quality', type: 'rating' },
        { question: 'Examples and practical relevance', type: 'rating' },
        { question: 'Assessment fairness', type: 'rating' },
        { question: 'Learning resources provided', type: 'rating' },
        { question: 'Course-specific strengths', type: 'text' },
        { question: 'Course-specific improvements', type: 'text' }
      ],
    },
  ];

  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      questions: template.questions.map((question) => ({ ...question })),
    }));
    setShowModal(true);
  };

  const handleExportCSV = () => {
    const data = getFilteredAnalytics();
    if (data.length === 0) return toast.error('No data to export');

    const ratingQuestions = selectedAnalyticsForm?.questions?.filter(q => q.type === 'rating') || [];
    const headers = ['Student Reg', 'Faculty Name', 'Average Score', ...ratingQuestions.map(q => `"${q.question}"`), 'Comment', 'Date'];
    const backendKeys = ['contentKnowledge', 'teachingMethodology', 'communication', 'punctuality', 'studentEngagement'];

    const rows = data.map(item => {
      const scores = item.feedbackScores || {};
      const qScores = ratingQuestions.map((_, idx) => {
        const key = backendKeys[idx];
        return scores[key] !== undefined ? scores[key] : (scores[idx.toString()] || 0);
      });
      return [
        item.studentRegNumber,
        item.facultyId?.name,
        item.averageScore,
        ...qScores,
        `"${(item.comment || '').replace(/"/g, '""')}"`,
        new Date(item.submittedAt).toLocaleDateString()
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${selectedAnalyticsForm.title.replace(/\s+/g, '_')}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Feedback Workflow"
        title="Create smarter forms and review richer analytics from one unified workspace."
        description="This area now feels more like an operations console, with clearer creation flow and cleaner analytics presentation."
        highlights={[
          { label: 'Active Forms', value: forms.length },
          { label: 'Published', value: forms.filter((form) => form.isPublished).length },
          { label: 'Faculty Linked', value: faculty.length },
        ]}
      />

      <div className="glass-card p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feedback Forms</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage form lifecycle, sharing, and analytics from one workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={formSearch}
                onChange={(e) => setFormSearch(e.target.value)}
                placeholder="Search forms..."
                className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Form
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Published Forms</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{publishedCount}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Draft Forms</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{draftCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
              <Clock3 className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Faculty Reach</p>
              <p className="mt-2 text-3xl font-black text-sky-600">{faculty.length}</p>
            </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Questions</p>
              <p className="mt-2 text-3xl font-black text-violet-600">{avgQuestionsPerForm}</p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <ChartPanel title="Quick Templates" subtitle="Reusable form ideas to speed up the next feedback cycle.">
          <div className="space-y-3">
            {quickTemplates.map((template) => (
              <div key={template.title} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{template.title}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{template.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel title="Forms Workspace" subtitle="Searchable, filtered view of draft and published forms.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredForms.map((form) => (
          <motion.div
            key={form._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-2">{form.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Semester {form.semester} • {form.facultyList.length} Faculty
            </p>
            <p className="text-xs text-gray-500 mb-4">{form.questions?.length || 5} Questions</p>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                form.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {form.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex gap-2">
              {!form.isPublished && (
                <button
                  onClick={() => handlePublish(form._id)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Publish
                </button>
              )}
              {form.isPublished && (
                <>
                  <button
                    onClick={() => handleViewAnalytics(form)}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400"
                  >
                    <BarChart2 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => copyShareLink(form._id)}
                    className="p-2 btn-secondary"
                    title="Share Link"
                  >
                    {copied === form._id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(form._id)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
            ))}
          </div>
          {filteredForms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500">
              No forms match the current filters.
            </div>
          )}
        </ChartPanel>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.35),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.2),_transparent_28%)]" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    <Sparkles className="w-4 h-4" />
                    Form Builder
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">Create Feedback Form</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-200">Build a focused evaluation flow with the right questions, targeted faculty coverage, and a cleaner structure for students.</p>
                </div>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="relative self-start p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="relative mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Questions</p>
                  <p className="mt-1 text-2xl font-black">{formData.questions.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Faculty Selected</p>
                  <p className="mt-1 text-2xl font-black">{formData.facultyList.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Semester</p>
                  <p className="mt-1 text-2xl font-black">{formData.semester}</p>
                </div>
              </div>
            </div>

            <div className="p-8 max-h-[75vh] overflow-y-auto bg-gradient-to-b from-white to-slate-50/70 dark:from-gray-800 dark:to-gray-900/40">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Form Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. End Semester Feedback 2024"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                      <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expiration Date (Optional)</label>
                        <input
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Feedback Questions</label>
                        <span className="text-xs text-gray-500">{formData.questions.length} questions configured</span>
                      </div>
                      <div className="space-y-3">
                        {formData.questions.map((q, idx) => (
                          <div key={idx} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="mt-3 text-xs font-bold text-gray-400 w-4">{idx + 1}.</div>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              placeholder="Enter question text..."
                              required
                            />
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                              className="w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            >
                              <option value="rating">Rating (1-5)</option>
                              <option value="text">Text</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeQuestion(idx)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                          <Plus className="w-5 h-5" />
                          Add New Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Select Faculty <span className="text-gray-500 font-normal ml-2">({formData.facultyList.length} selected)</span>
                      </label>
                      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 gap-3">
                        {faculty.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No faculty found in your department</p>
                        ) : (
                          faculty.map(f => (
                            <label key={f._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.facultyList.includes(f._id)
                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                : 'bg-white border-transparent hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                            }`}>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                formData.facultyList.includes(f._id)
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {formData.facultyList.includes(f._id) && <Check className="w-3 h-3" />}
                              </div>
                              <input
                                type="checkbox"
                                value={f._id}
                                checked={formData.facultyList.includes(f._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (!formData.facultyList.includes(f._id)) {
                                      setFormData({ ...formData, facultyList: [...formData.facultyList, f._id] });
                                    }
                                  } else {
                                    setFormData({ ...formData, facultyList: formData.facultyList.filter(id => id !== f._id) });
                                  }
                                }}
                                className="hidden"
                              />
                              <span className="font-medium text-gray-700 dark:text-gray-300">{f.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/80 dark:bg-blue-900/10 p-6">
                      <p className="text-xs uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 font-bold">Creation Checklist</p>
                      <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                        <div className="flex items-center justify-between">
                          <span>Title added</span>
                          <span className={formData.title.trim() ? 'text-emerald-600 font-semibold' : 'text-gray-400'}>{formData.title.trim() ? 'Done' : 'Pending'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Questions ready</span>
                          <span className={formData.questions.length >= 3 ? 'text-emerald-600 font-semibold' : 'text-gray-400'}>{formData.questions.length >= 3 ? 'Done' : 'Pending'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Faculty selected</span>
                          <span className={formData.facultyList.length > 0 ? 'text-emerald-600 font-semibold' : 'text-gray-400'}>{formData.facultyList.length > 0 ? 'Done' : 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  >
                    Create Form
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && selectedAnalyticsForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAnalyticsForm.title} - Analytics</h2>
                <p className="text-sm text-gray-500">Overview of student feedback and performance</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingAnalytics ? (
              <div className="p-12 flex justify-center items-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto flex-1">
                {/* Filter Section */}
                <div className="flex items-center gap-4 mb-6 bg-white dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    value={analyticsFilter.facultyId}
                    onChange={(e) => setAnalyticsFilter({ ...analyticsFilter, facultyId: e.target.value })}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Faculty</option>
                    {selectedAnalyticsForm.facultyList.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                  <div className="ml-auto flex gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">Total Reviews</p>
                      <p className="text-xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">Avg Score</p>
                      <p className="text-xl font-bold text-green-600">{stats.avg}</p>
                    </div>
                  </div>
                </div>

                {stats.total === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                    <p>No feedback data available for this form yet.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Chart */}
                  <ChartPanel title="Performance Metrics" subtitle="Average score by question with improved chart clarity." className="bg-white dark:bg-gray-700/30 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={stats.chartData}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.2} />
                        <XAxis type="number" domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fill: '#6b7280', fontSize: 11 }} 
                          width={100}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                          itemStyle={{ color: '#f3f4f6' }}
                        />
                        <Bar dataKey="score" barSize={20} radius={[0, 10, 10, 0]}>
                          {stats.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  {/* Rating Distribution Pie Chart */}
                  <ChartPanel title="Rating Distribution" subtitle="Distribution of 1-5 ratings for the selected form or faculty." className="bg-white dark:bg-gray-700/30 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                          itemStyle={{ color: '#f3f4f6' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeedbackForms;
