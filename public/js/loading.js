(()=>{
  const raw=window.fetch.bind(window);
  const state={pending:0,button:null,pagePending:true};
  function pageOverlay(){let x=document.querySelector('.page-content-loader');if(!x){x=document.createElement('div');x.className='page-content-loader';x.setAttribute('role','status');x.setAttribute('aria-live','polite');x.innerHTML='<div class="page-content-loader-card"><span class="page-content-loader-ring"></span><b>Loading page</b><small>Please wait while content is prepared</small></div>';document.body.appendChild(x)}return x}
  function pageNeedsOverlay(){return /^(\/admin|\/my-orders|\/review|\/cart)\/?$/.test(location.pathname)}
  function bar(){
    let x=document.querySelector('.global-smart-loader');
    if(!x){x=document.createElement('div');x.className='global-smart-loader';x.innerHTML='<span></span>';document.body.appendChild(x)}
    return x;
  }
  function paint(){const active=state.pagePending||state.pending>0;bar().classList.toggle('show',active);pageOverlay().classList.toggle('show',pageNeedsOverlay()&&state.pagePending)}
  document.addEventListener('pointerdown',e=>state.button=e.target.closest('button,a'),true);
  document.addEventListener('DOMContentLoaded',paint);
  window.addEventListener('load',()=>{state.pagePending=false;paint()},{once:true});
  window.addEventListener('pageshow',()=>{state.pagePending=false;paint()});
  window.addEventListener('beforeunload',()=>{state.pagePending=true;paint()});
  window.fetch=(...args)=>{
    const button=state.button;state.button=null;
    if(button?.tagName==='BUTTON'&&!button.disabled&&!button.matches('.heart,#wishlistFilter,[data-no-loading]'))button.classList.add('smart-action-loading');
    state.pending++;paint();
    return raw(...args).finally(()=>{
      state.pending=Math.max(0,state.pending-1);
      if(button)button.classList.remove('smart-action-loading');
      paint();
    });
  };
  paint();
})();