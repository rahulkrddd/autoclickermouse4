const crypto=require('crypto');
function orderEvent(order){
 const customer=order.customerSnapshot||{};
 const products=(order.items||[]).map(x=>({name:String(x.name||'Product'),quantity:Math.max(1,Number(x.quantity)||1),productId:String(x.legacyProductId||x.productId||'')}));
 const method=String(order.paymentMethod||'').trim().toLowerCase(),paid=order.paymentStatus==='paid',cod=method==='cod';
 const type=paid?'payment_received':cod?'cod_order_created':'order_created',orderId=String(order.orderId||order._id);
 return {eventId:'order:'+crypto.createHash('sha256').update([order.siteId,order._id,orderId].join('|')).digest('hex'),type,name:String(customer.name||'Not available'),mobile:String(customer.mobile||''),orderId,reason:paid?'Payment received':cod?'COD order created':'Order created',source:'order',createdAt:order.createdAt||new Date(),metadata:{gateway:method,paymentStatus:order.paymentStatus,orderStatus:order.orderStatus,grandTotal:Number(order.grandTotal)||0,currency:order.currency||'INR',deliveryMode:order.deliveryMode,productIds:products.map(x=>x.productId).filter(Boolean),productNames:products.map(x=>x.name),products,paymentId:String(order.paymentId||''),orderMongoId:String(order._id)}};
}
async function recordOrderActivity(order){
 if(!order)return;const Activity=require('../models/Activity'),event=orderEvent(order),session=typeof order.$session==='function'?order.$session():null;
 const matches=[{orderId:event.orderId},{'metadata.orderMongoId':String(order._id)}];
 if(order.paymentId)matches.push({'metadata.paymentId':String(order.paymentId)});
 if(order.idempotencyKey)matches.push({'metadata.internalOrderId':String(order.idempotencyKey)});
 await Activity.deleteMany({type:{$in:['payment_failed','payment_successful']},$or:matches},{session});
 await Activity.updateOne({eventId:event.eventId},{$set:event},{upsert:true,session});
}
async function backfillRecentOrders(limit=250){
 const Order=require('../models/Order'),Payment=require('../models/Payment'),Activity=require('../models/Activity');
 const rows=await Order.find().sort({createdAt:-1}).limit(limit);
 for(const order of rows){
   await recordOrderActivity(order);
   const payment=await Payment.findOne({$or:[{orderId:order._id},{gatewayOrderId:order.orderId},{paymentId:order.paymentId||'__none__'}]}).lean();
   if(payment)await Activity.deleteMany({type:{$in:['payment_failed','payment_successful']},$or:[{orderId:String(payment.gatewayOrderId||'')},{'metadata.internalOrderId':String(payment.internalOrderId||'')},{'metadata.paymentId':String(payment.paymentId||'')}]});
 }
}
module.exports={orderEvent,recordOrderActivity,backfillRecentOrders};
