import express from 'express';
import { getDashboardData, getAttendanceHistory } from '../controllers/studentController.js';
import { restrictTo, verifyToken } from '../../../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken, restrictTo('student'));

router.get('/dashboard',           getDashboardData);
router.get('/attendance-history',  getAttendanceHistory);

export default router;