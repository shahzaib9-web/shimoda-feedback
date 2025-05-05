import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(req: Request) {
  const form = new FormData();
  const blob = await req.blob();
  form.append('file', new File([blob], 'audio.webm'));
  form.append('model', 'whisper-1');

  const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  const json = await openaiRes.json();
  return NextResponse.json({ text: json.text });
}

