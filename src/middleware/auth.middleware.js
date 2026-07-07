function apiKeyAuth(req, res, next) {
  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    return res.status(401).json({ error: 'API key missing' });
  }

  if (providedKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = apiKeyAuth;