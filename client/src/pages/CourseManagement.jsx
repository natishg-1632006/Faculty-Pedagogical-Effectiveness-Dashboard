import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, BookOpen, Search, GraduationCap, Layers3, Sparkles, Users } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    semester: 1,
    departmentId: '',
    assignedFaculty: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes, usersRes] = await Promise.all([
        adminAPI.getAllCourses(),
        adminAPI.getAllDepartments(),
        adminAPI.getAllUsers()
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptsRes.data);
      setFaculty(usersRes.data.filter(u => u.role === 'Faculty'));
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) {
        await adminAPI.updateCourse(editCourse._id, formData);
        toast.success('Course updated');
      } else {
        await adminAPI.createCourse(formData);
        toast.success('Course created');
      }
      setShowModal(false);
      setEditCourse(null);
      setFormData({ courseName: '', courseCode: '', semester: 1, departmentId: '', assignedFaculty: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await adminAPI.deleteCourse(id);
      toast.success('Course deleted');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !term ||
        course.courseName.toLowerCase().includes(term) ||
        course.courseCode.toLowerCase().includes(term) ||
        (course.departmentId?.name || '').toLowerCase().includes(term) ||
        (course.assignedFaculty?.name || '').toLowerCase().includes(term);

      const matchesSemester =
        semesterFilter === 'all' || String(course.semester) === semesterFilter;

      const matchesAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && course.assignedFaculty) ||
        (assignmentFilter === 'unassigned' && !course.assignedFaculty);

      return matchesSearch && matchesSemester && matchesAssignment;
    });
  }, [assignmentFilter, courses, searchTerm, semesterFilter]);

  const assignedCourses = courses.filter((course) => course.assignedFaculty).length;
  const unassignedCourses = courses.length - assignedCourses;
  const semesterSpread = new Set(courses.map((course) => course.semester)).size;
  const filteredAverageSemester = filteredCourses.length
    ? (filteredCourses.reduce((total, course) => total + Number(course.semester || 0), 0) / filteredCourses.length).toFixed(1)
    : '0.0';

  const topDepartmentLoad = useMemo(() => {
    const departmentMap = courses.reduce((acc, course) => {
      const name = course.departmentId?.name || 'Unknown Department';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const [name, count] = Object.entries(departmentMap).sort((a, b) => b[1] - a[1])[0] || ['No data', 0];
    return { name, count };
  }, [courses]);

  const nextCourseCodeHint = useMemo(() => {
    if (!formData.departmentId) return 'Pick a department to generate a better code pattern.';
    const selectedDepartment = departments.find((dept) => dept._id === formData.departmentId);
    if (!selectedDepartment) return 'Department code insight unavailable.';

    const prefix = selectedDepartment.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    return `${prefix || 'CRS'}-${String(formData.semester).padStart(2, '0')}XX`;
  }, [departments, formData.departmentId, formData.semester]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Course Control"
        title="Manage curriculum delivery with a cleaner and more strategic course workspace."
        description="Track assignment coverage, scan semester mix, and manage course records from a stronger admin dashboard."
        highlights={[
          { label: 'Courses', value: courses.length },
          { label: 'Assigned', value: assignedCourses },
          { label: 'Open Load', value: unassignedCourses },
          { label: 'Semesters', value: semesterSpread || 0 },
        ]}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card bg-gradient-to-br from-blue-50/80 to-white p-5 dark:from-blue-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="mt-2 text-3xl font-black text-blue-600">{courses.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:from-emerald-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Faculty Coverage</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">
                {courses.length ? `${Math.round((assignedCourses / courses.length) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-amber-50/80 to-white p-5 dark:from-amber-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Filtered Avg Semester</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{filteredAverageSemester}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
              <Layers3 className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-violet-50/80 to-white p-5 dark:from-violet-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Department Load</p>
              <p className="mt-2 text-lg font-black text-violet-600">{topDepartmentLoad.name}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{topDepartmentLoad.count} active courses</p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <ChartPanel
        title="Course Workspace"
        subtitle="Search the catalog, isolate unassigned courses, and manage semester distribution from one place."
      >
        <div className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course name, code, department, or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-gray-100 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            />
          </div>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="rounded-xl bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          >
            <option value="all">All Semesters</option>
            {[...Array(8)].map((_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                Semester {index + 1}
              </option>
            ))}
          </select>
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="rounded-xl bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          >
            <option value="all">All Assignments</option>
            <option value="assigned">Assigned Faculty</option>
            <option value="unassigned">Unassigned Faculty</option>
          </select>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Coverage Signal</p>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{assignedCourses} courses already have faculty owners.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the assignment filter to quickly isolate the remaining open load.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Semester Mix</p>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{semesterSpread || 0} semesters are represented in the catalog.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Balanced spread makes term planning easier for HOD and faculty allocation.</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-900/30 dark:bg-violet-900/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Quick Priority</p>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{unassignedCourses} courses still need assignment review.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Assigning them early reduces scheduling friction before evaluation cycles begin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">{course.courseName}</h3>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{course.courseCode}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  Sem {course.semester}
                </span>
              </div>

              <div className="mt-5 flex-1 space-y-3 rounded-2xl bg-gray-50/90 p-4 dark:bg-gray-900/40">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Department</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{course.departmentId?.name || 'No Department'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Faculty Owner</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {course.assignedFaculty?.name || 'Not Assigned'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {course.assignedFaculty?.email || 'Assign a faculty member to complete teaching coverage.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    course.assignedFaculty
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  }`}
                >
                  {course.assignedFaculty ? 'Faculty Assigned' : 'Needs Assignment'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditCourse(course);
                      setFormData({
                        courseName: course.courseName,
                        courseCode: course.courseCode,
                        semester: course.semester,
                        departmentId: course.departmentId?._id || '',
                        assignedFaculty: course.assignedFaculty?._id || ''
                      });
                      setShowModal(true);
                    }}
                    className="rounded-xl p-2 text-slate-600 transition hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-700"
                    aria-label={`Edit ${course.courseName}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="rounded-xl p-2 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label={`Delete ${course.courseName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700">
            No courses match the current search, semester, or assignment filters.
          </div>
        )}
      </ChartPanel>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-3xl overflow-hidden p-0"
          >
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white">
              <h2 className="text-2xl font-black">{editCourse ? 'Edit' : 'Create'} Course</h2>
              <p className="mt-2 text-sm text-slate-200">
                Build a cleaner course record with assignment and semester planning in one workflow.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Departments</p>
                  <p className="mt-1 text-xl font-black">{departments.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Faculty Pool</p>
                  <p className="mt-1 text-xl font-black">{faculty.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Code Hint</p>
                  <p className="mt-1 text-xl font-black">{nextCourseCodeHint}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Course Name</label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    required
                    placeholder="e.g., Advanced Data Structures"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Course Code</label>
                    <input
                      type="text"
                      value={formData.courseCode}
                      onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                      className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                      placeholder="e.g., CSE402"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Assign Faculty</label>
                  <select
                    value={formData.assignedFaculty}
                    onChange={(e) => setFormData({ ...formData, assignedFaculty: e.target.value })}
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Builder Notes</p>
                  <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <p>Use a department-aligned code pattern so the catalog stays easier to scan.</p>
                    <p>Assign faculty now if the teaching owner is already known to improve coverage visibility.</p>
                    <p>Keep semester mapping accurate so HOD and admin planning dashboards stay reliable.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Suggested Pattern</p>
                  <p className="mt-2 text-lg font-black text-gray-900 dark:text-white">{nextCourseCodeHint}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This is a quick helper based on the selected department and semester.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Planning signal</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {formData.assignedFaculty
                          ? 'This course already has a selected faculty owner, which improves rollout readiness.'
                          : 'Leaving the faculty blank is okay for now, but it will appear in the open assignment queue.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 lg:col-span-2">
                <button type="submit" className="btn-primary flex-1">
                  {editCourse ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditCourse(null);
                    setFormData({ courseName: '', courseCode: '', semester: 1, departmentId: '', assignedFaculty: '' });
                  }}
                  className="btn-secondary flex-1"
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

export default CourseManagement;
