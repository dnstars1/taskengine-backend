async function createSession(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { courseId, duration, date } = req.body;

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: req.userId },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const session = await prisma.studySession.create({
      data: {
        userId: req.userId,
        courseId,
        duration,
        date: date ? new Date(date) : new Date(),
      },
      include: { course: { select: { name: true } } },
    });

    res.status(201).json({ ...session, courseName: session.course.name });
  } catch (err) {
    next(err);
  }
}

async function getWeeklyStats(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const now = new Date();

    // Monday–Sunday week boundaries
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + mondayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.userId,
        date: { gte: weekStart, lt: weekEnd },
      },
      include: { course: { select: { name: true } } },
    });

    // Group by module/course
    const byModule = {};
    for (const s of sessions) {
      const name = s.course.name;
      if (!byModule[name]) {
        byModule[name] = { courseName: name, courseId: s.courseId, totalMinutes: 0, sessionCount: 0 };
      }
      byModule[name].totalMinutes += s.duration;
      byModule[name].sessionCount += 1;
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    res.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalMinutes,
      modules: Object.values(byModule),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession, getWeeklyStats };
