require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./utils/prisma');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const moodleRoutes = require('./routes/moodle.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const calendarRoutes = require('./routes/calendar.routes');
const studySessionRoutes = require('./routes/studySession.routes');
const moduleRoutes = require('./routes/module.routes');
const insightsRoutes = require('./routes/insights.routes');

const app = express();

app.set('prisma', prisma);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Swagger UI — optional, server won't crash if file/package is missing
try {
  const swaggerUi = require('swagger-ui-express');
  const yaml = require('js-yaml');
  const fs = require('fs');
  const path = require('path');
  const swaggerDoc = yaml.load(
    fs.readFileSync(path.join(__dirname, '..', 'swagger.yaml'), 'utf8')
  );
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'TaskEngine API Docs',
  }));
} catch (e) {
  console.warn('Swagger UI not loaded:', e.message);
}

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
app.use('/api/insights', insightsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Run: lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

async function start() {
  try {
    // Simple DB ping via adapter — fails fast if the database is unreachable.
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅  TaskEngine API running on http://0.0.0.0:${PORT}`);
    console.log(`📖  Swagger UI:  http://localhost:${PORT}/docs`);
  });
}

const graceful = async () => {
  await prisma.$disconnect();
  if (globalThis.__pgPool) await globalThis.__pgPool.end();
  server.close(() => process.exit(0));
};
process.on('SIGINT', graceful);
process.on('SIGTERM', graceful);

start();
