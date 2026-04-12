const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { getMonthAssignments } = require('../controllers/calendar.controller');

const router = Router();

router.get('/:year/:month', auth, getMonthAssignments);

module.exports = router;
