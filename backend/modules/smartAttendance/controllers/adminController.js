import Class             from '../models/Class.js';
import Subject           from '../models/Subject.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLedger  from '../models/AttendanceLedger.js';
import { User }          from '../../../models/user.model.js';

// ── Pagination helper ────────────────────────────────────────────────────────
const paginate = (query, { page = 1, limit = 10 }) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    skip:      (p - 1) * l,
    limit:     l,
    page:      p,
    buildMeta: (total) => ({
      total,
      page:       p,
      limit:      l,
      totalPages: Math.ceil(total / l),
      hasNext:    p * l < total,
      hasPrev:    p > 1,
    }),
  };
};

// ── Generic user filter builder ───────────────────────────────────────────────
const buildUserFilter = (role, query) => {
  const { search, department, isActive } = query;
  const filter = { role };

  if (department)            filter.department = { $regex: department, $options: 'i' };
  if (isActive !== undefined) filter.isActive  = isActive === 'true';
  if (search) {
    filter.$or = [
      { name:       { $regex: search, $options: 'i' } },
      { email:      { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

export const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalClasses, totalSubjects, activeSessions] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'faculty'}),
        Class.countDocuments(),
        Subject.countDocuments(),
        AttendanceSession.countDocuments({ status: 'active' }),
      ]);

    res.json({
      success: true,
      stats: { totalStudents, totalFaculty, totalClasses, totalSubjects, activeSessions },
    });
  } catch (err) {
    console.error('[getDashboard]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENTS
// GET  /api/admin/students  — Query: page, limit, search, department, isActive
// POST /api/admin/students
// PUT  /api/admin/students/:id
// DEL  /api/admin/students/:id
// ════════════════════════════════════════════════════════════════════════════

export const getStudents = async (req, res) => {
  try {
    const { page, limit }   = req.query;
    const { skip, buildMeta } = paginate({}, { page, limit });
    const filter              = buildUserFilter('student', req.query);

    const [students, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit) || 10)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, students, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getStudents]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, email, password, rollNumber, phone, department } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already in use' });

    const student = await User.create({
      name, email, password, rollNumber, phone, department, role: 'student',
    });

    const { password: _, ...studentData } = student.toObject();
    res.status(201).json({ success: true, student: studentData });
  } catch (err) {
    console.error('[createStudent]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, phone, department, isActive, password } = req.body;

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (name       !== undefined) student.name       = name;
    if (email      !== undefined) student.email      = email;
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (phone      !== undefined) student.phone      = phone;
    if (department !== undefined) student.department = department;
    if (isActive   !== undefined) student.isActive   = isActive;
    if (password)                 student.password   = password;

    await student.save();
    const { password: _, ...studentData } = student.toObject();
    res.json({ success: true, student: studentData });
  } catch (err) {
    console.error('[updateStudent]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await Class.updateMany(
      { students: req.params.id },
      { $pull: { students: req.params.id } }
    );

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    console.error('[deleteStudent]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// FACULTY
// GET  /api/admin/faculty  — Query: page, limit, search, department, isActive
// POST /api/admin/faculty
// PUT  /api/admin/faculty/:id
// DEL  /api/admin/faculty/:id
// ════════════════════════════════════════════════════════════════════════════

export const getFaculty = async (req, res) => {
  try {
    const { page, limit }     = req.query;
    const { skip, buildMeta } = paginate({}, { page, limit });
    const filter              = buildUserFilter('faculty', req.query);

    const [faculty, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit) || 10)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, faculty, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getFaculty]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already in use' });

    const faculty = await User.create({ name, email, password, phone, department, role: 'faculty' });
    const { password: _, ...facultyData } = faculty.toObject();
    res.status(201).json({ success: true, faculty: facultyData });
  } catch (err) {
    console.error('[createFaculty]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { name, email, phone, department, isActive, password } = req.body;

    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    if (name       !== undefined) faculty.name       = name;
    if (email      !== undefined) faculty.email      = email;
    if (phone      !== undefined) faculty.phone      = phone;
    if (department !== undefined) faculty.department = department;
    if (isActive   !== undefined) faculty.isActive   = isActive;
    if (password)                 faculty.password   = password;

    await faculty.save();
    const { password: _, ...facultyData } = faculty.toObject();
    res.json({ success: true, faculty: facultyData });
  } catch (err) {
    console.error('[updateFaculty]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await User.findOneAndDelete({ _id: req.params.id, role: 'faculty' });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (err) {
    console.error('[deleteFaculty]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// SUBJECTS
// GET  /api/admin/subjects  — Query: page, limit, search (name/code), department
// POST /api/admin/subjects
// PUT  /api/admin/subjects/:id
// DEL  /api/admin/subjects/:id
// ════════════════════════════════════════════════════════════════════════════

export const getSubjects = async (req, res) => {
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
        .limit(parseInt(limit) || 10),
      Subject.countDocuments(filter),
    ]);

    res.json({ success: true, subjects, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getSubjects]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, department, credits } = req.body;

    if (!name || !code)
      return res.status(400).json({ success: false, message: 'name and code are required' });

    if (await Subject.findOne({ code: code.toUpperCase() }))
      return res.status(409).json({ success: false, message: 'Subject code already exists' });

    const subject = await Subject.create({ name, code: code.toUpperCase(), department, credits });
    res.status(201).json({ success: true, subject });
  } catch (err) {
    console.error('[createSubject]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (err) {
    console.error('[updateSubject]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('[deleteSubject]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// CLASSES
// GET  /api/admin/classes  — Query: page, limit, search (name/dept/section)
// POST /api/admin/classes
// PUT  /api/admin/classes/:id
// DEL  /api/admin/classes/:id
// POST /api/admin/classes/:id/enroll
// ════════════════════════════════════════════════════════════════════════════

export const getClasses = async (req, res) => {
  try {
    const { page, limit, search, department } = req.query;
    const { skip, buildMeta }                 = paginate({}, { page, limit });

    const filter = {};
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { section:    { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate('assignments.subject', 'name code')
        .populate('assignments.faculty', 'name email')
        .populate('students',            'name rollNumber email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit) || 10),
      Class.countDocuments(filter),
    ]);

    res.json({ success: true, classes, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getClasses]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, semester, section, department, assignments, students } = req.body;

    if (!name || !semester)
      return res.status(400).json({ success: false, message: 'name and semester are required' });

    const cls = await Class.create({
      name,
      semester,
      section:     section     || '',
      department:  department  || '',
      assignments: assignments || [],
      students:    students    || [],
    });

    await cls.populate([
      { path: 'assignments.subject', select: 'name code' },
      { path: 'assignments.faculty', select: 'name email' },
      { path: 'students',            select: 'name rollNumber email' },
    ]);

    res.status(201).json({ success: true, class: cls });
  } catch (err) {
    console.error('[createClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignments.subject', 'name code')
      .populate('assignments.faculty', 'name email')
      .populate('students',            'name rollNumber email');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, class: cls });
  } catch (err) {
    console.error('[updateClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    console.error('[deleteClass]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const enrollStudentAdmin = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ success: false, message: 'studentId is required' });

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: studentId } },
      { new: true }
    ).populate('students', 'name rollNumber email');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    res.json({ success: true, message: 'Student enrolled successfully', class: cls });
  } catch (err) {
    console.error('[enrollStudentAdmin]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ATTENDANCE REPORTS
// GET /api/admin/reports — Query: page, limit, search, department, subject
// ════════════════════════════════════════════════════════════════════════════

export const getAttendanceReports = async (req, res) => {
  try {
    const { page, limit, search, department, subject } = req.query;
    const { skip, buildMeta }                          = paginate({}, { page, limit });

    const pipeline = [
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
      ...(department ? [{ $match: { 'student.department': { $regex: department, $options: 'i' } } }] : []),
      ...(subject    ? [{ $match: { 'subject.name':       { $regex: subject,    $options: 'i' } } }] : []),
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) || 10 },
            {
              $project: {
                _id:         1,
                studentName: '$student.name',
                rollNumber:  '$student.rollNumber',
                email:       '$student.email',
                department:  '$student.department',
                subject:     '$subject.name',
                subjectCode: '$subject.code',
                className: {
                  $trim: {
                    input: { $concat: [
                      { $ifNull: ['$class.name',    ''] }, ' ',
                      { $ifNull: ['$class.section', ''] },
                    ]},
                  },
                },
                attended:     1,
                totalClasses: 1,
                percentage: {
                  $cond: [
                    { $gt: ['$totalClasses', 0] },
                    { $round: [{ $multiply: [{ $divide: ['$attended', '$totalClasses'] }, 100] }, 1] },
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
    console.error('[getAttendanceReports]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, buildMeta } = paginate({}, { page, limit });

    const [classes, subjects] = await Promise.all([
      Class.find().distinct('department'),
      Subject.find().distinct('department'),
    ]);

    let allDepts = [...new Set([...classes, ...subjects])].filter(Boolean).sort();

    if (search) {
      allDepts = allDepts.filter(d => d.toLowerCase().includes(search.toLowerCase()));
    }

    const total = allDepts.length;
    const paginated = allDepts.slice(skip, skip + parseInt(limit || 10));

    const departments = await Promise.all(
      paginated.map(async (name) => {
        const [classCount, subjectCount, studentCount] = await Promise.all([
          Class.countDocuments({ department: name }),
          Subject.countDocuments({ department: name }),
          User.countDocuments({ department: name, role: 'student' }),
        ]);
        return {
          _id: name,
          name,
          classCount,
          subjectCount,
          studentCount,
          totalCount: classCount + subjectCount,
        };
      })
    );

    res.json({ success: true, departments, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getDepartments]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });

    const exists = await Class.findOne({ department: name }) || await Subject.findOne({ department: name });
    if (exists) return res.status(409).json({ success: false, message: 'Department already exists' });

    await Class.create({ name: `${name} Default Class`, semester: '1', section: 'A', department: name });

    res.status(201).json({ success: true, department: { name } });
  } catch (err) {
    console.error('[createDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const oldName = req.params.id;
    const { name: newName } = req.body;

    if (!newName) return res.status(400).json({ success: false, message: 'New name is required' });

    await Promise.all([
      Class.updateMany({ department: oldName }, { department: newName }),
      Subject.updateMany({ department: oldName }, { department: newName }),
      User.updateMany({ department: oldName }, { department: newName }),
    ]);

    res.json({ success: true, message: 'Department updated successfully' });
  } catch (err) {
    console.error('[updateDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const name = req.params.id;

    const [classCount, subjectCount] = await Promise.all([
      Class.countDocuments({ department: name }),
      Subject.countDocuments({ department: name }),
    ]);

    if (classCount > 0 || subjectCount > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete department with existing classes or subjects' 
      });
    }

    await User.updateMany({ department: name }, { $unset: { department: 1 } });

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    console.error('[deleteDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const { page, limit, search, status, date, facultyId, subjectId } = req.query;
    const { skip, buildMeta } = paginate({}, { page, limit });

    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (facultyId) filter.faculty = facultyId;
    if (subjectId) filter.subject = subjectId;

    const pipeline = [
      { $match: filter },
      { $lookup: { from: 'users', localField: 'faculty', foreignField: '_id', as: 'faculty' } },
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subject' } },
      { $lookup: { from: 'classes', localField: 'class', foreignField: '_id', as: 'class' } },
      { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      ...(search ? [{
        $match: {
          $or: [
            { 'faculty.name': { $regex: search, $options: 'i' } },
            { 'subject.name': { $regex: search, $options: 'i' } },
            { 'class.name': { $regex: search, $options: 'i' } },
          ],
        },
      }] : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) || 10 },
            {
              $project: {
                _id: 1,
                facultyName: '$faculty.name',
                facultyEmail: '$faculty.email',
                subjectName: '$subject.name',
                subjectCode: '$subject.code',
                className: {
                  $trim: {
                    input: { $concat: [
                      { $ifNull: ['$class.name', ''] }, ' ',
                      { $ifNull: ['$class.section', ''] },
                    ]},
                  },
                },
                date: 1,
                startTime: 1,
                endTime: 1,
                status: 1,
                attendeeCount: { $size: { $ifNull: ['$attendees', []] } },
                maxAttendees: 1,
                durationMinutes: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await AttendanceSession.aggregate(pipeline);
    const sessions = result.data || [];
    const total = result.total[0]?.count || 0;

    res.json({ success: true, sessions, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getAllSessions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSessionDetails = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('faculty', 'name email department')
      .populate('subject', 'name code department')
      .populate('class', 'name section semester department students')
      .populate('attendees.student', 'name rollNumber email department')
      .lean();

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const ledgers = await AttendanceLedger.find({
      class: session.class._id,
      subject: session.subject._id,
    })
      .populate('student', 'name rollNumber email')
      .lean();

    const enrolledCount = session.class.students?.length || 0;
    const presentCount = session.attendees?.length || 0;
    const absentCount = enrolledCount - presentCount;

    res.json({
      success: true,
      session: {
        ...session,
        enrolledCount,
        presentCount,
        absentCount,
        attendancePercentage: enrolledCount > 0 ? Math.round((presentCount / enrolledCount) * 100) : 0,
      },
      ledgers,
    });
  } catch (err) {
    console.error('[getSessionDetails]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};