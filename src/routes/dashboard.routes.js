const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { getSummary } = require('../controllers/dashboard.controller');

const router = Router();

router.get('/summary', auth, getSummary);

module.exports = router;
