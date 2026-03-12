import express from 'express';
import { submitFeedback, getAllFeedbacks, getPublishedForms, submitStudentFeedback } from '../controllers/feedbackController.js';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { generatePDFReport, generateCSVReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Feedback routes
router.post('/feedback', submitFeedback);
router.get('/feedback', protect, authorize('Admin', 'HOD'), getAllFeedbacks);
router.get('/student/forms', getPublishedForms);
router.post('/student/feedback', submitStudentFeedback);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markAsRead);
router.patch('/notifications/read-all', protect, markAllAsRead);

// Report routes
router.get('/reports/pdf', protect, generatePDFReport);
router.get('/reports/csv', protect, authorize('Admin', 'HOD'), generateCSVReport);

export default router;
