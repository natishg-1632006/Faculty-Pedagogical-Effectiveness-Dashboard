import express from 'express';
import {
  createUser, getAllUsers, updateUser, deleteUser, toggleUserStatus, resetUserPassword,
  createDepartment, getAllDepartments, updateDepartment, deleteDepartment,
  createCourse, getAllCourses, updateCourse, deleteCourse,
  getSystemStats, getAuditLogs, getAnalytics
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('Admin'));

// User Management
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);

// Department Management
router.post('/departments', createDepartment);
router.get('/departments', getAllDepartments);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Course Management
router.post('/courses', createCourse);
router.get('/courses', getAllCourses);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// System Monitoring
router.get('/stats', getSystemStats);
router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);

export default router;
