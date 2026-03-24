import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const API_URL = configuredApiUrl
  ? `${configuredApiUrl}/api`
  : import.meta.env.DEV
    ? '/api'
    : 'https://faculty-pedagogical-effectiveness-tn7x.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin APIs
export const adminAPI = {
  createUser: (data) => api.post('/admin/users', data),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  resetPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  
  createDepartment: (data) => api.post('/admin/departments', data),
  getAllDepartments: () => api.get('/admin/departments'),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  
  createCourse: (data) => api.post('/admin/courses', data),
  getAllCourses: () => api.get('/admin/courses'),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  
  getSystemStats: () => api.get('/admin/stats'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getAnalytics: () => api.get('/admin/analytics'),
};

// HOD APIs
export const hodAPI = {
  getDepartmentPerformance: () => api.get('/hod/department-performance'),
  getFacultyRanking: (semester) => api.get('/hod/faculty-ranking', { params: { semester } }),
  getFacultyDetails: (id) => api.get(`/hod/faculty/${id}`),
  getLowPerformers: () => api.get('/hod/low-performers'),
  getDepartmentFaculty: () => api.get('/hod/department-faculty'),
  createFeedbackForm: (data) => api.post('/hod/feedback-forms', data),
  getFeedbackForms: () => api.get('/hod/feedback-forms'),
  publishForm: (id) => api.patch(`/hod/feedback-forms/${id}/publish`),
  getFormAnalytics: (formId, params) => api.get('/feedback', { params: { ...params, formId } }),
  deleteForm: (id) => api.delete(`/hod/feedback-forms/${id}`),
  sendNotification: (data) => api.post('/hod/notify', data),
};

// Faculty APIs
export const facultyAPI = {
  getDashboard: () => api.get('/faculty/dashboard'),
  getSubjectPerformance: () => api.get('/faculty/subject-performance'),
  getSemesterTrend: () => api.get('/faculty/semester-trend'),
};

// Common APIs
export const commonAPI = {
  submitFeedback: (data) => api.post('/feedback', data),
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  downloadPDF: (facultyId, semester) => api.get('/reports/pdf', { 
    params: { facultyId, semester },
    responseType: 'blob'
  }),
  downloadCSV: (departmentId) => api.get('/reports/csv', { 
    params: { departmentId },
    responseType: 'blob'
  }),
  getPublishedForms: () => api.get('/student/forms'),
  submitStudentFeedback: (data) => api.post('/student/feedback', data),
};

export default api;
