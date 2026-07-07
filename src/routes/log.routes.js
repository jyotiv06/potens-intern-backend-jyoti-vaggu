const express = require('express');
const router = express.Router();
const { createLog } = require('../controllers/log.controller');

router.post('/', createLog);

module.exports = router;