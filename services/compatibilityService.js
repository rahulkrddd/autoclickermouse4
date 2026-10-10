const pricing=require('./pricingService');
function normalizeSpecifications(specifications) {
  if (!specifications) {
    return {};
  }

  if (specifications instanceof Map) {
    return Object.fromEntries(specifications);
  }

  if (
    typeof specifications === 'object' &&
    !Array.isArray(specifications)
  ) {
    return specifications;
  }

  return {};
}

function product(p) {
  return {
    _id: String(p._id),
    id: p.legacyId,
    legacyId: p.legacyId,
    slug: p.slug,
    name: p.name,
    sku:p.sku||'', productCode:p.productCode||'', category: p.category, subCategory:p.subCategory||'', tags:p.tags||[], shortDescription:p.shortDescription||'', currency:p.currency||'INR', reservedStock:Number(p.reservedStock||0),
    price: p.price,
    oldPrice: p.oldPrice,

    stock: Math.max(
      0,
      Number(p.stock || 0) - Number(p.reservedStock || 0)
    ),

    badge: p.badge || '',

    image: p.primaryImage?.url || '',

    gallery: (p.gallery || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(image => image.url)
      .filter(Boolean),

    description: p.description || '',
    features: p.features || [],

    specs: normalizeSpecifications(p.specifications),

    active: p.active,
    buyNowEnabled: p.buyNowEnabled,
    addToCartEnabled: p.addToCartEnabled,
    minOrderQty: p.minOrderQty,
    maxOrderQty: p.maxOrderQty,
    selfPickupAvailable: p.selfPickupAvailable,
    homeDeliveryAvailable: p.homeDeliveryAvailable,
    codAvailable: p.codAvailable,
    freeShipping: p.freeShipping===true,
    featured: p.featured, pickupLocationIds:(p.pickupLocationIds||[]).map(String), primaryImage:p.primaryImage||{}, galleryDetailed:p.gallery||[], weight:p.weight, dimensions:p.dimensions||{}, taxRate:p.taxRate||0, hsnCode:p.hsnCode||''
  };
}

function order(o) {
  const source=o.items||[],needsDerived=source.some(x=>Number(x.taxRate)>0&&!Number(x.taxableValue));
  const derived=needsDerived?pricing.calculate(source.map(x=>({p:{price:x.price,taxRate:x.taxRate},q:x.quantity})),o.discount||0,o.shippingCharge||0):null;
  const viewItems=source.map((item,i)=>derived?{...item,lineDiscount:derived.items[i].lineDiscount,taxableValue:derived.items[i].taxableValue,taxAmount:derived.items[i].taxAmount,lineTotal:derived.items[i].lineTotal}:item);
  return {
    name: o.customerSnapshot?.name || '',
    address: o.customerSnapshot?.address || '',
    pincode: o.customerSnapshot?.pincode || '',
    mobile: o.customerSnapshot?.mobile || '',

    order_id: o.orderId,
    payment_id: o.paymentId || '',

    items: viewItems.map(item => ({
      product_id: item.legacyProductId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.imageUrl,
      sku: item.sku, productCode:item.productCode, hsnCode:item.hsnCode,
      lineSubtotal:item.lineSubtotal, lineDiscount:item.lineDiscount||0, taxableValue:item.taxableValue||0, taxRate:item.taxRate||0, taxAmount:item.taxAmount||0, lineTotal:item.lineTotal||item.lineSubtotal
    })),

    subtotal: o.subtotal,
    discount: o.discount,
    coupon: o.couponCode || '',
    shippingCharge:o.shippingCharge||0, taxAmount:derived?derived.taxAmount:(o.taxAmount||0), currency:o.currency||'INR', paymentMethod:o.paymentMethod||'razorpay', paymentStatus:o.paymentStatus, invoiceAvailable:!!o.invoiceId, invoiceId:o.invoiceId||null, deliveryMode:o.deliveryMode, pickupSnapshot:o.pickupSnapshot||null, customerVisibleNote:o.customerVisibleNote||'', adminNote:o.adminNote||'', amount: o.grandTotal,

    date: o.createdAt
      ? new Date(o.createdAt).toISOString().slice(0, 10)
      : '',

    time: o.createdAt
      ? new Date(o.createdAt).toISOString().slice(11, 19)
      : '',

    created_at: o.createdAt,
    current_status: o.orderStatus,

    feedback: o.feedback || 'NA',
    feedback_timestamp: o.feedbackTimestamp || 'NA',
    review_text: o.reviewText || 'NA',

    tracking_details: o.trackingDetails || 'NA',
    tracking_history: o.trackingHistory || []
  };
}

module.exports = {
  product,
  order
};