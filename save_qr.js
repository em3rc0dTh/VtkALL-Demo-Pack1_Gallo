const OPENWA_URL = process.env.OPENWA_API_URL || 'http://openwa:2785/api';
const OPENWA_KEY = process.env.OPENWA_API_KEY || 'dev-admin-key';
const SESSION_ID = '3109e55c-1bca-4111-88c6-c107916f571f';

import { writeFileSync } from 'fs';

async function run() {
  const r = await fetch(`${OPENWA_URL}/sessions/${SESSION_ID}/qr`, {
    headers: { 'X-API-Key': OPENWA_KEY }
  });
  const data = await r.json();
  
  // qrCode is "data:image/png;base64,..."
  const base64 = data.qrCode.replace('data:image/png;base64,', '');
  const buf = Buffer.from(base64, 'base64');
  writeFileSync('/tmp/qr_mecanica.png', buf);
  console.log('QR guardado en /tmp/qr_mecanica.png - bytes:', buf.length);
}
run().catch(console.error);
