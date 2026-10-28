function sanitizeGatewayPayload(value){if(!value||typeof value!=='object')return value;const blocked=/secret|token|authorization|card|cvv|pin/i;return Object.fromEntries(Object.entries(value).filter(([k])=>!blocked.test(k)).map(([k,v])=>[k,typeof v==='object'?sanitizeGatewayPayload(v):v]))}
function cashfreeSuccessfulPayment(payments=[]){return payments.filter(x=>x.payment_status==='SUCCESS').sort((a,b)=>new Date(b.payment_time||0)-new Date(a.payment_time||0))[0]||null}
module.exports={sanitizeGatewayPayload,cashfreeSuccessfulPayment};
