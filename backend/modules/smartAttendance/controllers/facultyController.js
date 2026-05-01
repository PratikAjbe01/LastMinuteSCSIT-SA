import Class             from '../models/Class.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLedger  from '../models/AttendanceLedger.js';
import Subject           from '../models/Subject.js';
import { User }          from '../../../models/user.model.js';
import { getIO, scheduleAutoEnd, stopSessionInterval } from '../socket/socketHandler.js';
import { getClientIP, getSubnet, normalizeIP } from '../utils/ipHelpers.js';

// ── Pagination helper ────────────────────────────────────────────────────────
const paginate = (query, { page = 1, limit = 10 }) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    skip:       (p - 1) * l,
    limit:      l,
    page:       p,
    buildMeta:  (total) => ({
      total,
      page:       p,
      limit:      l,
      totalPages: Math.ceil(total / l),
      hasNext:    p * l < total,
      hasPrev:    p > 1,
    }),
  };
};

// ── Filter builder ───────────────────────────────────────────────────────────
const buildFilter = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = typeof query[field] === 'string'
        ? { $regex: query[field], $options: 'i' }
        : query[field];
    }
  });
  return filter;
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/my-classes
// Query: page, limit, search (matches className/department)
// ────────────────────────────────────────────────────────────────────────────
export const getFacultyClasses = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, buildMeta }     = paginate({}, { page, limit });

    const baseFilter = { 'assignments.faculty': req.user._id };
    if (search) {
      baseFilter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const [classes, total] = await Promise.all([
      Class.find(baseFilter)
        .populate('assignments.subject', 'name code')
        .skip(skip)
        .limit(parseInt(limit) || 10)
        .lean(),
      Class.countDocuments(baseFilter),
    ]);

    const assignedClasses = classes.map((cls) => {
      const mySubjects = cls.assignments
        .filter((a) => a.faculty.toString() === req.user._id.toString())
        .map((a) => a.subject);

      return {
        classId:      cls._id,
        className:    `${cls.name}${cls.section ? ' - ' + cls.section : ''}`,
        department:   cls.department,
        subjects:     mySubjects,
        studentCount: cls.students?.length || 0,
      };
    });

    res.json({ success: true, assignedClasses, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getFacultyClasses]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/my-classes/:id
// ────────────────────────────────────────────────────────────────────────────
export const getFacultyClassById = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id:                   req.params.id,
      'assignments.faculty': req.user._id,
    })
      .populate('assignments.subject', 'name code')
      .populate('assignments.faculty', 'name email')
      .populate('students', 'name rollNumber email department');

    if (!cls)
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });

    res.json({ success: true, class: cls });
  } catch (err) {
    console.error('[getFacultyClassById]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/faculty/my-classes
// body: { name, section, department, subjectId }
// ────────────────────────────────────────────────────────────────────────────
export const createFacultyClass = async (req, res) => {
  try {
    const { name, section, department, subjectId } = req.body;

    if (!name)      return res.status(400).json({ success: false, message: 'Class name is required' });
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const cls = await Class.create({
      name,
      section:     section    || '',
      department:  department || req.user.department || '',
      assignments: [{ subject: subjectId, faculty: req.user._id }],
      students:    [],
    });

    await cls.populate([
      { path: 'assignments.subject', select: 'name code' },
      { path: 'assignments.faculty', select: 'name email' },
    ]);

    res.status(201).json({ success: true, class: cls });
  } catch (err) {
    console.error('[createFacultyClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/faculty/my-classes/:id
// body: { name, section, department }
// ────────────────────────────────────────────────────────────────────────────
export const updateFacultyClass = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id:                   req.params.id,
      'assignments.faculty': req.user._id,
    });
    if (!cls)
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });

    const { name, section, department } = req.body;
    if (name       !== undefined) cls.name       = name;
    if (section    !== undefined) cls.section    = section;
    if (department !== undefined) cls.department = department;

    await cls.save();
    await cls.populate([
      { path: 'assignments.subject', select: 'name code' },
      { path: 'assignments.faculty', select: 'name email' },
      { path: 'students',            select: 'name rollNumber email' },
    ]);

    res.json({ success: true, class: cls });
  } catch (err) {
    console.error('[updateFacultyClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/faculty/my-classes/:id
// ────────────────────────────────────────────────────────────────────────────
export const deleteFacultyClass = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id:                   req.params.id,
      'assignments.faculty': req.user._id,
    });
    if (!cls)
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });

    await Class.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    console.error('[deleteFacultyClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/faculty/my-classes/:id/enroll
// body: { studentId }
// ────────────────────────────────────────────────────────────────────────────
export const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ success: false, message: 'studentId is required' });

    const cls = await Class.findOne({
      _id:                   req.params.id,
      'assignments.faculty': req.user._id,
    });
    if (!cls)
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    if (cls.students.some((s) => s.toString() === studentId))
      return res.status(409).json({ success: false, message: 'Student already enrolled in this class' });

    cls.students.addToSet(studentId);
    await cls.save();
    await cls.populate('students', 'name rollNumber email department');

    res.json({ success: true, message: 'Student enrolled successfully', students: cls.students });
  } catch (err) {
    console.error('[addStudentToClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/faculty/my-classes/:id/students/:studentId
// ────────────────────────────────────────────────────────────────────────────
export const removeStudentFromClass = async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;

    const cls = await Class.findOne({
      _id:                   classId,
      'assignments.faculty': req.user._id,
    });
    if (!cls)
      return res.status(404).json({ success: false, message: 'Class not found or access denied' });

    cls.students = cls.students.filter((s) => s.toString() !== studentId);
    await cls.save();

    res.json({ success: true, message: 'Student removed from class' });
  } catch (err) {
    console.error('[removeStudentFromClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/faculty/start-session
// body: { classId, subjectId, maxAttendees? }
// ────────────────────────────────────────────────────────────────────────────
export const startSession = async (req, res) => {
  try {
    const { classId, subjectId, maxAttendees, durationMinutes } = req.body;

    if (!classId || !subjectId)
      return res.status(400).json({ success: false, message: 'classId and subjectId are required' });

    const cls = await Class.findOne({
      _id:         classId,
      assignments: { $elemMatch: { faculty: req.user._id, subject: subjectId } },
    });
    if (!cls)
      return res.status(403).json({ success: false, message: 'Not authorized for this class/subject' });

    const existing = await AttendanceSession.findOne({
      faculty: req.user._id, class: classId, subject: subjectId, status: 'active',
    });
    if (existing)
      return res.status(409).json({
        success:   false,
        message:   'Active session already exists',
        sessionId: existing._id,
        startTime: existing.startTime,   // ← add this so frontend can resume
      });

    // ── IP detection ──────────────────────────────────────────────────────
    const facultyRawIP    = getClientIP(req);
    const facultyPublicIP = normalizeIP(facultyRawIP);
    const allowedSubnet   = getSubnet(facultyPublicIP);

    console.log(`[startSession] Faculty IP: ${facultyRawIP} → normalized: ${facultyPublicIP} → subnet: ${allowedSubnet}`);

    // ── Duration / auto-end ───────────────────────────────────────────────
    const mins           = durationMinutes ? parseInt(durationMinutes) : null;
    const scheduledEndAt = mins ? new Date(Date.now() + mins * 60 * 1000) : null;

    const session = await AttendanceSession.create({
      faculty:         req.user._id,
      class:           classId,
      subject:         subjectId,
      date:            new Date().toISOString().split('T')[0],
      startTime:       new Date(),
      status:          'active',
      maxAttendees:    maxAttendees ? parseInt(maxAttendees) : null,
      allowedSubnet,
      facultyPublicIP,
      durationMinutes: mins,
      scheduledEndAt,
      activityLog: [{
        action:    'SESSION_STARTED',
        actor:     'faculty',
        actorId:   req.user._id,
        detail:    `Started from IP ${facultyPublicIP} | Subnet: ${allowedSubnet || 'unrestricted'} | Duration: ${mins ? mins + 'min' : 'unlimited'}`,
        timestamp: new Date(),
      }],
    });

    // Schedule auto-end if duration set
    const io = getIO();
    if (io && mins) {
      scheduleAutoEnd(io, session._id.toString(), mins);
    }

    res.status(201).json({
      success:         true,
      session,
      allowedSubnet,
      facultyPublicIP,
      scheduledEndAt:  scheduledEndAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[startSession]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PATCH /api/smart-attendance/faculty/sessions/:sessionId/duration ──────────
export const updateSessionDuration = async (req, res) => {
  try {
    const { sessionId }     = req.params;
    const { durationMinutes } = req.body;

    const mins           = durationMinutes ? parseInt(durationMinutes) : null;
    const scheduledEndAt = mins ? new Date(Date.now() + mins * 60 * 1000) : null;

    const session = await AttendanceSession.findOneAndUpdate(
      { _id: sessionId, faculty: req.user._id, status: 'active' },
      {
        durationMinutes: mins,
        scheduledEndAt,
        $push: {
          activityLog: {
            action:    'DURATION_UPDATED',
            actor:     'faculty',
            actorId:   req.user._id,
            detail:    mins
              ? `Duration updated to ${mins}min — auto-ends at ${scheduledEndAt?.toLocaleTimeString()}`
              : 'Duration removed — unlimited',
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    const io = getIO();
    if (io) {
      if (mins) {
        scheduleAutoEnd(io, sessionId, mins);
      } else {
        const { clearAutoEnd } = await import('../socket/socketHandler.js');
        clearAutoEnd(sessionId);
      }

      io.to(`session-${sessionId}`).emit('duration-updated', {
        sessionId,
        durationMinutes: mins,
        scheduledEndAt:  scheduledEndAt?.toISOString() ?? null,
      });
    }

    res.json({ success: true, durationMinutes: mins, scheduledEndAt });
  } catch (err) {
    console.error('[updateSessionDuration]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/smart-attendance/faculty/sessions/:sessionId/threshold
// body: { maxAttendees }
// ────────────────────────────────────────────────────────────────────────────
export const updateSessionThreshold = async (req, res) => {
  try {
    const { sessionId }  = req.params;
    const { maxAttendees } = req.body;
    const max = maxAttendees !== undefined ? parseInt(maxAttendees) || null : null;

    const session = await AttendanceSession.findOneAndUpdate(
      { _id: sessionId, faculty: req.user._id, status: 'active' },
      {
        maxAttendees: max,
        $push: {
          activityLog: {
            action:    'THRESHOLD_UPDATED',
            actor:     'faculty',
            actorId:   req.user._id,
            detail:    max ? `Threshold set to ${max}` : 'Threshold removed',
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found or unauthorized' });

    res.json({ success: true, maxAttendees: session.maxAttendees });
  } catch (err) {
    console.error('[updateSessionThreshold]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/smart-attendance/faculty/sessions/:sessionId/activity
// ────────────────────────────────────────────────────────────────────────────
export const getSessionActivity = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      _id:    req.params.sessionId,
      faculty: req.user._id,
    }).select('activityLog attendees maxAttendees allowedSubnet status');

    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    res.json({ success: true, session });
  } catch (err) {
    console.error('[getSessionActivity]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/faculty/end-session
// body: { sessionId }
// ────────────────────────────────────────────────────────────────────────────
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ success: false, message: 'sessionId is required' });

    const session = await AttendanceSession.findById(sessionId).populate('class', 'students');
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.faculty.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (session.status === 'completed')
      return res.json({ success: true, message: 'Session already ended' });

    session.status         = 'completed';
    session.endTime        = new Date();
    session.currentToken   = null;
    session.tokenExpiresAt = null;
    await session.save();

    stopSessionInterval(sessionId.toString());

    const enrolledStudents = session.class?.students || [];
    if (enrolledStudents.length > 0) {
      await AttendanceLedger.bulkWrite(
        enrolledStudents.map((studentId) => ({
          updateOne: {
            filter: {
              student: studentId,
              subject: session.subject,
              class:   session.class._id,
            },
            update: {
              $inc:         { totalClasses: 1 },
              $setOnInsert: { attended: 0 },
            },
            upsert: true,
          },
        }))
      );
    }

    res.json({ success: true, message: 'Session ended and attendance records updated' });
  } catch (err) {
    console.error('[endSession]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/sessions
// Query: page, limit, search (class/subject name), status, date
// ────────────────────────────────────────────────────────────────────────────
export const getFacultySessions = async (req, res) => {
  try {
    const { page, limit, search, status, date } = req.query;
    const { skip, buildMeta }                   = paginate({}, { page, limit });

    const baseFilter = { faculty: req.user._id };
    if (status) baseFilter.status = status;
    if (date)   baseFilter.date   = date;

    // For search on populated fields we use aggregation pipeline
    const pipeline = [
      { $match: baseFilter },
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subject' } },
      { $lookup: { from: 'classes',  localField: 'class',   foreignField: '_id', as: 'class'   } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$class',   preserveNullAndEmptyArrays: true } },
      ...(search
        ? [{
            $match: {
              $or: [
                { 'subject.name': { $regex: search, $options: 'i' } },
                { 'subject.code': { $regex: search, $options: 'i' } },
                { 'class.name':   { $regex: search, $options: 'i' } },
              ],
            },
          }]
        : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) || 10 },
            {
              $lookup: {
                from:         'users',
                localField:   'attendees.student',
                foreignField: '_id',
                as:           'studentDetails',
                pipeline:     [{ $project: { name: 1, rollNumber: 1, email: 1, department: 1 } }],
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await AttendanceSession.aggregate(pipeline);
    const sessions  = result.data    || [];
    const total     = result.total[0]?.count || 0;

    const formatted = sessions.map((s) => ({
      ...s,
      attendeeCount: s.attendees?.length || 0,
      attendees: (s.attendees || []).map((a) => {
        const studentInfo = s.studentDetails?.find(
          (sd) => sd._id.toString() === a.student?.toString()
        );
        return {
          ...a,
          student:      studentInfo || { _id: a.student },
          markedAtTime: a.markedAt
            ? new Date(a.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—',
        };
      }),
      studentDetails: undefined,
    }));

    res.json({ success: true, sessions: formatted, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getFacultySessions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/reports
// Query: page, limit, search (student name/roll), subject, className
// ────────────────────────────────────────────────────────────────────────────
export const getFacultyReports = async (req, res) => {
  try {
    const { page, limit, search, subject } = req.query;
    const { skip, buildMeta }              = paginate({}, { page, limit });

    const classes  = await Class.find({ 'assignments.faculty': req.user._id }).select('_id');
    const classIds = classes.map((c) => c._id);

    const pipeline = [
      { $match: { class: { $in: classIds } } },
      { $lookup: { from: 'users',    localField: 'student', foreignField: '_id', as: 'student' } },
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subject' } },
      { $lookup: { from: 'classes',  localField: 'class',   foreignField: '_id', as: 'class'   } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$class',   preserveNullAndEmptyArrays: true } },
      ...(search
        ? [{
            $match: {
              $or: [
                { 'student.name':       { $regex: search, $options: 'i' } },
                { 'student.rollNumber': { $regex: search, $options: 'i' } },
                { 'student.email':      { $regex: search, $options: 'i' } },
              ],
            },
          }]
        : []),
      ...(subject ? [{ $match: { 'subject.name': { $regex: subject, $options: 'i' } } }] : []),
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) || 10 },
            {
              $project: {
                _id:          1,
                studentName:  '$student.name',
                rollNumber:   '$student.rollNumber',
                email:        '$student.email',
                department:   '$student.department',
                subject:      '$subject.name',
                subjectCode:  '$subject.code',
                className: {
                  $trim: {
                    input: { $concat: [
                      { $ifNull: ['$class.name', ''] }, ' ',
                      { $ifNull: ['$class.section', ''] },
                    ]},
                  },
                },
                attended:     1,
                totalClasses: 1,
                percentage: {
                  $cond: [
                    { $gt: ['$totalClasses', 0] },
                    { $multiply: [{ $divide: ['$attended', '$totalClasses'] }, 100] },
                    0,
                  ],
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await AttendanceLedger.aggregate(pipeline);
    const reports   = result.data    || [];
    const total     = result.total[0]?.count || 0;

    res.json({ success: true, reports, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getFacultyReports]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/students
// Query: page, limit, search (name/roll/email), department
// ────────────────────────────────────────────────────────────────────────────
export const getAllStudentsForFaculty = async (req, res) => {
  try {
    const { page, limit, search, department } = req.query;
    const { skip, buildMeta }                 = paginate({}, { page, limit });

    const filter = { role: 'student' };
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit) || 10)
        .select('name rollNumber email department'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, students, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getAllStudentsForFaculty]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/faculty/subjects
// Query: page, limit, search (name/code), department
// ────────────────────────────────────────────────────────────────────────────
export const getFacultySubjects = async (req, res) => {
  try {
    const { page, limit, search, department } = req.query;
    const { skip, buildMeta }                 = paginate({}, { page, limit });

    const filter = {};
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit) || 10)
        .select('name code department'),
      Subject.countDocuments(filter),
    ]);

    res.json({ success: true, subjects, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getFacultySubjects]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/faculty/sessions/:sessionId/attendees/:studentId
// ────────────────────────────────────────────────────────────────────────────
export const removeStudentFromSession = async (req, res) => {
  try {
    const { sessionId, studentId } = req.params;

    const session = await AttendanceSession.findOneAndUpdate(
      { _id: sessionId, faculty: req.user._id },
      { $pull: { attendees: { student: studentId } } },
      { new: true }
    );
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found or unauthorized' });

    await AttendanceLedger.updateOne(
      { student: studentId, subject: session.subject, class: session.class },
      { $inc: { attended: -1 } }
    );

    res.json({ success: true, message: 'Attendance record voided for this student' });
  } catch (err) {
    console.error('[removeStudentFromSession]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};