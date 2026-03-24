import express from 'express';
import { getDepartmentPerformance, getFacultyRanking, getLowPerformers, getFacultyDetails, createFeedbackForm, publishFeedbackForm, deleteFeedbackForm, getFeedbackForms, getDepartmentFaculty, sendNotificationToFaculty } from '../controllers/hodController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('HOD'));

router.get('/department-performance', getDepartmentPerformance);
router.get('/faculty-ranking', getFacultyRanking);
router.get('/faculty/:id', getFacultyDetails);
router.get('/low-performers', getLowPerformers);
router.get('/department-faculty', getDepartmentFaculty);
router.post('/feedback-forms', createFeedbackForm);
router.get('/feedback-forms', getFeedbackForms);
router.patch('/feedback-forms/:id/publish', publishFeedbackForm);
router.delete('/feedback-forms/:id', deleteFeedbackForm);
router.post('/notify', sendNotificationToFaculty);

export default router;
