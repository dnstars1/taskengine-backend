const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { sync, status, disconnect } = require('../controllers/moodle.controller');

const router = Router();

router.post('/sync', auth, sync);
router.get('/status', auth, status);
router.post('/disconnect', auth, disconnect);

module.exports = router;
