const {siteId}=require('../config/site');
const express=require('express'),crypto=require('crypto'),multer=require('multer');
const Product=require('../models/Product'),Order=require('../models/Order'),Invoice=require('../models/Invoice'),Pickup=require('../models/PickupLocation'),Audit=require('../models/AdminAuditLog'),InventoryLog=require('../models/InventoryLog');
const inventory=require('../services/inventoryService'),reorder=require('../services/reorderEligibilityService'),invoices=require('../services/invoiceService'),settings=require('../services/settingsService'),storage=require('../services/supabaseStorageService'),compat=require('../services/compatibilityService');
const router=express.Router(),safe=x=>String(x||'').trim(),mobile=x=>safe(x).replace(/\D/g,'').slice(-10),auth=(q,s,n)=>q.session.isAuthenticated?n():s.status(401).json({message:'Admin session required'}),audit=(q,x)=>Audit.create({actorId:q.session?.adminId||'admin',...x});
const owner=async(q,s,n)=>{const m=mobile(q.body?.mobileNumber||q.query.mobileNumber||q.headers['x-customer-mobile']);if(!/^[6-9]\d{9}$/.test(m))return s.status(401).json({message:'Customer verification required'});q.order=await Order.findOne({orderId:q.params.orderId,'customerSnapshot.mobile':m});return q.order?n():s.status(404).json({message:'Order not found'})};
async function lines(raw,opts={}){if(!Array.isArray(raw)||!raw.length)throw Error('At least one product is required');const sums=new Map();for(const x of raw){const id=safe(x.productId||x.legacyProductId);sums.set(id,(sums.get(id)||0)+Number(x.quantity))}const ps=await Product.find({legacyId:{$in:[...sums.keys()]}});return[...sums].map(([id,q])=>{const p=ps.find(x=>x.legacyId===id);inventory.validate(p,q,opts.mode||'buy',opts);return{p,q}})}
async function totals(ls,shipping){const x=await settings.all(),subtotal=ls.reduce((n,v)=>n+v.p.price*v.q,0),charge=shipping==null?(x.freeShippingThreshold!=null&&subtotal>=x.freeShippingThreshold?0:Number(x.shippingCharge||0)):Math.max(0,Number(shipping));return{subtotal,discount:0,shippingCharge:charge,taxAmount:0,grandTotal:subtotal+charge,currency:x.defaultCurrency||'INR'}}
router.get('/admin/products-data',auth,async(q,s,n)=>{try{const page=Math.max(1,parseInt(q.query.page,10)||1),limit=Math.min(100,Math.max(1,parseInt(q.query.limit,10)||8)),search=safe(q.query.search).slice(0,100),status=safe(q.query.status),category=safe(q.query.category),filter={};if(status==='active')filter.active=true;else if(status==='inactive')filter.active=false;if(category)filter.category=category;if(search){const escaped=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const prefix=new RegExp('^'+escaped,'i');filter.$or=[{name:prefix},{legacyId:prefix},{slug:prefix},{sku:prefix},{productCode:prefix},{category:prefix}]}const totalRecords=await Product.countDocuments(filter),totalPages=totalRecords?Math.ceil(totalRecords/limit):0,safePage=totalPages?Math.min(page,totalPages):1;const rows=await Product.find(filter).sort({createdAt:-1,_id:-1}).skip((safePage-1)*limit).limit(limit).lean();s.json({products:rows.map(compat.product),pagination:{page:safePage,limit,totalRecords,totalPages,hasPrevious:safePage>1,hasNext:safePage<totalPages}})}catch(e){n(e)}});
router.get('/admin/orders/:orderId',auth,async(q,s)=>{const o=await Order.findOne({orderId:q.params.orderId}).populate('invoiceId').lean();if(!o)return s.status(404).json({message:'Order not found'});s.json({...compat.order(o),invoiceNumber:o.invoiceId?.invoiceNumber||'',confirmedAt:o.confirmedAt,inventoryCommittedAt:o.inventoryCommittedAt})});

