const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getFloorAttendanceSummary
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.post('/mark', authorize('FLOOR_MANAGER', 'ADMIN', 'OWNER'), markAttendance);
router.get('/floor/:floorId/summary', authorize('FLOOR_MANAGER', 'ADMIN', 'OWNER'), getFloorAttendanceSummary);

module.exports = router;