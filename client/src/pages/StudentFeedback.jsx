import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Star, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { commonAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentFeedback = () => {
  const [searchParams] = useSearchParams();
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [hoveredScores, setHoveredScores] = useState({});
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    regNumber: '',
    email: ''
  });
  const [submittedFaculty, setSubmittedFaculty] = useState([]);

  // Rating labels mapping
  const RATING_LABELS = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  // Calculate form progress
  const calculateProgress = () => {
    if (!selectedForm) return 0;
    let filled = 0;
    if (studentInfo.name) filled++;
    if (studentInfo.regNumber) filled++;
    if (studentInfo.email) filled++;
    if (selectedFaculty) filled++;
    filled += Object.keys(scores).length;
    if (comment) filled++;
    
    const total = 4 + (selectedForm.questions?.length || 0);
    return Math.min(100, Math.round((filled / total) * 100));
  };

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    const formId = searchParams.get('form');
    if (formId && forms.length > 0) {
      const form = forms.find(f => f._id === formId);
      if (form) setSelectedForm(form);
    }
  }, [forms, searchParams]);

  useEffect(() => {
    setSubmittedFaculty([]);
  }, [selectedForm?._id, studentInfo.regNumber, studentInfo.email]);

  const fetchForms = async () => {
    try {
      const { data } = await commonAPI.getPublishedForms();
      setForms(data);
    } catch (error) {
      toast.error('Failed to load forms');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentInfo.email)) {
      return toast.error('Please enter a valid email address');
    }

    if (!studentInfo.name.trim() || !studentInfo.regNumber.trim()) {
      return toast.error('Please fill in your name and registration number');
    }

    if (submittedFaculty.includes(selectedFaculty)) {
      return toast.error('You have already submitted feedback for this faculty member in this session.');
    }

    try {
      const responses = selectedForm.questions.map((q, idx) => ({
        question: q.question,
        type: q.type,
        value: q.type === 'rating' ? scores[idx] || 5 : comment
      }));

      await commonAPI.submitStudentFeedback({
        formId: selectedForm._id,
        facultyId: selectedFaculty,
        responses,
        studentName: studentInfo.name,
        studentRegNumber: studentInfo.regNumber,
        studentEmail: studentInfo.email
      });
      toast.success('Feedback submitted successfully!');
      toast('You can now submit feedback for another faculty member.', { icon: '📝' });
      
      setSubmittedFaculty(prev => [...prev, selectedFaculty]);
      setSelectedFaculty('');
      setScores({});
      setComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const renderStars = (field, value) => {
    const displayValue = hoveredScores[field] || value;

    return (
      <div className="flex flex-wrap items-center gap-4">
        <div 
          className="flex gap-2"
          onMouseLeave={() => setHoveredScores(prev => ({ ...prev, [field]: 0 }))}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setScores({ ...scores, [field]: star })}
              onMouseEnter={() => setHoveredScores(prev => ({ ...prev, [field]: star }))}
              className="focus:outline-none p-1"
            >
              <Star
                className={`w-9 h-9 transition-colors duration-200 ${
                  star <= displayValue 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' 
                    : 'text-gray-200 dark:text-gray-600'
                }`}
                strokeWidth={1.5}
              />
            </motion.button>
          ))}
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          displayValue > 0 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
        }`}>
          {RATING_LABELS[displayValue] || 'Select Rating'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pb-32 pt-12 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Student Feedback Portal</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Your voice matters. Help us enhance the academic experience by sharing your honest feedback.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 pb-12">
        {!selectedForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 min-h-[400px]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Filter className="w-5 h-5" />
                <h3 className="text-xl font-bold">Available Forms</h3>
              </div>
              
              <div className="flex gap-4 w-full md:w-auto">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Departments</option>
                  {[...new Set(forms.map(f => f.departmentId?.name))].filter(Boolean).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filterSem}
                  onChange={(e) => setFilterSem(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Semesters</option>
                  {[...new Set(forms.map(f => f.semester))].sort().map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {forms
                .filter(form => !filterDept || form.departmentId?.name === filterDept)
                .filter(form => !filterSem || form.semester === parseInt(filterSem))
                .map((form) => (
                  <motion.div
                    key={form._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => setSelectedForm(form)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        Semester {form.semester}
                      </span>
                      <Send className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {form.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {form.departmentId?.name}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center text-sm text-gray-500">
                      <span>{form.facultyList.length} Faculty Members</span>
                    </div>
                  </motion.div>
              ))}
              {forms.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No feedback forms available at the moment.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 dark:bg-gray-700">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedForm.title}</h2>
                  <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{selectedForm.departmentId?.name}</span>
                    <span>•</span>
                    <span>Semester {selectedForm.semester}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Student Details */}
                <section className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                    Student Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={studentInfo.name}
                        onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={studentInfo.regNumber}
                        onChange={(e) => setStudentInfo({ ...studentInfo, regNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="e.g. REG2023001"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={studentInfo.email}
                        onChange={(e) => setStudentInfo({ ...studentInfo, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="student@university.edu"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Faculty Selection */}
                <section className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                    Select Faculty
                  </h3>
                  <div>
                    <select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      required
                    >
                      <option value="">Choose a faculty member to evaluate...</option>
                      {selectedForm.facultyList.map(f => (
                        <option 
                          key={f._id} 
                          value={f._id}
                          disabled={submittedFaculty.includes(f._id)}
                          className={submittedFaculty.includes(f._id) ? 'text-gray-400 bg-gray-100' : ''}
                        >
                          {f.name} {submittedFaculty.includes(f._id) ? '(Submitted)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Section 3: Feedback Questions */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                    Feedback Questions
                  </h3>
                  <div className="space-y-6">
                    {selectedForm.questions?.map((q, idx) => (
                      <div key={idx} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm">
                        <label className="block text-base font-medium text-gray-900 dark:text-white mb-4">
                          {idx + 1}. {q.question}
                        </label>
                        {q.type === 'rating' ? (
                          <div className="pl-2">
                             {renderStars(idx, scores[idx] || 5)}
                          </div>
                        ) : (
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                            placeholder="Please share any additional comments or suggestions..."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-6">
                  <button type="submit" className="w-full btn-primary py-4 text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                    <Send className="w-6 h-6" />
                    Submit Feedback
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Your feedback is anonymous and will be used to improve teaching quality.
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;