router.get('/admin/customers/:mobile/history',auth,async(q,s)=>{const m=mobile(q.params.mobile);if(!/^[6-9]\d{9}$/.test(m))return s.status(400).json({message:'Invalid mobile number'});const rows=await Order.find({'customerSnapshot.mobile':m}).sort({createdAt:-1}).lean();if(!rows.length)return s.status(404).json({message:'Customer history not found'});const latest=rows[0],paid=rows.filter(x=>x.paymentStatus==='paid');s.json({customer:{name:latest.customerSnapshot?.name||'',mobile:m,email:latest.customerSnapshot?.email||'',totalOrders:rows.length,totalRevenue:paid.reduce((n,x)=>n+Number(x.grandTotal||0),0),firstOrderDate:rows[rows.length-1].createdAt,lastOrderDate:rows[0].createdAt},orders:rows.map(compat.order)})});

router.get('/admin/inventory-logs',auth,async(q,s)=>{const Log=require('../models/InventoryLog');s.json(await Log.find().sort({createdAt:-1}).limit(300).lean())});
router.delete('/admin/inventory-logs/:id',auth,async(q,s)=>{if(!require('mongoose').isValidObjectId(q.params.id))return s.status(400).json({message:'Invalid inventory log ID'});const row=await InventoryLog.findByIdAndDelete(q.params.id);if(!row)return s.status(404).json({message:'Inventory log not found'});await audit(q,{action:'delete',module:'inventory_logs',entityId:String(row._id),before:row.toObject()});s.json({message:'Inventory log deleted',deleted:1})});
router.post('/admin/inventory-logs/bulk-delete',auth,async(q,s)=>{const ids=[...new Set((Array.isArray(q.body.ids)?q.body.ids:[]).map(String))];if(!ids.length)return s.status(400).json({message:'Select at least one inventory log'});if(ids.some(id=>!require('mongoose').isValidObjectId(id)))return s.status(400).json({message:'Invalid inventory log ID'});const rows=await InventoryLog.find({_id:{$in:ids}}).lean(),r=await InventoryLog.deleteMany({_id:{$in:ids}});await audit(q,{action:'bulk_delete',module:'inventory_logs',entityId:ids.join(','),before:{records:rows},after:{deletedCount:r.deletedCount}});s.json({message:'Inventory logs deleted',deleted:r.deletedCount})});
router.get('/admin/audit-logs',auth,async(q,s)=>s.json(await Audit.find().sort({createdAt:-1}).limit(300).lean()));
router.put('/admin/pickup-locations/:id',auth,async(q,s)=>{const before=await Pickup.findById(q.params.id).lean();if(!before)return s.status(404).json({message:'Pickup location not found'});const v={name:safe(q.body.name),address:q.body.address||{},contactNumber:safe(q.body.contactNumber),active:q.body.active!==false,openingHours:q.body.openingHours||{},availableProductIds:Array.isArray(q.body.availableProductIds)?q.body.availableProductIds:[]};const x=await Pickup.findByIdAndUpdate(q.params.id,v,{new:true,runValidators:true});await audit(q,{action:'update',module:'pickup_locations',entityId:String(x._id),before,after:x.toObject()});s.json(x)});
router.delete('/admin/pickup-locations/:id',auth,async(q,s)=>{const x=await Pickup.findByIdAndDelete(q.params.id);if(!x)return s.status(404).json({message:'Pickup location not found'});await audit(q,{action:'delete',module:'pickup_locations',entityId:String(x._id),before:x.toObject()});s.json({message:'Pickup location permanently deleted'})});
router.patch('/admin/products/:id/gallery/reorder',auth,async(q,s)=>{const p=await Product.findOne({legacyId:q.params.id});if(!p)return s.status(404).json({message:'Product not found'});const order=Array.isArray(q.body.order)?q.body.order:[];p.gallery.forEach(img=>{const at=order.indexOf(String(img._id));if(at>=0)img.sortOrder=at});await p.save();await audit(q,{action:'gallery_reorder',module:'products',entityId:p.legacyId,after:{order}});s.json({gallery:p.gallery})});
router.patch('/admin/products/:id/gallery/:imageId',auth,async(q,s)=>{const p=await Product.findOne({legacyId:q.params.id});if(!p)return s.status(404).json({message:'Product not found'});const img=p.gallery.id(q.params.imageId);if(!img)return s.status(404).json({message:'Image not found'});img.alt=safe(q.body.alt);await p.save();await audit(q,{action:'gallery_alt',module:'products',entityId:p.legacyId,after:{imageId:q.params.imageId,alt:img.alt}});s.json({gallery:p.gallery})});
router.get('/api/pickup-locations',async(q,s)=>s.json(await Pickup.find({active:true}).lean()));
router.get('/api/settings/public',async(q,s)=>{const x=await settings.all();s.json({storeOpen:x.storeOpen,supportMobile:x.supportMobile,supportEmail:x.supportEmail,selfPickupEnabled:x.selfPickupEnabled,codEnabled:x.codEnabled,maintenanceMessage:x.maintenanceMessage,invoiceEnabled:x.invoiceEnabled!==false,defaultCurrency:x.defaultCurrency,shippingCharge:Number(x.shippingCharge||0),freeShippingThreshold:Number(x.freeShippingThreshold||0)})});
router.get('/admin/settings',auth,async(q,s)=>s.json(await settings.all()));router.put('/admin/settings',auth,async(q,s)=>{const before=await settings.all(),after=await settings.update(q.body,q.session.adminId);await audit(q,{action:'update',module:'settings',entityId:'global',before,after});s.json(after)});
router.get('/admin/pickup-locations',auth,async(q,s)=>s.json(await Pickup.find().lean()));router.post('/admin/pickup-locations',auth,async(q,s)=>{const v={code:safe(q.body.code),name:safe(q.body.name),address:q.body.address||{},contactNumber:safe(q.body.contactNumber),active:q.body.active!==false,openingHours:q.body.openingHours||{}};const x=await Pickup.findOneAndUpdate({code:v.code},v,{upsert:true,new:true,runValidators:true});await audit(q,{action:'upsert',module:'pickup_locations',entityId:x.code,after:x.toObject()});s.json(x)});
router.post('/admin/products/:id/stock-adjustment',auth,async(q,s)=>{const p=await Product.findOne({legacyId:q.params.id});if(!p)return s.status(404).json({message:'Product not found'});const mode=safe(q.body.mode)||'adjust',value=Number(q.body.quantity);if(!Number.isInteger(value))return s.status(400).json({message:'Quantity must be a whole number'});let change;if(mode==='set'){if(value<0)return s.status(400).json({message:'Total quantity cannot be negative'});change=value-Number(p.stock)}else{if(value===0)return s.status(400).json({message:'Adjustment cannot be zero'});change=value}if(change===0)return s.json({message:'Stock unchanged',stock:p.stock});const r=await inventory.change({product:p,quantityChange:change,reason:q.body.reason||'admin_adjustment',actor:{type:'admin',id:q.session.adminId},idempotencyKey:safe(q.body.idempotencyKey)||`admin:${crypto.randomUUID()}`});await audit(q,{action:'stock_adjustment',module:'products',entityId:p.legacyId,before:{stock:p.stock},after:{stock:r.product.stock,change}});s.json({message:'Stock adjusted',stock:r.product.stock,logId:r.log._id})});
const upload=multer({storage:multer.memoryStorage(),limits:{files:4,fileSize:5*1024*1024}});router.post('/admin/products/:id/gallery',auth,upload.array('images',4),async(q,s)=>{const p=await Product.findOne({legacyId:q.params.id}),added=[];if(!p)return s.status(404).json({message:'Product not found'});try{const current=(p.primaryImage?.url?1:0)+p.gallery.length;if(current+(q.files||[]).length>4)throw Error('A product can have a maximum of 4 images');for(const f of q.files||[])added.push(await storage.uploadProductImage(siteId,f,p.legacyId));p.gallery.push(...added.map((x,i)=>({...x,alt:safe(q.body.alt)||p.name,sortOrder:p.gallery.length+i})));await p.save();await audit(q,{action:'gallery_upload',module:'products',entityId:p.legacyId,after:added});s.json({gallery:p.gallery})}catch(e){await Promise.all(added.map(x=>storage.remove(x).catch(()=>{})));s.status(400).json({message:e.message})}});
router.delete('/admin/products/:id/gallery/:imageId',auth,async(q,s)=>{const p=await Product.findOne({legacyId:q.params.id});if(!p)return s.status(404).json({message:'Product not found'});const img=p.gallery.id(q.params.imageId);if(!img)return s.status(404).json({message:'Image not found'});if(!p.primaryImage?.url&&p.gallery.length<=1)return s.status(400).json({message:'At least one product image is required'});const old=img.toObject();img.deleteOne();await p.save();await storage.remove(old).catch(()=>{});await audit(q,{action:'gallery_remove',module:'products',entityId:p.legacyId,before:old});s.json({gallery:p.gallery})});
router.post('/my-orders/:orderId/reorder-eligibility',owner,async(q,s)=>{const x=await settings.all();if(x.storeOpen===false)return s.status(409).json({message:x.maintenanceMessage||'The store is temporarily closed. Please try again later.',code:'STORE_CLOSED'});s.json(await reorder.evaluate(q.order,q.body||{}))});router.get('/my-orders/:orderId/product/:legacyId',owner,async(q,s)=>{const p=await Product.findOne({legacyId:q.params.legacyId,active:true});if(!p||!p.slug)return s.status(404).json({available:false,message:'This product is part of your previous order, but it is not currently available in the store.'});s.json({available:true,id:p.legacyId,slug:p.slug,name:p.name})});
async function sendInvoice(s,o){const cfg=await settings.all();if(cfg.invoiceEnabled===false)return s.status(404).json({message:'Invoice service is currently unavailable',code:'INVOICE_DISABLED'});

  let inv = await Invoice.findOne({
    orderId:o._id
  });

  if(!inv){

    try{
      inv = await invoices.generate(o);

      if(!o.invoiceId){
        o.invoiceId = inv._id;
        await o.save();
      }

    }catch(err){

      console.error(
        'Invoice generation failed',
        o.orderId,
        err.message
      );

      return s.status(500).json({
        message:'Unable to generate invoice'
      });
    }
  }

  const pdf = await invoices.pdf(inv);

  s.set(
    'Content-Type',
    'application/pdf'
  );

  s.set(
    'Content-Disposition',
    `attachment; filename="invoice-${inv.invoiceNumber}.pdf"`
  );

  s.send(pdf);
}
router.get('/my-orders/:orderId/invoice',owner,(q,s)=>sendInvoice(s,q.order));router.get('/admin/orders/:orderId/invoice',auth,async(q,s)=>{const o=await Order.findOne({orderId:q.params.orderId});return o?sendInvoice(s,o):s.status(404).json({message:'Order not found'})});router.post('/admin/orders/:orderId/invoice/backfill',auth,async(q,s)=>{const cfg=await settings.all();if(cfg.invoiceEnabled===false)return s.status(409).json({message:'Invoice service is currently disabled',code:'INVOICE_DISABLED'});const o=await Order.findOne({orderId:q.params.orderId});if(!o)return s.status(404).json({message:'Order not found'});const x=await invoices.generate(o);o.invoiceId=x._id;await o.save();await audit(q,{action:'invoice_backfill',module:'orders',entityId:o.orderId,after:{invoiceNumber:x.invoiceNumber}});s.json({invoiceNumber:x.invoiceNumber})});
router.post('/admin/orders/manual',auth,async(q,s)=>{const c=q.body.customer||{},snapshot={name:safe(c.name),mobile:mobile(c.mobile),email:safe(c.email),address:safe(c.address),pincode:safe(c.pincode),city:safe(c.city),district:safe(c.district),state:safe(c.state),country:safe(c.country)||'India'};if(!snapshot.name||!/^[6-9]\d{9}$/.test(snapshot.mobile)||snapshot.address.length<10||!/^\d{6}$/.test(snapshot.pincode))return s.status(400).json({message:'Valid name, mobile, address and pincode are required'});


const opts={
  mode:'buy',
  deliveryMode:q.body.deliveryMode||'delivery',
  paymentMethod:q.body.paymentMethod||'manual'
};

let ls;

try{
  ls=await lines(q.body.items,opts);
}catch(err){
  return s.status(400).json({
    message:err.message,
    code:err.code||'VALIDATION_ERROR'
  });
}

const t=await totals(ls,q.body.shippingCharge);

const id=
  'MAN-'+
  Date.now().toString(36).toUpperCase()+
  '-'+
  crypto.randomBytes(3).toString('hex').toUpperCase();
const o=await Order.create({orderId:id,customerSnapshot:snapshot,items:ls.map(x=>({productId:x.p._id,legacyProductId:x.p.legacyId,sku:x.p.sku,productCode:x.p.productCode,hsnCode:x.p.hsnCode,name:x.p.name,imageUrl:x.p.primaryImage?.url,price:x.p.price,quantity:x.q,taxRate:x.p.taxRate||0,lineSubtotal:x.p.price*x.q,lineTotal:x.p.price*x.q})),...t,couponCode:safe(q.body.coupon),deliveryMode:opts.deliveryMode,paymentMethod:opts.paymentMethod,paymentStatus:'pending',orderStatus:'Order Placed',trackingDetails:'NA',trackingHistory:[{status:'Order Placed',at:new Date()}],customerVisibleNote:safe(q.body.customerVisibleNote),adminNote:safe(q.body.adminNote),idempotencyKey:safe(q.body.idempotencyKey)||`manual:${crypto.randomUUID()}`});await audit(q,{action:'manual_order_create',module:'orders',entityId:o.orderId,after:{grandTotal:o.grandTotal}});s.status(201).json({message:'Manual order created',order:compat.order(o)})});
router.patch('/admin/orders/:orderId',auth,async(q,s)=>{const o=await Order.findOne({orderId:q.params.orderId});if(!o)return s.status(404).json({message:'Order not found'});const before=o.toObject(),b=q.body||{};for(const k of ['trackingDetails','customerVisibleNote','adminNote'])if(b[k]!==undefined)o[k]=safe(b[k]);if(b.customer){for(const k of ['name','email','address','pincode','city','district','state','country'])if(b.customer[k]!==undefined)o.customerSnapshot[k]=safe(b.customer[k]);if(b.customer.mobile!==undefined)o.customerSnapshot.mobile=mobile(b.customer.mobile)}if(b.items&&o.orderStatus==='Order Placed'&&o.paymentStatus!=='paid'){const ls=await lines(b.items,{mode:'buy',deliveryMode:b.deliveryMode||o.deliveryMode,paymentMethod:b.paymentMethod||o.paymentMethod});o.items=ls.map(x=>({productId:x.p._id,legacyProductId:x.p.legacyId,sku:x.p.sku,name:x.p.name,price:x.p.price,quantity:x.q,lineSubtotal:x.p.price*x.q,lineTotal:x.p.price*x.q}));Object.assign(o,await totals(ls,b.shippingCharge))}await o.save();await audit(q,{action:'edit',module:'orders',entityId:o.orderId,before,after:o.toObject()});s.json({message:'Order updated',order:compat.order(o)})});
module.exports={router,lines,totals};