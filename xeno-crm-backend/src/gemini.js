import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(prompt) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
  }
  return data.candidates[0].content.parts[0].text;
}

export async function generateJSON(prompt) {
  const text = await callGemini(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function generateText(prompt) {
  return callGemini(prompt);
}