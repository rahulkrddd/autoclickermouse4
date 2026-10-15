let products=[],publicSettings=null,homePage=1,homeLimit=8,onlyWish=sessionStorage.getItem(`acm:${window.__SITE_ID__}:wishlistFilter`)==='true';const off=p=>p.oldPrice>p.price?Math.round((p.oldPrice-p.price)*100/p.oldPrice):0;let announcementTimer=null;function renderFeaturedAnnouncement(){
  const lines=String(publicSettings?.maintenanceMessage||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const message=lines[0]||'';
  let banner=document.getElementById('featuredAnnouncement');
  if(announcementTimer){clearInterval(announcementTimer);announcementTimer=null}
  if(!message){banner?.remove();return}
  if(!banner){banner=document.createElement('section');banner.id='featuredAnnouncement';banner.className='featured-announcement';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');banner.innerHTML='<div class="featured-announcement-inner"><span class="featured-announcement-icon" aria-hidden="true">🎁</span><div class="featured-announcement-copy"><small>Featured announcement</small><strong id="featuredAnnouncementText"></strong></div></div>';
  
	const hero=document.querySelector('.hero');
	if(hero){
		hero.parentNode.insertBefore(
			banner,
			hero
		);
	}
	else{
		document.body.prepend(banner);
		}
}
  banner.classList.toggle('store-closed',publicSettings?.storeOpen===false);const label=banner.querySelector('small');if(label)label.textContent=publicSettings?.storeOpen===false?'Important store update':'Featured announcement';const target=banner.querySelector('#featuredAnnouncementText');let index=0;target.textContent=message;banner.hidden=false;
  if(lines.length>1)announcementTimer=setInterval(()=>{index=(index+1)%lines.length;target.classList.remove('is-changing');void target.offsetWidth;target.textContent=lines[index];target.classList.add('is-changing')},3500)
}
function escapeHtml(value){
    return String(value ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
}

function applyStoreData(data){
  if(!data || typeof data!=='object'){
    return;
  }

  if(Array.isArray(data.products)){
    products=data.products;
  }

  if(data.settings && typeof data.settings==='object'){
    publicSettings=data.settings;
  }

  renderFeaturedAnnouncement();

  const categorySelect=$('#category');

  if(categorySelect){
    const currentCategory=categorySelect.value;

    const categories=[
      ...new Set(
        products
          .map(product=>String(product.category||'').trim())
          .filter(Boolean)
      )
    ].sort((a,b)=>a.localeCompare(b));

    categorySelect.innerHTML=
      '<option value="">All categories</option>'+
      categories
        .map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
        .join('');

    if(categories.includes(currentCategory)){
      categorySelect.value=currentCategory;
    }
  }

  const requestedSearch=
    new URLSearchParams(window.location.search).get('q')||'';

  const searchInput=$('#globalSearch');

  if(searchInput && requestedSearch && !searchInput.value.trim()){
    searchInput.value=requestedSearch;
  }

  homePage=1;

  render();
  syncWishlistFilter();
  placeWishlistFilter();
}
async function load(){const job=swrJSON('public-store',async()=>{const [products,settings]=await Promise.all([fetch('/api/products').then(r=>r.json()),fetch('/api/settings/public').then(r=>r.json()).catch(()=>null)]);return{products,settings}},{scope:'local',onCached:applyStoreData,onFresh:applyStoreData});if(!job.cached)await job.fresh}function render(){let q=($('#globalSearch')?.value||'').toLowerCase(),c=$('#category').value,w=wish().map(x=>x.id),a=products.filter(p=>(p.name+(p.shortDescription||p.description||'')).toLowerCase().includes(q)&&(!c||p.category===c)&&(!onlyWish||w.includes(p.id)));if($('#sort').value==='featured')a.sort((x,y)=>Number(y.featured)-Number(x.featured));if($('#sort').value==='low')a.sort((x,y)=>x.price-y.price);if($('#sort').value==='high')a.sort((x,y)=>y.price-x.price);const total=a.length,totalPages=Math.max(1,Math.ceil(total/homeLimit));homePage=Math.min(Math.max(1,homePage),totalPages);const start=total?(homePage-1)*homeLimit:0,end=Math.min(start+homeLimit,total),pageItems=a.slice(start,end);$('#grid').innerHTML=pageItems.map(p=>`<article class="card product-card">${off(p)?`<span class="discount-badge">${off(p)}% OFF</span>`:''}<button type="button" aria-label="Wishlist" class="heart ${w.includes(p.id)?'on':''}" onclick="heart(event,'${p.id}')">${w.includes(p.id)?'♥':'♡'}</button><a class="card-link" href="/product/${p.slug}"><img src="${p.image}" alt="${p.name}"><div class="pad card-content"><span class="badge">${p.badge}</span><h3>${p.name}</h3><p class="muted card-description">${p.shortDescription||p.description||''}</p><p><span class="price">₹${p.price}</span> <span class="old">₹${p.oldPrice}</span></p>${Number(p.stock)<=0?'<p class="stock-status out-of-stock">Out of Stock</p>':`<p class="stock-status">${p.stock} in stock</p>`}</div></a><div class="pad product-actions"><button class="cart-action" ${Number(p.stock)<=0||(p.addToCartEnabled===false||publicSettings?.storeOpen===false)?'disabled aria-disabled="true"':''} onclick="quick(event,'${p.id}')"><span class="cart-icon">＋</span><span>Add</span></button><button class="buy-action" ${Number(p.stock)<=0||(p.buyNowEnabled===false||publicSettings?.storeOpen===false)?'disabled aria-disabled="true"':''} onclick="buy(event,'${p.id}')">Buy Now</button></div></article>`).join('')||'<div class="empty-state">No matching products found.</div>';const showing=$('#homeShowing'),label=$('#homePageLabel'),prev=$('#homePrev'),next=$('#homeNext');if(showing)showing.textContent=`Showing ${total?start+1:0}-${end} of ${total} products`;if(label)label.textContent=`Page ${homePage} of ${totalPages}`;if(prev)prev.disabled=homePage<=1;if(next)next.disabled=homePage>=totalPages;const pager=$('#homePagination');if(pager)pager.hidden=totalPages<=1}window.quick=(e,id)=>{if(publicSettings?.storeOpen===false)return toast(publicSettings.maintenanceMessage||'The store is temporarily closed. Please try again later.');e.preventDefault();e.stopPropagation();const p=products.find(x=>x.id===id);if(!p||Number(p.stock)<=0)return toast('This product is out of stock');addCart(p)};window.buy=(e,id)=>{if(publicSettings?.storeOpen===false)return toast(publicSettings.maintenanceMessage||'The store is temporarily closed. Please try again later.');e.preventDefault();e.stopPropagation();const p=products.find(x=>x.id===id);if(!p||Number(p.stock)<=0)return toast('This product is out of stock');if(p.buyNowEnabled===false)return toast('Buy Now is disabled for this product');openDirectCheckout([{productId:id,quantity:1}])};let wishTapLocked=false;window.heart=(e,id)=>{e.preventDefault();e.stopPropagation();if(wishTapLocked)return;wishTapLocked=true;setTimeout(()=>wishTapLocked=false,350);const p=products.find(x=>String(x.id)===String(id)),btn=e.currentTarget,currentlySaved=wish().some(x=>String(x.id)===String(id)),added=setWishState(p,!currentlySaved);btn.classList.toggle('on',added);btn.textContent=added?'♥':'♡';btn.setAttribute('aria-label',added?'Remove from wishlist':'Add to wishlist');toast(added?'Added to wishlist':'Removed from wishlist')};function placeWishlistFilter(){const b=$('#wishlistFilter'),nav=document.querySelector('.nav'),toolbar=document.querySelector('main .toolbar');if(!b||!nav||!toolbar)return;if(matchMedia('(max-width:700px)').matches){if(b.parentElement!==nav)nav.insertBefore(b,nav.querySelector('.navlinks'))}else if(b.parentElement!==toolbar){toolbar.appendChild(b)}}const wishMedia=matchMedia('(max-width:700px)');wishMedia.addEventListener?.('change',placeWishlistFilter);window.addEventListener('resize',placeWishlistFilter);$('#category').onchange=$('#sort').onchange=render;$('#globalSearch').oninput=render;function syncWishlistFilter(){const b=$('#wishlistFilter');if(!b)return;b.classList.toggle('active',onlyWish);b.setAttribute('aria-pressed',String(onlyWish))}$('#wishlistFilter').onclick=e=>{e.preventDefault();e.stopPropagation();onlyWish=!onlyWish;sessionStorage.setItem(`acm:${window.__SITE_ID__}:wishlistFilter`,String(onlyWish));syncWishlistFilter();render()};syncWishlistFilter();placeWishlistFilter();load();
/* Home featured pagination */
const homePrev=$('#homePrev'),homeNext=$('#homeNext');if(homePrev)homePrev.onclick=()=>{if(homePage>1){homePage--;render();document.querySelector('#grid')?.scrollIntoView({behavior:'smooth',block:'start'})}};if(homeNext)homeNext.onclick=()=>{const pages=Math.max(1,Math.ceil(products.length/homeLimit));if(homePage<pages){homePage++;render();document.querySelector('#grid')?.scrollIntoView({behavior:'smooth',block:'start'})}};['globalSearch','category','sort'].forEach(id=>{const el=$('#'+id);if(!el)return;el.addEventListener(id==='globalSearch'?'input':'change',()=>{homePage=1},{capture:true})});