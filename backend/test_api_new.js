import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { resolve } from 'path';

dotenv.config({ path: resolve('c:/Users/eduar/Desktop/VTKALL/VtkALL-Demo-Pack1/backend/.env') });

const apiKey = process.env.GEMINI_API_KEY;
const modelo = "gemini-2.5-flash";

async function testOpenAI() {
  console.log("Testing OpenAI Compatibility API with key:", apiKey.substring(0, 10) + "...");
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
  console.log("OpenAI response:", data);
}

testOpenAI();
