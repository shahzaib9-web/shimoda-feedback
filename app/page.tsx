'use client';
import { useState, useRef, useEffect } from 'react';
import { saveFeedback } from '../feedbackStore';
import Image from 'next/image';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [spinner, setSpinner] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, aiReply]);

  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);

    const newRec = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    newRec.ondataavailable = e => chunks.push(e.data);

    newRec.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      sendToWhisper(blob);
    };

    newRec.start();
    setRecorder(newRec);
    setRecording(true);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    let silenceStart: number | null = null;

    const silenceThreshold = 5;
    const silenceDuration = 3000;

    const checkSilence = () => {
      analyser.getByteTimeDomainData(dataArray);
      const isSilent = dataArray.every(value => Math.abs(value - 128) < silenceThreshold);

      const now = Date.now();

      if (isSilent) {
        if (silenceStart === null) silenceStart = now;
        if (now - silenceStart > silenceDuration) {
          newRec.stop();
          setRecording(false);
          stream.getTracks().forEach(track => track.stop());
        } else {
          requestAnimationFrame(checkSilence);
        }
      } else {
        silenceStart = null;
        requestAnimationFrame(checkSilence);
      }
    };

    requestAnimationFrame(checkSilence);
  };

  const sendToWhisper = async (blob: Blob) => {
    setSpinner(true);
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: blob,
    });
    const { text } = await res.json();
    setTranscript(text);
    getChatGPTReply(text);
  };

  const getChatGPTReply = async (input: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();
    const reply = data.reply;
    setAiReply(reply);
    playVoice(reply);
    saveFeedback(input, reply);
    setSpinner(false);
  };

  const playVoice = async (text: string) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const blob = await res.blob();
    const audioBlob = new Blob([blob], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.play().catch(err => console.error("❌ Playback error:", err));
  };

  return (
    <div
      style={{
        backgroundImage: "url('/soap-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '2rem',
        color: 'white',
        fontFamily: 'Aura, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <Image src="/shimoda-logo.png" alt="Shimoda Logo" width={140} height={40} />
      </div>

      {/* Info bubble */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '100%',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '1rem' }}>
          What did you think of our product?
        </h2>

        <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '2rem' }}>
          We’ve added audio-powered feedback to our site to make it as easy as possible for you to share your thoughts with us! Simply click the button below, and tell us what you thought. Our response bot will confirm that we’ve received your feedback.
        </p>

        <button
          onClick={startMic}
          disabled={recording}
          style={{
            background: 'white',
            color: 'black',
            fontWeight: 'bold',
            fontSize: '20px',
            padding: '0.7rem 1.5rem',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {recording ? 'Listening…' : 'Click Here'}
        </button>
      </div>

      {/* Feedback + AI reply bubble */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '1rem',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '100%'
      }}>
        <p style={{ fontSize: '22px', fontWeight: 'bold' }}><strong>Your Feedback:</strong> {transcript}</p>
        <div style={{ margin: '1rem 0' }} />
        <p style={{ fontSize: '22px', fontWeight: 'bold' }}><strong>Shimoda:</strong> {aiReply}</p>
      </div>

      <div ref={chatEndRef} />
    </div>
  );
}