/* Site-scoped banner manager. Uses the existing admin authentication and CSRF fetch wrapper. */
(()=>{'use strict';
 const root=document.getElementById('banners');if(!root)return;
 const $=s=>root.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let rows=[],options={products:[],categories:[]},editing='',busy=false,dragId='',mobileRemoved=false;
 const blobs={desktop:null,mobile:null},previewURLs={desktop:'',mobile:''};
 let renderVersion=0;
 const border=v=>/^#[0-9a-f]{6}$/i.test(v||'')?v:'#808000';
 function syncPublic(){fetch('/api/banners',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>window.publicDataCache?.write('banners',data)).catch(()=>{})}
 const imageReady=url=>new Promise(resolve=>{if(!url){resolve(false);return}const img=new Image();let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(t);img.onload=img.onerror=null;resolve(ok)};const t=setTimeout(()=>finish(false),4500);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url;if(img.complete)finish(img.naturalWidth>0)});
 const message=(text,error=false)=>{const e=$('#bannerMessage');e.textContent=text;e.classList.toggle('error',error)};
 async function request(url,opt={}){const r=await fetch(url,{cache:'no-store',credentials:'same-origin',...opt});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.message||'Banner request failed');if(opt.method&&opt.method!=='GET'&&url!=='/admin/banners/preview'){window.swrInvalidate?.('admin:banners');syncPublic()}return data}
 async function render(){
  const token=++renderVersion,ready=await Promise.all(rows.map(b=>imageReady(b.desktop?.url)));if(token!==renderVersion)return;
  $('#bannerCount').textContent=`${rows.length} / 6 banners`;
  $('#addBanner').disabled=busy||rows.length>=6;
  $('#bannerList').innerHTML=rows.length?rows.map((b,i)=>{
   const now=Date.now(),scheduled=b.startsAt&&Date.parse(b.startsAt)>now,expired=b.endsAt&&Date.parse(b.endsAt)<=now,live=b.active&&!scheduled&&!expired;
   return `<article class="banner-admin-card" draggable="true" data-banner-id="${esc(b._id)}">${ready[i]?`<img src="${esc(b.desktop.url)}" alt="${esc(b.altText||b.title)}" style="--banner-border:${border(b.borderColor)}">`:'<p class="banner-hint">Banner image unavailable. Edit to replace it.</p>'}<div class="banner-card-body"><h3>${esc(b.title)}</h3><span class="banner-status ${live?'live':''}">${!b.active?'Inactive':scheduled?'Scheduled':expired?'Expired':'Active'}</span><p>${esc(b.action)}${b.target?': '+esc(b.target):''}</p><p>Position ${i+1}${b.mobile?.url?' · Mobile image included':' · Desktop image on mobile'}</p><div class="banner-card-actions"><button type="button" class="pill" data-op="edit">Edit</button><button type="button" class="pill" data-op="toggle">${b.active?'Deactivate':'Activate'}</button><button type="button" class="pill" data-op="up" ${i===0?'disabled':''}>Move up</button><button type="button" class="pill" data-op="down" ${i===rows.length-1?'disabled':''}>Move down</button><button type="button" class="pill danger" data-op="delete">Delete</button></div></div></article>`;
  }).join(''):'<p class="banner-hint">No banners yet. The homepage slider stays hidden until an active banner is added.</p>';
 }
 async function applyData(data){rows=Array.isArray(data.banners)?data.banners:[];await render();$('#bannerCleanup').hidden=!data.cleanupPending}
 async function load(){try{
  if(window.swrJSON){const task=window.swrJSON('admin:banners',()=>request('/admin/banners'),{onCached:data=>{if(!rows.length)applyData(data)}});await applyData(await task.fresh)}
  else await applyData(await request('/admin/banners'));
 }catch(e){message(e.message,true);throw e}}
 window.loadAdminBanners=async()=>{await Promise.all([load(),request('/admin/banners/options').then(d=>options=d)])};
 function clearPreviews(){for(const kind of ['desktop','mobile']){if(previewURLs[kind])URL.revokeObjectURL(previewURLs[kind]);previewURLs[kind]='';blobs[kind]=null}}
 function targetControl(value=''){
  const action=$('#bannerAction').value,host=$('#bannerTargetHost');
  if(action==='none'){host.innerHTML='<p class="banner-hint">This banner is display-only.</p>';return}
  if(action==='search')host.innerHTML=`<label for="bannerTarget">Search keywords</label><input id="bannerTarget" maxlength="200" required placeholder="e.g. Resin gifts" value="${esc(value)}">`;
  else{const items=action==='product'?options.products.map(p=>({value:p.slug,label:p.name})):options.categories.map(c=>({value:c,label:c}));host.innerHTML=`<label for="bannerTarget">${action==='product'?'Product':'Category'} (this site only)</label><select id="bannerTarget" required><option value="">Choose...</option>${items.map(x=>`<option value="${esc(x.value)}" ${x.value===value?'selected':''}>${esc(x.label)}</option>`).join('')}</select>`}
 }
 function localDate(v){if(!v)return '';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
 async function edit(b=null){
  if(busy)return;try{options=await request('/admin/banners/options')}catch(e){message(e.message,true);return}
  clearPreviews();mobileRemoved=false;editing=b?b._id:'';$('#bannerForm').reset();$('#bannerEditorTitle').textContent=b?'Edit banner':'Add banner';
  $('#bannerBorderColor').value=border(b?.borderColor);updateBorder();$('#bannerTitle').value=b?.title||'';$('#bannerAlt').value=b?.altText||'';$('#bannerAction').value=b?.action||'search';$('#bannerActive').checked=b?b.active:true;$('#bannerStarts').value=localDate(b?.startsAt);$('#bannerEnds').value=localDate(b?.endsAt);targetControl(b?.target||'');
  for(const kind of ['desktop','mobile']){const img=$(`#bannerPreview_${kind}`);img.hidden=!b?.[kind]?.url;img.src=b?.[kind]?.url||'';$(`#bannerFile_${kind}`).value=''}
  $('#removeBannerMobile').hidden=!b?.mobile?.url;$('#bannerEditor').hidden=false;$('#bannerTitle').focus();message('');
 }
 $('#addBanner').addEventListener('click',()=>edit());$('#cancelBanner').addEventListener('click',()=>{$('#bannerEditor').hidden=true;clearPreviews()});
 $('#bannerAction').addEventListener('change',()=>targetControl());
 $('#removeBannerMobile').addEventListener('click',()=>{mobileRemoved=true;blobs.mobile=null;$('#bannerPreview_mobile').hidden=true;$('#bannerFile_mobile').value='';$('#removeBannerMobile').hidden=true});
 async function save(e){e.preventDefault();if(busy)return;if(!editing&&!blobs.desktop){message('Choose and crop a desktop image first.',true);return}
  const data=new FormData();data.set('borderColor',$('#bannerBorderColor').value);data.set('title',$('#bannerTitle').value.trim());data.set('altText',$('#bannerAlt').value.trim());data.set('action',$('#bannerAction').value);data.set('target',$('#bannerTarget')?.value||'');data.set('active',String($('#bannerActive').checked));
  for(const [key,id] of [['startsAt','bannerStarts'],['endsAt','bannerEnds']]){const value=$('#'+id).value;data.set(key,value?new Date(value).toISOString():'')}
  data.set('removeMobile',String(mobileRemoved));for(const kind of ['desktop','mobile'])if(blobs[kind])data.set(kind,blobs[kind],kind+'.webp');
  busy=true;$('#saveBanner').disabled=true;message('Saving banner...');
  try{const d=await request('/admin/banners'+(editing?'/'+encodeURIComponent(editing):''),{method:editing?'PUT':'POST',body:data});rows=d.banners;$('#bannerEditor').hidden=true;clearPreviews();message(d.message);window.swrInvalidate?.('banners','local');render();await load()}
  catch(err){message(err.message,true)}finally{busy=false;$('#saveBanner').disabled=false;render()}
 }
 $('#bannerForm').addEventListener('submit',save);
 async function reorder(ids){if(busy)return;busy=true;try{const d=await request('/admin/banners/reorder',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});rows=d.banners;render();message('Banner order saved')}catch(e){message(e.message,true);await load().catch(()=>{})}finally{busy=false;render()}}
 $('#bannerList').addEventListener('click',async e=>{const btn=e.target.closest('[data-op]'),card=e.target.closest('[data-banner-id]');if(!btn||!card||busy)return;const b=rows.find(x=>x._id===card.dataset.bannerId);if(!b)return;
  const op=btn.dataset.op;if(op==='edit'){edit(b);return}
  if(op==='up'||op==='down'){const ids=rows.map(x=>x._id),i=ids.indexOf(b._id),j=i+(op==='up'?-1:1);if(j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];await reorder(ids);return}
  if(op==='delete'&&!confirm(`Delete banner "${b.title}"?`))return;
  busy=true;btn.disabled=true;
  try{let d;if(op==='delete')d=await request('/admin/banners/'+b._id,{method:'DELETE'});else{const form=new FormData();for(const key of ['title','altText','action','target','startsAt','endsAt'])form.set(key,b[key]||'');form.set('borderColor',border(b.borderColor));form.set('active',String(!b.active));d=await request('/admin/banners/'+b._id,{method:'PUT',body:form})}rows=d.banners;message(d.message);await load()}
  catch(err){message(err.message,true)}finally{busy=false;render()}
 });
 $('#bannerList').addEventListener('dragstart',e=>{if(e.target.tagName==='IMG'){e.preventDefault();return}dragId=e.target.closest('[data-banner-id]')?.dataset.bannerId||'';if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragId)}});
 $('#bannerList').addEventListener('dragover',e=>{if(dragId)e.preventDefault()});
 $('#bannerList').addEventListener('drop',e=>{e.preventDefault();const id=e.target.closest('[data-banner-id]')?.dataset.bannerId;if(!dragId||!id||id===dragId)return;const ids=rows.map(x=>x._id),from=ids.indexOf(dragId),to=ids.indexOf(id);ids.splice(from,1);ids.splice(to,0,dragId);dragId='';reorder(ids)});
 $('#bannerList').addEventListener('dragend',()=>dragId='');
 $('#bannerCleanup').addEventListener('click',async()=>{try{const d=await request('/admin/banners/cleanup',{method:'POST'});message(d.cleanupPending?'Some images still need cleanup. Retry later.':'Image cleanup complete',!!d.cleanupPending);await load()}catch(e){message(e.message,true)}});
 // Exact-size crop editor: pan/zoom, keyboard-accessible sliders, and deterministic output.
 const dialog=document.getElementById('bannerCropDialog'),canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),zoom=dialog.querySelector('#bannerCropZoom'),x=dialog.querySelector('#bannerCropX'),y=dialog.querySelector('#bannerCropY');
 let cropImage=null,cropKind='',sourceURL='',pointer=null,returnFocus=null;
 const dimensions={desktop:[1400,680],mobile:[1050,510]};
 function updateBorder(){const value=border($('#bannerBorderColor').value);root.style.setProperty('--banner-border',value);dialog.style.setProperty('--banner-border',value)}
 $('#bannerBorderColor').addEventListener('input',updateBorder);
 function draw(){if(!cropImage)return;const iw=cropImage.naturalWidth,ih=cropImage.naturalHeight,scale=Math.max(canvas.width/iw,canvas.height/ih)*Number(zoom.value),w=canvas.width/scale,h=canvas.height/scale,left=(iw-w)*Number(x.value)/100,top=(ih-h)*Number(y.value)/100;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(cropImage,left,top,w,h,0,0,canvas.width,canvas.height)}
 function closeCrop(){dialog.hidden=true;if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL='';cropImage=null;returnFocus?.focus()}
 async function openCrop(file,kind){
  if(!file)return;if(file.size>20*1024*1024){message('Each image must be 20 MB or smaller.',true);return}
  returnFocus=$(`#bannerFile_${kind}`);cropKind=kind;
  try{
   if(!/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(file.name)&&!/^image\/(jpeg|png|webp|avif|gif|tiff)$/.test(file.type))throw Error('Use JPG, PNG, WebP, AVIF, GIF or TIFF. SVG is not accepted.');
   const image=new Image();sourceURL=URL.createObjectURL(file);
   try{image.src=sourceURL;await image.decode()}catch{
    const form=new FormData();form.set('source',file);const r=await fetch('/admin/banners/preview',{method:'POST',body:form});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.message||'Unable to decode image')}
    URL.revokeObjectURL(sourceURL);sourceURL=URL.createObjectURL(await r.blob());image.src=sourceURL;await image.decode();
   }
   if(image.naturalWidth*image.naturalHeight>40000000)throw Error('Image is too large. Maximum 40 megapixels.');
   cropImage=image;[canvas.width,canvas.height]=dimensions[kind];zoom.value='1';x.value=y.value='50';dialog.querySelector('#bannerCropTitle').textContent=`Crop ${kind} banner · ${canvas.width} × ${canvas.height} px`;dialog.hidden=false;draw();zoom.focus();
  }catch(e){message(e.message,true);if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=''}
 }
 for(const kind of ['desktop','mobile'])$(`#bannerFile_${kind}`).addEventListener('change',e=>openCrop(e.target.files[0],kind));
 for(const input of [zoom,x,y])input.addEventListener('input',draw);
 canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,px:Number(x.value),py:Number(y.value)};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!pointer||!cropImage)return;const rect=canvas.getBoundingClientRect(),scale=Math.max(canvas.width/cropImage.naturalWidth,canvas.height/cropImage.naturalHeight)*Number(zoom.value),overflowX=cropImage.naturalWidth-canvas.width/scale,overflowY=cropImage.naturalHeight-canvas.height/scale;
  if(overflowX>0)x.value=String(Math.max(0,Math.min(100,pointer.px-(e.clientX-pointer.x)*canvas.width/rect.width/scale/overflowX*100)));
  if(overflowY>0)y.value=String(Math.max(0,Math.min(100,pointer.py-(e.clientY-pointer.y)*canvas.height/rect.height/scale/overflowY*100)));draw();
 });
 canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
 dialog.querySelector('#bannerCropCancel').addEventListener('click',closeCrop);
 dialog.querySelector('#bannerCropApply').addEventListener('click',()=>{if(!cropImage)return;draw();canvas.toBlob(blob=>{if(!blob){message('Unable to crop image. Try another file.',true);return}blobs[cropKind]=blob;if(previewURLs[cropKind])URL.revokeObjectURL(previewURLs[cropKind]);previewURLs[cropKind]=URL.createObjectURL(blob);const img=$(`#bannerPreview_${cropKind}`);img.src=previewURLs[cropKind];img.hidden=false;if(cropKind==='mobile'){mobileRemoved=false;$('#removeBannerMobile').hidden=false}closeCrop()},'image/webp',.92)});
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCrop();return}if(e.key==='Tab'){const focus=[...dialog.querySelectorAll('input,button')].filter(el=>!el.disabled),first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 setInterval(()=>{if(document.hidden||!root.classList.contains('on')||busy||!$('#bannerEditor').hidden)return;load().catch(()=>{})},30000);
 render();
})();
