export default { async fetch() { return new Response(JSON.stringify({ error: 'MAGG CRM legacy worker disabled' }), { status: 410, headers: { 'content-type': 'application/json' } }); } };
