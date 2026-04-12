async function listModules(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const courses = await prisma.course.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { assignments: true, studySessions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = courses.map((c) => ({
      id: c.id,
      name: c.name,
      assignmentCount: c._count.assignments,
      sessionCount: c._count.studySessions,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listModules };
