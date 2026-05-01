import express from 'express';
import {
  getDashboard,
  getStudents, createStudent, updateStudent, deleteStudent,
  getFaculty,  createFaculty, updateFaculty, deleteFaculty,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClasses,  createClass,   updateClass,   deleteClass,
  getAttendanceReports,
  enrollStudentAdmin,
  getAllSessions,
  getSessionDetails,
  deleteDepartment,
  updateDepartment,
  createDepartment,
  getDepartments,
} from '../controllers/adminController.js';
import { restrictTo, verifyToken } from '../../../middleware/verifyToken.js';

const router = express.Router();

// All admin routes require admin token
router.use(verifyToken, restrictTo('admin'));

router.get('/dashboard', getDashboard);

router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

router.route('/faculty').get(getFaculty).post(createFaculty);
router.route('/faculty/:id').put(updateFaculty).delete(deleteFaculty);

router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

router.route('/classes').get(getClasses).post(createClass);
router.route('/classes/:id').put(updateClass).delete(deleteClass);

router.get('/reports', getAttendanceReports);
// adminRoutes.js
router.post('/classes/:id/enroll', verifyToken, restrictTo('admin'), enrollStudentAdmin);

router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

router.get('/sessions', getAllSessions);
router.get('/sessions/:id', getSessionDetails);

export default router;