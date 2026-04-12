const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { getProfile, updateSettings } = require('../controllers/user.controller');

const router = Router();

router.get('/profile', auth, getProfile);
router.put('/settings', auth, updateSettings);

module.exports = router;
