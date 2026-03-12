import express from 'express';
import { getPersonalDashboard, getSubjectWisePerformance, getSemesterTrend } from '../controllers/facultyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('Faculty'));

router.get('/dashboard', getPersonalDashboard);
router.get('/subject-performance', getSubjectWisePerformance);
router.get('/semester-trend', getSemesterTrend);

export default router;
