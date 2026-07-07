const express = require('express');
const router = express.Router();
const { createLog, getLogById, verifyLogChain, exportLogs } = require('../controllers/log.controller');

router.post('/', createLog);
router.get('/verify', verifyLogChain);
router.get('/export', exportLogs);
router.get('/:id', getLogById);

module.exports = router;