const fs=require('fs');

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const absoluteUrl=(value,base)=>{try{return new URL(String(value||''),base).href}catch{return String(value||'')}};
const cleanBase=(configured,req)=>String(configured||`${req.protocol}://${req.get('host')}`).replace(/\/$/,'');
const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const productDescription=(product,fallback)=>compact(product.shortDescription||product.description||fallback).slice(0,320);

function productSeo({product,cfg,req}){
  const base=cleanBase(cfg.canonicalDomain,req);
  const canonical=`${base}/product/${encodeURIComponent(product.slug)}`;
  const title=`${compact(product.name)} | Buy Online | ${compact(cfg.siteName)}`;
  const description=productDescription(product,cfg.description);
  const rawImages=[product.image,product.primaryImage?.url,...(product.gallery||[]).map(item=>typeof item==='string'?item:item?.url)].filter(Boolean);
  const images=[...new Set(rawImages.map(image=>absoluteUrl(image,base)))];
  if(!images.length&&cfg.socialImage)images.push(absoluteUrl(cfg.socialImage,base));
  const availability=Number(product.stock)>0?'https://schema.org/InStock':'https://schema.org/OutOfStock';
  const schema={
    '@context':'https://schema.org','@type':'Product',name:compact(product.name),description,
    sku:compact(product.sku||product.legacyId||product.id||product.slug),image:images,
    offers:{'@type':'Offer',url:canonical,priceCurrency:product.currency||'INR',price:Number(product.price),availability,itemCondition:'https://schema.org/NewCondition'}
  };
  return {base,canonical,title,description,image:images[0]||'',schema};
}

function injectProductSeo(template,context){
  const {cfg}=context;
  const data=productSeo(context);
  const tags=[
    `<title>${escapeHtml(data.title)}</title>`,
    `<meta name="description" content="${escapeHtml(data.description)}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`,
    `<link rel="canonical" href="${escapeHtml(data.canonical)}">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="${escapeHtml(cfg.siteName)}">`,
    `<meta property="og:title" content="${escapeHtml(data.title)}">`,
    `<meta property="og:description" content="${escapeHtml(data.description)}">`,
    `<meta property="og:url" content="${escapeHtml(data.canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(data.image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(data.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(data.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(data.image)}">`,
    `<script type="application/ld+json" id="seo-product-schema-server">${safeJson(data.schema)}</script>`,
    `<script type="application/ld+json" id="seo-breadcrumb-schema-server">${safeJson({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${data.base}/`},{'@type':'ListItem',position:2,name:context.product.name,item:data.canonical}]})}</script>`
  ].join('');
  return template
    .replace(/<title>[\s\S]*?<\/title>/i,'')
    .replace('</head>',`${tags}</head>`);
}

function renderProductFile(filePath,context){return injectProductSeo(fs.readFileSync(filePath,'utf8'),context)}
module.exports={escapeHtml,productSeo,injectProductSeo,renderProductFile};