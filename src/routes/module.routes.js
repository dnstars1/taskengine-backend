const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { listModules } = require('../controllers/module.controller');

const router = Router();

router.get('/', auth, listModules);

module.exports = router;
