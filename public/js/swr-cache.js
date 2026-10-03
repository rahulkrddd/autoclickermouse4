(()=>{
  const prefix='acm:swr:v1:';
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