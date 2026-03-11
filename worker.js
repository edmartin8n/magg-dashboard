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

      const messages = [
        {
          role: 'system',
          content: 'Eres el asistente de inversion de MAGG Capital. Solo respondes sobre los deals del pipeline. Responde en espanol, de forma concisa, citando la referencia del deal (MAGG-XXXX o HIST-XXX). Pipeline de deals:\n\n' + deals_context
        },
        {
          role: 'user',
          content: query
        }
      ];

      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: messages,
        max_tokens: 500
      });

      const answer = result.response || 'Sin respuesta';

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
