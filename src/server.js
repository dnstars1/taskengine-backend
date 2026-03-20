require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const moodleRoutes = require('./routes/moodle.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const calendarRoutes = require('./routes/calendar.routes');
const studySessionRoutes = require('./routes/studySession.routes');
const moduleRoutes = require('./routes/module.routes');

const app = express();
const prisma = new PrismaClient();

// Share Prisma client via app settings
app.set('prisma', prisma);

// Global middleware
app.use(cors({ origin: false }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/moodle', moodleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/modules', moduleRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TaskEngine API running on http://0.0.0.0:${PORT}`);
});
