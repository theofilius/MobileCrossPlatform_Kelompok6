const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/', auth, reportController.createReport);
router.get('/', auth, reportController.getReports);
router.get('/:id', auth, reportController.getReportById);
router.patch('/:id/status', auth, reportController.updateReportStatus);
router.post('/:id/media', auth, upload.array('files', 5), reportController.uploadMedia);
router.get('/:id/media', auth, reportController.getReportMedia);

module.exports = router;
