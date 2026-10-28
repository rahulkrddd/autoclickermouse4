const ACM_SITE_ID=window.__SITE_ID__;if(!/^[a-z0-9][a-z0-9_-]{2,49}$/.test(ACM_SITE_ID||''))throw Error('Invalid site context');const acmKey=k=>`acm:${ACM_SITE_ID}:${k}`;
const $=s=>document.querySelector(s);function toast(message,action,type){
  const text=String(message??'').trim()||'Something went wrong';
  const explicitType=['success','error','warning','info'].includes(type)?type:'';
  const lower=text.toLowerCase();
  const resolvedType=explicitType||(
    /unable|failed|failure|error|problem|try again/.test(lower)?'error':
    /out of stock|empty|disabled|closed|minimum|maximum|changed|unavailable|not available/.test(lower)?'warning':
    /added|removed|updated|saved|applied|successful|success/.test(lower)?'success':'info'
  );
  const meta={
    success:{icon:'✓',label:'Success',detail:'Action completed successfully'},
    error:{icon:'!',label:'Error',detail:'The action could not be completed'},
    warning:{icon:'!',label:'Attention',detail:'Please review and try again'},
    info:{icon:'i',label:'Information',detail:'Please review this message'}
  }[resolvedType];
  const escapeToast=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  document.querySelector('.shop-toast')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="shop-toast toast-${resolvedType}" role="${resolvedType==='error'?'alert':'status'}" aria-live="${resolvedType==='error'?'assertive':'polite'}" aria-atomic="true"><span class="toast-icon" aria-hidden="true">${meta.icon}</span><div class="toast-content"><small>${meta.label}</small><b>${escapeToast(text)}</b><span>${meta.detail}</span></div>${action?'<a href="/cart">View cart</a>':''}<button class="toast-close" type="button" aria-label="Dismiss notification">×</button></div>`);
  const current=document.querySelector('.shop-toast');
  if(!current)return;
  current.querySelector('.toast-close')?.addEventListener('click',()=>{current.classList.remove('show');setTimeout(()=>current.remove(),250)},{once:true});
  requestAnimationFrame(()=>current.classList.add('show'));
  const duration=resolvedType==='error'?4500:resolvedType==='warning'?3800:3000;
  setTimeout(()=>{if(current.isConnected){current.classList.remove('show');setTimeout(()=>current.remove(),250)}},duration);
}const readLocalList=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(e){localStorage.removeItem(k);return []}},cart=()=>readLocalList(acmKey('cart')),wish=()=>readLocalList(acmKey('wish'));function saveCart(x){localStorage.setItem(acmKey('cart'),JSON.stringify(x));updateCount()}function updateCount(){const e=$('#cartCount');if(e)e.textContent=cart().reduce((a,x)=>a+x.quantity,0)}async function track(type,data={}){try{await fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,...data})})}catch(e){}}function addCart(p,q=1,variant=null){const selected=variant||null,min=Math.max(1,Number(selected?.minOrderQty??p?.minOrderQty)||1),available=Math.max(0,Number(selected?.stock??p?.stock)||0),configured=(selected?.maxOrderQty??p?.maxOrderQty)==null?available:Math.min(available,Number(selected?.maxOrderQty??p.maxOrderQty)),wanted=Number(q);if(!p||p.addToCartEnabled===false){toast('Add to Cart is disabled for this product');return false}if(p.variationEnabled&&!selected){toast('Please select an available option.');return false}if(!Number.isInteger(wanted)||wanted<min){toast(`Minimum quantity is ${min}`);return false}let a=cart(),variantId=selected?.variantId||'',x=a.find(v=>v.id===p.id&&String(v.variantId||'')===String(variantId)),next=(x?.quantity||0)+wanted;if(next>configured){toast(`Maximum allowed quantity is ${configured}`);return false}x?x.quantity=next:a.push({id:p.id,variantId,quantity:wanted});saveCart(a.map(item=>({id:item.id,variantId:item.variantId||'',quantity:Number(item.quantity)||1})));track('cart_add',{productId:p.id,variantId});toast('Added to cart',true);return true}function setWishState(p,shouldAdd){if(!p||!p.id)return false;let a=wish().filter((x,i,arr)=>x&&x.id&&arr.findIndex(v=>v.id===x.id)===i),exists=a.some(x=>String(x.id)===String(p.id)),next=typeof shouldAdd==='boolean'?shouldAdd:!exists;a=next?[...a.filter(x=>String(x.id)!==String(p.id)),p]:a.filter(x=>String(x.id)!==String(p.id));localStorage.setItem(acmKey('wish'),JSON.stringify(a));track(next?'wishlist_add':'wishlist_remove',{productId:p.id});return next}function toggleWish(p){return setWishState(p)}function setupLogin(){const a=$('#adminBtn'),o=$('#ordersBtn'),m=$('#login');if(!a||!m)return;const open=t=>{$('#loginTitle').textContent=t==='admin'?'Admin Login':'Find My Orders';$('#loginLabel').textContent=t==='admin'?'Numeric password':'Registered mobile number';$('#loginForm').dataset.type=t;$('#loginMsg').textContent=t==='admin'?'Administrator access only.':'Enter the mobile number used during checkout.';m.classList.add('open')};a.onclick=()=>open('admin');o.onclick=()=>{let x=localStorage.getItem(acmKey('mobileNumber'));x?location.href='/my-orders?mobileNumber='+x:open('orders')};m.querySelector('.close').onclick=()=>m.classList.remove('open');$('#loginInput').oninput=e=>e.target.value=e.target.value.replace(/\D/g,'');$('#loginForm').onsubmit=async e=>{e.preventDefault();let t=e.target.dataset.type,v=$('#loginInput').value,u=t==='admin'?'/admin/admin-login':'/my-orders',b=t==='admin'?{password:v}:{mobileNumber:v},r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),d=await r.json();$('#loginMsg').textContent=d.message;if(r.ok){if(t==='admin')location.href='/admin';else{localStorage.setItem(acmKey('mobileNumber'),v);location.href='/my-orders?mobileNumber='+v}}}}updateCount();setupLogin();
;async function enableSiteSearch(){
 'use strict';
 const input=document.querySelector('#globalSearch,.search input[type="search"],.search input');
 if(!input||input.dataset.searchOverlayV3==='true')return;
 input.dataset.searchOverlayV3='true';
 const host=input.closest('.search');if(!host)return;
 input.removeAttribute('list');document.getElementById('siteSearchSuggestions')?.remove();
 for(const [key,value] of Object.entries({autocomplete:'off',autocorrect:'off',autocapitalize:'none',spellcheck:'false',role:'combobox','aria-autocomplete':'list','aria-expanded':'false','aria-controls':'searchOverlayOptions'}))input.setAttribute(key,value);
 if(!input.getAttribute('aria-label'))input.setAttribute('aria-label','Search products');
 const style=document.createElement('style');style.id='search-overlay-v3-style';style.textContent=`
 #searchOverlayV3{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;width:100%!important;max-width:none!important;height:100vh!important;height:100dvh!important;max-height:none!important;background:transparent!important;color:#212121!important;overflow:visible!important;pointer-events:none!important;z-index:2147483647!important;box-sizing:border-box!important;}
 #searchOverlayV3:not([data-open="true"]){display:none!important;}
 #searchOverlayV3::backdrop{background:transparent;pointer-events:none;}
 #searchOverlayV3 .so-backdrop{position:absolute;inset:var(--so-top) 0 0;background:rgba(15,23,42,.38);pointer-events:auto;}
 #searchOverlayV3 .so-panel{position:absolute;left:var(--so-left);top:var(--so-top);width:var(--so-width);max-width:100%;max-height:var(--so-height);display:flex;flex-direction:column;overflow:hidden;background:#fff;color:#212121;border:1px solid #e2dde1;border-radius:0 0 12px 12px;box-shadow:0 12px 28px #0003;pointer-events:auto;box-sizing:border-box;}
 #searchOverlayV3 .so-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-bottom:1px solid #eee;flex:0 0 auto;}
 #searchOverlayV3 .so-title{font:600 13px/1.4 Arial,Helvetica,sans-serif;color:#596273;}
 #searchOverlayV3 .so-close{display:grid;place-items:center;width:36px;min-width:36px;height:36px;padding:0;border:0;border-radius:50%;background:#f2f3f5;color:#212121;font:24px/1 Arial;cursor:pointer;}
 #searchOverlayV3 .so-options{overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;min-height:0;flex:1 1 auto;padding:5px;margin:0;}
 #searchOverlayV3 .so-option{display:flex;align-items:center;gap:12px;min-height:48px;padding:11px 14px;box-sizing:border-box;border-radius:6px;cursor:pointer;font:14px/1.4 Arial,Helvetica,sans-serif;overflow-wrap:anywhere;color:#212121;}
 #searchOverlayV3 .so-option:hover,#searchOverlayV3 .so-option[aria-selected="true"]{background:color-mix(in srgb,var(--so-accent) 10%,white);}
 #searchOverlayV3 .so-icon{font-size:22px;color:#697180;flex:0 0 22px;}
 #searchOverlayV3 .so-empty{padding:20px 14px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#596273;}
 #searchOverlayV3 .so-close:focus-visible{outline:2px solid #7b5aa6;outline-offset:2px;}
 #searchOverlayV3 .so-product-image{width:52px!important;height:52px!important;object-fit:contain!important;flex:0 0 52px;border-radius:7px;background:#f7f7f7;}
 #searchOverlayV3 .so-product-copy{min-width:0;display:flex;flex-direction:column;gap:4px;flex:1;}
 #searchOverlayV3 .so-product-name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;line-height:1.4;font-weight:600;}
 #searchOverlayV3 .so-product-category{display:block;color:#6b6570;font-size:12px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 #searchOverlayV3 .so-history-text{flex:1;min-width:0;overflow-wrap:anywhere;}
 #searchOverlayV3 .so-history-remove{width:36px;min-width:36px;height:36px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--so-accent);font:24px/1 Arial;cursor:pointer;}
 #searchOverlayV3 .so-history-remove:focus-visible{outline:2px solid var(--so-accent);}
 @media(max-width:700px){#searchOverlayV3 .so-panel{left:0;width:100%;height:var(--so-height);max-height:var(--so-height);border-radius:0;border-left:0;border-right:0;box-shadow:none;}#searchOverlayV3 .so-option{min-height:52px;}#searchOverlayV3 .so-options{padding-bottom:max(12px,env(safe-area-inset-bottom));}}
 `;document.head.appendChild(style);
 const root=document.createElement('div');root.id='searchOverlayV3';root.setAttribute('popover','manual');root.dataset.open='false';
 const backdrop=document.createElement('div');backdrop.className='so-backdrop';backdrop.setAttribute('aria-hidden','true');
 const panel=document.createElement('section');panel.className='so-panel';panel.setAttribute('aria-label','Search suggestions');
 const heading=document.createElement('div');heading.className='so-heading';
 const title=document.createElement('span');title.className='so-title';title.textContent='Explore keywords';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='so-close';closeButton.setAttribute('aria-label','Close search suggestions');closeButton.textContent='×';
 const options=document.createElement('div');options.id='searchOverlayOptions';options.className='so-options';options.setAttribute('role','listbox');options.setAttribute('aria-label','Search keywords');
 heading.append(title,closeButton);panel.append(heading,options);root.append(backdrop,panel);document.body.appendChild(root);
 let opened=false,products=[],shown=[],active=-1,loading=true,loadFailed=false,oldOverflow='',oldPadding='',oldNavZ='',oldNavPosition='';
 const nav=input.closest('.nav');
 const theme=getComputedStyle(host.querySelector('button')||host);
 root.style.setProperty('--so-accent',theme.backgroundColor==='rgba(0, 0, 0, 0)'?'#c64c7c':theme.backgroundColor);
 const historyKey=acmKey('searchHistory');
 const previousHistoryKey=historyKey+':v1';
 let memoryHistory=[];
 const clean=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,160);
 function readHistory(){try{const raw=JSON.parse(localStorage.getItem(historyKey)||localStorage.getItem(previousHistoryKey)||'[]');return Array.isArray(raw)?raw.filter(x=>typeof x==='string').map(clean).filter(Boolean).slice(0,12):[];}catch{return memoryHistory;}}
 function writeHistory(values){memoryHistory=values.slice(0,12);try{localStorage.setItem(historyKey,JSON.stringify(memoryHistory));}catch{}}
 function remember(value){const q=clean(value);if(q)writeHistory([q,...readHistory().filter(x=>x.toLowerCase()!==q.toLowerCase())]);}
 function choose(item){if(item.kind==='product'){remember(input.value);close();location.href='/product/'+encodeURIComponent(item.product.slug||item.product.id);}else submit(item.value);}
 
 function place(){
  if(!opened)return;
  const r=host.getBoundingClientRect(),vv=window.visualViewport,viewTop=vv?.offsetTop||0,viewLeft=vv?.offsetLeft||0,viewHeight=vv?.height||innerHeight,viewWidth=vv?.width||innerWidth;
  const top=Math.max(viewTop,Math.min(r.bottom,viewTop+viewHeight-60));
  const left=Math.max(viewLeft,Math.min(r.left,viewLeft+viewWidth-1));
  root.style.setProperty('--so-top',top+'px');root.style.setProperty('--so-left',left+'px');root.style.setProperty('--so-width',Math.max(1,Math.min(r.width,viewLeft+viewWidth-left))+'px');root.style.setProperty('--so-height',Math.max(0,viewTop+viewHeight-top)+'px');
 }
 function close(){
  if(!opened)return;opened=false;root.dataset.open='false';
  if(typeof root.hidePopover==='function'&&root.matches(':popover-open'))root.hidePopover();
  input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;
  document.body.style.overflow=oldOverflow;document.body.style.paddingRight=oldPadding;
  if(nav){nav.style.zIndex=oldNavZ;nav.style.position=oldNavPosition;}
 }
 function open(){
  if(!opened){opened=true;oldOverflow=document.body.style.overflow;oldPadding=document.body.style.paddingRight;
   const gutter=Math.max(0,innerWidth-document.documentElement.clientWidth);if(gutter)document.body.style.paddingRight=(parseFloat(getComputedStyle(document.body).paddingRight)+gutter)+'px';
   document.body.style.overflow='hidden';
   // Fallback stacking for browsers without the Popover API.
   if(nav){oldNavZ=nav.style.zIndex;oldNavPosition=nav.style.position;nav.style.zIndex='2147483646';if(getComputedStyle(nav).position==='static')nav.style.position='relative';}
   root.dataset.open='true';if(typeof root.showPopover==='function')root.showPopover();
  }
  input.setAttribute('aria-expanded','true');place();
 }
 function submit(value=input.value){
  input.value=String(value).trim();const q=input.value;remember(q);close();
  if(location.pathname==='/'){input.dispatchEvent(new Event('input',{bubbles:true}));close();}
  else if(q)location.href='/?q='+encodeURIComponent(q);
 }
 function paint(){
  const q=clean(input.value).toLowerCase();active=-1;input.removeAttribute('aria-activedescendant');options.replaceChildren();
  shown=q?products.filter(p=>{const text=[p.name,p.category,p.subCategory,p.shortDescription,p.sku,...(Array.isArray(p.tags)?p.tags:[])].join(' ').toLowerCase();return q.split(' ').every(word=>text.includes(word));}).slice(0,40).map(product=>({kind:'product',product})):readHistory().map(value=>({kind:'history',value}));
  title.textContent=q?'Products':'Recent searches';
  if(!shown.length){const message=document.createElement('div');message.className='so-empty';message.setAttribute('role','status');message.textContent=!q?'No recent searches yet. Your searches will appear here.':loading?'Loading products…':loadFailed?'Products are unavailable. Press Enter to search.':'No matching products. Try another search.';options.appendChild(message);}
  shown.forEach((item,i)=>{
   const row=document.createElement('div');row.className='so-option';row.id='searchOverlayOption'+i;row.setAttribute('role','option');row.setAttribute('aria-selected','false');
   if(item.kind==='product'){
    const p=item.product,img=document.createElement('img');img.className='so-product-image';img.alt='';img.loading='lazy';
    const source=String(p.image||p.primaryImage?.url||'');img.src=/^(https?:\/\/|\/(?!\/))/.test(source)?source:'/images/coming-soon.svg';
    img.addEventListener('error',()=>{if(!img.src.endsWith('/images/coming-soon.svg'))img.src='/images/coming-soon.svg';},{once:true});
    const copy=document.createElement('span');copy.className='so-product-copy';const name=document.createElement('strong');name.className='so-product-name';name.textContent=String(p.name||'Product');
    const category=document.createElement('span');category.className='so-product-category';category.textContent=[p.category,p.subCategory].filter(Boolean).join(' · ');copy.append(name,category);row.append(img,copy);
   }else{
    const icon=document.createElement('span');icon.className='so-icon';icon.textContent='↶';icon.setAttribute('aria-hidden','true');const text=document.createElement('span');text.className='so-history-text';text.textContent=item.value;
    const remove=document.createElement('button');remove.type='button';remove.className='so-history-remove';remove.textContent='×';remove.setAttribute('aria-label','Remove '+item.value+' from recent searches');
    remove.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();});remove.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();writeHistory(readHistory().filter(x=>x.toLowerCase()!==item.value.toLowerCase()));input.focus();paint();});row.append(icon,text,remove);
   }
   row.addEventListener('pointerdown',e=>e.preventDefault());row.addEventListener('click',()=>choose(item));options.appendChild(row);
  });
  options.scrollTop=0;open();
 }
 input.addEventListener('focus',paint);input.addEventListener('click',()=>{if(!opened)paint()});input.addEventListener('input',()=>{if(document.activeElement===input)paint()});
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close();return;}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!opened)paint();if(!shown.length)return;active=active<0?(e.key==='ArrowDown'?0:shown.length-1):(active+(e.key==='ArrowDown'?1:-1)+shown.length)%shown.length;Array.from(options.children).forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));input.setAttribute('aria-activedescendant','searchOverlayOption'+active);options.children[active]?.scrollIntoView({block:'nearest'});return;}
  if(e.key==='Enter'){e.preventDefault();if(opened&&active>=0)choose(shown[active]);else submit(input.value);}
 });
 input.addEventListener('blur',()=>setTimeout(()=>{if(opened&&!root.contains(document.activeElement)&&document.activeElement!==input)close();},150));
 closeButton.addEventListener('click',()=>{close();input.blur();});backdrop.addEventListener('pointerdown',e=>{e.preventDefault();close();input.blur();});
 document.addEventListener('pointerdown',e=>{if(opened&&!root.contains(e.target)&&!host.contains(e.target)){close();}});
 document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.preventDefault();close();input.focus();close();}},true);
 host.querySelector('button')?.addEventListener('click',e=>{e.preventDefault();submit();});input.closest('form')?.addEventListener('submit',e=>{e.preventDefault();submit();});
 window.addEventListener('resize',place);window.addEventListener('scroll',place,{passive:true});window.visualViewport?.addEventListener('resize',place);window.visualViewport?.addEventListener('scroll',place);window.addEventListener('pagehide',close);
 try{
  const response=await fetch('/api/products');if(!response.ok)throw Error('Search catalog unavailable');const data=await response.json();
  products=(Array.isArray(data)?data:[]).filter(p=>p&&typeof p==='object'&&p.active!==false);
 }catch{loadFailed=true;}finally{loading=false;if(opened)paint();}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableSiteSearch);else enableSiteSearch();

// Product-image fallback only. Existing page, cart, checkout and admin behaviour remains unchanged.
const PRODUCT_IMAGE_FALLBACK='/images/coming-soon.svg';
function applyProductImageFallback(image){
  if(!(image instanceof HTMLImageElement)||image.dataset.imageFallbackApplied==='true')return;
  image.dataset.imageFallbackApplied='true';
  image.src=PRODUCT_IMAGE_FALLBACK;
  if(!String(image.alt||'').trim())image.alt='Product image coming soon';
}
document.addEventListener('error',event=>{
  const image=event.target;
  if(image instanceof HTMLImageElement&&image.src&&!image.src.endsWith(PRODUCT_IMAGE_FALLBACK))applyProductImageFallback(image);
},true);
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('img').forEach(image=>{
    const source=image.getAttribute('src');
    if(!source||source==='undefined'||source==='null')applyProductImageFallback(image);
  });
});

// Refresh only the navigation badge after history restore or another tab changes this site cart.
window.addEventListener('pageshow',updateCount);
window.addEventListener('storage',event=>{if(event.key===acmKey('cart')||event.key===null)updateCount()});
