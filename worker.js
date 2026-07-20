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

      const systemPrompt = `Eres el asistente de inversion de MAGG Capital. Tienes DOS modos de respuesta segun lo que pida el usuario:

1) PREGUNTA - el usuario quiere informacion sobre el pipeline. Responde de forma concisa, en espanol, citando la referencia del deal (MAGG-XXXX o HIST-XXX).

2) EDICION - el usuario te pide modificar un deal concreto del pipeline (cambiar estado, precio, notas, proximo paso, motivo, owner, prioridad, spread, etc). Identifica el deal EXACTO por su referencia a partir del contexto de abajo. Si no puedes identificar un unico deal con certeza (nombre ambiguo, varias coincidencias), usa el modo PREGUNTA para pedir aclaracion en vez de adivinar.

Responde SIEMPRE con un unico objeto JSON valido, sin texto antes ni despues, sin bloques de codigo markdown, con una de estas dos formas EXACTAS:

Para preguntas:
{"type":"answer","text":"<tu respuesta en espanol>"}

Para ediciones:
{"type":"edit","ref":"<referencia exacta del deal, ej MAGG-2026-037>","changes":{"<campo>":"<valor nuevo>"},"summary":"<resumen breve en espanol de que vas a cambiar, para mostrarselo al usuario antes de guardar>"}

Campos validos dentro de "changes" (usa exactamente estas claves, solo incluye los que el usuario pidio cambiar explicitamente, no inventes valores para campos que no menciono):
- estado: estado del deal en texto libre (ej "Descartado", "En Analisis", "On Hold", "GO", "NO GO")
- scoring: veredicto (ej "NO GO", "GO", "Borderline", "En Analisis")
- precio: numero en euros sin abreviar (ej 4150000 para 4,15M€)
- prox_paso: texto libre
- owner: nombre del responsable
- fecha_accion: fecha en formato DD/MM/AAAA
- notas: texto libre
- motivo: razon del veredicto, texto libre
- exit_yield: texto (ej "5,25%")
- spread: texto (ej "-180" o "+45")
- yoc_hma: texto (ej "3,8%")
- prioridad: texto libre
- right_now: numero entero
- accion_semanal: texto libre
- kill_switches: texto libre
- lp_fit: texto libre

Pipeline de deals:

${deals_context}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ];

      const result = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: messages,
        max_tokens: 700,
        temperature: 0.2
      });

      let raw = (result.response || '').trim();
      // Models sometimes wrap JSON in ```json fences despite instructions — strip them.
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

      let payload;
      try {
        payload = JSON.parse(raw);
        if (!payload || (payload.type !== 'answer' && payload.type !== 'edit')) {
          throw new Error('unexpected shape');
        }
      } catch (parseErr) {
        // Fallback: treat the raw text as a plain answer rather than failing outright.
        payload = { type: 'answer', text: raw || 'Sin respuesta' };
      }

      return new Response(JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ type: 'answer', text: 'Error: ' + e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
