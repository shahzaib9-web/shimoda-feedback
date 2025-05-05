import { supabase } from './lib/supabase';

export async function saveFeedback(text: string, reply: string) {
  console.log('🧪 Attempting to save feedback...');
  console.log('📤 User said:', text);
  console.log('📥 AI replied:', reply);

  const { data, error } = await supabase.from('feedback').insert([
    {
      userTranscript: text,
      aiReply: reply,
      timestamp: new Date().toISOString(),
      tags: null,
      source: 'voice',
    },
  ]);

  if (error) {
    console.error('❌ Supabase insert error:', error.message);
  } else {
    console.log('✅ Feedback saved to Supabase:', data);
  }
}
