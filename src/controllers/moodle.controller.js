const { parseIcsUrl, cleanCourseName } = require('../utils/icsParser');
const { calculatePriority } = require('../utils/priorityCalculator');
const { encrypt, decrypt } = require('../utils/crypto');

function validateIcsUrl(icsUrl) {
  let parsed;
  try {
    parsed = new URL(icsUrl);
  } catch {
    return 'Invalid URL format';
  }

  if (parsed.protocol !== 'https:') {
    return 'Only HTTPS URLs are allowed';
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.endsWith('.local') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    return 'Internal/private URLs are not allowed';
  }

  return null;
}

async function syncEvents(prisma, userId, icsUrl) {
  // Clean up existing course names with Moodle prefixes
  const existingCourses = await prisma.course.findMany({
    where: { userId },
  });
  for (const course of existingCourses) {
    const cleaned = cleanCourseName(course.name);
    if (cleaned !== course.name) {
      // Check if a course with the clean name already exists
      const existing = await prisma.course.findUnique({
        where: { name_userId: { name: cleaned, userId } },
      });
      if (existing) {
        // Move assignments from old course to the clean-named one, then delete old
        await prisma.assignment.updateMany({
          where: { courseId: course.id },
          data: { courseId: existing.id },
        });
        await prisma.studySession.updateMany({
          where: { courseId: course.id },
          data: { courseId: existing.id },
        });
        await prisma.course.delete({ where: { id: course.id } });
      } else {
        await prisma.course.update({
          where: { id: course.id },
          data: { name: cleaned },
        });
      }
    }
  }

  const events = await parseIcsUrl(icsUrl);

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const course = await prisma.course.upsert({
      where: { name_userId: { name: event.courseName, userId } },
      update: {},
      create: { name: event.courseName, userId },
    });

    if (!event.icsUid) continue;

    const priority = calculatePriority(3, event.dueDate);

    const existing = await prisma.assignment.findUnique({
      where: { icsUid_userId: { icsUid: event.icsUid, userId } },
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
          userId,
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

  return { created, updated, total: events.length };
}

async function sync(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { icsUrl } = req.body;

    if (!icsUrl) {
      return res.status(400).json({ error: 'icsUrl is required' });
    }

    const validationError = validateIcsUrl(icsUrl);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const encryptedUrl = encrypt(icsUrl);

    await prisma.user.update({
      where: { id: req.userId },
      data: { icsUrl: encryptedUrl, lastSync: new Date() },
    });

    const result = await syncEvents(prisma, req.userId, icsUrl);

    res.json({ message: 'Sync complete', ...result });
  } catch (err) {
    next(err);
  }
}

async function resync(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { icsUrl: true },
    });

    if (!user?.icsUrl) {
      return res.status(400).json({ error: 'No Moodle URL configured' });
    }

    const icsUrl = decrypt(user.icsUrl);
    const result = await syncEvents(prisma, req.userId, icsUrl);

    await prisma.user.update({
      where: { id: req.userId },
      data: { lastSync: new Date() },
    });

    res.json({ message: 'Re-sync complete', ...result });
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

module.exports = { sync, resync, status, disconnect };
