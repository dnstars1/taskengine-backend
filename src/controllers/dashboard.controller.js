async function getSummary(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const now = new Date();

    // Monday–Sunday week boundaries
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + mondayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Upcoming assignments (not past due)
    const assignments = await prisma.assignment.findMany({
      where: { userId: req.userId, dueDate: { gte: now } },
      include: { course: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    // Assignments due this week
    const dueThisWeek = assignments.filter(
      (a) => a.dueDate >= weekStart && a.dueDate < weekEnd
    );

    // Assignments due within 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const urgent = assignments.filter((a) => a.dueDate <= threeDaysFromNow);

    // Study sessions this week
    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.userId,
        date: { gte: weekStart, lt: weekEnd },
      },
    });

    const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Determine workload status
    let workloadStatus = 'light';
    if (urgent.length >= 3) workloadStatus = 'heavy';
    else if (urgent.length >= 1) workloadStatus = 'moderate';

    res.json({
      workloadStatus,
      totalAssignments: assignments.length,
      dueThisWeek: dueThisWeek.length,
      urgentCount: urgent.length,
      totalStudyMinutes,
      nextDeadline: assignments.length > 0 ? assignments[0] : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
