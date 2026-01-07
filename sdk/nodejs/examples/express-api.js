const express = require('express');
const { ShieldAuth } = require('shieldauth');

const app = express();
app.use(express.json());

const auth = new ShieldAuth('YOUR_APP_ID');

// Validate on startup
const LICENSE_KEY = process.env.LICENSE_KEY;

(async () => {
  const valid = await auth.validate(LICENSE_KEY);
  
  if (!valid) {
    console.log('Invalid license! API will not start.');
    process.exit(1);
  }
  
  console.log('License valid! Starting API...');
  
  // Heartbeat every 5 minutes
  setInterval(async () => {
    await auth.heartbeat();
  }, 5 * 60 * 1000);
  
  // Your API routes
  app.get('/api/data', (req, res) => {
    res.json({ data: 'Your data here' });
  });
  
  app.listen(3000, () => {
    console.log('API running on port 3000');
  });
})();