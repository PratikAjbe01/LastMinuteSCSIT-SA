import express from 'express';
import { markAttendance } from '../controllers/attendanceController.js';
import { restrictTo, verifyToken } from '../../../middleware/verifyToken.js';

const router = express.Router();

router.post('/mark', verifyToken, restrictTo('student'), markAttendance);

export default router;