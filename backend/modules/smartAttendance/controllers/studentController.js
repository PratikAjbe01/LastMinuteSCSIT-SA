import AttendanceLedger  from '../models/AttendanceLedger.js';
import AttendanceSession from '../models/AttendanceSession.js';

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

// ────────────────────────────────────────────────────────────────────────────
// GET /api/student/dashboard
// ────────────────────────────────────────────────────────────────────────────
export const getDashboardData = async (req, res) => {
  try {
    const studentId = req.user._id;

    const [ledgers, recentSessions] = await Promise.all([
      AttendanceLedger.find({ student: studentId })
        .populate('subject', 'name code')
        .populate('class',   'name section')
        .lean(),
      AttendanceSession.find({ 'attendees.student': studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('subject', 'name code')
        .populate('class',   'name section')
        .lean(),
    ]);

    let totalClasses = 0;
    let attended     = 0;
    ledgers.forEach((l) => {
      totalClasses += l.totalClasses;
      attended     += l.attended;
    });

    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

    const subjectBreakdown = ledgers.map((l) => ({
      subject:      l.subject?.name || '—',
      subjectCode:  l.subject?.code,
      className:    `${l.class?.name || ''} ${l.class?.section || ''}`.trim(),
      attended:     l.attended     || 0,
      totalClasses: l.totalClasses || 0,
      percentage:   l.totalClasses > 0 ? Math.round((l.attended / l.totalClasses) * 100) : 0,
    }));

    res.json({
      success: true,
      stats: {
        totalClasses,
        attendedClasses:  attended,
        percentage,
        enrolledSubjects: ledgers.length,
        lastAttendance:   recentSessions[0]?.createdAt || null,
      },
      subjectBreakdown,
      recentSessions: recentSessions.map((s) => ({
        _id:         s._id,
        subjectName: s.subject?.name,
        subjectCode: s.subject?.code,
        className:   `${s.class?.name || ''} ${s.class?.section || ''}`.trim(),
        date:        s.date,
        status:      'Present',
      })),
    });
  } catch (err) {
    console.error('[getDashboardData]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/student/attendance-history
// Query: page, limit, search (subject name/code), date, status
// ────────────────────────────────────────────────────────────────────────────
export const getAttendanceHistory = async (req, res) => {
  try {
    const { page, limit, search, date } = req.query;
    const { skip, buildMeta }           = paginate({}, { page, limit });
    const studentId                     = req.user._id;

    const pipeline = [
      { $match: { 'attendees.student': studentId, status: 'completed' } },
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subject' } },
      { $lookup: { from: 'classes',  localField: 'class',   foreignField: '_id', as: 'class'   } },
      { $lookup: { from: 'users',    localField: 'faculty', foreignField: '_id', as: 'faculty'  } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$class',   preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
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
      ...(date ? [{ $match: { date } }] : []),
      { $sort: { startTime: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) || 10 },
            {
              $project: {
                _id:         1,
                subject:     '$subject.name',
                subjectCode: '$subject.code',
                class: {
                  $trim: {
                    input: { $concat: [
                      { $ifNull: ['$class.name',    ''] }, ' ',
                      { $ifNull: ['$class.section', ''] },
                    ]},
                  },
                },
                faculty:   '$faculty.name',
                date:      1,
                startTime: 1,
                markedAt: {
                  $let: {
                    vars: {
                      record: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$attendees',
                              cond:  { $eq: ['$$this.student', studentId] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: '$$record.markedAt',
                  },
                },
                status: { $literal: 'Present' },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await AttendanceSession.aggregate(pipeline);
    const history  = result.data    || [];
    const total    = result.total[0]?.count || 0;

    res.json({ success: true, history, pagination: buildMeta(total) });
  } catch (err) {
    console.error('[getAttendanceHistory]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};