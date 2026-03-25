const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const chatbot = require('../controllers/chatbotController');

router.post('/query', auth, role('admin'), chatbot.query);

module.exports = router;
