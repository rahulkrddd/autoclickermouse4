(()=>{
  const prefix=`acm:swr:v2:${window.__SITE_ID__}:`;
  function store(scope){return scope==='local'?localStorage:sessionStorage}
  function read(key,scope='session'){try{const x=JSON.parse(store(scope).getItem(prefix+key)||'null');return x&&Object.hasOwn(x,'data')?x:null}catch{return null}}
  function write(key,data,scope='session'){try{store(scope).setItem(prefix+key,JSON.stringify({savedAt:Date.now(),data}))}catch{}}
  window.swrJSON=function(key,request,{scope='session',onCached,onFresh}={}){
    const cached=read(key,scope);if(cached&&onCached)queueMicrotask(()=>onCached(cached.data));
    const fresh=Promise.resolve().then(request).then(data=>{write(key,data,scope);onFresh?.(data);return data});
    return{cached:cached?.data,fresh};
  };
  window.swrInvalidate=function(key,scope='session'){try{store(scope).removeItem(prefix+key)}catch{}};
})();

(()=>{
 const key=name=>`acm:public:v1:${window.__SITE_ID__}:${name}`,inflight=new Map(),MAX_AGE=7*86400000;
 const read=name=>{try{const value=JSON.parse(localStorage.getItem(key(name))||'null');return value&&Date.now()-value.at<MAX_AGE?value.data:null}catch{return null}};
 const write=(name,data)=>{try{localStorage.setItem(key(name),JSON.stringify({at:Date.now(),data}));if(name.startsWith('product:')||name.startsWith('snapshot:')){const prefix=key(''),keys=Object.keys(localStorage).filter(k=>k.startsWith(prefix)&&/^(product|snapshot):/.test(k.slice(prefix.length)));if(keys.length>100){keys.sort((a,b)=>{try{return JSON.parse(localStorage.getItem(a)).at-JSON.parse(localStorage.getItem(b)).at}catch{return 0}});keys.slice(0,keys.length-100).forEach(k=>localStorage.removeItem(k))}}}catch{}};
 const remove=name=>{try{localStorage.removeItem(key(name))}catch{}};
 const json=url=>{if(inflight.has(url))return inflight.get(url);const task=fetch(url,{cache:'no-store'}).then(async response=>{if(!response.ok){const error=Error('Unable to load latest information');error.status=response.status;throw error}return response.json()}).finally(()=>inflight.delete(url));inflight.set(url,task);return task};
 window.publicDataCache={read,write,remove,json,snapshot:product=>{if(product?.slug&&product?.id)write('snapshot:'+product.slug,product)}};
 // Capture navigation without changing the destination or variant purchase flow.
 document.addEventListener('click',event=>{const link=event.target.closest?.('a[href*="/product/"]');if(!link)return;try{const slug=decodeURIComponent(new URL(link.href,location.href).pathname.split('/').pop()),catalog=read('catalog')||[];const product=catalog.find(p=>p.slug===slug);if(product)window.publicDataCache.snapshot(product)}catch{}},true);
})();