const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth.middleware');
const { sync, resync, status, disconnect } = require('../controllers/moodle.controller');

const router = Router();

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId,
  message: { error: 'Too many sync requests, please try again later' },
});

router.post('/sync', auth, syncLimiter, sync);
router.post('/resync', auth, syncLimiter, resync);
router.get('/status', auth, status);
router.post('/disconnect', auth, disconnect);

module.exports = router;
