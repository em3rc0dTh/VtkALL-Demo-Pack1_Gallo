import { env } from 'process';
import fetch from 'node-fetch';

const apiKey = "AIzaSyCIMFsBWS-9hxnSdVCivXjxtlqkFTkoG-U";
const modelo = "gemini-3.5-flash";

async function testNative() {
  console.log("Testing Native Gemini API...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }]
    })
  });
  console.log("Native status:", res.status);
  const data = await res.text();
  console.log("Native response:", data.substring(0, 200));
}

async function testOpenAI() {
  console.log("\\nTesting OpenAI Compatibility API...");
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelo,
      messages: [{ role: "user", content: "Hello" }]
    })
  });
  console.log("OpenAI status:", res.status);
  const data = await res.text();
  console.log("OpenAI response:", data.substring(0, 200));
}

async function run() {
  await testNative();
  await testOpenAI();
}

run();
