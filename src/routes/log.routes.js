const express = require('express');
const router = express.Router();
const { createLog, getLogById, verifyLogChain } = require('../controllers/log.controller');

router.post('/', createLog);
router.get('/verify', verifyLogChain);
router.get('/:id', getLogById);

module.exports = router;