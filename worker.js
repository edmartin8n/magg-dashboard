/**
 * MAGG — asistente de deals.
 *
 * Reescrito el 07/08/2026. El anterior llevaba roto desde el 30/05: usaba
 * @cf/meta/llama-3.1-8b-instruct, descatalogado, y devolvía error en cada
 * pregunta. Además recibía el pipeline como un churro de texto pegado en el
 * prompt, así que no podía consultar nada que no cupiera ahí.
 *
 * Ahora consulta Supabase con la sesión del usuario y responde solo sobre lo
 * que ha leído. Sabe de: deals, análisis de los briefs, fondos, encaje
 * deal<->fondo y modelos financieros.
 */

const MODELO = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const SUPA_URL = 'https://kbojedtovopcyfvewugx.supabase.co';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/* La clave publicable no basta: el RLS exige sesión. Se usa el token del
   usuario que envía la pregunta, así el asistente no puede ver nada que esa
   persona no pueda ver por sí misma. */
async function supa(path, token, anonKey) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Recupera solo lo relevante para la pregunta en vez de volcarlo todo:
   el contexto es limitado y el ruido empeora la respuesta. */
const PALABRAS_VACIAS = new Set(['cual','cuales','cuanto','cuantos','como','donde','para',
  'sobre','este','esta','esto','todos','todas','deal','deals','fondo','fondos','tiene','tienen',
  'dime','dame','quiero','saber','hotel','hoteles','proyecto','activo','sobre','entre','desde']);

/* Los deals se nombran por su nombre, no por su referencia: preguntar
   "¿cuál es el NOI del Hotel Mavi?" es lo natural. Sin esto el asistente
   respondía "no consta" con el dato delante, porque solo reconocía el
   patrón MAGG-XXXX-XXX. */
async function resolverRef(pregunta, token, anonKey) {
  const directo = pregunta.match(/(MAGG-\d{4}-\d+|HIST-\d+)/i);
  if (directo) return directo[1].toUpperCase();

  const terminos = norm(pregunta).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !PALABRAS_VACIAS.has(w)).slice(0, 6);
  if (!terminos.length) return null;

  const filtro = terminos.map((t) => `nombre.ilike.*${encodeURIComponent(t)}*`).join(',');
  try {
    const cand = await supa(`deals?select=ref,nombre&or=(${filtro})&limit=6`, token, anonKey);
    if (!cand.length) return null;
    // Si varios encajan, gana el que más términos comparte con la pregunta.
    let mejor = null, mejorN = 0;
    for (const c of cand) {
      const n = terminos.filter((t) => norm(c.nombre).includes(t)).length;
      if (n > mejorN) { mejor = c.ref; mejorN = n; }
    }
    return mejorN >= 1 ? mejor : null;
  } catch (e) { return null; }
}

async function recuperar(pregunta, token, anonKey) {
  const q = norm(pregunta);
  const ref = await resolverRef(pregunta, token, anonKey);
  const refMatch = ref ? [ref, ref] : null;
  const partes = [];

  // 1. Si menciona un deal concreto, se trae su ficha completa.
  if (refMatch) {
    const [deal] = await supa(`deals?select=*&ref=eq.${ref}`, token, anonKey);
    if (deal) {
      partes.push(`FICHA DEL DEAL ${ref}:\n${JSON.stringify(deal, null, 1)}`);
      const [an] = await supa(
        `analisis_deal?select=tesis,conclusion,por_que_si,por_que_no,kill_switches,gaps&ref=eq.${ref}`,
        token, anonKey);
      if (an) partes.push(`ANÁLISIS DE ${ref}:\n${JSON.stringify(an, null, 1)}`);
      const [fin] = await supa(`financieros_deal?select=*&ref=eq.${ref}`, token, anonKey);
      if (fin) partes.push(`MODELO FINANCIERO DE ${ref}:\n${JSON.stringify(fin, null, 1)}`);

      // Encaje con fondos, si la pregunta va de eso.
      if (/fondo|inversor|capital|casar|encaj|quien|quién/.test(q)) {
        const m = await supa(
          `matches_fondo_deal?select=score,motivos,excluido,motivo_exclusion,fondos(nombre,tier,contacto,racional)` +
          `&ref=eq.${ref}&excluido=is.false&order=score.desc&limit=8`, token, anonKey);
        if (m.length) partes.push(`FONDOS QUE ENCAJAN CON ${ref}:\n${JSON.stringify(m, null, 1)}`);
      }
    }
  }

  // 2. Preguntas sobre fondos en general.
  if (!refMatch && /fondo|inversor|capital|lp\b/.test(q)) {
    const f = await supa(
      'fondos?select=nombre,tier,tipo,contacto,racional,ultimo_feedback&order=tier&limit=40',
      token, anonKey);
    partes.push(`FONDOS (${f.length}):\n${JSON.stringify(f, null, 1)}`);
  }

  // 3. Búsqueda de texto en el análisis acumulado de los briefs.
  const palabras = q.split(/\s+/).filter((w) => w.length > 4).slice(0, 4);
  if (!refMatch && palabras.length) {
    const patron = palabras.join(' | ');
    try {
      const r = await supa(
        `analisis_deal?select=ref,tesis,conclusion&texto_completo=wfts(spanish).${encodeURIComponent(patron)}&limit=8`,
        token, anonKey);
      if (r.length) partes.push(`ANÁLISIS RELACIONADOS:\n${JSON.stringify(r, null, 1)}`);
    } catch (e) { /* la búsqueda es un extra: si falla, seguimos */ }
  }

  // 4. Contexto base del pipeline vivo, siempre.
  const vivos = await supa(
    'deals?select=ref,nombre,estado,tipologia,ubicacion,precio_asking,yoc_hma,spread_bps' +
    '&estado=in.("En An%C3%A1lisis","On Hold")&order=ref', token, anonKey);
  partes.push(`PIPELINE ACTIVO (${vivos.length}):\n${JSON.stringify(vivos, null, 1)}`);

  return partes.join('\n\n---\n\n');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      const body = await request.json();
      const query = (body.query || '').trim();
      const token = body.token;
      const anonKey = body.anon_key;

      if (!query) return json({ answer: 'Hazme una pregunta.' });
      if (!token || !anonKey) {
        return json({ answer: '⚠️ Sesión no válida. Vuelve a entrar en el CRM.' }, 401);
      }

      const contexto = await recuperar(query, token, anonKey);

      const r = await env.AI.run(MODELO, {
        messages: [
          {
            role: 'system',
            content:
              'Eres el analista de inversión de MAGG Capital. Respondes en español, ' +
              'de forma directa y concisa, citando siempre la referencia del deal ' +
              '(MAGG-XXXX-XXX) o el nombre del fondo.\n\n' +
              'REGLAS:\n' +
              '- Usa ÚNICAMENTE los datos de abajo. Si algo no está, di que no consta; ' +
              'no lo inventes ni lo deduzcas.\n' +
              '- Los ratios vienen en fracción: 0.096 es 9,6%.\n' +
              '- Si recomiendas fondos, di por qué encajan usando su racional.\n' +
              '- Distingue siempre dato confirmado de supuesto: muchos modelos usan ' +
              'ADR y ocupación asumidos, no dados por el bróker.\n\n' +
              'DATOS:\n\n' + contexto,
          },
          { role: 'user', content: query },
        ],
        max_tokens: 900,
      });

      return json({ answer: r.response || 'Sin respuesta.' });
    } catch (e) {
      return json({ answer: `Error: ${e.message}` }, 500);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
