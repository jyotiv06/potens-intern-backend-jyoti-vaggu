require('dotenv').config();
const hashChainService = require('../services/hashChain.service');
const pool = require('../config/db');

async function runVerify() {
  try {
    const result = await hashChainService.verifyChain();

    if (result.status === 'pass') {
      console.log('Chain verification PASSED — no tampering detected.');
    } else {
      console.log('Chain verification FAILED');
      console.log(`   Broken entry ID: ${result.brokenEntryId}`);
      console.log(`   Reason: ${result.reason}`);
    }
  } catch (err) {
    console.error('Error running verification:', err.message);
  } finally {
    await pool.end(); 
    process.exit(0);
  }
}

runVerify();