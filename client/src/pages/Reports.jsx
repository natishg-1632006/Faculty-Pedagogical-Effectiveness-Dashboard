import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Table, Calendar, Filter } from 'lucide-react';
import { commonAPI, hodAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useAuth();
  const [semester, setSemester] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'HOD') {
      fetchFaculty();
    }
  }, [user]);

  const fetchFaculty = async () => {
    try {
      const res = await hodAPI.getDepartmentFaculty();
      setFaculty(res.data);
    } catch (error) {
      toast.error('Failed to load faculty');
    }
  };

  const downloadPDF = async () => {
    if (user?.role === 'HOD' && !facultyId) {
      toast.error('Please select a faculty member');
      return;
    }

    setLoading(true);
    try {
      const id = user?.role === 'Faculty' ? user._id : facultyId;
      const res = await commonAPI.downloadPDF(id, semester);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance-report-${semester || 'all'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const res = await commonAPI.downloadCSV(user?.departmentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `department-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded successfully');
    } catch (error) {
      toast.error('Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Download performance reports</p>
      </div>

      {/* PDF Report Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">PDF Performance Report</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Detailed performance analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          {user?.role === 'HOD' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Faculty</label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Faculty</option>
                {faculty.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Semester (Optional)</label>
            <input
              type="number"
              min="1"
              max="8"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Leave empty for all semesters"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={downloadPDF}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>
      </motion.div>

      {/* CSV Report Section - HOD Only */}
      {user?.role === 'HOD' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Table className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">CSV Department Report</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Export all department data</p>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Downloading...' : 'Download CSV Report'}
          </button>
        </motion.div>
      )}

      {/* Report Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 bg-blue-50 dark:bg-blue-900/20"
      >
        <h3 className="text-lg font-semibold mb-4">Report Information</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></span>
            <span>PDF reports include detailed performance metrics, charts, and feedback analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></span>
            <span>Filter by semester to get specific period reports</span>
          </li>
          {user?.role === 'HOD' && (
            <>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></span>
                <span>CSV reports contain complete department data for further analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></span>
                <span>Select individual faculty members to generate their performance reports</span>
              </li>
            </>
          )}
        </ul>
      </motion.div>
    </div>
  );
};

export default Reports;
