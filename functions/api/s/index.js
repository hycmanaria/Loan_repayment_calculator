// POST /api/s — create a short link
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }

  const { p } = body;
  if (!p || typeof p !== 'string') return new Response(null, { status: 400 });

  const url   = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code;
  for (let i = 0; i < 5; i++) {
    code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const check = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', 'po_' + code])
    });
    const { result } = await check.json();
    if (result === null) break;
  }

  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', 'po_' + code, p, 'EX', 7776000])
  });

  return new Response(JSON.stringify({ code }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
