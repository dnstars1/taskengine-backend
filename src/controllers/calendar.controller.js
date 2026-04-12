async function getMonthAssignments(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { year, month } = req.params;
    const y = Number(year);
    const m = Number(month);

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    const assignments = await prisma.assignment.findMany({
      where: {
        userId: req.userId,
        dueDate: { gte: startDate, lt: endDate },
      },
      include: { course: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    // Group by "YYYY-MM-DD" key (matches Flutter format)
    const grouped = {};
    for (const a of assignments) {
      const key = a.dueDate.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        ...a,
        courseName: a.course.name,
      });
    }

    res.json(grouped);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMonthAssignments };
