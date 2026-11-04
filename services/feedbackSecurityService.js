const crypto=require('crypto'),{siteId}=require('../config/site');
const sign=s=>crypto.createHmac('sha256',process.env.SESSION_SECRET).update(s).digest('hex');
function issue(order){const expiry=Date.now()+3600000;const payload=`${siteId}|${order.orderId}|${order.customerSnapshot.mobile}|${expiry}`;return `${expiry}.${sign(payload)}`}
function verify(order,token){const [expiry,signature]=String(token||'').split('.');if(!/^\d{13}$/.test(expiry||'')||Number(expiry)<Date.now()||Number(expiry)>Date.now()+3600000||!/^[a-f0-9]{64}$/.test(signature||''))return false;return crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(sign(`${siteId}|${order.orderId}|${order.customerSnapshot.mobile}|${expiry}`)))}
module.exports={issue,verify};