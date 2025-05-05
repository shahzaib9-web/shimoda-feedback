import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. read the JSON body
  const { text } = await req.json();

  // 2. grab your key from env
  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    console.error('❌ ELEVEN_API_KEY missing');
    return NextResponse.json({ error: 'No key' }, { status: 500 });
  }

  // 3. choose a voice ID from your ElevenLabs voice‑library
  const voiceId = 'EXAVITQu4vr4xnSDxMaL';             // change if you want

  // 4. build request to ElevenLabs v1 TTS
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,                            //  << key header
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',              // safe default
      voice_settings: { stability: 0.4, similarity_boost: 0.8 },
    }),
  });

  console.log('🎯 status:', response.status);
  if (!response.ok) {
    const raw = await response.text();
    console.error('❌ TTS error body:', raw);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }

  // 5. get the MP3 bytes
  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // 6. return them to the browser
  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
