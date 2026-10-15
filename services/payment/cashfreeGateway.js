const crypto=require('crypto');
const VALID_ENV=new Set(['sandbox','production']);
class CashfreeGateway{
 constructor(env=process.env){this.env=String(env.CASHFREE_ENV||'sandbox').toLowerCase();if(!VALID_ENV.has(this.env))throw new Error('CASHFREE_ENV must be sandbox or production');this.appId=env.CASHFREE_APP_ID;this.secret=env.CASHFREE_SECRET_KEY;this.apiVersion=env.CASHFREE_API_VERSION||'2026-01-01';this.base=this.env==='production'?'https://api.cashfree.com/pg':'https://sandbox.cashfree.com/pg'}
 configured(){return Boolean(this.appId&&this.secret)}
 async request(path,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(this.base+path,{...options,signal:controller.signal});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data.message||'Cashfree API request failed'),{status:response.status,gatewayData:data});return data}finally{clearTimeout(timer)}}
 headers(idempotencyKey){return {'content-type':'application/json','x-client-id':this.appId,'x-client-secret':this.secret,'x-api-version':this.apiVersion,'x-idempotency-key':idempotencyKey}}
 async createOrder(request,idempotencyKey){if(!this.configured())throw Object.assign(new Error('Cashfree is not configured'),{status:503});const data=await this.request('/orders',{method:'POST',headers:this.headers(idempotencyKey),body:JSON.stringify(request)});return{gateway:'cashfree',gatewayOrderId:data.order_id,paymentSessionId:data.payment_session_id,status:data.order_status,raw:data}}
 async fetchOrder(orderId){return this.request(`/orders/${encodeURIComponent(orderId)}`,{headers:this.headers()})}
 async fetchPayments(orderId){return this.request(`/orders/${encodeURIComponent(orderId)}/payments`,{headers:this.headers()})}
 verifyWebhook(signature,rawBody,timestamp){if(!signature||!timestamp||!Buffer.isBuffer(rawBody))return false;const expected=crypto.createHmac('sha256',this.secret).update(String(timestamp)).update(rawBody).digest();let received;try{received=Buffer.from(String(signature),'base64')}catch{return false}return received.length===expected.length&&crypto.timingSafeEqual(received,expected)}
}
module.exports=CashfreeGateway;