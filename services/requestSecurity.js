const crypto=require('crypto');
function token(q){if(!q.session.csrfToken)q.session.csrfToken=crypto.randomBytes(32).toString('hex');return q.session.csrfToken}
function parseOrigin(value){try{const u=new URL(String(value));if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.origin==='null')return null;return u.origin}catch{return null}}
function allowedOrigins(q){const allowed=new Set();const configured=[process.env.PUBLIC_BASE_URL,...String(process.env.ADMIN_ALLOWED_ORIGINS||'').split(',')].filter(Boolean);for(const v of configured){const origin=parseOrigin(String(v).trim());if(origin)allowed.add(origin)}
 // Local development is allowed only for the exact loopback host/port being served.
 // Never trust forwarded host headers or enable a wildcard production origin.
 if(process.env.NODE_ENV!=='production'){const host=String(q.get('host')||'');const current=parseOrigin(String(q.protocol||'http')+'://'+host);if(current){const u=new URL(current);if(['localhost','127.0.0.1','[::1]'].includes(u.hostname))allowed.add(current)}}
 return allowed}
function middleware(q,s,n){if(['GET','HEAD','OPTIONS'].includes(q.method)||q.path.startsWith('/webhooks/'))return n();if(!q.path.startsWith('/admin/'))return n();
 const origin=q.get('origin');if(origin){const parsed=parseOrigin(origin);if(!parsed||!allowedOrigins(q).has(parsed))return s.status(403).json({code:'ORIGIN_REJECTED',message:'Admin request origin is not allowed. Check PUBLIC_BASE_URL / ADMIN_ALLOWED_ORIGINS and NODE_ENV.'})}
 const actual=q.get('x-csrf-token')||'',expected=token(q);if(!/^[a-f0-9]{64}$/.test(actual)||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return s.status(403).json({code:'CSRF_INVALID',message:'Security token expired. Please retry.'});n()}
module.exports={token,middleware,allowedOrigins,parseOrigin};