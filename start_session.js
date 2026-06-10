const OPENWA_URL = process.env.OPENWA_API_URL || 'http://openwa:2785/api';
const OPENWA_KEY = process.env.OPENWA_API_KEY || 'dev-admin-key';

async function run() {
  // Start the session
  const r = await fetch(`${OPENWA_URL}/sessions/3109e55c-1bca-4111-88c6-c107916f571f/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': OPENWA_KEY }
  });
  const d = await r.text();
  console.log('Start response:', r.status, d);
  
  // Wait 3 seconds then get QR
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const qrR = await fetch(`${OPENWA_URL}/sessions/3109e55c-1bca-4111-88c6-c107916f571f/screen`, {
    headers: { 'X-API-Key': OPENWA_KEY }
  });
  const qrD = await qrR.text();
  console.log('QR response:', qrR.status, qrD.substring(0, 300));
}
run().catch(console.error);
