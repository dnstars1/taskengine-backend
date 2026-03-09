const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth.middleware');
const {
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignment.controller');

const router = Router();

router.get('/', auth, listAssignments);

router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('courseId').isInt().withMessage('courseId must be an integer'),
    body('dueDate').isISO8601().withMessage('dueDate must be a valid date'),
    body('weight').optional().isFloat({ min: 0 }).withMessage('weight must be a positive number'),
    body('difficulty').optional().isInt({ min: 1, max: 5 }).withMessage('difficulty must be 1-5'),
  ],
  validate,
  createAssignment
);

router.put('/:id', auth, updateAssignment);
router.delete('/:id', auth, deleteAssignment);

module.exports = router;
