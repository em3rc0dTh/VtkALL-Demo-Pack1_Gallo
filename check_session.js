import mongoose from 'mongoose';
import Cliente from './models/Cliente.js';

const OPENWA_URL = process.env.OPENWA_API_URL || 'http://openwa:2785/api';
const OPENWA_KEY = process.env.OPENWA_API_KEY || 'dev-admin-key';
const SESSION_NAME = process.env.OPENWA_SESSION_NAME || 'mecanica-bot';

async function checkAndStartSession() {
  console.log('OPENWA_API_URL:', OPENWA_URL);
  
  // 1. List sessions
  const sessionsRes = await fetch(`${OPENWA_URL}/sessions`, {
    headers: { 'X-API-Key': OPENWA_KEY }
  });
  const sessions = await sessionsRes.json();
  console.log('Sessions:', JSON.stringify(sessions, null, 2));

  // 2. Check if mecanica-bot is in the list
  const existing = sessions.find(s => s.name === SESSION_NAME);
  if (existing) {
    console.log('Session found:', existing.name, 'status:', existing.status, 'id:', existing.id);
    
    // Try to start it if not active
    if (existing.status !== 'WORKING' && existing.status !== 'QR') {
      const startRes = await fetch(`${OPENWA_URL}/sessions/${existing.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': OPENWA_KEY
        }
      });
      const startData = await startRes.text();
      console.log('Start session response:', startRes.status, startData);
    }
  } else {
    console.log('Session NOT found. Creating...');
    
    const createRes = await fetch(`${OPENWA_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': OPENWA_KEY
      },
      body: JSON.stringify({ name: SESSION_NAME })
    });
    const createData = await createRes.json();
    console.log('Create session response:', createRes.status, JSON.stringify(createData));
    
    // Now start it
    if (createData.id) {
      const startRes = await fetch(`${OPENWA_URL}/sessions/${createData.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': OPENWA_KEY
        }
      });
      const startData = await startRes.text();
      console.log('Start session response:', startRes.status, startData);
    }
  }
}

checkAndStartSession().catch(console.error);
