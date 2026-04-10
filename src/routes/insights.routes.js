const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { getStudyAdvice } = require('../controllers/insights.controller');

const router = Router();

router.get('/study-advice', auth, getStudyAdvice);

module.exports = router;
