export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      const body = await request.json();
      const query = body.query || '';
      const deals_context = body.deals_context || '';

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: 'Eres el asistente de inversion de MAGG Capital. Solo respondes sobre los deals del pipeline. Responde en espanol, de forma concisa con referencias a los deals (ref MAGG-XXXX o HIST-XXX). Pipeline:\n\n' + deals_context
            },
            {
              role: 'user',
              content: query
            }
          ]
        })
      });

      const data = await resp.json();
      const answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || 'Sin respuesta';

      return new Response(JSON.stringify({ answer: answer }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ answer: 'Error: ' + e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
