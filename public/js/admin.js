const $=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));let orders=[],products=[],coupons=[],analytics={},settings={},pickups=[],logs=[];

/*
 * Global admin state
 * Important: These variables must be declared before load() is called.
 */
const ORDER_PAGE_SIZE_KEY = `acm:${window.__SITE_ID__}:admin:orderPageSize`; 

const savedOrderPageSize = Number(
  localStorage.getItem(ORDER_PAGE_SIZE_KEY)
);

let orderPager = {
  page: 1,
  limit: [5, 10, 20, 50, 100].includes(savedOrderPageSize)
    ? savedOrderPageSize
    : 5,
  totalRecords: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false
};

let productPager = {
  page: 1,
  limit:8,
  totalRecords: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false
};

let productView = [];
let adminProductQuery = '';

let productRequestSequence = 0;
let productRequestActive = false;


function show(h){$('#modalBody').innerHTML=h;$('#modal').classList.add('open');$('#modal .close').focus()}function close(){ $('#modal').classList.remove('open') }$('#modal .close').onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});async function api(url,opt={}){const r=await fetch(url,opt),d=await r.json().catch(()=>({}));if(r.status===401){location.href='/';throw Error('Session expired')}if(!r.ok)throw Error(d.message||'Request failed');return d}const json=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('on'));document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('primary'));$('#'+b.dataset.tab).classList.add('on');b.classList.add('primary')});
load = async function(){

    const [o,a,p,c,s,pl,l] = await Promise.all([
        api('/admin/getOrders?page=1&limit=20'),
        api('/admin/analytics'),
        api('/admin/products-data'),
        api('/admin/coupons'),
        api('/admin/settings'),
        api('/admin/pickup-locations'),
        api('/admin/inventory-logs')
    ]);

orders = o.orders || [];

orderPager = {
  ...orderPager,
  ...(o.pagination || {})
};

    analytics = a;
	products = Array.isArray(p.products)?p.products:[];
	
	productPager = {
	...productPager,
	...(p.pagination || {})
	};
    coupons = c;
    settings = s;
    pickups = pl;
    logs = l;

    render();
};

