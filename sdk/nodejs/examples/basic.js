const { ShieldAuth } = require('shieldauth');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize
const auth = new ShieldAuth('YOUR_APP_ID');

rl.question('Enter license key: ', async (licenseKey) => {
  console.log('Validating license...');
  
  const valid = await auth.validate(licenseKey);
  
  if (!valid) {
    console.log('Invalid license!');
    process.exit(1);
  }
  
  console.log('License valid!');
  console.log(`Session ID: ${auth.getSessionId()}`);
  console.log(`HWID: ${ShieldAuth.getHWID()}`);
  
  // Your application runs here
  console.log('\nApplication running...');
  
  // Heartbeat every 5 minutes
  setInterval(async () => {
    const success = await auth.heartbeat();
    console.log(success ? 'Heartbeat sent' : 'Heartbeat failed');
  }, 5 * 60 * 1000);
  
  rl.close();
});