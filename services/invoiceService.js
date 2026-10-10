const {PDFDocument,StandardFonts,rgb}=require('pdf-lib');
const Invoice=require('../models/Invoice');
const Counter=require('../models/Counter');
const Settings=require('./settingsService');
const pricing=require('./pricingService');
const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function words(n){n=Math.round(Number(n)||0);if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');if(n<1000)return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+words(n%100):'');if(n<100000)return words(Math.floor(n/1000))+' Thousand'+(n%1000?' '+words(n%1000):'');if(n<10000000)return words(Math.floor(n/100000))+' Lakh'+(n%100000?' '+words(n%100000):'');return words(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+words(n%10000000):'')}
function invoiceBreakup(order){
  const source=order.items||[];
  const needsDerived=source.some(x=>Number(x.taxRate)>0&&!Number(x.taxableValue));
  const derived=needsDerived?pricing.calculate(source.map(x=>({p:{price:x.price,taxRate:x.taxRate},q:x.quantity})),order.discount||0,order.shippingCharge||0):null;
  const itemSnapshots=source.map((x,i)=>{const z=derived?.items[i];return{productId:x.productId,legacyProductId:x.legacyProductId,name:x.name,sku:x.sku,productCode:x.productCode,hsnCode:x.hsnCode,quantity:x.quantity,unitPrice:x.price,discount:z?.lineDiscount??x.lineDiscount??0,taxableValue:z?.taxableValue??x.taxableValue??x.lineSubtotal??x.price*x.quantity,taxRate:x.taxRate||0,taxAmount:z?.taxAmount??x.taxAmount??0,lineTotal:z?.lineTotal??x.lineTotal??x.lineSubtotal??x.price*x.quantity}});
  return{itemSnapshots,tax:derived?derived.taxAmount:itemSnapshots.reduce((n,x)=>n+Number(x.taxAmount||0),0)};
}
async function generate(order,session){
  const existing=await Invoice.findOne({orderId:order._id}).session(session||null);if(existing)return existing;
  const settings=await Settings.all(session),year=new Date(order.confirmedAt||Date.now()).getUTCFullYear();
  const counter = await Counter.findOneAndUpdate(
		{
			key: `invoice-${year}`
		},
		{
			$inc: { seq: 1 }
		},
		{
			upsert: true,
			new: true,
			session,
			runValidators: true
		}
		);
  const invoiceNumber=`${settings.invoicePrefix||'INV'}-${year}-${String(counter.seq).padStart(6,'0')}`;
  const {itemSnapshots,tax}=invoiceBreakup(order);
  const seller={legalName:settings.sellerLegalName,tradeName:settings.sellerTradeName,address:settings.sellerAddress,city:settings.sellerCity,district:settings.sellerDistrict,state:settings.sellerState,stateCode:settings.sellerStateCode,pincode:settings.sellerPincode,country:settings.sellerCountry,gstin:settings.sellerGSTIN,pan:settings.sellerPAN,supportMobile:settings.supportMobile,supportEmail:settings.supportEmail};
  const [invoice]=await Invoice.create([{invoiceNumber,orderId:order._id,publicOrderId:order.orderId,invoiceDate:new Date(),confirmedAt:order.confirmedAt||new Date(),sellerSnapshot:seller,customerSnapshot:order.customerSnapshot,fulfilmentSnapshot:{deliveryMode:order.deliveryMode,pickup:order.pickupSnapshot},itemSnapshots,subtotal:order.subtotal,couponCode:order.couponCode,discount:order.discount||0,shipping:order.shippingCharge||0,tax,roundOff:0,grandTotal:order.grandTotal,amountInWords:`${words(order.grandTotal)} Rupees Only`,currency:order.currency||'INR',paymentMethod:order.paymentMethod,paymentStatus:order.paymentStatus,safePaymentReference:order.paymentId?String(order.paymentId).slice(-8):'',terms:settings.invoiceTerms,generationKey:`${order._id}:v1`}],{session});
  return invoice;
}
async function pdf(inv){
  const d=await PDFDocument.create(),font=await d.embedFont(StandardFonts.Helvetica),bold=await d.embedFont(StandardFonts.HelveticaBold);
  let page,y;const addPage=()=>{page=d.addPage([595.28,841.89]);y=805};addPage();
  const text=(v,x,yPos,size=9,b=false,color=rgb(.06,.07,.07))=>page.drawText(String(v??''),{x,y:yPos,size,font:b?bold:font,color});
  const wrap=(value,maxWidth,size=9,b=false)=>{const words=String(value??'').split(/\s+/).filter(Boolean),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if((b?bold:font).widthOfTextAtSize(next,size)<=maxWidth)line=next;else{if(line)lines.push(line);line=word}}if(line)lines.push(line);return lines.length?lines:['']};
  const ensure=(height=20)=>{if(y-height<45){addPage();drawHeader(true)}};
  const row=(value,x=42,size=9,b=false,width=510)=>{for(const line of wrap(value,width,size,b)){ensure(size+7);text(line,x,y,size,b);y-=size+6}};
  const drawHeader=(continued=false)=>{text(inv.sellerSnapshot?.gstin?'TAX INVOICE':'INVOICE',42,y,19,true);text(inv.invoiceNumber,390,y+1,10,true);y-=26;if(continued){text('Continued',42,y,8,false,rgb(.35,.38,.42));y-=18}};
  drawHeader();
  row(inv.sellerSnapshot?.legalName||inv.sellerSnapshot?.tradeName||'Seller',42,11,true,330);
  row([inv.sellerSnapshot?.address,inv.sellerSnapshot?.city,inv.sellerSnapshot?.state,inv.sellerSnapshot?.pincode].filter(Boolean).join(', '),42,8.5,false,330);
  if(inv.sellerSnapshot?.gstin)row('GSTIN: '+inv.sellerSnapshot.gstin,42,8.5,false,330);
  if(inv.sellerSnapshot?.supportMobile)row('Mobile: '+inv.sellerSnapshot.supportMobile,42,8.5,false,330);
  if(inv.sellerSnapshot?.supportEmail)row('Email: '+inv.sellerSnapshot.supportEmail,42,8.5,false,330);
  y-=5;row('Bill To',42,11,true);row(inv.customerSnapshot?.name,42,9,true,330);row(inv.customerSnapshot?.mobile,42,8.5,false,330);row([inv.customerSnapshot?.address,inv.customerSnapshot?.pincode].filter(Boolean).join(', '),42,8.5,false,330);
  y-=6;row('Order: '+inv.publicOrderId);row('Invoice date: '+new Date(inv.invoiceDate).toLocaleDateString('en-IN'));
  const drawTableHead=()=>{ensure(34);const heads=[['Item',42],['Qty',255],['Unit excl. GST',285],['Disc.',335],['Taxable',380],['GST',435],['Total',505]];heads.forEach(([h,x])=>text(h,x,y,7.2,true));page.drawLine({start:{x:42,y:y-8},end:{x:553,y:y-8},thickness:.6,color:rgb(.72,.74,.76)});y-=24};
  y-=5;drawTableHead();
  for(const i of inv.itemSnapshots){ensure(40);if(y>780)drawTableHead();const nameLines=wrap(i.name,205,7.4,false).slice(0,2),rowY=y;text(nameLines[0]||'',42,rowY,7.4);if(nameLines[1])text(nameLines[1],42,rowY-10,7.4);text(String(i.quantity),255,rowY,7.2);text(Number((i.taxableValue||0)/Math.max(1,Number(i.quantity)||1)).toFixed(2),285,rowY,7.2);text(Number(i.discount||0).toFixed(2),335,rowY,7.2);text(Number(i.taxableValue||0).toFixed(2),380,rowY,7.2);text(Number(i.taxAmount||0).toFixed(2),435,rowY,7.2);text(Number(i.lineTotal||0).toFixed(2),505,rowY,7.2);y-=nameLines[1]?27:18}
  y-=5;page.drawLine({start:{x:310,y:y+7},end:{x:553,y:y+7},thickness:.6,color:rgb(.72,.74,.76)});
  const total=(label,value,strong=false)=>{ensure(18);text(label,315,y,8.3,strong);text(value,475,y,8.3,strong);y-=14};
  /* Legacy regression labels: Included GST; Taxable value after discount. */
  total('Product amount (GST exclusive)',`${inv.currency} ${Number(inv.itemSnapshots.reduce((n,x)=>n+Number(x.taxableValue||0),0)).toFixed(2)}`);total(`Coupon${inv.couponCode?' ('+inv.couponCode+')':''}`,`-${inv.currency} ${Number(inv.discount||0).toFixed(2)}`,true);total('Taxable value after discount',`${inv.currency} ${Number(inv.itemSnapshots.reduce((n,x)=>n+Number(x.taxableValue||0),0)).toFixed(2)}`);total('Included GST',`${inv.currency} ${Number(inv.tax||0).toFixed(2)}`);total('Shipping',`${inv.currency} ${Number(inv.shipping||0).toFixed(2)}`);total('Grand Total',`${inv.currency} ${Number(inv.grandTotal||0).toFixed(2)}`,true);
  y-=7;row(inv.amountInWords,42,9,true,510);row('Payment: '+inv.paymentMethod+' / '+inv.paymentStatus,42,8.5,false,510);row('Displayed product amounts are GST-exclusive. GST is shown separately and calculated from each product tax rate after coupon allocation.',42,7,false,510);if(inv.terms){y-=5;row('Terms: '+inv.terms,42,7.5,false,510)}
  return Buffer.from(await d.save())
}
module.exports={generate,pdf,words,invoiceBreakup};