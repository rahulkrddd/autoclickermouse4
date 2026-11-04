let coOpenSequence=0;
let coItems=[],coDiscount=0,coCoupon='',coProducts=[],coValidationStarted=false,coSettings={},coPickups=[],coCompleted=false,coPaymentOpened=false,coPaymentDismissTracked=false,coPaymentConfig=null,coCustomer=null,coStoreName='',coPaymentAvailable=false;
function checkoutPaymentAvailability(settings,items,products,paymentConfig){const online=enabledGateways(paymentConfig).length>0,cod=settings?.codEnabled===true&&items.every(i=>products.find(p=>p.id===i.productId)?.codAvailable===true);return {online,cod,available:online||cod}}
function pickupAddress(x){const a=x?.address||{};return [a.line1,a.line2,a.city,a.district,a.state,a.pincode,a.country].map(v=>String(v||'').trim()).filter(Boolean).join(', ')}
function pickupDetails(x){if(!x)return '';const address=pickupAddress(x)||'Complete address not available';const contact=x.contactNumber?`<span><b>Call:</b> ${x.contactNumber}</span>`:'';return `<div class="pickup-location-details"><b>${x.name||'Pickup location'}</b><p>${address}</p>${contact}</div>`}
function pickupLabel(x){const a=x?.address||{};return [x.name,a.city,a.state,a.pincode].map(v=>String(v||'').trim()).filter(Boolean).join(' - ')}
function cf(id,label,area=false){return `<div class="field validation-field"><label>${label}</label>${area?`<textarea id="co_${id}" required></textarea>`:`<input id="co_${id}" required inputmode="${id==='mobile'||id==='pincode'?'numeric':'text'}">`}<span class="valid-tick">✓</span><small class="field-error"></small></div>`}
function valid(id,v){v=String(v||'').trim();return id==='name'?/^[A-Za-z\u0900-\u097F .'-]{2,60}$/.test(v):id==='mobile'?/^[6-9]\d{9}$/.test(v):id==='pincode'?/^\d{6}$/.test(v):v.length>=10}
const coErrors={name:'Enter a valid name',mobile:'Enter a valid 10-digit Indian mobile number',address:'Enter at least 10 characters',pincode:'Enter a valid 6-digit pincode'};function validateCOField(id,show=true){const e=$('#co_'+id),box=e.closest('.validation-field'),yes=valid(id,e.value);box.classList.toggle('is-valid',show&&yes);box.classList.toggle('is-invalid',show&&!yes);box.querySelector('.field-error').textContent=show&&!yes?coErrors[id]:'';return yes}function validateCO(showErrors=coValidationStarted){let ok=true;['name','mobile','address','pincode'].forEach(id=>{ok=validateCOField(id,showErrors)&&ok});$('#co_pay').disabled=!$('#co_consent').checked||!coPaymentAvailable;return ok&&coPaymentAvailable}
async function cachedCheckoutProfile(prefill={}){if(Object.values(prefill).some(Boolean))return prefill;const mobile=localStorage.getItem(acmKey('mobileNumber'));if(!/^[6-9]\d{9}$/.test(mobile||''))return prefill;try{const r=await fetch('/customer-profile/'+encodeURIComponent(mobile));if(!r.ok)return {...prefill,mobile};const d=await r.json();return {...prefill,...d.customer,mobile}}catch(e){return {...prefill,mobile}}}
window.openDirectCheckout=async function(items,prefill={},opts={}){const openSequence=++coOpenSequence;coValidationStarted=false;coCompleted=false;coPaymentOpened=false;coPaymentDismissTracked=false;document.querySelector('#directCheckoutModal')?.remove();document.body.insertAdjacentHTML('beforeend','<div class="modal open" id="directCheckoutModal"><div class="panel checkout-panel checkout-loading"><button class="close" type="button">×</button><div class="checkout-loader-pro" role="status" aria-live="polite"><div class="checkout-loader-ring"><span>₹</span></div><h3>Preparing checkout securely</h3><p>Validating products, delivery and payment options</p><div class="checkout-loader-dots"><i></i><i></i><i></i></div></div></div></div>');const loadingModal=$('#directCheckoutModal');loadingModal.querySelector('.close').onclick=()=>{coOpenSequence++;loadingModal.remove()};await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));prefill=await cachedCheckoutProfile(prefill);if(openSequence!==coOpenSequence)return;coItems=items;coDiscount=+opts.discount||0;coCoupon=opts.coupon||'';let qty=items.reduce((n,x)=>n+(+x.quantity||1),0);try{[coProducts,coSettings,coPickups,coStoreName,coPaymentConfig]=await Promise.all([fetch('/api/products').then(r=>r.json()),fetch('/api/settings/public').then(r=>r.json()),fetch('/api/pickup-locations').then(r=>r.json()),fetch('/api/seo-config',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(x=>String(x.siteName||'').trim()).catch(()=>''),getPaymentConfig().catch(()=>null)])}catch(e){coProducts=[];coSettings={};coPickups=[]}if(openSequence!==coOpenSequence)return;coItems=items.filter(x=>{const base=coProducts.find(v=>v.id===x.productId),selected=x.variantId&&x.variantId!=='__base__'?(base?.variants||[]).find(v=>v.variantId===x.variantId):base,stock=Math.max(0,Number(selected?.stock)||0),qty=Number(x.quantity)||1;return stock>0&&qty<=stock});if(coItems.length!==items.length){document.querySelector('#directCheckoutModal')?.remove();toast('Stock changed. Please review the available quantity.');return}if(!coItems.length){document.querySelector('#directCheckoutModal')?.remove();toast('No in-stock products are available for checkout');return}items=coItems;document.querySelector('#directCheckoutModal')?.remove();qty=items.reduce((n,x)=>n+(+x.quantity||1),0);const itemCards=items.map(x=>{const base=coProducts.find(v=>v.id===x.productId),variant=x.variantId&&x.variantId!=='__base__'?(base?.variants||[]).find(v=>v.variantId===x.variantId):null,pr=variant?{...base,...variant,name:base.name,image:variant.imageUrl||base.image,variantLabel:[variant.color,variant.size,variant.material,variant.style].filter(Boolean).join(' / ')}:base;return pr?`<a class="checkout-product" href="/product/${pr.slug}"><img src="${pr.image}" alt="${pr.name}"><span><b>${pr.name}</b><small>Quantity: ${+x.quantity||1} · ₹${pr.price}</small></span><strong>View ›</strong></a>`:''}).join('');const paymentAvailability=checkoutPaymentAvailability(coSettings,coItems,coProducts,coPaymentConfig),paymentOptions=`${paymentAvailability.online?'<option value="online">Online payment</option>':''}${paymentAvailability.cod?'<option value="cod">Cash on Delivery</option>':''}`;coPaymentAvailable=paymentAvailability.available;document.body.insertAdjacentHTML('beforeend',`<div class="modal open" id="directCheckoutModal"><div class="panel checkout-panel"><button class="close" type="button">×</button><div class="checkout-title"><small>SECURE CHECKOUT</small><form id="coForm">${cf('name','Name')}${cf('mobile','Mobile number')}${cf('address','Delivery address',true)}${cf('pincode','Pincode')}<div class="field"><label>Delivery method</label><select id="co_delivery"><option value="delivery">Home delivery</option>${coSettings.selfPickupEnabled&&coItems.every(i=>coProducts.find(p=>p.id===i.productId)?.selfPickupAvailable)&&coPickups.length?'<option value="pickup">Self pickup</option>':''}</select></div><div class="field" id="co_pickup_wrap" style="display:none"><label>Pickup location</label><select id="co_pickup">${coPickups.map(x=>`<option value="${x._id}">${pickupLabel(x)}</option>`).join('')}</select><div id="co_pickup_details"></div></div><div class="field"><label>Payment method</label>${coPaymentAvailable?`<select id="co_payment">${paymentOptions}</select>`:'<div id="co_payment_unavailable" class="payment-unavailable" role="alert">No payment method is currently available. Please try again later.</div>'}</div><section class="coupon-box"><label>Have a coupon?</label><div class="coupon-row"><input id="co_coupon" value="${coCoupon}" placeholder="Enter coupon code"><button class="pill" id="co_apply" type="button">Apply</button></div><div id="co_coupon_msg"></div></section><label class="consent-box"><input id="co_consent" type="checkbox" checked><span>I consent to use of these details for checkout, order support and failure recovery.</span></label><button id="co_pay" class="pill primary pay-button" disabled>Pay Now</button></form></div></div>`);for(const id of ['name','mobile','address','pincode']){let e=$('#co_'+id);e.value=prefill[id]||'';e.addEventListener('focus',()=>validateCOField(id,true));e.addEventListener('click',()=>validateCOField(id,true));e.addEventListener('input',()=>validateCOField(id,true));e.addEventListener('blur',()=>validateCOField(id,true))}$('#co_consent').onchange=()=>validateCO(false);const deliveryWrap=$('#co_delivery').closest('.field'),paymentSelect=$('#co_payment'),paymentWrap=paymentSelect?.closest('.field');if($('#co_delivery').options.length===1)deliveryWrap.hidden=true;if(paymentSelect&&paymentSelect.options.length===1)paymentWrap.hidden=true;if(!coPaymentAvailable){const payButton=$('#co_pay');payButton.disabled=true;payButton.textContent='Payment unavailable'}const paintPickup=()=>{const pickup=coPickups.find(x=>String(x._id)===String($('#co_pickup')?.value));const box=$('#co_pickup_details');if(box)box.innerHTML=pickupDetails(pickup)};$('#co_delivery').onchange=()=>{const isPickup=$('#co_delivery').value==='pickup';$('#co_pickup_wrap').style.display=isPickup?'block':'none';if(isPickup)paintPickup()};if($('#co_pickup')){$('#co_pickup').onchange=paintPickup;paintPickup()}$('#co_apply').onclick=applyCoupon;const recordAbandonment=()=>{if(coCompleted||coPaymentOpened)return;const name=$('#co_name')?.value.trim()||'',mobile=$('#co_mobile')?.value.trim()||'',address=$('#co_address')?.value.trim()||'',pincode=$('#co_pincode')?.value.trim()||'';if(!valid('name',name)||!valid('mobile',mobile))return;if(typeof window.track==='function')window.track('checkout_abandoned',{name,mobile,reason:'Checkout closed before completion',productIds:coItems.map(x=>x.productId),productNames:coItems.map(x=>coProducts.find(p=>p.id===x.productId)?.name).filter(Boolean),metadata:{addressAvailable:valid('address',address),pincodeAvailable:valid('pincode',pincode)}})};const closeCheckout=()=>{const modal=document.querySelector('#directCheckoutModal');if(modal)modal.remove();recordAbandonment()};const checkoutClose=document.querySelector('#directCheckoutModal .close');if(checkoutClose)checkoutClose.onclick=e=>{e.preventDefault();closeCheckout()};$('#coForm').onsubmit=payCO;validateCO(false);if(coCoupon)showCoupon()}
async function getPaymentConfig(){
  const r=await fetch('/api/payments/config',{cache:'no-store'});
  if(!r.ok)throw Error('Unable to load payment options');
  const cfg=await r.json();
  coPaymentConfig=cfg;
  return cfg;
}
function enabledGateways(cfg){
  return ['cashfree','razorpay'].filter(name=>cfg?.[name]?.enabled===true);
}
function restoreCheckoutForm(){
  const form=$('#coForm'),choice=$('#gatewayChoice');
  if(choice)choice.remove();
  if(form){form.hidden=false;form.removeAttribute('aria-hidden')}

  const checkoutTitle =
  	document.querySelector('.checkout-title');
  
  if (checkoutTitle) {
  	checkoutTitle.style.display = '';
  }

  const close=$('#directCheckoutModal .close');if(close)close.focus();
}
function showGatewayChoice(gateways,onSelect){
  const form=$('#coForm'),panel=$('#directCheckoutModal .checkout-panel');
  if(!form||!panel)return;
  form.hidden=true;form.setAttribute('aria-hidden','true');

  const checkoutTitle =
      document.querySelector('.checkout-title');
  
  if (checkoutTitle) {
      checkoutTitle.style.display = 'none';
  }

  panel.insertAdjacentHTML('beforeend',`<section id="gatewayChoice" class="gateway-choice" aria-labelledby="gatewayChoiceTitle"><div class="gateway-choice-head"><button type="button" class="gateway-back" aria-label="Back to checkout form">&#8592; Back</button><small>SECURE PAYMENT</small><h2 id="gatewayChoiceTitle">Choose payment option</h2><p>Select a gateway to continue.</p></div><div class="gateway-choice-list">${gateways.includes('cashfree')?'<button type="button" class="gateway-choice-button recommended" data-gateway="cashfree"><span><b>Cashfree</b><small>UPI (Recommended)</small></span><strong>Continue &#8250;</strong></button>':''}${gateways.includes('razorpay')?'<button type="button" class="gateway-choice-button" data-gateway="razorpay"><span><b>Razorpay</b><small>Cards, UPI and Net Banking</small></span><strong>Continue &#8250;</strong></button>':''}</div></section>`);
  $('#gatewayChoice .gateway-back').onclick=restoreCheckoutForm;
  document.querySelectorAll('#gatewayChoice [data-gateway]').forEach(btn=>btn.onclick=()=>onSelect(btn.dataset.gateway));
}
function paymentAttemptKey(gateway,customer,deliveryMode,pickupLocationId){
  const fingerprint=JSON.stringify({gateway,items:coItems,coupon:coCoupon,customer:{name:customer.name,mobile:customer.mobile,address:customer.address,pincode:customer.pincode,email:customer.email||''},deliveryMode,pickupLocationId:pickupLocationId||''});
  const key=acmKey('pendingPaymentAttempt');
  try{const current=JSON.parse(sessionStorage.getItem(key)||'null');if(current?.fingerprint===fingerprint&&current?.id)return current.id}catch{}
  const id=crypto.randomUUID();sessionStorage.setItem(key,JSON.stringify({fingerprint,id}));return id;
}
function clearPaymentAttempt(){sessionStorage.removeItem(acmKey('pendingPaymentAttempt'));localStorage.removeItem(acmKey('pendingPaymentKey'))}
function removePaidItemsFromCart(){const ordered=new Map(coItems.map(x=>[String(x.productId),Math.max(1,Number(x.quantity)||1)]));saveCart(cart().flatMap(x=>{const orderedQty=ordered.get(String(x.id))||0,currentQty=Math.max(1,Number(x.quantity)||1),remaining=currentQty-orderedQty;return remaining>0?[{...x,quantity:remaining}]:[]}))}
function completePaidCheckout(customer,order){coCompleted=true;const orderId=order?.order_id||order?.orderId||'';const url='/my-orders?mobileNumber='+encodeURIComponent(customer.mobile)+(orderId?'&orderId='+encodeURIComponent(orderId):'')+'&fresh='+Date.now();try{localStorage.setItem(acmKey('mobileNumber'),customer.mobile)}catch(_){}try{clearPaymentAttempt()}catch(_){}try{removePaidItemsFromCart()}catch(_){}const modal=document.querySelector('#directCheckoutModal');if(modal)modal.remove();window.location.replace(url);setTimeout(()=>{window.location.href=url},250)}
async function verifyCashfreeUntilFinal(internalOrderId){for(let attempt=0;attempt<8;attempt++){const vr=await fetch('/api/payments/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gateway:'cashfree',internalOrderId})}),d=await vr.json();if(vr.ok&&d.success)return d;if(d.paymentReceived){showPaymentPending(coCustomer,d.message);return{pending:true}}if(vr.status!==202)throw Error(d.message||'Payment verification failed');await new Promise(resolve=>setTimeout(resolve,750))}throw Error('Payment confirmation is taking longer than expected. Please check My Orders.')}
async function subtotal(){let products=await fetch('/api/products').then(r=>r.json());return coItems.reduce((sum,x)=>{let p=products.find(v=>v.id===x.productId);return sum+(p&&Number(p.stock)>0?p.price*(+x.quantity||1):0)},0)}
async function applyCoupon(){let code=$('#co_coupon').value.trim().toUpperCase(),sub=await subtotal(),r=await fetch('/api/coupon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,items:coItems,subtotal:sub,mobile:$('#co_mobile')?.value||'',productIds:coItems.map(x=>coProducts.find(p=>p.id===x.productId)?._id).filter(Boolean)})}),d=await r.json();if(!r.ok){coCoupon='';coDiscount=0;$('#co_coupon_msg').innerHTML=`<div class="coupon-error">${d.message}</div>`;return}coCoupon=d.code;coDiscount=d.discount;showCoupon()}
function showCoupon(){$('#co_coupon').value=coCoupon;$('#co_coupon_msg').innerHTML=`<div class="coupon-success"><span>✓</span><div><b>${coCoupon} applied</b><small>You save ₹${coDiscount}. Discount will be applied to payment.</small></div></div>`}
async function payCO(e){
  e.preventDefault();coValidationStarted=true;if(!validateCO(true))return;
  const customer={name:$('#co_name').value.trim(),mobile:$('#co_mobile').value.trim(),address:$('#co_address').value.trim(),pincode:$('#co_pincode').value.trim()};
  const b=$('#co_pay'),deliveryMode=$('#co_delivery').value,paymentMethod=$('#co_payment')?.value;if(!coPaymentAvailable||!paymentMethod){toast('No payment method is currently available. Please try again later.');return}
  coCustomer=customer;
  if(paymentMethod==='cod')return submitPayment('cod',customer,deliveryMode,b);
  b.disabled=true;b.textContent='Checking payment options...';
  try{
    const cfg=await getPaymentConfig(),gateways=enabledGateways(cfg);
    if(!gateways.length)throw Error('Online payment is not configured');
    b.disabled=false;b.textContent='Pay Now';
    if(gateways.length===1)return submitPayment(gateways[0],customer,deliveryMode,b);
    showGatewayChoice(gateways,gateway=>submitPayment(gateway,customer,deliveryMode,b));
  }catch(err){toast(err.message||'Unable to load payment options',false,'error');b.disabled=false;b.textContent='Pay Now'}
}
function trackCheckoutPaymentFailure(gateway,customer,order,reason,stage='checkout'){
 if(gateway==='cod')return;
 try{if(typeof window.track!=='function')return;Promise.resolve(window.track('payment_failed',{name:customer.name,mobile:customer.mobile,orderId:order?.gatewayOrderId||order?.id||order?.internalOrderId||'',reason:String(reason||'Payment failed').slice(0,500),productIds:coItems.map(x=>x.productId),productNames:coItems.map(x=>coProducts.find(p=>p.id===x.productId)?.name).filter(Boolean),metadata:{gateway:String(gateway||'unknown').toLowerCase(),stage,internalOrderId:order?.internalOrderId||''}})).catch(()=>{});}catch(_){}
}
async function submitPayment(gateway,customer,deliveryMode,b){
  let paymentOrder=null;coPaymentDismissTracked=false;
  b.disabled=true;b.textContent=gateway==='cod'?'Placing order...':'Preparing payment...';
  try{
    if(gateway==='cod'){
      const r=await fetch('/createOrder/cod',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:coItems,coupon:coCoupon,customer,deliveryMode,pickupLocationId:deliveryMode==='pickup'?$('#co_pickup').value:null,idempotencyKey:crypto.randomUUID()})}),o=await r.json();
      if(!r.ok)throw Error(o.message);completePaidCheckout(customer,o.order);return;
    }
    const pickupLocationId=deliveryMode==='pickup'?$('#co_pickup').value:null;
    let idem=paymentAttemptKey(gateway,customer,deliveryMode,pickupLocationId),r,o;
    for(let attempt=0;attempt<2;attempt++){
      r=await fetch('/api/payments/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gateway,items:coItems,coupon:coCoupon,customer,deliveryMode,pickupLocationId,idempotencyKey:idem})});o=await r.json();
      const staleCheckout=r.status===409&&/already paid|contents changed/i.test(o.message||'');
      if(!staleCheckout||attempt===1)break;
      clearPaymentAttempt();idem=paymentAttemptKey(gateway,customer,deliveryMode,pickupLocationId);
    }
    if(!r.ok)throw Error(o.message);paymentOrder=o;coPaymentOpened=true;
    if(o.gateway==='cashfree'){
      if(!o.paymentSessionId)throw Error('Cashfree payment session was not created. Please try again.');
      if(typeof Cashfree!=='function')throw Error('Cashfree checkout could not be loaded');
      const cf=Cashfree({mode:o.mode==='production'?'production':'sandbox'});
      const result=await cf.checkout({paymentSessionId:o.paymentSessionId,redirectTarget:'_modal'});
      if(result?.error)throw Error(result.error.message||'Payment window closed or payment failed');
      const verified=await verifyCashfreeUntilFinal(o.internalOrderId);if(verified.pending)return;
      completePaidCheckout(customer,verified.order);return;
    }
    if(typeof Razorpay!=='function')throw Error('Razorpay checkout could not be loaded');
    new Razorpay({key:o.key,amount:o.amount,currency:o.currency,order_id:o.id,name:coStoreName||'Store',prefill:{name:customer.name,contact:customer.mobile},handler:async x=>{try{const vr=await fetch('/verifyPayment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:x.razorpay_payment_id,order_id:x.razorpay_order_id,signature:x.razorpay_signature})}),d=await vr.json();if(d.paymentReceived){showPaymentPending(customer,d.message);return}if(!d.success)throw Error(d.message||'Verification failed');completePaidCheckout(customer,d.order)}catch(err){restoreCheckoutForm();b.disabled=false;b.textContent='Pay Now';trackCheckoutPaymentFailure(gateway,customer,o,err.message||'Payment verification failed','verification');toast(err.message||'Payment verification failed. Please check My Orders before paying again.',false,'error')}},modal:{ondismiss:()=>{restoreCheckoutForm();if(!coPaymentDismissTracked){coPaymentDismissTracked=true;trackCheckoutPaymentFailure(gateway,customer,o,'Payment window closed','dismissed')}b.disabled=false;b.textContent='Pay Now'}}}).open();
  }catch(err){restoreCheckoutForm();if(!/confirmation is taking longer/i.test(err.message||''))trackCheckoutPaymentFailure(gateway,customer,paymentOrder,err.message||'Unable to start payment');toast(err.message||'Unable to start payment',false,'error');b.disabled=false;b.textContent='Pay Now'}
}
function showPaymentPending(customer,message){coCompleted=true;const modal=document.querySelector('#directCheckoutModal');if(!modal)return;const form=modal.querySelector('#coForm');if(form)form.hidden=true;modal.querySelector('#gatewayChoice')?.remove();const box=document.createElement('section');box.setAttribute('role','status');const h=document.createElement('h2');h.textContent='Payment received, confirmation pending';const p=document.createElement('p');p.textContent=message||'Do not pay again. Your payment is being reconciled. Contact the store with your payment reference if confirmation is delayed.';const link=document.createElement('a');link.className='pill primary';link.textContent='Check My Orders';link.href='/my-orders?mobileNumber='+encodeURIComponent(customer?.mobile||'');box.append(h,p,link);(modal.querySelector('.panel')||modal).append(box)}