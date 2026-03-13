import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Building2, Users, UserCheck, Sparkles } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        adminAPI.getAllDepartments(),
        adminAPI.getAllUsers()
      ]);
      setDepartments(deptRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'HOD'));
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDept) {
        await adminAPI.updateDepartment(editDept._id, formData);
        toast.success('Department updated');
      } else {
        await adminAPI.createDepartment(formData);
        toast.success('Department created');
      }
      setShowModal(false);
      setEditDept(null);
      setFormData({ name: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await adminAPI.deleteDepartment(id);
      toast.success('Department deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return departments.filter((dept) => {
      const matchesSearch =
        !term ||
        dept.name.toLowerCase().includes(term) ||
        (dept.hodId?.name || '').toLowerCase().includes(term);
      const matchesAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && dept.hodId) ||
        (assignmentFilter === 'unassigned' && !dept.hodId);
      return matchesSearch && matchesAssignment;
    });
  }, [departments, searchTerm, assignmentFilter]);

  const assignedCount = departments.filter((dept) => dept.hodId).length;
  const unassignedCount = departments.length - assignedCount;
  const availableHods = users.length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Department Control"
        title="Organize departments with a cleaner and more actionable admin workspace."
        description="Track department coverage, scan assignment gaps, and manage department records from a more refined dashboard."
        highlights={[
          { label: 'Departments', value: departments.length },
          { label: 'Assigned HODs', value: assignedCount },
          { label: 'Unassigned', value: unassignedCount },
        ]}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Department
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Departments</p>
              <p className="mt-2 text-3xl font-black text-blue-600">{departments.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned HODs</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{assignedCount}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open Assignments</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{unassignedCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available HOD Users</p>
              <p className="mt-2 text-3xl font-black text-violet-600">{availableHods}</p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <ChartPanel title="Department Workspace" subtitle="Search departments, spot assignment gaps, and manage records from one place.">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments or HOD names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            <option value="assigned">Assigned HOD</option>
            <option value="unassigned">Unassigned HOD</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <motion.div
              key={dept._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-blue-100 text-sm font-black uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                    {dept.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {dept.hodId ? 'Leadership assigned' : 'Awaiting HOD assignment'}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    dept.hodId
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  }`}
                >
                  {dept.hodId ? 'Assigned' : 'Open'}
                </span>
              </div>

              <div className="mt-5 flex-1 rounded-2xl bg-gray-50/90 p-4 dark:bg-gray-900/40">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  Department Lead
                </p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {dept.hodId?.name || 'Not Assigned'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {dept.hodId?.email || 'Assign an HOD to improve department coverage.'}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditDept(dept);
                    setFormData({ name: dept.name });
                    setShowModal(true);
                  }}
                  className="btn-secondary flex-1 items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept._id)}
                  className="rounded-xl p-3 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label={`Delete ${dept.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredDepartments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500">
            No departments match the current search or assignment filter.
          </div>
        )}
      </ChartPanel>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-0 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white">
              <h2 className="text-2xl font-black">{editDept ? 'Edit' : 'Add'} Department</h2>
              <p className="mt-2 text-sm text-slate-200">Create or update a department record with a cleaner admin workflow.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium mb-2">Department Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Computer Science, Electrical Engineering"
                />
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Available HOD pool</p>
                <p>{availableHods} HOD user accounts currently exist for department leadership assignments.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  {editDept ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditDept(null);
                    setFormData({ name: '' });
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
