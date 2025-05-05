export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let shimodaInfo = '';
try {
  shimodaInfo = fs.readFileSync(
    path.join(process.cwd(), 'public/shimoda-info.txt'),
    'utf8'

  );
  console.log ('✅ Shimoda info file loaded.');
} catch (err) {
  console.error('❌ Failed to read shimoda-info.txt:', err);

}
  path.join(process.cwd(), 'public/shimoda-info.txt'),
  'utf8'


export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const systemPrompt = `
You are Shimoda Feedback AI, a calm and respectful assistant trained only to gather product feedback — nothing more.

Your job is to:
- Thank the user briefly
- Acknowledge their comment
- NEVER ask any follow-up questions
- NEVER give advice, solutions, or sales talk
- NEVER respond with anything that suggests conversation
- ONLY confirm that feedback is received
- NEVER say "[FEEDBACK_CAPTURED]"

You also know everything about Shimoda soap and brand, which is described here:

""" 
${shimodaInfo}
"""
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    const reply = completion.choices[0]?.message?.content || 'Thanks for your feedback.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('❌ /api/chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}