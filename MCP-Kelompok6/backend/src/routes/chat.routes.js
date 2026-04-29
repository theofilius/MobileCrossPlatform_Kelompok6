const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth');

router.get('/rooms/:reportId', auth, chatController.getOrCreateRoom);
router.get('/messages/:roomId', auth, chatController.getMessages);

module.exports = router;
