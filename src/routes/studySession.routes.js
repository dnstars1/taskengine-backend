const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth.middleware');
const { createSession, getWeeklyStats } = require('../controllers/studySession.controller');

const router = Router();

router.post(
  '/',
  auth,
  [
    body('courseId').isInt().withMessage('courseId must be an integer'),
    body('duration').isInt({ min: 1 }).withMessage('duration must be a positive integer (minutes)'),
    body('date').optional().isISO8601().withMessage('date must be a valid ISO date'),
  ],
  validate,
  createSession
);

router.get('/weekly', auth, getWeeklyStats);

module.exports = router;
