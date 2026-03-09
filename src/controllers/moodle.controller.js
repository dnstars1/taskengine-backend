const { parseIcsUrl } = require('../utils/icsParser');
const { calculatePriority } = require('../utils/priorityCalculator');

async function sync(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { icsUrl } = req.body;

    if (!icsUrl) {
      return res.status(400).json({ error: 'icsUrl is required' });
    }

    // Save the ICS URL on the user
    await prisma.user.update({
      where: { id: req.userId },
      data: { icsUrl, lastSync: new Date() },
    });

    // Parse events from ICS
    const events = await parseIcsUrl(icsUrl);

    let created = 0;
    let updated = 0;

    for (const event of events) {
      // Find or create course
      const course = await prisma.course.upsert({
        where: { name_userId: { name: event.courseName, userId: req.userId } },
        update: {},
        create: { name: event.courseName, userId: req.userId },
      });

      if (!event.icsUid) continue;

      const priority = calculatePriority(10, 3, event.dueDate);

      // Upsert assignment by icsUid
      const existing = await prisma.assignment.findUnique({
        where: { icsUid_userId: { icsUid: event.icsUid, userId: req.userId } },
      });

      if (existing) {
        await prisma.assignment.update({
          where: { id: existing.id },
          data: {
            title: event.title,
            dueDate: event.dueDate,
            courseId: course.id,
            priority,
          },
        });
        updated++;
      } else {
        await prisma.assignment.create({
          data: {
            title: event.title,
            courseId: course.id,
            userId: req.userId,
            dueDate: event.dueDate,
            weight: 10,
            difficulty: 3,
            priority,
            source: 'ics',
            icsUid: event.icsUid,
          },
        });
        created++;
      }
    }

    res.json({
      message: 'Sync complete',
      created,
      updated,
      total: events.length,
    });
  } catch (err) {
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { icsUrl: true, lastSync: true },
    });

    res.json({
      connected: !!user.icsUrl,
      lastSync: user.lastSync,
    });
  } catch (err) {
    next(err);
  }
}

async function disconnect(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    await prisma.user.update({
      where: { id: req.userId },
      data: { icsUrl: null, lastSync: null },
    });

    res.json({ message: 'Moodle disconnected' });
  } catch (err) {
    next(err);
  }
}

module.exports = { sync, status, disconnect };
