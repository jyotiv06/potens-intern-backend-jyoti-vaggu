const hashChainService = require('../services/hashChain.service');

async function createLog(req, res, next) {
  try {
    const { actor, action, payload } = req.body;

    if (!actor || !action) {
      return res.status(400).json({ error: 'actor and action are required' });
    }

    const entry = await hashChainService.appendEntry({
      actor,
      action,
      payload: payload || {}
    });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

async function getLogById(req, res, next) {
  try {
    const { id } = req.params;

    const entry = await hashChainService.getEntryWithStatus(id);

    if (!entry) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
}

async function verifyLogChain(req, res, next) {
  try {
    const result = await hashChainService.verifyChain();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function exportLogs(req, res, next) {
  try {
    const { actor, startDate, endDate } = req.query;

    const logs = await hashChainService.exportLogs({ actor, startDate, endDate });

    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}


module.exports = { createLog };
module.exports = { createLog, getLogById };
module.exports = { createLog, getLogById, verifyLogChain };
module.exports = { createLog, getLogById, verifyLogChain, exportLogs };