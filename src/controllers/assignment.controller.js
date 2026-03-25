const { calculatePriority } = require('../utils/priorityCalculator');

async function listAssignments(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const assignments = await prisma.assignment.findMany({
      where: {
        userId: req.userId,
        dueDate: { gte: new Date() },
      },
      include: { course: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });

    // Recalculate priorities on read
    const result = assignments.map((a) => ({
      ...a,
      priority: calculatePriority(a.difficulty, a.dueDate),
      courseName: a.course.name,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createAssignment(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { title, courseId, dueDate, difficulty } = req.body;

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: req.userId },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const priority = calculatePriority(difficulty || 3, dueDate);

    const assignment = await prisma.assignment.create({
      data: {
        title,
        courseId,
        userId: req.userId,
        dueDate: new Date(dueDate),
        difficulty: difficulty || 3,
        priority,
        source: 'manual',
      },
      include: { course: { select: { name: true } } },
    });

    res.status(201).json({ ...assignment, courseName: assignment.course.name });
  } catch (err) {
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { difficulty, title, dueDate } = req.body;

    // Verify ownership
    const existing = await prisma.assignment.findFirst({
      where: { id: Number(id), userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const newDifficulty = difficulty !== undefined ? difficulty : existing.difficulty;
    const newDueDate = dueDate ? new Date(dueDate) : existing.dueDate;
    const priority = calculatePriority(newDifficulty, newDueDate);

    const data = { priority };
    if (title !== undefined) data.title = title;
    if (difficulty !== undefined) data.difficulty = difficulty;
    if (dueDate !== undefined) data.dueDate = newDueDate;

    const assignment = await prisma.assignment.update({
      where: { id: Number(id) },
      data,
      include: { course: { select: { name: true } } },
    });

    res.json({ ...assignment, courseName: assignment.course.name });
  } catch (err) {
    next(err);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    const existing = await prisma.assignment.findFirst({
      where: { id: Number(id), userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.assignment.delete({ where: { id: Number(id) } });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAssignments, createAssignment, updateAssignment, deleteAssignment };
