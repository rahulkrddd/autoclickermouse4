(() => {
  'use strict';
  const path=location.pathname.replace(/\/$/,'')||'/';
  const absolute=(value,base)=>{try{return new URL(value,base).href}catch{return value}};
  const setMeta=(selector,attrs={})=>{let node=document.head.querySelector(selector);if(!node){node=document.createElement('meta');document.head.appendChild(node)}Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));return node};
  const setLink=(rel,href)=>{let node=document.head.querySelector(`link[rel="${rel}"]`);if(!node){node=document.createElement('link');node.rel=rel;document.head.appendChild(node)}node.href=href;return node};
  const setJsonLd=(id,data)=>{let node=document.getElementById(id);if(!node){node=document.createElement('script');node.id=id;node.type='application/ld+json';document.head.appendChild(node)}node.textContent=JSON.stringify(data)};
  const pageLabel=()=>path==='/'?'Home':path==='/cart'?'Cart':path==='/review'?'Reviews':path==='/FAQs'?'FAQs':path==='/policies'?'Policies':path==='/my-orders'?'My Orders':path==='/admin'?'Admin':path.startsWith('/product/')?'Product':'Store';
  const imageSeo=()=>document.querySelectorAll('img').forEach(img=>{const fallback=img.closest('[data-product-name]')?.dataset.productName||img.alt||'Product image';if(!img.alt)img.alt=fallback;if(!img.title)img.title=img.alt});
  async function run(){
    const response=await fetch('/api/seo-config',{credentials:'same-origin'});if(!response.ok)return;const cfg=await response.json();
    const base=(cfg.canonicalDomain||location.origin).replace(/\/$/,'');
    const canonical=base+location.pathname;
	let title =
	path === '/'
		? cfg.siteName
		: `${pageLabel()} | ${cfg.siteName}`;
	
    let description=cfg.description;
    let image=absolute(cfg.socialImage||cfg.logo,base);
    let type='website';
    let product=null;
    if(path.startsWith('/product/')){
      const slug=decodeURIComponent(path.split('/').pop());
      const r=await fetch('/api/products/'+encodeURIComponent(slug));
      if(r.ok){product=await r.json();title=`${product.name} | Buy Online | ${cfg.siteName}`; description=product.shortDescription||product.description||cfg.description;image=absolute(product.image||cfg.socialImage,base);type='product'}
    }
    document.title=title;
    setMeta('meta[name="description"]',{name:'description',content:description});
    setMeta('meta[name="keywords"]',{name:'keywords',content:(cfg.keywords||[]).join(', ')});
    setMeta('meta[property="og:title"]',{property:'og:title',content:title});
    setMeta('meta[property="og:description"]',{property:'og:description',content:description});
    setMeta('meta[property="og:image"]',{property:'og:image',content:image});
    setMeta('meta[property="og:url"]',{property:'og:url',content:canonical});
    setMeta('meta[property="og:type"]',{property:'og:type',content:type});
    setMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    setMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    setMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    setMeta('meta[name="twitter:image"]',{name:'twitter:image',content:image});
    setLink('canonical',canonical);setLink('icon',cfg.favicon);
    setJsonLd('seo-organization-schema',{'@context':'https://schema.org','@type':'Organization',name:cfg.siteName,url:base,logo:absolute(cfg.logo,base)});
    if(product){
      const rating=product.reviewSummary||{};
      const schema={'@context':'https://schema.org','@type':'Product',name:product.name,description,sku:product.sku||product.id,image:[product.image,...(product.gallery||[])].filter(Boolean).map(x=>absolute(x,base)),offers:{'@type':'Offer',priceCurrency:product.currency||'INR',price:Number(product.price),availability:Number(product.stock)>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:canonical}};
      if(Number(rating.count)>0&&Number(rating.average)>0)schema.aggregateRating={'@type':'AggregateRating',ratingValue:Number(rating.average).toFixed(1),reviewCount:Number(rating.count)};
      if(!document.getElementById('seo-product-schema-server'))setJsonLd('seo-product-schema',schema);
      if(!document.getElementById('seo-breadcrumb-schema-server'))setJsonLd('seo-breadcrumb-schema',{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:base+'/'},{'@type':'ListItem',position:2,name:product.name,item:canonical}]});
    }
    imageSeo();new MutationObserver(imageSeo).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('DOMContentLoaded',imageSeo,{once:true});
  }
  run().catch(()=>{});
})();