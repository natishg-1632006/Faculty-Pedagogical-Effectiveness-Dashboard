import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Trash2, X, Share2, Copy, Check, BarChart2, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { hodAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FeedbackForms = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedAnalyticsForm, setSelectedAnalyticsForm] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsFilter, setAnalyticsFilter] = useState({ facultyId: '' });
  const [copied, setCopied] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    semester: 1,
    facultyList: [],
    questions: [
      { question: 'Content Knowledge', type: 'rating' },
      { question: 'Teaching Methodology', type: 'rating' },
      { question: 'Communication Skills', type: 'rating' },
      { question: 'Punctuality', type: 'rating' },
      { question: 'Student Engagement', type: 'rating' }
    ],
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
      
      console.log('Faculty:', facultyRes.data);
      
      setFaculty(facultyRes.data);
      setForms(formsRes.data);
    } catch (error) {
      console.error('Error:', error);
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
      questions: [
        { question: 'Content Knowledge', type: 'rating' },
        { question: 'Teaching Methodology', type: 'rating' },
        { question: 'Communication Skills', type: 'rating' },
        { question: 'Punctuality', type: 'rating' },
        { question: 'Student Engagement', type: 'rating' }
      ],
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
      const { data } = await hodAPI.getFormAnalytics(form._id);
      setAnalyticsData(data);
      setAnalyticsFilter({ facultyId: '' });
      setShowAnalytics(true);
    } catch (error) {
      toast.error('Failed to load analytics');
    }
  };

  const getFilteredAnalytics = () => {
    let filtered = analyticsData;
    if (analyticsFilter.facultyId) {
      filtered = filtered.filter(f => f.facultyId._id === analyticsFilter.facultyId);
      filtered = filtered.filter(f => f.facultyId?._id === analyticsFilter.facultyId);
    }
    return filtered;
  };

  const calculateStats = () => {
    const data = getFilteredAnalytics();
    const total = data.length;
    const avg = total > 0 
      ? (data.reduce((sum, item) => sum + item.averageScore, 0) / total).toFixed(2) 
      : 0;
    
    // Prepare chart data
    const chartData = [
      { name: 'Knowledge', score: 0 },
      { name: 'Teaching', score: 0 },
      { name: 'Comm.', score: 0 },
      { name: 'Punctuality', score: 0 },
      { name: 'Engagement', score: 0 }
    ];

    if (total > 0) {
      data.forEach(item => {
        chartData[0].score += item.feedbackScores.contentKnowledge;
        chartData[1].score += item.feedbackScores.teachingMethodology;
        chartData[2].score += item.feedbackScores.communication;
        chartData[3].score += item.feedbackScores.punctuality;
        chartData[4].score += item.feedbackScores.studentEngagement;
        const scores = item.feedbackScores || {};
        chartData[0].score += scores.contentKnowledge || 0;
        chartData[1].score += scores.teachingMethodology || 0;
        chartData[2].score += scores.communication || 0;
        chartData[3].score += scores.punctuality || 0;
        chartData[4].score += scores.studentEngagement || 0;
      });
      chartData.forEach(item => item.score = Number((item.score / total).toFixed(2)));
    }
    return { total, avg, chartData };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feedback Forms</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <motion.div
            key={form._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Feedback Form</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure a new evaluation form for students</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                  <div>
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Select Faculty <span className="text-gray-500 font-normal ml-2">({formData.facultyList.length} selected)</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  {faculty.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 col-span-2">No faculty found in your department</p>
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

              <div>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
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
                    <p className="text-xl font-bold text-blue-600">{calculateStats().total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">Avg Score</p>
                    <p className="text-xl font-bold text-green-600">{calculateStats().avg}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Chart */}
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 h-80">
                  <h3 className="text-lg font-bold mb-4">Performance Metrics</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculateStats().chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Comments */}
                <div className="bg-white dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 h-80 overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">Student Comments</h3>
                  <div className="space-y-3">
                    {getFilteredAnalytics().filter(f => f.comment).map((feedback, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">{feedback.facultyId.name}</span>
                          <span className="font-semibold text-sm">{feedback.facultyId?.name || 'Unknown Faculty'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            feedback.averageScore >= 4 ? 'bg-green-100 text-green-700' : 
                            feedback.averageScore >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {feedback.averageScore.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{feedback.comment}"</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(feedback.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {getFilteredAnalytics().filter(f => f.comment).length === 0 && (
                      <p className="text-center text-gray-500 py-8">No comments available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeedbackForms;
