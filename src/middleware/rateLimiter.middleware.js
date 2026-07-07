const rateLimit = require('express-rate-limit');

const logRateLimiter = rateLimit({
  windowMs: 60 * 1000,     
  max: 10,                  
  standardHeaders: true,    
  legacyHeaders: false,     
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

module.exports = logRateLimiter;