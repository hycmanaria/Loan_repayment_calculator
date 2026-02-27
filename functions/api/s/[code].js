// GET /api/s/:code — retrieve a short link
export async function onRequestGet(context) {
  const { params, env } = context;
  const code = params.code;
  if (!code) return new Response(null, { status: 400 });

  const url   = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', 'po_' + code])
  });
  const { result } = await response.json();

  if (result === null) return new Response(null, { status: 404 });
  return new Response(JSON.stringify({ p: result }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
