import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pendingTasks, completedTasks, tasks, customPrompt } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const taskList = tasks.map((task: any) => 
      `- ${task.title} (${task.category}${task.deadline ? `, due: ${new Date(task.deadline).toLocaleDateString()}` : ''})`
    ).join('\n');

    const prompt = customPrompt || `Generate a brief, motivational productivity insight for a user with ${pendingTasks} pending tasks and ${completedTasks} completed tasks.

Current pending tasks:
${taskList || 'No pending tasks'}

Provide:
1. A brief motivation message (1-2 sentences)
2. One specific productivity tip based on their task patterns
3. Highlight any upcoming deadlines or patterns you notice

Keep the response concise (under 150 words) and encouraging.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ai-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});