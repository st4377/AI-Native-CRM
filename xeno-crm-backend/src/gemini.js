import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

async function callLLM(prompt) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`LLM API error: ${JSON.stringify(data)}`);
  }
  return data.choices[0].message.content;
}

export async function generateJSON(prompt) {
  const text = await callLLM(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function generateText(prompt) {
  return callLLM(prompt);
}