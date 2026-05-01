import express from "express";

import attendanceRoutes from "../modules/smartAttendance/routes/attendanceRoutes.js";
import facultyRoutes from "../modules/smartAttendance/routes/facultyRoutes.js";
import studentRoutes from "../modules/smartAttendance/routes/studentRoutes.js";
import adminRoutes from "../modules/smartAttendance/routes/adminRoutes.js";

import biometricsRoutes from "../modules/smartAttendance/routes/biometricsRoutes.js";

const router = express.Router();

router.use("/attendance", attendanceRoutes);
router.use("/faculty", facultyRoutes);
router.use("/student", studentRoutes);
router.use("/admin", adminRoutes);

router.use('/biometrics', biometricsRoutes);

export default router;