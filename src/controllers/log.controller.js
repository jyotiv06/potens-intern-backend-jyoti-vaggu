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

module.exports = { createLog };