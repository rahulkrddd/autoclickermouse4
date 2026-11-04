// Coupon limits use persisted orders, including historical COD orders.
// All final redemptions must run inside the same transaction as the order.
function activationError(c, now = new Date()) {
  if (c.startAt && !Number.isFinite(new Date(c.startAt).getTime())) return 'Invalid coupon start date';
  if (c.expiresAt && !Number.isFinite(new Date(c.expiresAt).getTime())) return 'Invalid coupon expiry date';
  if (c.startAt && c.expiresAt && new Date(c.startAt) > new Date(c.expiresAt)) return 'Coupon cannot be activated as expiry date is before start date';
  if (c.startAt && new Date(c.startAt) > now) return 'Coupon cannot be activated as start date is in the future';
  if (c.expiresAt && new Date(c.expiresAt) < now) return 'Coupon cannot be activated as expiry date is in the past';
  return '';
}
function normalizeMobile(value) { return String(value || '').replace(/\D/g, '').slice(-10); }
function withSession(query, session) { return session ? query.session(session) : query; }
async function assertLimits(coupon, customerMobile, Order, session, excludePaymentId) {
  const filter = {couponCode: coupon.code};
  const historical = await withSession(Order.countDocuments(filter), session);
  const Payment=require('../models/Payment');const holdFilter={reservationState:'held',reservationExpiresAt:{$gt:new Date()},'gatewayPayload.couponCode':coupon.code,...(excludePaymentId?{_id:{$ne:excludePaymentId}}:{})};const holds=await withSession(Payment.countDocuments(holdFilter),session);const used = Math.max(Number(coupon.usageCount) || 0, historical);
  if (coupon.usageLimit != null && used + holds >= coupon.usageLimit) throw Error('This coupon has reached its usage limit. Please try another offer.');
  if (coupon.perCustomerLimit != null) {
    const key = normalizeMobile(customerMobile);
    if (!/^[6-9]\d{9}$/.test(key)) throw Error('Enter a valid customer mobile number before applying this coupon.');
    const count = await withSession(Order.countDocuments({...filter, 'customerSnapshot.mobile': key}), session);
    const customerHolds=await withSession(Payment.countDocuments({...holdFilter,'gatewayPayload.customer.mobile':key}),session);
    if (count + customerHolds >= coupon.perCustomerLimit) throw Error('You have reached the per customer usage limit for this coupon.');
  }
  return used;
}
async function commitUsage(coupon, used, Coupon, session) {
  // Updating this shared coupon document serializes concurrent transactions.
  // A write conflict retries the transaction, including the limit checks.
  if (!session) throw Error('Coupon redemption requires an order transaction');
  const result = await Coupon.updateOne({_id: coupon._id}, {$set: {usageCount: used + 1}}, {session});
  if (result.matchedCount !== 1) throw Error('Coupon is no longer available');
}
module.exports = {activationError, normalizeMobile, assertLimits, commitUsage};