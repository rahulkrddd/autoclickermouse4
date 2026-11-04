const crypto=require('crypto');
function paymentActivityData(payment){
 if(!payment||!['failed','cancelled'].includes(payment.status))return null;
 const payload=payment.gatewayPayload||{},customer=payload.customer||{},items=payload.items||[];
 const gateway=String(payment.gateway||'unknown').trim().toLowerCase(),orderId=String(payment.gatewayOrderId||payment.internalOrderId||payment._id||'');
 const activityType='payment_failed';
 const eventId='payment:'+crypto.createHash('sha256').update([payment.siteId,gateway,orderId,payment.paymentId||'',activityType].join('|')).digest('hex');
 const days=Number(process.env.ACTIVITY_RETENTION_DAYS||0);
 return {eventId,type:activityType,name:customer.name,mobile:customer.mobile,orderId,reason:payment.failureReason||(payment.status==='cancelled'?'Payment cancelled':'Payment failed'),source:'payment',createdAt:new Date(),...(days>0?{expiresAt:new Date(Date.now()+days*86400000)}:{}),metadata:{gateway,status:payment.status,internalOrderId:payment.internalOrderId,paymentId:payment.paymentId||'',orderCreated:false,failureCode:payment.failureCode||'',productIds:items.map(x=>String(x.legacyId||x.legacyProductId||x.productId||'')).filter(Boolean),productNames:items.map(x=>x.name||x.productName||'').filter(Boolean)}};
}
async function recordPaymentActivity(payment){const event=paymentActivityData(payment);if(!event)return;try{const Activity=require('../models/Activity');await Activity.updateOne({eventId:event.eventId},{$set:event},{upsert:true})}catch(error){if(error.code!==11000)console.error('Payment activity recording failed:',error.message)}}
module.exports={paymentActivityData,recordPaymentActivity};