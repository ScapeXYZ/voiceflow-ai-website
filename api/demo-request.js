const {createHash, createHmac} = require('node:crypto');
const hash = value => createHash('sha256').update(value).digest('hex');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const reply = (code, message) => res.status(code).json({message});
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, 'Use POST.'); }
  const env = process.env;
  if (!env.DEMO_ALLOWED_ORIGIN || req.headers.origin !== env.DEMO_ALLOWED_ORIGIN) return reply(403, 'Request origin is not allowed.');
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(415, 'Use JSON.');
  let data;
  try {
    if (Number(req.headers['content-length']) > 10000) return reply(413, 'Request is too large.');
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!data || Array.isArray(data) || Buffer.byteLength(JSON.stringify(data)) > 10000) return reply(400, 'Invalid request.');
  } catch { return reply(400, 'Invalid request.'); }
  if (data.website) return reply(400, 'Unable to accept this request.');
  const fields = {};
  for (const [key, max] of Object.entries({name:100,business:150,email:200,phone:30,message:2000})) {
    if (typeof data[key] !== 'string') return reply(400, 'Please check all fields.');
    fields[key] = data[key].trim();
    if (fields[key].length > max || (key !== 'phone' && !fields[key]) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(fields[key])) return reply(400, 'Please check all fields.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || /[\r\n]/.test(fields.email) || (fields.phone && !/^[+0-9() .-]{7,30}$/.test(fields.phone))) return reply(400, 'Please check your email and phone.');
  try {
    if (!env.DEMO_SCRIPT_SECRET || env.DEMO_SCRIPT_SECRET.length < 32 || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.DEMO_SCRIPT_URL || '') || !/^https:\/\//.test(env.DEMO_REDIS_URL || '') || !env.DEMO_REDIS_TOKEN) throw Error('configuration');
    const redis = async command => {
      const response = await fetch(env.DEMO_REDIS_URL, {method:'POST',headers:{Authorization:`Bearer ${env.DEMO_REDIS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(4000)});
      const result = await response.json();
      if (!response.ok || result.error) throw Error('storage');
      return result.result;
    };
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const key = createHmac('sha256',env.DEMO_SCRIPT_SECRET).update(ip).digest('hex');
    const count = await redis(['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n", '1',`demo:rate:${key}`]);
    if (Number(count) > 5) { res.setHeader('Retry-After','600'); return reply(429,'Too many attempts. Please wait ten minutes or email us.'); }
    // Stable content identity prevents retries (including after timeouts) from sending twice.
    const id = hash(JSON.stringify({...fields,email:fields.email.toLowerCase()}));
    const response = await fetch(env.DEMO_SCRIPT_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.DEMO_SCRIPT_SECRET,id,fields}),signal:AbortSignal.timeout(15000),redirect:'follow'});
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.id !== id) throw Error('upstream');
    return reply(200,'Your demo request was accepted. Thank you!');
  } catch { return reply(503,'We could not confirm your request. Retry with the same details or use the email fallback.'); }
};
