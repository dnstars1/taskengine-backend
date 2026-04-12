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

    // Assignments due in the next 7 days (rolling window)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeek = assignments.filter((a) => a.dueDate <= sevenDaysFromNow);

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

    // Workload score: combines urgent (3-day) and 7-day deadlines, weighted by difficulty
    // Urgent items count double since they're more pressing
    const urgentScore = urgent.reduce((sum, a) => sum + (a.difficulty || 3) * 2, 0);
    const weekScore = dueThisWeek
      .filter((a) => !urgent.includes(a))
      .reduce((sum, a) => sum + (a.difficulty || 3), 0);
    const totalScore = urgentScore + weekScore;
    // Scale so ~30 points = 100 (e.g. 3 hard urgent = 30, 5 hard week-level = 25)
    const workloadScore = Math.min(Math.round((totalScore / 30) * 100), 100);

    let workloadStatus = 'light';
    if (workloadScore >= 60) workloadStatus = 'heavy';
    else if (workloadScore >= 25) workloadStatus = 'moderate';

    // Find the hardest urgent assignment
    const hardestDifficulty = urgent.length > 0
      ? Math.max(...urgent.map((a) => a.difficulty || 3))
      : 0;

    res.json({
      workloadStatus,
      workloadScore,
      totalAssignments: assignments.length,
      dueThisWeek: dueThisWeek.length,
      urgentCount: urgent.length,
      hardestDifficulty,
      totalStudyMinutes,
      nextDeadline: assignments.length > 0 ? assignments[0] : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
