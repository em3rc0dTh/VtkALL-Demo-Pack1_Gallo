const OPENWA_URL = process.env.OPENWA_API_URL || 'http://openwa:2785/api';
const OPENWA_KEY = process.env.OPENWA_API_KEY || 'dev-admin-key';
const SESSION_ID = 'f762d493-63ca-423f-8ff3-58ac36b4767e';

import { writeFileSync } from 'fs';

async function run() {
  // Try different QR endpoints
  const endpoints = [
    `/sessions/${SESSION_ID}/qr`,
    `/sessions/${SESSION_ID}/qr.png`,
    `/sessions/${SESSION_ID}/qr/image`,
    `/sessions/${SESSION_ID}/screenshot`,
    `/sessions/mecanica-bot/qr`,
    `/sessions/mecanica-bot/qr.png`,
  ];
  
  for (const ep of endpoints) {
    const r = await fetch(`${OPENWA_URL}${ep}`, {
      headers: { 'X-API-Key': OPENWA_KEY }
    });
    const ct = r.headers.get('content-type') || '';
    const body = await r.text();
    console.log(`${ep} → ${r.status} (${ct}) — ${body.substring(0, 200)}`);
    
    if (r.status === 200 && (ct.includes('image') || ct.includes('json'))) {
      if (ct.includes('image')) {
        writeFileSync('/tmp/qr.png', Buffer.from(body, 'binary'));
        console.log('QR image saved to /tmp/qr.png');
      }
    }
  }
}
run().catch(console.error);
