import express from "express";
import {
  getFacultyClasses,
  getFacultyClassById,
  createFacultyClass,
  updateFacultyClass,
  deleteFacultyClass,
  addStudentToClass,
  getFacultySubjects,
  getAllStudentsForFaculty,
  startSession,
  endSession,
  getFacultySessions,
  getFacultyReports,
  removeStudentFromSession,
  updateSessionThreshold,
  updateSessionDuration,
  getSessionActivity,
} from "../controllers/facultyController.js";
import { restrictTo, verifyToken } from '../../../middleware/verifyToken.js';

const router = express.Router();
router.use(verifyToken, restrictTo("faculty"));

// ── Class management ──────────────────────────────────
router.route("/my-classes")
  .get(getFacultyClasses)
  .post(createFacultyClass);

router.route("/my-classes/:id")
  .get(getFacultyClassById)
  .put(updateFacultyClass)
  .delete(deleteFacultyClass);

router.post('/my-classes/:id/students', verifyToken, restrictTo('faculty'), addStudentToClass);
router.delete('/session/:sessionId/student/:studentId', verifyToken, restrictTo('faculty'), removeStudentFromSession);

// ── Reference data (for dropdowns) ───────────────────
router.get("/subjects", getFacultySubjects);
router.get("/students", getAllStudentsForFaculty);

// ── Sessions ──────────────────────────────────────────
router.post("/start-session", startSession);
router.post("/end-session",   endSession);
router.patch("/sessions/:sessionId/threshold", updateSessionThreshold);
router.patch("/sessions/:sessionId/duration", updateSessionDuration);
router.get("/sessions/:sessionId/activity", getSessionActivity);

router.get("/sessions",       getFacultySessions);
router.get("/reports",        getFacultyReports);

export default router;