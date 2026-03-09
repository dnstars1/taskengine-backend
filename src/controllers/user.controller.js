async function getProfile(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        icsUrl: true,
        lastSync: true,
        notificationsEnabled: true,
        darkModeEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const { notificationsEnabled, darkModeEnabled } = req.body;

    const data = {};
    if (notificationsEnabled !== undefined) data.notificationsEnabled = notificationsEnabled;
    if (darkModeEnabled !== undefined) data.darkModeEnabled = darkModeEnabled;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        notificationsEnabled: true,
        darkModeEnabled: true,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateSettings };
