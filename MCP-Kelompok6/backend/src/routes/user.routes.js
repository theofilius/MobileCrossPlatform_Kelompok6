const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

router.put('/location', auth, userController.updateLocation);
router.get('/nearby', auth, userController.getNearbyVolunteers);
router.get('/responders/:reportId', auth, userController.getResponderTracking);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
