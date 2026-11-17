/* Banner-only stale-while-revalidate carousel. */
(()=>{'use strict';
 const root=document.getElementById('homeBanners');if(!root){window.finishBannerBoot?.();return}
 const track=root.querySelector('.banner-track'),dots=root.querySelector('.banner-dots'),motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const color=v=>/^#[0-9a-f]{6}$/i.test(v||'')?v:'#808000';
 let rows=[],source=[],signature='',current=0,timer=0,resume=0,drag=null,suppressClick=false,refreshing=false,hover=false,focused=false,version=0;
 function validURL(v){if(!v)return '';try{const u=new URL(v,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
 const visible=b=>b&&b.active!==false&&(!b.startsAt||Date.parse(b.startsAt)<=Date.now())&&(!b.endsAt||Date.parse(b.endsAt)>Date.now());
 const perPage=()=>mobile.matches?1:2;
 const last=()=>Math.max(0,rows.length-perPage());
 const release=()=>window.finishBannerBoot?.();
 function preload(url){return new Promise(resolve=>{if(!url){resolve(false);return}const img=new Image();let settled=false;const done=ok=>{if(settled)return;settled=true;clearTimeout(timeout);img.onload=img.onerror=null;resolve(ok)};const timeout=setTimeout(()=>done(false),4500);img.onload=()=>done(true);img.onerror=()=>done(false);img.src=url;if(img.complete)done(img.naturalWidth>0)})}
 function start(){clearInterval(timer);if(last()>0&&!motion.matches&&!document.hidden&&!hover&&!focused)timer=setInterval(()=>go(current>=last()?0:current+1),4000)}
 function pause(){clearInterval(timer);clearTimeout(resume);resume=setTimeout(start,6500)}
 function mark(){[...dots.children].forEach((d,i)=>d.setAttribute('aria-current',String(i===current)))}
 function go(index,instant=false){current=Math.max(0,Math.min(last(),index));const el=track.children[current];if(!el)return;track.scrollTo({left:el.offsetLeft-track.firstElementChild.offsetLeft,behavior:instant||motion.matches?'instant':'smooth'});mark()}
 function drawDots(){dots.innerHTML=last()>0?Array.from({length:last()+1},(_,i)=>`<button type="button" class="banner-dot" data-index="${i}" aria-label="Show banner group ${i+1}" aria-current="false"></button>`).join(''):'';dots.hidden=last()===0;mark()}
 async function render(data,force=false){
  source=Array.isArray(data)?data:[];
  const next=source.filter(b=>visible(b)&&validURL(b.desktop?.url)).slice(0,6),key=JSON.stringify([mobile.matches,next]);
  if(!force&&key===signature){release();return}
  const token=++version,previous=rows[current]?._id;
  // Keep the existing loaded carousel in place during background image refresh.
  const loaded=await Promise.all(next.map(async b=>{
   const desktop=validURL(b.desktop.url),small=validURL(b.mobile?.url),preferred=mobile.matches&&small?small:desktop;
   if(await preload(preferred))return {...b,displayURL:preferred};
   if(preferred!==desktop&&await preload(desktop))return {...b,displayURL:desktop};
   const old=rows.find(row=>row._id===b._id);return old?{...b,displayURL:old.displayURL}:null;
  }));
  if(token!==version)return;
  signature=loaded.every(Boolean)?key:'';rows=loaded.filter(Boolean);clearInterval(timer);
  if(!rows.length){root.hidden=true;track.replaceChildren();dots.replaceChildren();release();return}
  const fragment=document.createElement('div');
  fragment.innerHTML=rows.map((b,i)=>{
   const clickable=b.action!=='none',href=b.action==='product'?'/product/'+encodeURIComponent(b.target):'/?q='+encodeURIComponent(b.target||'');
   return `<${clickable?'a':'div'} class="banner-slide" ${clickable?`href="${esc(href)}"`:''} data-index="${i}" draggable="false" aria-label="${esc(b.title)}"><picture><img src="${esc(b.displayURL)}" alt="${esc(b.altText||b.title)}" width="1400" height="680" loading="eager" decoding="async" draggable="false"></picture></${clickable?'a':'div'}>`;
  }).join('');
  [...fragment.children].forEach((el,i)=>el.style.setProperty('--banner-border',color(rows[i].borderColor)));
  track.replaceChildren(...fragment.children);root.hidden=false;
  current=Math.max(0,Math.min(last(),rows.findIndex(b=>b._id===previous)));drawDots();go(current,true);release();start();
 }
 track.addEventListener('scroll',()=>{if(!track.children.length)return;const origin=track.firstElementChild.offsetLeft;let best=Infinity;[...track.children].slice(0,last()+1).forEach((el,i)=>{const d=Math.abs(el.offsetLeft-origin-track.scrollLeft);if(d<best){best=d;current=i}});mark()},{passive:true});
 dots.addEventListener('click',e=>{const d=e.target.closest('[data-index]');if(d){pause();go(Number(d.dataset.index))}});
 track.addEventListener('pointerdown',e=>{pause();suppressClick=false;if(e.pointerType==='mouse'&&e.button===0)drag={x:e.clientX,left:track.scrollLeft,moved:false}});
 window.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>7)drag.moved=true;if(drag.moved){suppressClick=true;track.style.scrollSnapType='none';track.style.scrollBehavior='auto';track.scrollLeft=drag.left-dx;e.preventDefault()}});
 function finishDrag(){if(!drag)return;const moved=drag.moved;drag=null;track.style.scrollSnapType='';track.style.scrollBehavior='';if(moved)go(current)}
 window.addEventListener('pointerup',finishDrag);window.addEventListener('pointercancel',()=>{finishDrag();suppressClick=false});
 track.addEventListener('dragstart',e=>e.preventDefault());track.addEventListener('touchstart',pause,{passive:true});track.addEventListener('wheel',pause,{passive:true});
 track.addEventListener('click',e=>{const slide=e.target.closest('a[data-index]');if(!slide)return;if(suppressClick){e.preventDefault();suppressClick=false;return}if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const b=rows[Number(slide.dataset.index)];if(!b||b.action==='product')return;e.preventDefault();pause();if(typeof window.applyBannerFilter==='function')window.applyBannerFilter(b.action,b.target);else location.href=slide.href});
 root.addEventListener('mouseenter',()=>{hover=true;clearInterval(timer)});root.addEventListener('mouseleave',()=>{hover=false;start()});
 root.addEventListener('focusin',()=>{focused=true;clearInterval(timer)});root.addEventListener('focusout',()=>{focused=false;start()});
 async function refresh(){if(refreshing||document.hidden)return;refreshing=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5500);try{const r=await fetch('/api/banners',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Banner refresh failed');const data=await r.json();if(!Array.isArray(data))throw Error('Invalid banners');window.publicDataCache?.write('banners',data);await render(data)}catch{release()}finally{clearTimeout(timeout);refreshing=false}}
 const cached=window.publicDataCache?.read('banners');
 // Finish cached image readiness before applying fresh metadata, avoiding a cold-image flash.
 Promise.resolve(cached?render(cached):null).finally(refresh);
 setInterval(()=>{if(!document.hidden){render(source);refresh()}},30000);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(timer);else{refresh();start()}});
 motion.addEventListener?.('change',start);mobile.addEventListener?.('change',()=>render(source,true));
 window.addEventListener('storage',e=>{if(e.key?.endsWith(':banners')){const value=window.publicDataCache?.read('banners');if(value)render(value)}});
})();
