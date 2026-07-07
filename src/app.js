const express = require('express');
const hashChainService = require('./services/hashChain.service');

const app = express();
const logRoutes = require('./routes/log.routes');

app.use(express.json());
app.use('/log', logRoutes);
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get("/test", async (req, res) => {
    const result = await hashChainService.verifyChain();

    res.json(result);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;