function render(){renderDashboardStats();renderOrders();renderProducts();renderCoupons();renderPickups();renderSettings();renderLogs();renderEvents()}
function renderOrders(){const q=($('#search').value||'').toLowerCase(),sf=$('#statusFilter').value,a=orders.filter(o=>JSON.stringify(o).toLowerCase().includes(q)&&(!sf||o.current_status===sf));$('#ordersBody').innerHTML=a.map(o=>`<tr><td><button class="order-link" onclick="orderDetails('${esc(o.order_id)}')"><b>${esc(o.order_id)}</b><small>${esc(o.date)} · ${esc(o.time)}</small></button></td><td><button class="customer-link" onclick="customerHistory('${esc(o.mobile)}')">${esc(o.name)}<small>${esc(o.mobile)}</small></button></td><td>${esc(o.currency)} ${Number(o.amount).toFixed(2)}</td>

<td>
  <button
      class="status-badge"
      onclick="statusEdit('${esc(o.order_id)}')"
      type="button">
      ${esc(o.current_status)}
  </button>
</td>

<td>${esc(o.paymentMethod)} / ${esc(o.paymentStatus)}</td><td><button class="table-action" onclick="downloadInvoice('${esc(o.order_id)}')">Download Invoice</button></td><td><button class="table-action" onclick="editOrder('${esc(o.order_id)}')">Edit</button></td></tr>`).join('')||'<tr><td colspan="7" class="admin-empty">No orders.</td></tr>'}$('#search').oninput=$('#statusFilter').onchange=renderOrders;
window.orderDetails=async(id,edit=false)=>{const o=await api('/admin/orders/'+encodeURIComponent(id));const itemRows=o.items.map((x,i)=>`<div class="order-item-row"><img src="${esc(x.image||'/images/product.svg')}" alt=""><div><b>${esc(x.name)}</b><small>Qty ${x.quantity} · ${o.currency} ${Number(x.price).toFixed(2)}</small></div><strong>${o.currency} ${Number(x.lineTotal||x.price*x.quantity).toFixed(2)}</strong>${edit?`<input class="edit-qty" data-product="${esc(x.product_id)}" type="number" min="1" value="${x.quantity}">`:''}</div>`).join('');show(`<form id="unifiedOrderForm" data-order="${esc(id)}"><div class="modal-title-row"><div><small>ORDER DETAILS</small><h2>${esc(id)}</h2></div><span class="status-badge">${esc(o.current_status)}</span></div><div class="detail-grid"><section><h3>Order Information</h3>${kv('Order date',o.date+' '+o.time)}${kv('Payment',o.paymentMethod+' / '+o.paymentStatus)}${kv('Coupon',o.coupon||'None')}${kv('Shipping',o.currency+' '+o.shippingCharge)}${kv('Tax',o.currency+' '+o.taxAmount)}${kv('Total',o.currency+' '+o.amount)}</section><section><h3>Customer Information</h3>${edit?field('e_name','Customer Name *',o.name)+field('e_mobile','Mobile *',o.mobile)+field('e_email','Email',o.email||'')+field('e_address','Address *',o.address,true)+field('e_pincode','Pincode *',o.pincode):kv('Name',o.name)+kv('Mobile',o.mobile)+kv('Email',o.email||'Not available')+kv('Address',o.address)+kv('Pincode',o.pincode)}</section><section><h3>Tracking & Status</h3><div class="field"><label>Order Status *</label><select id="e_status">${['Order Placed','Order Confirmed','Packed','Shipped','Out for Delivery','Delivered','Rejected','Returned'].map(x=>`<option ${x===o.current_status?'selected':''}>${x}</option>`).join('')}</select></div>${field('e_tracking','Tracking Details',o.tracking_details==='NA'?'':o.tracking_details)}${kv('Last updated',o.tracking_history?.at(-1)?.at?new Date(o.tracking_history.at(-1).at).toLocaleString():'Not available')}</section><section><h3>Notes</h3>${edit?field('e_note','Customer Notes',o.customerVisibleNote||'',true)+field('e_admin','Admin Notes',o.adminNote||'',true):kv('Customer Notes',o.customerVisibleNote||'None')+kv('Admin Notes',o.adminNote||'None')}<h3>Invoice</h3>${kv('Invoice Number',o.invoiceNumber||'Generated on request')}<button type="button" class="pill" onclick="downloadInvoice('${esc(id)}')">Download Invoice</button></section></div><h3>Products</h3><div class="order-items">${itemRows}</div><div class="modal-actions">${edit?'<button class="pill primary" type="submit">Save Changes</button><button class="pill" type="button" onclick="orderDetails(\''+esc(id)+'\')">Cancel</button>':'<button class="pill primary" type="button" onclick="orderDetails(\''+esc(id)+'\',true)">Edit Order</button>'}<button class="pill" type="button" id="updateStatus">Update Status</button><button class="pill" type="button" onclick="downloadInvoice('${esc(id)}')">Download Invoice</button><button class="pill" type="button" onclick="document.querySelector('#modal .close').click()">Close</button></div></form>`);$('#updateStatus').onclick=async()=>{await api('/admin/updateOrderStatus',json('POST',{orderId:id,status:$('#e_status').value,trackingDetails:$('#e_tracking').value}));await load();orderDetails(id)};if(edit)$('#unifiedOrderForm').onsubmit=async e=>{e.preventDefault();const items=[...document.querySelectorAll('.edit-qty')].map(x=>({productId:x.dataset.product,quantity:+x.value}));await api('/admin/orders/'+encodeURIComponent(id),json('PATCH',{customer:{name:$('#e_name').value,mobile:$('#e_mobile').value,email:$('#e_email').value,address:$('#e_address').value,pincode:$('#e_pincode').value},trackingDetails:$('#e_tracking').value,customerVisibleNote:$('#e_note').value,adminNote:$('#e_admin').value,items}));setDirty(false);await load();orderDetails(id)}};
function kv(k,v){return `<p class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></p>`}
window.customerHistory=async mobile=>{const d=await api('/admin/customers/'+encodeURIComponent(mobile)+'/history'),c=d.customer;show(`<h2>Customer History</h2><div class="detail-grid"><section>${kv('Customer',c.name)}${kv('Mobile',c.mobile)}${kv('Email',c.email||'Not available')}</section><section>${kv('Total Orders',c.totalOrders)}${kv('Total Revenue','INR '+Number(c.totalRevenue).toFixed(2))}${kv('First Order',new Date(c.firstOrderDate).toLocaleDateString())}${kv('Last Order',new Date(c.lastOrderDate).toLocaleDateString())}</section></div><h3>Order History</h3><div class="history-list">${d.orders.map(o=>`<button class="history-order" onclick="orderDetails('${esc(o.order_id)}')"><b>${esc(o.order_id)}</b><span>${esc(o.date)} · ${esc(o.current_status)} · ${esc(o.paymentStatus)} · ${esc(o.currency)} ${Number(o.amount).toFixed(2)}</span></button>`).join('')}</div>`)};
window.downloadInvoice=async id=>{const button=document.activeElement?.closest?.('button');if(button)button.disabled=true;try{const r=await fetch('/admin/orders/'+encodeURIComponent(id)+'/invoice');if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.message||'Unable to download invoice')}const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(r.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1]||('invoice-'+id+'.pdf'));document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);adminToast('Invoice downloaded successfully')}catch(e){adminToast(e.message,'error')}finally{if(button)button.disabled=false}};
window.statusEdit=id=>{const o=orders.find(x=>x.order_id===id);show(`<form id="statusForm"><h2>Update Status</h2><div class="field"><label>Status</label><select id="os">${['Order Placed','Order Confirmed','Packed','Shipped','Out for Delivery','Delivered','Rejected','Returned'].map(x=>`<option ${x===o.current_status?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Tracking</label><input id="ot" value="${esc(o.tracking_details==='NA'?'':o.tracking_details)}"></div><button class="pill primary">Update</button></form>`);$('#statusForm').onsubmit=async e=>{e.preventDefault();try{const d=await api('/admin/updateOrderStatus',json('POST',{orderId:id,status:$('#os').value,trackingDetails:$('#ot').value}));close();await load();if(d.invoiceNumber)show(`<h2>Order Confirmed</h2><p>Invoice <b>${esc(d.invoiceNumber)}</b> generated.</p><button class="pill primary" onclick="downloadInvoice('${esc(id)}')">Download Invoice</button>`)}catch(x){show(`<h2>Unable to update</h2><p>${esc(x.message)}</p>`)}}};
window.editOrder=id=>orderDetails(id,true);
function field(id,label,value='',area=false,type='text',required=false){const mark=required?' <span class="required-mark" aria-hidden="true">*</span>':'';const req=required?' required aria-required="true"':'';return`<div class="field"><label for="${id}">${label}${mark}</label>${area?`<textarea id="${id}"${req}>${esc(value)}</textarea>`:`<input id="${id}" type="${type}" value="${esc(value)}"${req}>`}</div>`}
$('#newManualOrder').onclick=()=>{show(`<form id="manualForm"><h2>Create Manual Order</h2><div class="form-grid">${field('m_name','Name')}${field('m_mobile','Mobile')}${field('m_email','Email')}${field('m_pincode','Pincode')}${field('m_address','Address','',true)}<div class="field"><label>Delivery mode</label><select id="m_delivery"><option value="delivery">Home delivery</option><option value="pickup">Self pickup</option></select></div><div class="field"><label>Payment method</label>
<select id="m_payment">
<option>manual</option>
<option>cash</option>
${settings.codEnabled ? '<option>cod</option>' : ''}
<option>bank_transfer</option>
<option>razorpay_reference</option>
</select></div>${field('m_shipping','Shipping charge','','false','number')}</div><h3>Products</h3><div id="manualLines"></div><button type="button" class="pill" id="addManualLine">Add Product</button><button class="pill primary">Create Order</button></form>`);const add=()=>$('#manualLines').insertAdjacentHTML('beforeend',`<div class="manual-line"><select class="ml-product">${products.filter(p=>p.active).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} | ${esc(p.sku||p.id)} | ₹${p.price} | Stock ${p.stock}</option>`).join('')}</select><input class="ml-qty" type="number" min="1" value="1"><button type="button" class="table-delete" onclick="this.parentElement.remove()">Remove</button></div>`);$('#addManualLine').onclick=add;add();$('#manualForm').onsubmit=async e=>{e.preventDefault();const items=[...document.querySelectorAll('.manual-line')].map(x=>({productId:x.querySelector('.ml-product').value,quantity:+x.querySelector('.ml-qty').value}));try{const d=await api('/admin/orders/manual',json('POST',{customer:{name:$('#m_name').value,mobile:$('#m_mobile').value,email:$('#m_email').value,address:$('#m_address').value,pincode:$('#m_pincode').value},items,deliveryMode:$('#m_delivery').value,paymentMethod:$('#m_payment').value,shippingCharge:$('#m_shipping').value===''?undefined:+$('#m_shipping').value,idempotencyKey:crypto.randomUUID()}));close();await load();show(`<h2>Order Created</h2><p>${esc(d.order.order_id)}</p>`)}catch(x){alert(x.message)}}};

function renderProductsBase(){const list=products;$('#productList').innerHTML=list.map(p=>{const stock=Math.max(0,Number(p.stock)||0),reserved=Math.max(0,Number(p.reservedStock)||0),sc=stock===0?'admin-stock-out':stock<=5?'admin-stock-low':'admin-stock-good';return `<article class="card admin-product-card" data-active="${p.active!==false}"><div class="admin-product-image-wrap"><img class="admin-product-image" src="${esc(p.image||'/images/product.svg')}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='/images/product.svg'"><span class="admin-product-state ${p.active?'is-active':'is-inactive'}"><span class="admin-state-dot"></span>${p.active?'Active':'Inactive'}</span></div><div class="pad admin-product-content"><div class="admin-product-title-wrap"><h3>${esc(p.name)}</h3>${p.category?`<span class="admin-product-category">${esc(p.category)}</span>`:''}</div><div class="admin-product-price"><span class="admin-product-price-label">Selling price</span><strong>₹${Number(p.price||0).toLocaleString('en-IN')}</strong></div><div class="admin-product-stock-grid"><div class="admin-product-metric"><span>Available</span><strong>${stock}</strong></div><div class="admin-product-metric"><span>Reserved</span><strong>${reserved}</strong></div></div><div class="admin-product-stock-state ${sc}"><span class="admin-stock-dot"></span>${stock===0?'Out of stock':stock<=5?'Low stock':'In stock'}</div><div class="admin-product-limits"><div><span>Min quantity</span><strong>${Number(p.minOrderQty)||1}</strong></div><div><span>Max quantity</span><strong>${esc(p.maxOrderQty==null?'Stock limit':p.maxOrderQty)}</strong></div></div><div class="admin-product-actions"><button type="button" class="admin-product-action" onclick="productForm('${esc(p._id)}')">Edit</button><button type="button" class="admin-product-action" onclick="stockForm('${esc(p.id)}')">Stock</button><button type="button" class="admin-product-action" onclick="mediaForm('${esc(p.id)}')">Images</button><button type="button" class="admin-product-action admin-product-delete" onclick="deleteProduct('${esc(p.id)}','${esc(p.name)}')">Delete</button></div></div></article>`}).join('')||'<p class="admin-empty">No matching products found.</p>'}
function renderProducts(){return renderProductsBase()}
window.deleteProduct=async function(id,name){
  if(!confirm(`Permanently delete product "${name}"? This cannot be undone.`))return;
  try{
    await api('/admin/products/'+encodeURIComponent(id),{method:'DELETE'});
    const targetPage=products.length===1&&productPager.page>1?productPager.page-1:productPager.page;
    await loadProductPage(targetPage);
    adminToast('Product permanently deleted');
  }catch(error){adminToast(error.message||'Unable to delete product','error')}
};
$('#newProduct').onclick=()=>productForm();window.productForm=mongoId=>{const p=products.find(x=>String(x._id)===String(mongoId))||{},editing=Boolean(p._id),checks=[['active','Active'],['featured','Featured'],['buyNowEnabled','Buy Now'],['addToCartEnabled','Add to Cart'],['homeDeliveryAvailable','Home Delivery'],['selfPickupAvailable','Self Pickup'],['codAvailable','COD'],['freeShipping','Free Shipping']];show(`<form id="pf"><h2>${editing?'Edit':'Create'} Product</h2><div id="productFormMessage" class="notice" hidden></div><div class="form-grid">${[['id','Product ID'],['sku','SKU'],['productCode','Product code'],['slug','Slug'],['name','Name'],['category','Category'],['subCategory','Subcategory'],['price','Price'],['stock','Initial stock'],['oldPrice','Old price'],['minOrderQty','Minimum quantity'],['maxOrderQty','Maximum quantity'],['badge','Badge'],['taxRate','Tax rate'],['hsnCode','HSN code'],['weight','Weight'],['image','Primary image URL']].map(([k,l])=>field('p_'+k,l,p[k]??(k==='id'?p.id||'':k==='stock'?0:''),false,['price','stock','oldPrice','minOrderQty','maxOrderQty','taxRate','weight'].includes(k)?'number':'text',!editing&&['name','price'].includes(k))).join('')}</div>${field('p_shortDescription','Short description',p.shortDescription||'',true)}${field('p_description','Description',p.description||'',true)}${field('p_tags','Tags, comma separated',(p.tags||[]).join(','))}${field('p_features','Features, one per line',(p.features||[]).join('\n'),true)}${field('p_specs','Specifications JSON',JSON.stringify(p.specs||{},null,2),true)}<div class="check-grid">${checks.map(([k,l])=>`<label><input id="p_${k}" type="checkbox" ${p[k]!==false&&(p[k]===true||['active','buyNowEnabled','addToCartEnabled','homeDeliveryAvailable'].includes(k))?'checked':''}> ${l}</label>`).join('')}</div><button id="saveProduct" class="pill primary">Save Product</button></form>`);if(editing)$('#p_id').disabled=true;let locked=false;$('#pf').onsubmit=async e=>{e.preventDefault();if(locked)return;const button=$('#saveProduct'),message=$('#productFormMessage');try{locked=true;button.disabled=true;button.textContent='Saving...';const body={};['id','sku','productCode','slug','name','category','subCategory','price','stock','oldPrice','minOrderQty','maxOrderQty','badge','taxRate','hsnCode','weight','image','shortDescription','description'].forEach(k=>body[k]=$('#p_'+k).value);checks.forEach(([k])=>body[k]=$('#p_'+k).checked);body.tags=$('#p_tags').value.split(',').map(x=>x.trim()).filter(Boolean);body.features=$('#p_features').value.split('\n').map(x=>x.trim()).filter(Boolean);body.specs=JSON.parse($('#p_specs').value||'{}');const d=await api(editing?'/admin/products/'+encodeURIComponent(p._id):'/admin/products',json(editing?'PATCH':'POST',body));await loadProductPage(editing?productPager.page:1);close();alert(d.message)}catch(x){message.hidden=false;message.textContent=x.message;button.disabled=false;button.textContent='Save Product';locked=false}}};
window.stockForm=id=>{
  const p=products.find(x=>x.id===id);
  const current=Number(p.stock||0)+Number(p.reservedStock||0);

  show(`
    <form id="sf">
      <h2>Adjust Stock</h2>

      <div class="stock-preview">
        <p>
          Current Stock
          <b>${current}</b>
        </p>

        <p>
          Adjustment
          <b id="pvChange">0</b>
        </p>

        <p>
          Expected New Stock
          <b id="pvNew">${current}</b>
        </p>

        <p>
          Difference
          <b id="pvDiff">0</b>
        </p>
      </div>

      ${field(
        'adjustBy',
        'Increase / Decrease By',
        '',
        false,
        'number'
      )}

      ${field(
        'setTotal',
        'Set Total Quantity',
        '',
        false,
        'number'
      )}

      <div class="field">
        <label>Reason *</label>

        <select id="sr">
          <option>admin_adjustment</option>
          <option>correction</option>
          <option>refund_restock</option>
        </select>
      </div>

      <button
        class="pill primary"
        id="confirmStock"
        disabled
      >
        Confirm Adjustment
      </button>
    </form>
  `);

  const adjustInput=$('#adjustBy');
  const totalInput=$('#setTotal');
  const confirmButton=$('#confirmStock');

  const setVisualState=activeInput=>{
    const adjustField=adjustInput.closest('.field');
    const totalField=totalInput.closest('.field');

    adjustField.classList.toggle(
      'stock-field-muted',
      activeInput==='total'
    );

    totalField.classList.toggle(
      'stock-field-muted',
      activeInput==='adjust'
    );
  };

  const resetPreview=()=>{
    $('#pvChange').textContent='0';
    $('#pvNew').textContent=String(current);
    $('#pvDiff').textContent='0';
    confirmButton.disabled=true;
    setVisualState(null);
  };

  const draw=()=>{
    const adjustmentValue=adjustInput.value.trim();
    const totalValue=totalInput.value.trim();

    /*
      Neither value was entered.
      Therefore stock must remain unchanged.
    */
    if(adjustmentValue==='' && totalValue===''){
      resetPreview();
      return;
    }

    let change=0;
    let next=current;
    let valid=false;

    if(adjustmentValue!==''){
      const adjustment=Number(adjustmentValue);

      change=adjustment;
      next=current+adjustment;

      valid=
        Number.isInteger(adjustment) &&
        adjustment!==0 &&
        next>=0;
		
	  if(adjustmentValue !== '' && next < 0){
	  $('#pvNew').textContent = 'INVALID';
	  $('#pvDiff').textContent = change;
	  confirmButton.disabled = true;
    return;
}

      setVisualState('adjust');
    }
	  else if(totalValue!==''){
	  const requestedTotal=Number(totalValue);
	  
	  next=requestedTotal;
	  change=requestedTotal-current;
	  
	  if(requestedTotal < 0){
	  	$('#pvNew').textContent='INVALID';
	  	$('#pvDiff').textContent=change;
	  	$('#pvChange').textContent=change;
	  	confirmButton.disabled=true;
	  	return;
	  }
	  
	  valid=
	  	Number.isInteger(requestedTotal) &&
	  	requestedTotal>=0;
	  
	  setVisualState('total');
	  }

    $('#pvChange').textContent=
      Number.isFinite(change)
        ? `${change>0?'+':''}${change}`
        : '-';

    $('#pvNew').textContent=
      Number.isFinite(next)
        ? String(next)
        : '-';

    $('#pvDiff').textContent=
      Number.isFinite(change)
        ? `${change>0?'+':''}${change}`
        : '-';

    confirmButton.disabled=!valid;
  };

  adjustInput.addEventListener('input',()=>{
    /*
      Adjustment field gets priority when the admin types here.
      Any value in Set Total Quantity is removed automatically.
    */
    if(adjustInput.value!==''){
      totalInput.value='';
    }

    draw();
  });

  totalInput.addEventListener('input',()=>{
    /*
      Total field gets priority when the admin types here.
      Any value in Increase / Decrease By is removed automatically.
    */
    if(totalInput.value!==''){
      adjustInput.value='';
    }

    draw();
  });

  $('#sf').onsubmit=async e=>{
	  
    e.preventDefault();

    const adjustmentValue=adjustInput.value.trim();
    const totalValue=totalInput.value.trim();

    /*
      If both inputs are empty, do not send any request and
      do not change inventory.
    */
    if(adjustmentValue==='' && totalValue===''){
      resetPreview();
      return;
    }

    const mode=totalValue!==''?'set':'adjust';

const quantity=
  mode==='set'
    ? Number(totalValue)
    : Number(adjustmentValue);

if(mode === 'adjust'){
    const futureStock = current + quantity;

    if(futureStock < 0){
        alert(
            `Stock cannot become negative.\n\nCurrent Stock: ${current}\nAdjustment: ${quantity}\nResulting Stock: ${futureStock}`
        );
        return;
    }
}

    /*
      Set Total Quantity = 0 is valid.
      Adjustment = 0 is treated as no change.
    */
if(
  !Number.isInteger(quantity) ||
  (mode === 'set' && quantity < 0) ||
  (mode === 'adjust' && quantity === 0)
){
  draw();
  return;
}

    const button=$('#confirmStock');
    button.disabled=true;

    try{
      await api(
        `/admin/products/${encodeURIComponent(id)}/stock-adjustment`,
        json('POST',{
          mode,
          quantity,
          reason:$('#sr').value,
          idempotencyKey:crypto.randomUUID()
        })
      );

      close();
      await load();
    }
    catch(error){
      button.disabled=false;

      show(`
        <h2>Unable to adjust stock</h2>
        <p>${esc(error.message)}</p>
      `);
    }
  };

  resetPreview();
};

window.mediaForm=id=>{const p=products.find(x=>x.id===id);show(`<h2>Product Images</h2><form id="primaryUpload"><label>Replace primary image</label><input id="primaryFile" type="file" accept="image/jpeg,image/png,image/webp" required><button class="pill primary">Upload</button></form><form id="galleryUpload"><label>Add gallery images</label><input id="galleryFiles" type="file" multiple accept="image/jpeg,image/png,image/webp" required>${field('galleryAlt','Alt text',p.name)}<button class="pill primary">Upload Gallery</button></form><div id="galleryManager">${(p.galleryDetailed||[]).map(x=>`<div class="gallery-admin"><img src="${esc(x.url)}"><input value="${esc(x.alt||'')}" onchange="updateAlt('${id}','${x._id}',this.value)"><button class="table-delete" onclick="removeGallery('${id}','${x._id}')">Remove</button></div>`).join('')}</div>`);$('#primaryUpload').onsubmit=async e=>{e.preventDefault();const f=new FormData();f.append('image',$('#primaryFile').files[0]);try{await api(`/admin/products/${id}/image`,{method:'POST',body:f});close();load()}catch(x){alert(x.message)}};$('#galleryUpload').onsubmit=async e=>{e.preventDefault();const f=new FormData();[...$('#galleryFiles').files].forEach(x=>f.append('images',x));f.append('alt',$('#galleryAlt').value);try{await api(`/admin/products/${id}/gallery`,{method:'POST',body:f});close();load()}catch(x){alert(x.message)}}};window.updateAlt=async(id,img,alt)=>{await api(`/admin/products/${id}/gallery/${img}`,json('PATCH',{alt}));load()};window.removeGallery=async(id,img)=>{await api(`/admin/products/${id}/gallery/${img}`,{method:'DELETE'});close();load()};
function renderCoupons(){$('#couponList').innerHTML=coupons.map(c=>`<article class="admin-list-card"><div><h3>${esc(c.code)}</h3><div class="admin-meta"><span>${c.type==='percent'?c.value+'%':'₹'+c.value}</span><span>Min ₹${c.minOrder}</span><span>Used ${c.usageCount||0}/${c.usageLimit??'∞'}</span><span class="${c.active?'state-on':'state-off'}">${c.active?'Active':'Inactive'}</span></div></div><div><button class="pill" onclick="couponForm('${esc(c.code)}')">Edit</button><button class="pill danger" onclick="deleteCoupon('${esc(c.code)}')">Delete</button></div></article>`).join('')||'<p>No coupons.</p>'}$('#newCoupon').onclick=()=>couponForm();window.couponForm=code=>{const c=coupons.find(x=>x.code===code)||{};show(`<form id="cf"><h2>Coupon</h2><div class="form-grid">${field('c_code','Code',c.code||'')}<div class="field"><label>Type</label><select id="c_type"><option value="percent">Percent</option><option value="fixed" ${c.type==='fixed'?'selected':''}>Fixed</option></select></div>${field('c_value','Value',c.value||0,false,'number')}${field('c_min','Minimum order',c.minOrder||0,false,'number')}${field('c_max','Maximum discount',c.maxDiscount??'',false,'number')}${field('c_limit','Usage limit',c.usageLimit??'',false,'number')}${field('c_customer','Per customer limit',c.perCustomerLimit??'',false,'number')}${field('c_start','Start date',c.startAt?String(c.startAt).slice(0,10):'',false,'date')}${field('c_end','Expiry date',c.expiresAt?String(c.expiresAt).slice(0,10):'',false,'date')}</div><label><input id="c_active" type="checkbox" ${c.active!==false?'checked':''}> Active</label><button class="pill primary">Save</button></form>`);$('#cf').onsubmit=async e=>{e.preventDefault();await api('/admin/coupons',json('POST',{code:$('#c_code').value,type:$('#c_type').value,value:+$('#c_value').value,minOrder:+$('#c_min').value,maxDiscount:$('#c_max').value===''?null:+$('#c_max').value,usageLimit:$('#c_limit').value===''?null:+$('#c_limit').value,perCustomerLimit:$('#c_customer').value===''?null:+$('#c_customer').value,startAt:$('#c_start').value,expiresAt:$('#c_end').value,active:$('#c_active').checked}));close();load()}};window.deleteCoupon=async code=>{if(confirm('Delete coupon?')){await api('/admin/coupons/'+encodeURIComponent(code),{method:'DELETE'});load()}};
function renderPickups(){$('#pickupList').innerHTML=pickups.map(p=>`<article class="admin-list-card"><div><h3>${esc(p.name)}</h3><p>${esc([p.address?.line1,p.address?.city,p.address?.pincode].filter(Boolean).join(', '))}</p></div><button class="pill" onclick="pickupForm('${p._id}')">Edit</button></article>`).join('')||'<p>No pickup locations.</p>'}$('#newPickup').onclick=()=>pickupForm();window.pickupForm=id=>{const p=pickups.find(x=>x._id===id)||{};show(`<form id="plf"><h2>Pickup Location</h2>${field('pl_code','Code',p.code||'')}${field('pl_name','Name',p.name||'')}${field('pl_line','Address',p.address?.line1||'')}${field('pl_city','City',p.address?.city||'')}${field('pl_state','State',p.address?.state||'')}${field('pl_pin','Pincode',p.address?.pincode||'')}${field('pl_phone','Contact',p.contactNumber||'')}<label><input id="pl_active" type="checkbox" ${p.active!==false?'checked':''}> Active</label><button class="pill primary">Save</button></form>`);$('#plf').onsubmit=async e=>{e.preventDefault();const body={code:$('#pl_code').value,name:$('#pl_name').value,address:{line1:$('#pl_line').value,city:$('#pl_city').value,state:$('#pl_state').value,pincode:$('#pl_pin').value,country:'India'},contactNumber:$('#pl_phone').value,active:$('#pl_active').checked};await api(id?'/admin/pickup-locations/'+id:'/admin/pickup-locations',json(id?'PUT':'POST',body));close();load()}};
function renderSettings(){const bool=['storeOpen','selfPickupEnabled','codEnabled','invoiceEnabled'],keys=['supportMobile','supportEmail','sellerLegalName','sellerTradeName','sellerAddress','sellerCity','sellerDistrict','sellerState','sellerStateCode','sellerPincode','sellerCountry','sellerGSTIN','sellerPAN','defaultCurrency','defaultMaxOrderQty','activityRetentionDays','maintenanceMessage','shippingCharge','freeShippingThreshold','invoicePrefix','invoiceTerms'];$('#settingsForm').innerHTML=`<div class="check-grid">${bool.map(k=>`<label><input data-setting="${k}" type="checkbox" ${settings[k]?'checked':''}> ${k}</label>`).join('')}</div><div class="form-grid">${keys.map(k=>field('set_'+k,k,settings[k]??'',k==='sellerAddress'||k==='maintenanceMessage'||k==='invoiceTerms')).join('')}</div><button class="pill primary">Save Settings</button>`;$('#settingsForm').onsubmit=async e=>{e.preventDefault();const body={};bool.forEach(k=>body[k]=$(`[data-setting="${k}"]`).checked);keys.forEach(k=>body[k]=$('#set_'+k).value);settings=await api('/admin/settings',json('PUT',body));renderSettings();alert('Settings saved')}}
function renderLogs(){$('#inventoryBody').innerHTML=logs.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${esc(x.legacyProductId)}</td><td>${x.previousStock}</td><td>${x.quantityChange}</td><td>${x.newStock}</td><td>${esc(x.reason)}</td><td>${esc(x.performedBy?.type)} / ${esc(x.performedBy?.id)}</td></tr>`).join('')}
function renderEvents(){$('#eventsBody').innerHTML=(analytics.events||[]).map(e=>`<tr><td><input class="event-select" type="checkbox" value="${e.id}"></td><td>${new Date(e.at).toLocaleString()}</td><td>${esc(e.type)}</td><td>${esc(e.name||'Anonymous')}</td><td>${esc(e.mobile||'')}</td><td>${esc(e.productId||e.orderId||'')}</td><td>${esc(e.reason||'')}</td><td><button class="table-delete" onclick="deleteEvent('${e.id}')">Delete</button></td></tr>`).join('');document.querySelectorAll('.event-select').forEach(x=>x.onchange=()=>$('#deleteSelectedEvents').disabled=!document.querySelector('.event-select:checked'))}window.deleteEvent=async id=>{await api('/admin/events/'+id,{method:'DELETE'});load()};$('#deleteSelectedEvents').onclick=async()=>{const ids=[...document.querySelectorAll('.event-select:checked')].map(x=>x.value);if(ids.length&&confirm(`Delete ${ids.length} records?`)){await api('/admin/events/bulk-delete',json('POST',{ids}));load()}};$('#selectAllEvents').onchange=e=>{document.querySelectorAll('.event-select').forEach(x=>x.checked=e.target.checked);$('#deleteSelectedEvents').disabled=!e.target.checked};$('#logout').onclick=async()=>{await fetch('/admin/logout',{method:'POST'});location.href='/'};
let adminDirty=false;function setDirty(v){adminDirty=!!v}document.addEventListener('input',e=>{if(e.target.closest('#modal form,#settingsForm'))setDirty(true)});window.addEventListener('beforeunload',e=>{if(adminDirty){e.preventDefault();e.returnValue=''}});document.addEventListener('click',e=>{const nav=e.target.closest('a,[data-tab]');if(nav&&adminDirty&&!confirm('Are you sure you want to leave this page?\nUnsaved administrative changes may be lost.')){e.preventDefault();e.stopImmediatePropagation()}} ,true);
/* Controlled production upgrade */

async function loadOrders(page=orderPager.page){const q=new URLSearchParams({page:String(page),limit:String(orderPager.limit),search:($('#search')?.value||'').trim(),status:$('#statusFilter')?.value||''}),d=await api('/admin/getOrders?'+q);orders=Array.isArray(d.orders)?d.orders:[];orderPager=d.pagination||orderPager;renderOrders()}
load=async function(){const[o,a,p,c,s,pl,l]=await Promise.all([api('/admin/getOrders?page=1&limit=20'),api('/admin/analytics'),api('/admin/products-data'),api('/admin/coupons'),api('/admin/settings'),api('/admin/pickup-locations'),api('/admin/inventory-logs')]);orders=o.orders||[];

orderPager = {
  ...orderPager,
  ...(o.pagination || {})
};

analytics=a;products=Array.isArray(p.products)?p.products:[];

productPager = {
  ...productPager,
  ...(p.pagination || {})
};

coupons=c;settings=s;pickups=pl;logs=l;render()};
renderOrders=function(){const invoiceOn=settings.invoiceEnabled!==false;$('#ordersBody').innerHTML=orders.map(o=>`<tr><td><button class="order-link" onclick="orderDetails('${esc(o.order_id)}')"><b>${esc(o.order_id)}</b><small>${esc(o.date)} · ${esc(o.time)}</small></button></td><td><button class="customer-link" onclick="customerHistory('${esc(o.mobile)}')">${esc(o.name)}<small>${esc(o.mobile)}</small></button></td><td>${esc(o.currency)} ${Number(o.amount).toFixed(2)}</td><td><button class="status-badge" onclick="statusEdit('${esc(o.order_id)}')">${esc(o.current_status)}</button></td><td>${esc(o.paymentMethod)} / ${esc(o.paymentStatus)}</td>${invoiceOn?`<td><button class="table-action" onclick="downloadInvoice('${esc(o.order_id)}')">Download Invoice</button></td>`:''}<td><button class="table-action" onclick="editOrder('${esc(o.order_id)}')">Edit</button></td></tr>`).join('')||`<tr><td colspan="${invoiceOn?7:6}" class="admin-empty">No matching orders found.</td></tr>`;const start=orderPager.totalRecords?(orderPager.page-1)*orderPager.limit+1:0,end=Math.min(orderPager.page*orderPager.limit,orderPager.totalRecords);$('#orderShowing').textContent=`Showing ${start}-${end} of ${orderPager.totalRecords} orders`;$('#orderPageLabel').textContent=`Page ${orderPager.page} of ${orderPager.totalPages||1}`;$('#orderPrev').disabled=!orderPager.hasPrevious;$('#orderNext').disabled=!orderPager.hasNext};
/* Legacy order control bindings removed: current HTML uses live search and inline clear controls below. */
var originalProducts=renderProducts;renderProducts=function(){const q=adminProductQuery.toLowerCase(),all=products,filtered=products.filter(p=>!q||[p.name,p.id,p.sku,p.productCode,p.slug,p.category,p.subCategory,(p.tags||[]).join(' '),p.active?'active':'inactive'].join(' ').toLowerCase().includes(q));products=filtered;originalProducts();products=all;if(!filtered.length)$('#productList').innerHTML='<p>No matching products found</p>'};/* Legacy product search buttons removed: current HTML uses live search and inline clear controls below. */
renderPickups=function(){$('#pickupList').innerHTML=pickups.map(p=>`<article class="admin-list-card"><div><span class="pickup-state ${p.active===true?'active':'inactive'}">${p.active===true?'ACTIVE':'INACTIVE'}</span><h3>${esc(p.name)}</h3><p>${esc([p.address?.line1,p.address?.city,p.address?.pincode].filter(Boolean).join(', '))}</p></div><button class="pill" onclick="pickupForm('${esc(p._id)}')">Edit</button></article>`).join('')||'<p>No pickup locations.</p>'};
renderLogs=function(){$('#inventoryBody').innerHTML=logs.map(x=>`<tr><td><input class="inventory-select" type="checkbox" value="${esc(x._id)}"></td><td>${new Date(x.createdAt).toLocaleString()}</td><td>${esc(x.legacyProductId)}</td><td>${x.previousStock}</td><td>${x.quantityChange}</td><td>${x.newStock}</td><td>${esc(x.reason)}</td><td>${esc(x.performedBy?.type)} / ${esc(x.performedBy?.id)}</td><td><button class="table-delete" onclick="deleteInventoryLog('${esc(x._id)}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="9">No inventory logs remain.</td></tr>';document.querySelectorAll('.inventory-select').forEach(x=>x.onchange=inventorySelection)};function inventorySelection(){const n=document.querySelectorAll('.inventory-select:checked').length;$('#inventorySelectedCount').textContent=`(${n})`;$('#deleteSelectedInventory').disabled=!n}window.deleteInventoryLog=async id=>{if(!confirm('Delete this inventory history record? Stock will not change.'))return;await api('/admin/inventory-logs/'+id,{method:'DELETE'});logs=await api('/admin/inventory-logs');renderLogs()};$('#selectAllInventory').onchange=e=>{document.querySelectorAll('.inventory-select').forEach(x=>x.checked=e.target.checked);inventorySelection()};$('#deleteSelectedInventory').onclick=async()=>{const ids=[...document.querySelectorAll('.inventory-select:checked')].map(x=>x.value);if(ids.length&&confirm(`Delete ${ids.length} inventory history records?`)){await api('/admin/inventory-logs/bulk-delete',json('POST',{ids}));logs=await api('/admin/inventory-logs');renderLogs()}};
const formSnapshots=new WeakMap();function serial(f){return JSON.stringify([...new FormData(f).entries()].sort())}document.addEventListener('focusin',e=>{const f=e.target.closest('form');if(f&&!formSnapshots.has(f))formSnapshots.set(f,serial(f))});setDirty=()=>{};window.onbeforeunload=e=>{if([...document.querySelectorAll('form')].some(f=>formSnapshots.has(f)&&serial(f)!==formSnapshots.get(f))){e.preventDefault();e.returnValue=''}};

/* Requested admin UX controls */

const debounce=(fn,ms=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
function setAreaLoading(selector,on,label='Loading data'){const area=$(selector);if(!area)return;area.classList.toggle('data-loading',on);let x=area.querySelector(':scope > .smart-loader');if(on&&!x){area.insertAdjacentHTML('afterbegin',`<div class="smart-loader" role="status"><span></span><b>${esc(label)}</b></div>`)}else if(!on&&x)x.remove()}
async function loadOrdersSmart(page=1){setAreaLoading('#orders',true,'Loading orders');try{await loadOrders(page)}finally{setAreaLoading('#orders',false)}}
$('#search').oninput=debounce(()=>loadOrdersSmart(1),280);
$('#orderInlineClear').onclick=()=>{if(!$('#search').value)return;$('#search').value='';loadOrdersSmart(1);$('#search').focus()};
$('#statusFilter').onchange=()=>{setOrdersContext($('#statusFilter').value);loadOrdersSmart(1)};
$('#orderPageSize').onchange=e=>{orderPager.limit=+e.target.value;loadOrdersSmart(1)};
$('#orderPrev').onclick=()=>loadOrdersSmart(orderPager.page-1);
$('#orderNext').onclick=()=>loadOrdersSmart(orderPager.page+1);

function updateProductPagination(){
  const total=Number(productPager.totalRecords)||0;
  const page=Number(productPager.page)||1;
  const limit=Number(productPager.limit)||8;
  const pages=Math.max(1,Number(productPager.totalPages)||1);
  const start=total?(page-1)*limit+1:0;
  const end=Math.min(page*limit,total);
  $('#productShowing').textContent=`Showing ${start}-${end} of ${total} products`;
  $('#productPageLabel').textContent=`Page ${page} of ${pages}`;
  $('#productPrev').disabled=productRequestActive||!productPager.hasPrevious;
  $('#productNext').disabled=productRequestActive||!productPager.hasNext;
}

async function loadProductPage(requestedPage=1){
  let page=Math.max(1,Number(requestedPage)||1);
  if(productPager.totalPages>0)page=Math.min(page,productPager.totalPages);
  const sequence=++productRequestSequence;
  productRequestActive=true;
  updateProductPagination();
  setAreaLoading('#products',true,'Loading products');
  try{
    const q=new URLSearchParams({
      page:String(page),
      limit:String(productPager.limit),
      search:($('#productSearch').value||'').trim()
    });
    const d=await api('/admin/products-data?'+q);
    if(sequence!==productRequestSequence)return;
    products=Array.isArray(d.products)?d.products:[];
    productPager=d.pagination||productPager;
    renderProductsBase();
  }catch(error){
    if(sequence===productRequestSequence)alert(error.message||'Unable to load products');
  }finally{
    if(sequence===productRequestSequence){
      productRequestActive=false;
      setAreaLoading('#products',false);
      updateProductPagination();
    }
  }
}

renderProducts=function(){
  renderProductsBase();
  updateProductPagination();
};
$('#productSearch').oninput=debounce(()=>loadProductPage(1),280);
$('#productInlineClear').onclick=()=>{
  $('#productSearch').value='';
  loadProductPage(1);
  $('#productSearch').focus();
};
$('#productPrev').onclick=()=>{
  if(productPager.hasPrevious)loadProductPage(productPager.page-1);
};
$('#productNext').onclick=()=>{
  if(productPager.hasNext)loadProductPage(productPager.page+1);
};
const _renderPickups=renderPickups;renderPickups=function(){_renderPickups();document.querySelectorAll('#pickupList .pickup-state').forEach(x=>x.setAttribute('aria-label','Pickup location status: '+x.textContent.trim()))};
function couponWindow(c){const now=new Date(),start=c.startAt?new Date(c.startAt):null,end=c.expiresAt?new Date(c.expiresAt):null;return(!start||now>=start)&&(!end||now<=end)}
const _renderCoupons=renderCoupons;renderCoupons=function(){_renderCoupons();document.querySelectorAll('#couponList .admin-list-card').forEach((card,i)=>{const c=coupons[i],valid=c&&couponWindow(c),state=card.querySelector('.state-on,.state-off');if(state){state.textContent=valid&&c.active?'Active':'Inactive';state.className=valid&&c.active?'state-on':'state-off'}if(c&&!valid)card.classList.add('coupon-outside-window')})};
const _couponForm=couponForm;couponForm=function(code){_couponForm(code);const active=$('#c_active'),start=$('#c_start'),end=$('#c_end');const sync=()=>{const c={startAt:start.value?start.value+'T00:00:00':null,expiresAt:end.value?end.value+'T23:59:59':null},valid=couponWindow(c);active.disabled=!valid;if(!valid)active.checked=false;active.closest('label').title=valid?'':'Active is unavailable outside the coupon date window'};start.onchange=end.onchange=sync;sync()};
const _renderSettings=renderSettings;renderSettings=function(){_renderSettings();const f=$('#settingsForm');f.innerHTML=`<div class="settings-card"><div class="settings-card-head"><span>Store controls</span><small>Customer-facing switches</small></div>${f.querySelector('.check-grid').outerHTML}</div><div class="settings-card"><div class="settings-card-head"><span>Business configuration</span><small>Support, seller, shipping and invoice details</small></div>${f.querySelector('.form-grid').outerHTML}</div><div class="settings-savebar"><span>Review changes before publishing.</span><button class="pill primary">Save Settings</button></div>`;f.onsubmit=async e=>{e.preventDefault();setAreaLoading('#settings',true,'Saving settings');try{const body={};['storeOpen','selfPickupEnabled','codEnabled','invoiceEnabled'].forEach(k=>body[k]=$(`[data-setting="${k}"]`).checked);['supportMobile','supportEmail','sellerLegalName','sellerTradeName','sellerAddress','sellerCity','sellerDistrict','sellerState','sellerStateCode','sellerPincode','sellerCountry','sellerGSTIN','sellerPAN','defaultCurrency','defaultMaxOrderQty','activityRetentionDays','maintenanceMessage','shippingCharge','freeShippingThreshold','invoicePrefix','invoiceTerms'].forEach(k=>body[k]=$('#set_'+k).value);settings=await api('/admin/settings',json('PUT',body));renderSettings();adminToast('Settings saved successfully')}catch(error){adminToast(error.message||'Unable to save settings','error')}finally{setAreaLoading('#settings',false)}}};
;(()=>{function toggle(input){input.closest('.admin-searchbox')?.classList.toggle('has-value',!!input.value)}const debounceFinal=(fn,ms=220)=>{let t;return()=>{clearTimeout(t);t=setTimeout(fn,ms)}};function initFinal(){const os=$('#search'),ps=$('#productSearch');toggle(os);toggle(ps);os.addEventListener('input',debounceFinal(()=>{toggle(os);loadOrdersSmart(1)},220));ps.addEventListener('input',debounceFinal(()=>{toggle(ps);loadProductPage(1)},180));$('#orderInlineClear').onclick=()=>{os.value='';toggle(os);loadOrdersSmart(1);os.focus()};$('#productInlineClear').onclick=()=>{ps.value='';toggle(ps);loadProductPage(1);ps.focus()};const rp=renderPickups;renderPickups=function(){rp();document.querySelectorAll('#pickupList .pickup-state').forEach(x=>x.setAttribute('aria-label','Pickup status '+x.textContent.trim()))};setTimeout(()=>{renderPickups();renderSettings();updateProductPagination()},0)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFinal);else initFinal()})();
/* FINAL MOBILE ADMIN CORRECTIONS */
function finalRenderPickups(){
  const list=document.querySelector('#pickupList');
  if(!list)return;
  list.innerHTML=pickups.map(p=>{
    const enabled=p.active!==false;
    return `<article class="admin-list-card pickup-card" data-active="${enabled}">
      <div class="pickup-card-main">
        <span class="pickup-state ${enabled?'active':'inactive'}" aria-label="Pickup location status: ${enabled?'Active':'Inactive'}">${enabled?'ACTIVE':'INACTIVE'}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc([p.address?.line1,p.address?.city,p.address?.pincode].filter(Boolean).join(', '))}</p>
      </div>
      <div class="pickup-actions"><button class="pill pickup-edit" type="button" onclick="pickupForm('${esc(p._id)}')">Edit</button><button class="pill danger" type="button" onclick="deletePickup('${esc(p._id)}','${esc(p.name)}')">Delete</button></div>
    </article>`;
  }).join('')||'<p class="admin-empty">No pickup locations.</p>';
}
renderPickups=finalRenderPickups;

function finalRenderCoupons(){
  const list=document.querySelector('#couponList');
  if(!list)return;
  list.innerHTML=coupons.map(c=>{
    const enabled=c.active!==false&&couponWindow(c);
    return `<article class="admin-list-card coupon-card ${enabled?'':'coupon-inactive'}" data-active="${enabled}">
      <div class="coupon-card-main"><h3>${esc(c.code)}</h3><div class="admin-meta">
        <span>${c.type==='percent'?c.value+'%':'₹'+c.value}</span><span>Min ₹${c.minOrder}</span><span>Used ${c.usageCount||0}/${c.usageLimit??'∞'}</span>
        <span class="${enabled?'state-on':'state-off'}">${enabled?'Active':'Inactive'}</span>
      </div></div>
      <div class="coupon-actions"><button class="pill" type="button" onclick="couponForm('${esc(c.code)}')">Edit</button><button class="pill danger" type="button" onclick="deleteCoupon('${esc(c.code)}')">Delete</button></div>
    </article>`;
  }).join('')||'<p class="admin-empty">No coupons.</p>';
}
renderCoupons=finalRenderCoupons;

const finalRenderOrdersBase=renderOrders;
renderOrders=function(){
  finalRenderOrdersBase();
  document.querySelectorAll('#ordersBody tr').forEach(row=>{
    const labels=['Order','Customer','Total','Status','Payment','Invoice','Action'];
    [...row.children].forEach((cell,i)=>cell.dataset.label=labels[i]||'');
  });
};

const adminLoaded=new Set();
const adminLoading=new Map();
let adminBackgroundStarted=false;
function adminTabButton(tab){return document.querySelector(`[data-tab="${tab}"]`)}
function markAdminLoaded(tab){adminLoaded.add(tab);adminTabButton(tab)?.classList.add('tab-ready')}
async function ensureAdminTab(tab,{foreground=true}={}){
  if(adminLoaded.has(tab))return;
  if(adminLoading.has(tab)){
    if(!foreground)return adminLoading.get(tab);
    setAreaLoading('#'+tab,true,'Loading '+tab);
    try{return await adminLoading.get(tab)}finally{setAreaLoading('#'+tab,false)}
  }
  if(foreground)setAreaLoading('#'+tab,true,'Loading '+tab);
  const task=(async()=>{
    if(tab==='orders'){
      const d=await api('/admin/getOrders?page=1&limit='+orderPager.limit);
      orders=Array.isArray(d.orders)?d.orders:[];orderPager={...orderPager,...(d.pagination||{})};renderOrders();
    }else if(tab==='products'){
      await loadProductPage(1);
    }else if(tab==='coupons'){
      coupons=await api('/admin/coupons');renderCoupons();
    }else if(tab==='pickup'){
      pickups=await api('/admin/pickup-locations');renderPickups();
    }else if(tab==='settings'){
      settings=await api('/admin/settings');renderSettings();
    }else if(tab==='inventory'){
      {const [rows,summary]=await Promise.all([api('/admin/inventory-logs'),api('/admin/analytics?includeEvents=false')]);logs=rows;renderLogs();analytics={...analytics,...summary};applyOverviewSummary(summary);}
    }else if(tab==='leads'){
      analytics=await api('/admin/analytics?includeEvents=true');
      applyOverviewSummary(analytics);
      renderEvents();
    }
    markAdminLoaded(tab);
  })().finally(()=>{adminLoading.delete(tab);if(foreground)setAreaLoading('#'+tab,false)});
  adminLoading.set(tab,task);return task;
}
function activateAdminTab(button){
  document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('primary'));
  document.getElementById(button.dataset.tab).classList.add('on');button.classList.add('primary');
  ensureAdminTab(button.dataset.tab,{foreground:true}).catch(e=>show(`<h2>Unable to load</h2><p>${esc(e.message)}</p>`));
  loadOverviewSummary({force:true}).catch(()=>{});
}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>activateAdminTab(button));
async function loadAdminBackground(){
  if(adminBackgroundStarted)return;adminBackgroundStarted=true;
  const queue=['products','coupons','pickup','settings','inventory','leads'];
  for(const tab of queue){
    if(!adminLoaded.has(tab)&&!adminLoading.has(tab)){
      try{await ensureAdminTab(tab,{foreground:false})}catch(error){console.error('Background admin load failed',tab,error)}
    }
    await new Promise(resolve=>setTimeout(resolve,60));
  }
}
load=async function(){
  document.body.classList.add('admin-initial-loading');
  renderDashboardStats();
  try{
    const overviewTask=loadOverviewSummary();
    await ensureAdminTab('orders',{foreground:true});
    await overviewTask;
    document.body.classList.remove('admin-initial-loading');
    setTimeout(loadAdminBackground,0);
  }finally{document.body.classList.remove('admin-initial-loading')}
};
/* Final admin interaction fixes */
function adminToast(message,type='success'){document.querySelector('.admin-toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="admin-toast ${type}" role="status"><b>${type==='success'?'✓':'!'}</b><span>${esc(message)}</span></div>`);const t=document.querySelector('.admin-toast');requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t?.classList.remove('show');setTimeout(()=>t?.remove(),220)},2600)}
async function toggleEntity(kind,id,next,button){const old=!next;button.disabled=true;button.classList.toggle('is-active',next);button.classList.toggle('is-inactive',!next);button.textContent=next?'Active':'Inactive';try{const d=await api(`/admin/${kind}/${encodeURIComponent(id)}/active`,json('PATCH',{active:next}));if(kind==='products'){const x=products.find(v=>v.id===id);if(x)x.active=d.active}else if(kind==='coupons'){const x=coupons.find(v=>v.code===id);if(x)x.active=d.active}else{const x=pickups.find(v=>String(v._id)===String(id));if(x)x.active=d.active}adminToast(d.message)}catch(e){button.classList.toggle('is-active',old);button.classList.toggle('is-inactive',!old);button.textContent=old?'Active':'Inactive';adminToast(e.message,'error')}finally{button.disabled=false}}
function bindStateButtons(){document.querySelectorAll('[data-state-kind]').forEach(b=>{b.onclick=()=>toggleEntity(b.dataset.stateKind,b.dataset.stateId,b.textContent.trim()!=='Active',b)})}
const stateProductRender=renderProductsBase;renderProductsBase=function(){stateProductRender();document.querySelectorAll('#productList .admin-product-state').forEach((b,i)=>{const x=products[i];if(!x)return;b.outerHTML=`<button type="button" class="admin-product-state state-toggle ${x.active?'is-active':'is-inactive'}" data-state-kind="products" data-state-id="${esc(x.id)}">${x.active?'Active':'Inactive'}</button>`});bindStateButtons()};
const stateCouponRender=finalRenderCoupons;finalRenderCoupons=function(){stateCouponRender();document.querySelectorAll('#couponList .state-on,#couponList .state-off').forEach((b,i)=>{const x=coupons[i];if(!x)return;b.outerHTML=`<button type="button" class="state-toggle ${x.active?'is-active':'is-inactive'}" data-state-kind="coupons" data-state-id="${esc(x.code)}">${x.active?'Active':'Inactive'}</button>`});bindStateButtons()};renderCoupons=finalRenderCoupons;
const statePickupRender=finalRenderPickups;finalRenderPickups=function(){statePickupRender();document.querySelectorAll('#pickupList .pickup-state').forEach((b,i)=>{const x=pickups[i];if(!x)return;b.outerHTML=`<button type="button" class="pickup-state state-toggle ${x.active?'active is-active':'inactive is-inactive'}" data-state-kind="pickup-locations" data-state-id="${esc(x._id)}">${x.active?'Active':'Inactive'}</button>`});bindStateButtons()};renderPickups=finalRenderPickups;
const couponFormOriginal=couponForm;couponForm=function(code){couponFormOriginal(code);const form=$('#cf'),submit=form.onsubmit;form.onsubmit=async e=>{try{await submit(e);adminToast(code?'Coupon updated successfully':'Coupon created successfully')}catch(err){adminToast(err.message,'error')}}};
let activityType='',activityQuery='';const activityRenderBase=renderEvents;renderEvents=function(){const all=analytics.events||[],q=activityQuery.toLowerCase();analytics.events=all.filter(e=>(!activityType||e.type===activityType)&&(!q||[e.type,e.name,e.mobile,e.productId,e.legacyProductId,e.orderId].join(' ').toLowerCase().includes(q)));activityRenderBase();analytics.events=all};
$('#activityTypeFilter').onchange=e=>{activityType=e.target.value;renderEvents()};$('#activitySearch').oninput=debounce(e=>{activityQuery=e.target.value;renderEvents()},220);
function applyInactiveVisibility(){[['productInactiveFilter','#productList'],['couponInactiveFilter','#couponList'],['pickupInactiveFilter','#pickupList']].forEach(([id,root])=>{const showInactive=Boolean($('#'+id)?.checked);document.querySelectorAll(root+' article').forEach(card=>{const inactive=card.dataset.active==='false'||card.querySelector('.is-inactive,.state-off,.inactive');card.hidden=!showInactive&&Boolean(inactive);card.style.display=card.hidden?'none':''})})}['productInactiveFilter','couponInactiveFilter','pickupInactiveFilter'].forEach(id=>{$('#'+id).onchange=applyInactiveVisibility});const bindStateButtonsBase=bindStateButtons;bindStateButtons=function(){bindStateButtonsBase();applyInactiveVisibility()};
$('#deleteSelectedEvents').onclick=async()=>{const ids=[...document.querySelectorAll('.event-select:checked')].map(x=>x.value);if(!ids.length||!confirm(`Delete ${ids.length} records?`))return;try{const d=await api('/admin/events/bulk-delete',json('POST',{ids}));analytics.events=(analytics.events||[]).filter(e=>!ids.includes(String(e.id)));renderEvents();$('#selectAllEvents').checked=false;adminToast(`${d.deleted||ids.length} activity records deleted`)}catch(e){adminToast(e.message,'error')}};

function activityLabel(type){return type==='checkout_abandoned'?'Checkout abandoned':type==='payment_failed'?'Payment failed':type}
window.activityDetails=function(id){const e=(analytics.events||[]).find(x=>String(x.id)===String(id));if(!e)return;const ids=[...(e.metadata?.productIds||[]),e.legacyProductId,e.productId].filter(Boolean);const names=(e.metadata?.productNames||[]).filter(Boolean);show(`<h2>Activity details</h2><div class="detail-grid"><section>${kv('Type',activityLabel(e.type))}${kv('Time',new Date(e.at).toLocaleString())}${kv('Name',e.name||'Not available')}${kv('Mobile',e.mobile||'Not available')}</section><section>${kv('Order',e.orderId||'Not available')}${kv('Reason',e.reason||'Not available')}${kv('Products',names.length?names.join(', '):(ids.join(', ')||'Not available'))}</section></div>`)};
renderEvents=function(){const all=(analytics.events||[]).filter(e=>['checkout_abandoned','payment_failed'].includes(e.type)),q=activityQuery.toLowerCase(),view=all.filter(e=>(!activityType||e.type===activityType)&&(!q||[e.type,e.name,e.mobile,e.productId,e.legacyProductId,e.orderId,...(e.metadata?.productNames||[]),...(e.metadata?.productIds||[])].join(' ').toLowerCase().includes(q)));$('#eventsBody').innerHTML=view.map(e=>`<tr><td data-label="Select"><input class="event-select" type="checkbox" value="${esc(e.id)}"></td><td data-label="Time">${new Date(e.at).toLocaleString()}</td><td data-label="Type"><span class="activity-type ${e.type}">${esc(activityLabel(e.type))}</span></td><td data-label="Customer"><b>${esc(e.name||'Anonymous')}</b><small>${esc(e.mobile||'')}</small></td><td data-label="Mobile">${esc(e.mobile||'')}</td><td data-label="Product / Order">${esc((e.metadata?.productNames||[]).slice(0,2).join(', ')||e.productId||e.legacyProductId||e.orderId||'')}</td><td data-label="Reason">${esc(e.reason||'')}</td><td data-label="Action"><div class="row-actions activity-actions"><button class="table-action" onclick="activityDetails('${esc(e.id)}')">Details</button><button class="table-delete" onclick="deleteEvent('${esc(e.id)}')">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="8" class="admin-empty">No checkout abandonment or payment failure activity.</td></tr>';document.querySelectorAll('.event-select').forEach(x=>x.onchange=()=>$('#deleteSelectedEvents').disabled=!document.querySelector('.event-select:checked'))};
function activateStatsFilter(kind){const ordersButton=adminTabButton('orders'),productsButton=adminTabButton('products');if(kind==='products'){activateAdminTab(productsButton);return}const direct=['coupons','pickup','settings','inventory','leads'];if(direct.includes(kind)){activateAdminTab(adminTabButton(kind));return}activateAdminTab(ordersButton);const value=kind==='pending'?'Pending':kind==='delivered'?'Delivered':'';const filter=$('#statusFilter');if(value==='Pending'&&!filter.querySelector('option[value="Pending"]'))filter.insertAdjacentHTML('beforeend','<option value="Pending">Pending orders</option>');filter.value=value;setOrdersContext(value);loadOrdersSmart(1)}
function setOrdersContext(status=''){const title=$('#ordersSectionTitle'),desc=$('#ordersSectionDescription');if(!title||!desc)return;if(status==='Pending'){title.textContent='Pending orders';desc.textContent='Orders not yet Delivered, Rejected or Returned.'}else if(status==='Delivered'){title.textContent='Delivered orders';desc.textContent='Completed orders filtered by Delivered status.'}else{title.textContent='Orders';desc.textContent='Edit orders, confirm fulfilment and download invoices.'}}
function renderDashboardStats(){const root=$('#stats');if(!root)return;const value=(key,format=v=>v)=>overviewReady.has(key)?format(overviewValues[key]):null;const cards=[['orders','Orders',value('orders'),'All orders'],['revenue','Revenue',value('revenue',v=>'₹'+Number(v||0).toLocaleString('en-IN')),'All recorded order value'],['pending','Pending',value('pending'),'Open fulfilment queue'],['delivered','Delivered',value('delivered'),'Completed orders'],['products','Products',value('products'),'Manage catalogue'],['coupons','Coupons',value('coupons'),'Manage offers'],['pickup','Pickup',value('pickup'),'Manage locations'],['settings','Settings','Manage','Store controls'],['inventory','Inventory',value('inventory'),'Stock activity'],['leads','Activity',value('leads'),'Customer events']];root.innerHTML=cards.map(([kind,label,v,hint])=>`<button type="button" class="stat overview-stat ${v===null?'stat-loading':''}" data-stat-kind="${kind}"><span class="stat-icon">${kind==='orders'?'▤':kind==='revenue'?'₹':kind==='pending'?'◷':kind==='delivered'?'✓':'□'}</span><span class="stat-copy"><small>${label}</small>${v===null?'<span class="stat-card-loader" aria-label="Loading '+label+'"></span>':`<b>${v}</b>`}<em>${v===null?'Loading data...':hint}</em></span><span class="stat-arrow">›</span></button>`).join('');bindStatsCards()}
const overviewReady=new Set(['settings']);
const overviewValues={};
let overviewSummaryPromise=null;
async function loadOverviewSummary({force=false}={}){
  if(overviewSummaryPromise)return overviewSummaryPromise;
  overviewSummaryPromise=(async()=>{
    const summary=await api('/admin/analytics?includeEvents=false');
    analytics={...analytics,...summary};
    applyOverviewSummary(summary);
    return summary;
  })().catch(error=>{
    console.error('Overview summary failed',error);
    throw error;
  }).finally(()=>{overviewSummaryPromise=null});
  return overviewSummaryPromise;
}
function applyOverviewSummary(d){Object.assign(overviewValues,{orders:d.orders||0,revenue:d.revenue||0,pending:d.pending||0,delivered:d.delivered||0,products:d.products||0,coupons:d.coupons||0,pickup:d.pickups||0,inventory:d.inventory||0,leads:d.activity||0});['orders','revenue','pending','delivered','products','coupons','pickup','inventory','leads'].forEach(x=>overviewReady.add(x));renderDashboardStats()}
function refreshOverviewCard(kind,value){overviewValues[kind]=Number(value)||0;overviewReady.add(kind);renderDashboardStats()}

function bindStatsCards(){const kinds=['orders','revenue','pending','delivered','products','coupons','pickup','settings','inventory','leads'];document.querySelectorAll('#stats .stat').forEach((card,i)=>{const kind=card.dataset.statKind||kinds[i];card.tabIndex=0;card.setAttribute('role','button');card.onclick=()=>activateStatsFilter(kind);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click()}}})}
const renderStatsBase=render;render=function(){renderStatsBase();bindStatsCards()};
function initOverviewToggle(){const box=$('#adminOverview'),button=$('#overviewToggle');if(!box||!button)return;const apply=collapsed=>{box.classList.toggle('is-collapsed',collapsed);button.setAttribute('aria-expanded',String(!collapsed));button.querySelector('span').textContent=collapsed?'Show overview':'Hide overview';button.querySelector('b').textContent =
    collapsed
       ? '⊞'
       : '⊟';
	sessionStorage.setItem('adminOverviewCollapsed',String(collapsed))};button.onclick=()=>apply(!box.classList.contains('is-collapsed'));apply(sessionStorage.getItem('adminOverviewCollapsed')!=='false')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initOverviewToggle);else initOverviewToggle();
/* Ensure these final renderers are used after all original declarations. */
load().catch(e=>show(`<h2>Admin error</h2><p>${esc(e.message)}</p>`));

/* FINAL WORKING SETTINGS DATA ACTIONS */
function workingAdminDataTools(){const f=$('#settingsForm');if(!f||f.querySelector('#workingDataTools'))return;f.insertAdjacentHTML('beforeend',`<section class="settings-card" id="workingDataTools"><div class="settings-card-head"><span>Database tools</span><small>Download every database field and safely ADD, UPDATE, DELETE or SKIP each Excel row.</small></div><div class="data-tool-grid"><button class="pill" type="button" id="workingBackup">Download Excel backup</button><button class="pill primary" type="button" id="workingImport">Bulk upload Excel</button><input id="workingExcelFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden><button class="pill danger" type="button" id="workingReset">Reset entire website</button></div><p id="workingDataStatus" class="muted"></p></section>`);
 const busy=(button,on,text)=>{button.disabled=on;button.classList.toggle('smart-action-loading',on);if(text)$('#workingDataStatus').textContent=text};
 $('#workingBackup').onclick=async()=>{const b=$('#workingBackup');busy(b,true,'Preparing Excel backup...');try{const r=await fetch('/admin/data/backup.xlsx');if(!r.ok)throw Error((await r.json()).message||'Backup failed');const blob=await r.blob(),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='autoclickermouse-backup.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);adminToast('Excel backup downloaded')}catch(e){adminToast(e.message,'error')}finally{busy(b,false,'')}};
 $('#workingImport').onclick=()=>$('#workingExcelFile').click();
 $('#workingExcelFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;const b=$('#workingImport'),fd=new FormData();fd.append('backup',file);busy(b,true,`Uploading ${file.name}...`);try{const d=await api('/admin/data/import',{method:'POST',body:fd});const x=d.result;$('#workingDataStatus').textContent=`Completed: ${x.added} added, ${x.updated} updated, ${x.deleted} deleted, ${x.skipped} skipped. ${x.imagesDeleted||0} image object(s) deleted, ${x.imageCleanupFailed||0} image cleanup failure(s). ${x.errors.length} row error(s).`;adminToast('Excel database upload completed');adminLoaded.clear();await load()}catch(err){adminToast(err.message,'error');$('#workingDataStatus').textContent=err.message}finally{busy(b,false);e.target.value=''}};
 $('#workingReset').onclick=()=>{show(`<form id="workingResetForm"><h2>Reset entire website</h2><p class="reset-warning"><b>Permanent deletion:</b> Products, orders, coupons, customers, payments, inventory, activities, pickups, reviews, invoices, settings and wishlists will be deleted. This cannot be undone.</p>${field('workingResetPassword','Enter admin password','','false','password',true)}<label class="reset-confirm"><input id="workingResetCheck" type="checkbox" required> I understand that all website data will be permanently deleted.</label><p id="workingResetError" class="coupon-error" hidden></p><button id="workingResetSubmit" class="pill danger" type="submit">Delete everything</button></form>`);const form=$('#workingResetForm');form.onsubmit=async e=>{e.preventDefault();const button=$('#workingResetSubmit'),error=$('#workingResetError');error.hidden=true;button.disabled=true;button.textContent='Deleting...';try{await api('/admin/data/reset',json('POST',{password:$('#workingResetPassword').value}));close();adminToast('Website data permanently reset');adminLoaded.clear();orders=[];products=[];coupons=[];pickups=[];logs=[];analytics={events:[]};await load()}catch(x){error.hidden=false;error.textContent=x.message;button.disabled=false;button.textContent='Delete everything'}}};
}
const workingSettingsBase=renderSettings;renderSettings=function(){workingSettingsBase();workingAdminDataTools()};setTimeout(workingAdminDataTools,0);
/* Supabase product image workflow */
function validClientImage(file){return file&&['image/jpeg','image/png','image/webp'].includes(file.type)&&file.size>0&&file.size<=5*1024*1024}
function imagePreviewMarkup(file,label,index,group){const url=URL.createObjectURL(file);return `<div class="media-preview" data-group="${group}" data-index="${index}"><b>${esc(label)}</b><button type="button" class="media-preview-open" data-preview="${url}"><img src="${url}" alt="${esc(file.name)}"></button><small>${esc(file.name)}</small><button type="button" class="table-delete media-remove">Remove</button></div>`}
function openImageLightbox(urls,index=0,alts=[]){let at=index;document.querySelector('#imageLightbox')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="image-lightbox open" id="imageLightbox" role="dialog" aria-modal="true"><button class="lightbox-close" aria-label="Close">×</button><button class="lightbox-nav lightbox-prev" aria-label="Previous">‹</button><img alt=""><button class="lightbox-nav lightbox-next" aria-label="Next">›</button><b class="lightbox-counter"></b></div>`);const box=$('#imageLightbox'),paint=()=>{box.querySelector('img').src=urls[at];box.querySelector('img').alt=alts[at]||'Product image';box.querySelector('.lightbox-counter').textContent=`${at+1} / ${urls.length}`},closeBox=()=>{box.remove();document.removeEventListener('keydown',keys)},keys=e=>{if(e.key==='Escape')closeBox();if(e.key==='ArrowLeft'){at=(at-1+urls.length)%urls.length;paint()}if(e.key==='ArrowRight'){at=(at+1)%urls.length;paint()}};box.querySelector('.lightbox-close').onclick=closeBox;box.querySelector('.lightbox-prev').onclick=()=>{at=(at-1+urls.length)%urls.length;paint()};box.querySelector('.lightbox-next').onclick=()=>{at=(at+1)%urls.length;paint()};box.onclick=e=>{if(e.target===box)closeBox()};document.addEventListener('keydown',keys);paint()}
window.openImageLightbox=openImageLightbox;
window.productForm=mongoId=>{const p=products.find(x=>String(x._id)===String(mongoId))||{},editing=Boolean(p._id),checks=[['active','Active'],['featured','Featured'],['buyNowEnabled','Buy Now'],['addToCartEnabled','Add to Cart'],['homeDeliveryAvailable','Home Delivery'],['selfPickupAvailable','Self Pickup'],['codAvailable','COD'],['freeShipping','Free Shipping']];show(`<form id="pf"><h2>${editing?'Edit':'Create'} Product</h2><div id="productFormMessage" class="notice" hidden></div><div class="form-grid">${[['id','Product ID'],['sku','SKU'],['productCode','Product code'],['slug','Slug'],['name','Name'],['category','Category'],['subCategory','Subcategory'],['price','Price'],['stock','Initial stock'],['oldPrice','Old price'],['minOrderQty','Minimum quantity'],['maxOrderQty','Maximum quantity'],['badge','Badge'],['taxRate','Tax rate'],['hsnCode','HSN code'],['weight','Weight']].map(([k,l])=>field('p_'+k,l,p[k]??(k==='id'?p.id||'':k==='stock'?0:''),false,['price','stock','oldPrice','minOrderQty','maxOrderQty','taxRate','weight'].includes(k)?'number':'text',!editing&&['name','price'].includes(k))).join('')}</div>${field('p_shortDescription','Short description',p.shortDescription||'',true)}${field('p_description','Description',p.description||'',true)}${field('p_tags','Tags, comma separated',(p.tags||[]).join(','))}${field('p_features','Features, one per line',(p.features||[]).join('\n'),true)}${field('p_specs','Specifications JSON',JSON.stringify(p.specs||{},null,2),true)}<section class="product-media-fields"><h3>Product images</h3>${editing?`<div class="edit-existing-images"><h4>Existing product images (${[p.primaryImage?.url||p.image,...(p.galleryDetailed||[]).map(x=>x.url)].filter(Boolean).length} / 4)</h4><div class="media-preview-grid">${[p.primaryImage?.url||p.image,...(p.galleryDetailed||[]).map(x=>x.url)].filter(Boolean).map((url,i)=>`<article class="media-preview"><b>${i===0?'Primary':`Gallery ${i}`}</b><button type="button" class="media-preview-open" data-preview="${esc(url)}"><img src="${esc(url)}" alt="${esc(p.name||'Product image')}" onerror="this.onerror=null;this.src='/images/product.svg'"></button>${i===0?'<small>Use replacement control below</small>':'<small>Delete from Product Images manager</small>'}</article>`).join('')}</div></div>`:''}${editing&&p.image?`<div class="existing-media"><b>Current primary</b><button type="button" class="media-preview-open" data-preview="${esc(p.image)}"><img src="${esc(p.image)}" alt="${esc(p.name)}"></button></div>`:''}<div class="field"><label>${editing?'Replace primary image':'Primary image *'}</label><input id="p_primaryImage" type="file" accept="image/jpeg,image/png,image/webp" ${editing?'':'required'}></div><div class="field"><label>Add gallery images (maximum 3, total maximum 4)</label><input id="p_galleryImages" type="file" multiple accept="image/jpeg,image/png,image/webp"></div>${field('p_imageAlt','Image alt text',p.name||'')}<div id="selectedMediaPreviews" class="media-preview-grid"></div></section><div class="check-grid">${checks.map(([k,l])=>`<label><input id="p_${k}" type="checkbox" ${p[k]!==false&&(p[k]===true||['active','buyNowEnabled','addToCartEnabled','homeDeliveryAvailable'].includes(k))?'checked':''}> ${l}</label>`).join('')}</div><button id="saveProduct" class="pill primary">Save Product</button></form>`);if(editing)$('#p_id').disabled=true;let primaryFile=null,galleryFiles=[];const draw=()=>{$('#selectedMediaPreviews').innerHTML=(primaryFile?[imagePreviewMarkup(primaryFile,'Primary',0,'primary')]:[]).concat(galleryFiles.map((f,i)=>imagePreviewMarkup(f,`Gallery ${i+1}`,i,'gallery'))).join('');document.querySelectorAll('.media-preview-open').forEach(b=>b.onclick=()=>openImageLightbox([b.dataset.preview],0));document.querySelectorAll('.media-remove').forEach(b=>b.onclick=()=>{const root=b.closest('.media-preview');if(root.dataset.group==='primary'){primaryFile=null;$('#p_primaryImage').value=''}else{galleryFiles.splice(+root.dataset.index,1);$('#p_galleryImages').value=''}draw()})};$('#p_primaryImage').onchange=e=>{const f=e.target.files[0];if(f&&!validClientImage(f)){e.target.value='';return adminToast('Primary image must be JPEG, PNG or WebP and 5 MB or smaller','error')}primaryFile=f||null;draw()};$('#p_galleryImages').onchange=e=>{const incoming=[...e.target.files],previous=[...galleryFiles],existingGallery=(p.galleryDetailed||[]).length,slots=Math.max(0,3-existingGallery);if(incoming.some(f=>!validClientImage(f))){const dt=new DataTransfer();previous.forEach(f=>dt.items.add(f));e.target.files=dt.files;return adminToast('Every gallery image must be JPEG, PNG or WebP and 5 MB or smaller','error')}const map=new Map(previous.map(f=>[`${f.name}:${f.size}:${f.lastModified}:${f.type}`,f]));incoming.forEach(f=>map.set(`${f.name}:${f.size}:${f.lastModified}:${f.type}`,f));const merged=[...map.values()];if(merged.length>slots){const dt=new DataTransfer();previous.forEach(f=>dt.items.add(f));e.target.files=dt.files;draw();return adminToast(`You can upload maximum ${slots} new gallery image(s). Existing images are preserved. Total maximum is 4 images.`,`error`)}galleryFiles=merged;const dt=new DataTransfer();galleryFiles.forEach(f=>dt.items.add(f));e.target.files=dt.files;draw()};document.querySelectorAll('.existing-media .media-preview-open').forEach(b=>b.onclick=()=>openImageLightbox([b.dataset.preview],0));let locked=false;$('#pf').onsubmit=async e=>{e.preventDefault();if(locked)return;const button=$('#saveProduct'),message=$('#productFormMessage');try{if(!editing&&!primaryFile)throw Error('Primary product image is required');locked=true;button.disabled=true;button.textContent='Saving...';const fd=new FormData();for(const k of ['id','sku','productCode','slug','name','category','subCategory','price','stock','oldPrice','minOrderQty','maxOrderQty','badge','taxRate','hsnCode','weight','shortDescription','description','imageAlt'])fd.append(k,$('#p_'+k)?.value||'');checks.forEach(([k])=>fd.append(k,String($('#p_'+k).checked)));fd.append('tags',JSON.stringify($('#p_tags').value.split(',').map(x=>x.trim()).filter(Boolean)));fd.append('features',JSON.stringify($('#p_features').value.split('\n').map(x=>x.trim()).filter(Boolean)));fd.append('specs',JSON.stringify(JSON.parse($('#p_specs').value||'{}')));if(primaryFile)fd.append('primaryImage',primaryFile);galleryFiles.forEach(f=>fd.append('galleryImages',f));const d=await api(editing?'/admin/products/'+encodeURIComponent(p._id):'/admin/products',{method:editing?'PATCH':'POST',body:fd});swrInvalidate?.('public-products','local');if(editing)swrInvalidate?.('product:'+p.slug,'local');await loadProductPage(editing?productPager.page:1);close();adminToast(d.message)}catch(x){message.hidden=false;message.textContent=x.message;button.disabled=false;button.textContent='Save Product';locked=false}}};
window.mediaForm=id=>{const p=products.find(x=>x.id===id),images=[p.primaryImage,...(p.galleryDetailed||[])].filter(x=>x?.url),urls=images.map(x=>x.url),alts=images.map(x=>x.alt||p.name);show(`<h2>Product Images</h2><div class="media-preview-grid">${images.map((x,i)=>`<div class="media-preview"><b>${i===0?'Primary':`Gallery ${i}`}</b><button type="button" class="media-preview-open" data-index="${i}"><img src="${esc(x.url)}" alt="${esc(x.alt||p.name)}" onerror="this.onerror=null;this.src='/images/product.svg'"></button>${i?`<input value="${esc(x.alt||'')}" onchange="updateAlt('${id}','${x._id}',this.value)"><button class="table-delete" onclick="removeGallery('${id}','${x._id}')">Remove</button>`:''}</div>`).join('')}</div><form id="primaryUpload"><label>Replace primary image</label><input id="primaryFile" type="file" accept="image/jpeg,image/png,image/webp" required><button class="pill primary">Upload</button></form><form id="galleryUpload"><label>Add gallery images</label><input id="galleryFiles" type="file" multiple accept="image/jpeg,image/png,image/webp" required>${field('galleryAlt','Alt text',p.name)}<button class="pill primary">Upload Gallery</button></form>`);document.querySelectorAll('.media-preview-open').forEach(b=>b.onclick=()=>openImageLightbox(urls,+b.dataset.index,alts));const submit=async(form,route,fd)=>{const b=form.querySelector('button');b.disabled=true;try{await api(route,{method:'POST',body:fd});swrInvalidate?.('public-products','local');swrInvalidate?.('product:'+p.slug,'local');close();await loadProductPage(productPager.page);adminToast('Product images updated')}catch(e){adminToast(e.message,'error');b.disabled=false}};$('#primaryUpload').onsubmit=e=>{e.preventDefault();const f=$('#primaryFile').files[0];if(!validClientImage(f))return adminToast('Invalid image','error');const fd=new FormData();fd.append('image',f);fd.append('alt',p.name);submit(e.currentTarget,`/admin/products/${id}/image`,fd)};$('#galleryUpload').onsubmit=e=>{e.preventDefault();const fs=[...$('#galleryFiles').files];if(fs.some(f=>!validClientImage(f))||images.length+fs.length>4)return adminToast('Maximum 4 valid images, each up to 5 MB','error');const fd=new FormData();fs.forEach(f=>fd.append('images',f));fd.append('alt',$('#galleryAlt').value);submit(e.currentTarget,`/admin/products/${id}/gallery`,fd)}};
/* FINAL IMAGE QUEUE AND INDEPENDENT IMAGE MANAGER FIX */
const acmGalleryQueues=new WeakMap();
function acmFileKey(file){return `${file.name}:${file.size}:${file.lastModified}:${file.type}`}
function acmSetImageSelection(input,files){const transfer=new DataTransfer();files.forEach(file=>transfer.items.add(file));input.files=transfer.files;acmGalleryQueues.set(input,files)}
// Gallery queues are handled locally by each form so rejected selections never clear accepted files.

window.mediaForm=id=>{const p=products.find(x=>x.id===id);if(!p)return adminToast('Product not found','error');const primary=p.primaryImage?.url?p.primaryImage:null,gallery=p.galleryDetailed||[],images=[primary,...gallery].filter(Boolean),urls=images.map(x=>x.url),alts=images.map(x=>x.alt||p.name),remaining=Math.max(0,3-gallery.length);show(`<div class="image-manager"><div class="image-manager-head"><div><small>PRODUCT MEDIA</small><h2>${esc(p.name)}</h2><p>1 primary + maximum 3 gallery images. Total maximum 4.</p></div><span class="image-count">${images.length} / 4 images</span></div><section class="image-manager-section"><h3>Current images</h3><div class="media-preview-grid">${images.map((x,i)=>`<article class="media-preview image-manager-card"><span class="image-type ${i===0?'primary-type':'gallery-type'}">${i===0?'Primary':`Gallery ${i}`}</span><button type="button" class="media-preview-open" data-index="${i}"><img src="${esc(x.url)}" alt="${esc(x.alt||p.name)}" onerror="this.onerror=null;this.src='/images/product.svg'"></button>${i===0?'<small>Replace using the form below</small>':`<input class="image-alt-input" value="${esc(x.alt||'')}" aria-label="Gallery image alt text"><div class="image-card-actions"><button type="button" class="pill save-image-alt" data-image="${x._id}">Save alt</button><button type="button" class="table-delete remove-existing-gallery" data-image="${x._id}">Delete</button></div>`}</article>`).join('')}</div></section><div class="image-manager-forms"><form id="primaryUpload" class="image-upload-card"><h3>Replace primary</h3><p>Gallery images remain unchanged.</p><input id="primaryFile" type="file" accept="image/jpeg,image/png,image/webp" required><div id="managerPrimaryPreview" class="media-preview-grid compact"></div><div id="managerPrimaryStatus" class="compression-status"></div><button class="pill primary">Replace primary</button></form><form id="galleryUpload" class="image-upload-card"><h3>Add gallery images</h3><p>You can add ${remaining} more image(s). Select together or one by one.</p><input id="galleryFiles" data-product-id="${esc(id)}" data-existing-gallery="${gallery.length}" type="file" multiple accept="image/jpeg,image/png,image/webp" ${remaining?'required':'disabled'}>${field('galleryAlt','Alt text',p.name)}<div id="managerQueuedPreviews" class="media-preview-grid compact"></div><div id="managerGalleryStatus" class="compression-status"></div><button class="pill primary" ${remaining?'':'disabled'}>Upload gallery</button></form></div></div>`);
 document.querySelectorAll('.media-preview-open').forEach(button=>button.onclick=()=>openImageLightbox(urls,Number(button.dataset.index),alts));
 const primaryInput=$('#primaryFile'),primaryPreview=$('#managerPrimaryPreview'),primaryStatus=$('#managerPrimaryStatus'),galleryInput=$('#galleryFiles'),preview=$('#managerQueuedPreviews'),galleryStatus=$('#managerGalleryStatus');let compressedPrimary=null;
 const drawPrimary=()=>{primaryPreview.innerHTML=compressedPrimary?imagePreviewMarkup(compressedPrimary,'Primary',0,'manager-primary').replace('</small>',`</small><small>${Math.ceil(compressedPrimary.size/1024)} KB</small>`):'';primaryPreview.querySelector('.media-preview-open')?.addEventListener('click',e=>openImageLightbox([e.currentTarget.dataset.preview],0,[compressedPrimary.name]));primaryPreview.querySelector('.media-remove')?.addEventListener('click',()=>{compressedPrimary=null;primaryInput.value='';primaryStatus.textContent='';drawPrimary()})};
 primaryInput.onchange=async()=>{const raw=primaryInput.files[0];compressedPrimary=null;primaryPreview.innerHTML='';primaryStatus.textContent='';if(!raw)return;if(!validClientImage(raw)){primaryInput.value='';return adminToast('Select a JPEG, PNG or WebP image up to 5 MB','error')}try{primaryStatus.textContent='Optimizing image...';compressedPrimary=await compressProductImage(raw);const transfer=new DataTransfer();transfer.items.add(compressedPrimary);primaryInput.files=transfer.files;drawPrimary();primaryStatus.textContent=`Ready to upload: ${Math.ceil(compressedPrimary.size/1024)} KB`}catch(e){primaryInput.value='';primaryStatus.textContent='';adminToast(e.message,'error')}};
 const drawQueued=()=>{const queued=acmGalleryQueues.get(galleryInput)||[];preview.innerHTML=queued.map((file,index)=>imagePreviewMarkup(file,`New gallery ${index+1}`,index,'manager-gallery').replace('</small>',`</small><small>${Math.ceil(file.size/1024)} KB</small>`)).join('');preview.querySelectorAll('.media-preview-open').forEach(button=>button.onclick=()=>openImageLightbox([button.dataset.preview],0));preview.querySelectorAll('.media-remove').forEach(button=>button.onclick=()=>{const files=[...(acmGalleryQueues.get(galleryInput)||[])];files.splice(Number(button.closest('.media-preview').dataset.index),1);acmSetImageSelection(galleryInput,files);galleryStatus.textContent=files.length?`${files.length} image(s) ready. Every image is 200 KB or smaller.`:'';drawQueued()})};
 galleryInput.onchange=async()=>{const incoming=[...galleryInput.files],previous=[...(acmGalleryQueues.get(galleryInput)||[])];if(!incoming.length){drawQueued();return}if(incoming.some(file=>!validClientImage(file))){acmSetImageSelection(galleryInput,previous);drawQueued();return adminToast('Every gallery image must be JPEG, PNG or WebP and 5 MB or smaller','error')}const rawMap=new Map(previous.map(file=>[acmFileKey(file),file]));incoming.forEach(file=>rawMap.set(acmFileKey(file),file));if(rawMap.size>remaining){acmSetImageSelection(galleryInput,previous);drawQueued();return adminToast(`You can select only ${remaining} more gallery image(s)`,'error')}try{galleryInput.disabled=true;galleryStatus.textContent='Optimizing images...';const compressed=[];for(const file of rawMap.values())compressed.push(previous.includes(file)?file:await compressProductImage(file));acmSetImageSelection(galleryInput,compressed);drawQueued();galleryStatus.textContent=`${compressed.length} image(s) ready. Every image is 200 KB or smaller.`}catch(e){acmSetImageSelection(galleryInput,previous);drawQueued();galleryStatus.textContent=previous.length?`${previous.length} image(s) ready. Every image is 200 KB or smaller.`:'';adminToast(e.message,'error')}finally{galleryInput.disabled=!remaining}};
 const submit=async(form,route,fd,success)=>{const b=form.querySelector('button[type="submit"],button.pill.primary');b.disabled=true;b.textContent='Uploading...';try{await api(route,{method:'POST',body:fd});swrInvalidate?.('public-products','local');swrInvalidate?.('product:'+p.slug,'local');await loadProductPage(productPager.page);adminToast(success);mediaForm(id)}catch(e){adminToast(e.message,'error');b.disabled=false;b.textContent=form.id==='primaryUpload'?'Replace primary':'Upload gallery'}};
 $('#primaryUpload').onsubmit=e=>{e.preventDefault();if(!compressedPrimary||compressedPrimary.size>PRODUCT_IMAGE_TARGET)return adminToast('Select an image that can be compressed to 200 KB or smaller','error');const fd=new FormData();fd.append('image',compressedPrimary);fd.append('alt',p.name);submit(e.currentTarget,`/admin/products/${id}/image`,fd,'Primary image replaced')};
 $('#galleryUpload').onsubmit=e=>{e.preventDefault();const fs=[...(acmGalleryQueues.get(galleryInput)||[])];if(!fs.length)return adminToast('Select at least one gallery image','error');if(fs.some(file=>file.size>PRODUCT_IMAGE_TARGET)||1+gallery.length+fs.length>4)return adminToast('A product can have only 1 primary and maximum 3 gallery images, each 200 KB or smaller','error');const fd=new FormData();fs.forEach(file=>fd.append('images',file));fd.append('alt',$('#galleryAlt').value);submit(e.currentTarget,`/admin/products/${id}/gallery`,fd,'Gallery images uploaded')};
 document.querySelectorAll('.save-image-alt').forEach(button=>button.onclick=async()=>{const input=button.closest('.media-preview').querySelector('.image-alt-input');button.disabled=true;try{await api(`/admin/products/${id}/gallery/${button.dataset.image}`,json('PATCH',{alt:input.value}));adminToast('Alt text updated')}catch(e){adminToast(e.message,'error')}finally{button.disabled=false}});
 document.querySelectorAll('.remove-existing-gallery').forEach(button=>button.onclick=async()=>{if(!confirm('Delete this gallery image?'))return;button.disabled=true;try{await api(`/admin/products/${id}/gallery/${button.dataset.image}`,{method:'DELETE'});swrInvalidate?.('public-products','local');swrInvalidate?.('product:'+p.slug,'local');await loadProductPage(productPager.page);adminToast('Gallery image deleted');mediaForm(id)}catch(e){adminToast(e.message,'error');button.disabled=false}})
};
/* Final scoped overview synchronization and page-size preference */

$('#orderPageSize').value=String(orderPager.limit);
$('#orderPageSize').onchange=e=>{orderPager.limit=Number(e.target.value);localStorage.setItem(ORDER_PAGE_SIZE_KEY,String(orderPager.limit));loadOrdersSmart(1)};
const showRevenueProducts=()=>{const rows=analytics.revenueProducts||[];show(`<div class="modal-title-row"><div><small>PRODUCT EARNINGS</small><h2>Revenue by product</h2></div><b>₹${Number(analytics.revenue||0).toLocaleString('en-IN')}</b></div><div class="tablewrap"><table><thead><tr><th>Product</th><th>Units</th><th>Paid</th><th>Unpaid</th><th>Total</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name||x._id||'Unknown product')}</td><td>${Number(x.qty||0)}</td><td>₹${Number(x.paidRevenue||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td>₹${Number(x.unpaidRevenue||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td>₹${Number(x.revenue||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr>`).join('')||'<tr><td colspan="5" class="admin-empty">No product earnings.</td></tr>'}</tbody></table></div>`)};
const activateStatsFilterBase=activateStatsFilter;activateStatsFilter=kind=>kind==='revenue'?showRevenueProducts():activateStatsFilterBase(kind);
/* Scoped simplified product editor: specifications + unified images */
const PRODUCT_IMAGE_TARGET=200*1024;
const specHints=['Color','Size','Material','Weight','Dimensions','Brand','Model','Compatibility','Warranty','Country of Origin'];
async function compressProductImage(file){
 if(file.size<=PRODUCT_IMAGE_TARGET)return file;
 const bitmap=await createImageBitmap(file);let scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
 for(let attempt=0;attempt<9;attempt++){
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.86,.76,.66,.56,.46,.36]){const blob=await new Promise(r=>canvas.toBlob(r,'image/webp',quality));if(blob&&blob.size<=PRODUCT_IMAGE_TARGET){bitmap.close?.();return new File([blob],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp',lastModified:Date.now()})}}
  scale*=.82;
 }
 bitmap.close?.();throw new Error(`${file.name} could not be compressed below 200 KB`);
}
function specRowsHtml(specs={}){const rows=Object.entries(specs);if(!rows.length)rows.push(['','']);return rows.slice(0,15).map(([k,v])=>`<div class="spec-row"><input class="spec-key" maxlength="60" placeholder="Specification (e.g. Color)" value="${esc(k)}"><input class="spec-value" maxlength="200" placeholder="Value" value="${esc(v)}"><button type="button" class="table-delete remove-spec">Remove</button></div>`).join('')}
function readSpecRows(){const out={};document.querySelectorAll('#specRows .spec-row').forEach(r=>{const k=r.querySelector('.spec-key').value.trim(),v=r.querySelector('.spec-value').value.trim();if(k&&v)out[k]=v});return out}
function bindSpecBuilder(){
 const root=$('#specRows'),add=(k='',v='')=>{if(root.children.length>=15)return adminToast('Maximum 15 specifications allowed','error');root.insertAdjacentHTML('beforeend',specRowsHtml({[k]:v}));bindRemovers()};
 const bindRemovers=()=>root.querySelectorAll('.remove-spec').forEach(b=>b.onclick=()=>{if(root.children.length===1){b.parentElement.querySelectorAll('input').forEach(i=>i.value='')}else b.parentElement.remove()});
 $('#addSpec').onclick=()=>add();document.querySelectorAll('.spec-suggestion').forEach(b=>b.onclick=()=>add(b.dataset.key,''));bindRemovers();
}
window.productForm=mongoId=>{
 const p=products.find(x=>String(x._id)===String(mongoId))||{},editing=Boolean(p._id),checks=[['active','Active'],['featured','Featured'],['buyNowEnabled','Buy Now'],['addToCartEnabled','Add to Cart'],['homeDeliveryAvailable','Home Delivery'],['selfPickupAvailable','Self Pickup'],['codAvailable','COD'],['freeShipping','Free Shipping']];
 const existing=[...(p.image?[{url:p.image,alt:p.primaryImage?.alt||p.name,primary:true}]:[]),...(p.galleryDetailed||[]).map(x=>({...x,primary:false}))];
 show(`<form id="pf" class="product-editor"><h2>${editing?'Edit':'Add'} Product</h2><div id="productFormMessage" class="notice" hidden></div>
 <section class="product-editor-section"><h3>Basic information</h3><div class="form-grid">${[['id','Product ID'],['sku','SKU'],['productCode','Product code'],['slug','Slug'],['name','Name'],['category','Category'],['subCategory','Subcategory'],['price','Price'],['stock','Initial stock'],['oldPrice','Old price'],['minOrderQty','Minimum quantity'],['maxOrderQty','Maximum quantity'],['badge','Badge'],['taxRate','Tax rate'],['hsnCode','HSN code'],['weight','Weight']].map(([k,l])=>field('p_'+k,l,p[k]??(k==='id'?p.id||'':k==='stock'?0:''),false,['price','stock','oldPrice','minOrderQty','maxOrderQty','taxRate','weight'].includes(k)?'number':'text',!editing&&['name','price'].includes(k))).join('')}</div></section>
 <section class="product-editor-section"><h3>Product details</h3>${field('p_shortDescription','Short description',p.shortDescription||'',true)}${field('p_description','Description',p.description||'',true)}${field('p_tags','Tags, comma separated',(p.tags||[]).join(', '))}${field('p_features','Features, one per line',(p.features||[]).join('\n'),true)}</section>
 <section class="product-editor-section"><h3>Specifications <small>(maximum 15)</small></h3><div class="spec-suggestions">${specHints.map(x=>`<button type="button" class="spec-suggestion" data-key="${x}">+ ${x}</button>`).join('')}</div><div id="specRows" class="spec-builder">${specRowsHtml(p.specs||{})}</div><button id="addSpec" type="button" class="pill">+ Add specification</button></section>
 <section class="product-editor-section product-image-picker"><h3>Product images</h3><p class="image-help">Select up to 4 images together. Click any preview to make it primary. Images larger than 200 KB are compressed in your browser before upload.</p><input id="productImages" type="file" multiple accept="image/jpeg,image/png,image/webp"><div id="compressionStatus" class="compression-status"></div><div id="imagePreviews" class="media-preview-grid">${existing.map((x,i)=>`<div class="media-preview ${x.primary?'is-primary':''}" data-existing-index="${i}"><img src="${esc(x.url)}" alt="${esc(x.alt||p.name||'Product image')}">${x.primary?'<span class="primary-tick">✓</span>':''}${!x.primary&&editing&&x._id?`<button type="button" class="pill make-existing-primary" data-image="${x._id}">Make primary</button>`:''}</div>`).join('')}</div>${field('p_imageAlt','Image alt text',p.primaryImage?.alt||p.name||'')}<p class="image-help">Alt text is retained because it improves accessibility for screen-reader users and provides useful image context.</p></section>
 <section class="product-editor-section"><h3>Availability</h3><div class="check-grid">${checks.map(([k,l])=>`<label><input id="p_${k}" type="checkbox" ${p[k]!==false&&(p[k]===true||['active','buyNowEnabled','addToCartEnabled','homeDeliveryAvailable'].includes(k))?'checked':''}> ${l}</label>`).join('')}</div></section><div class="product-editor-actions"><button id="saveProduct" class="pill primary">Save Product</button></div></form>`);
 if(editing)$('#p_id').disabled=true;bindSpecBuilder();
 let selected=[],primaryIndex=0;const input=$('#productImages'),preview=$('#imagePreviews'),status=$('#compressionStatus');
 input.onchange=async()=>{try{const raw=[...input.files];const allowed=Math.max(0,4-existing.length);if(raw.length>4||editing&&raw.length>allowed)throw new Error(editing?`You can add only ${allowed} more image(s). Remove existing images from Manage Images first if needed.`:'Maximum 4 images allowed');status.textContent='Optimizing images...';selected=[];for(const f of raw){if(!/^image\/(jpeg|png|webp)$/.test(f.type))throw new Error('Only JPEG, PNG and WebP images are allowed');selected.push(await compressProductImage(f))}primaryIndex=0;renderSelected();status.textContent=selected.length?`${selected.length} image(s) ready. Every image is 200 KB or smaller.`:''}catch(e){selected=[];input.value='';status.textContent='';adminToast(e.message,'error')}};
 function renderSelected(){preview.querySelectorAll('[data-new]').forEach(x=>x.remove());selected.forEach((f,i)=>{const u=URL.createObjectURL(f);preview.insertAdjacentHTML('beforeend',`<button type="button" class="media-preview ${i===primaryIndex?'is-primary':''}" data-new="${i}"><img src="${u}" alt="Selected product image">${i===primaryIndex?'<span class="primary-tick">✓</span>':''}<small>${Math.ceil(f.size/1024)} KB</small></button>`)});preview.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>{primaryIndex=Number(b.dataset.new);renderSelected()})}
 document.querySelectorAll('.make-existing-primary').forEach(b=>b.onclick=async()=>{try{b.disabled=true;await api(`/admin/products/${p.id}/gallery/${b.dataset.image}/primary`,{method:'POST'});adminToast('Primary image changed');await loadProductPage(productPager.page);productForm(p._id)}catch(e){adminToast(e.message,'error');b.disabled=false}});
 let locked=false;$('#pf').onsubmit=async e=>{e.preventDefault();if(locked)return;const button=$('#saveProduct'),message=$('#productFormMessage');try{locked=true;button.disabled=true;button.textContent='Saving...';const fd=new FormData();['id','sku','productCode','slug','name','category','subCategory','price','stock','oldPrice','minOrderQty','maxOrderQty','badge','taxRate','hsnCode','weight','shortDescription','description','imageAlt'].forEach(k=>fd.append(k,$('#p_'+k)?.value||''));checks.forEach(([k])=>fd.append(k,String($('#p_'+k).checked)));fd.append('tags',JSON.stringify($('#p_tags').value.split(',').map(x=>x.trim()).filter(Boolean)));fd.append('features',JSON.stringify($('#p_features').value.split('\n').map(x=>x.trim()).filter(Boolean)));fd.append('specs',JSON.stringify(readSpecRows()));if(selected.length){fd.append('primaryImage',selected[primaryIndex]);selected.forEach((f,i)=>{if(i!==primaryIndex)fd.append('galleryImages',f)})}const d=await api(editing?'/admin/products/'+encodeURIComponent(p._id):'/admin/products',{method:editing?'PATCH':'POST',body:fd});await loadProductPage(editing?productPager.page:1);close();adminToast(d.message||'Product saved')}catch(x){message.hidden=false;message.textContent=x.message;button.disabled=false;button.textContent='Save Product';locked=false}};
};