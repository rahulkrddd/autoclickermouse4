const fs=require('fs');

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const absoluteUrl=(value,base)=>{try{return new URL(String(value||''),base).href}catch{return String(value||'')}};
const cleanBase=(configured,req)=>String(configured||`${req.protocol}://${req.get('host')}`).replace(/\/$/,'');
const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const productDescription=(product,fallback)=>compact(product.shortDescription||product.description||fallback).slice(0,320);
const PAGE_LABELS={'/':'','/cart':'Cart','/my-orders':'My Orders','/review':'Reviews','/FAQs':'FAQs','/policies':'Policies','/admin':'Admin'};

function productSeo({product,cfg,req}){
  const base=cleanBase(cfg.canonicalDomain,req);
  const canonical=`${base}/product/${encodeURIComponent(product.slug)}`;
  const title=`${compact(product.name)} | Buy Online | ${compact(cfg.siteName)}`;
  const description=productDescription(product,cfg.description);
  const rawImages=[product.image,product.primaryImage?.url,...(product.gallery||[]).map(item=>typeof item==='string'?item:item?.url)].filter(Boolean);
  const images=[...new Set(rawImages.map(image=>absoluteUrl(image,base)))];
  if(!images.length&&cfg.socialImage)images.push(absoluteUrl(cfg.socialImage,base));
  const availability=Number(product.stock)>0?'https://schema.org/InStock':'https://schema.org/OutOfStock';
  const schema={'@context':'https://schema.org','@type':'Product',name:compact(product.name),description,sku:compact(product.sku||product.legacyId||product.id||product.slug),image:images,offers:{'@type':'Offer',url:canonical,priceCurrency:product.currency||'INR',price:Number(product.price),availability,itemCondition:'https://schema.org/NewCondition'}};
  return {base,canonical,title,description,image:images[0]||'',type:'product',schema};
}

function pageSeo({cfg,req}){
  const base=cleanBase(cfg.canonicalDomain,req);
  const pathname=req.path||'/';
  const canonical=base+(pathname==='/'?'/':pathname);
  const label=PAGE_LABELS[pathname]??'Store';
  const title=label?`${label} | ${compact(cfg.siteName)}`:compact(cfg.homeTitle||cfg.siteName);
  return {base,canonical,title,description:compact(cfg.description).slice(0,320),image:absoluteUrl(cfg.socialImage||cfg.logo,base),type:'website'};
}

function stripSeo(template){
  return template
    .replace(/<title>[\s\S]*?<\/title>/gi,'')
    .replace(/<meta\s+(?:name|property)=["'](?:description|keywords|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,'')
    .replace(/<link\s+rel=["'](?:canonical|icon|shortcut icon)["'][^>]*>/gi,'')
    .replace(/<script[^>]+id=["']seo-(?:organization|product|breadcrumb)-schema(?:-server)?["'][\s\S]*?<\/script>/gi,'');
}

function commonTags(data,cfg){
  const organization={'@context':'https://schema.org','@type':'Organization',name:cfg.siteName,url:data.base,logo:absoluteUrl(cfg.logo,data.base)};
  return [
    `<title>${escapeHtml(data.title)}</title>`,
    `<meta name="description" content="${escapeHtml(data.description)}">`,
    `<meta name="keywords" content="${escapeHtml((cfg.keywords||[]).join(', '))}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`,
    `<link rel="canonical" href="${escapeHtml(data.canonical)}">`,
    `<link rel="icon" href="${escapeHtml(absoluteUrl(cfg.favicon||cfg.logo,data.base))}">`,
    `<meta property="og:type" content="${escapeHtml(data.type)}">`,
    `<meta property="og:site_name" content="${escapeHtml(cfg.siteName)}">`,
    `<meta property="og:title" content="${escapeHtml(data.title)}">`,
    `<meta property="og:description" content="${escapeHtml(data.description)}">`,
    `<meta property="og:url" content="${escapeHtml(data.canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(data.image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(data.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(data.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(data.image)}">`,
    `<script type="application/ld+json" id="seo-organization-schema-server">${safeJson(organization)}</script>`
  ].join('');
}

function injectBranding(template,cfg){
  const name=escapeHtml(cfg.siteName);
  const search=escapeHtml(cfg.searchPlaceholder||`Search ${cfg.siteName}`);
  const footer=escapeHtml(cfg.footerBrand||cfg.siteName);
  return template
    .replace(/<a class="brand" href="\/">[\s\S]*?<\/a>/i,`<a class="brand" href="/">${name}</a>`)
    .replace(/(<input[^>]+id="globalSearch"[^>]+placeholder=")[^"]*(")/i,`$1${search}$2`)
    .replace(/<footer class="footer">[\s\S]*?<\/footer>/i,`<footer class="footer">© ${footer} · <a href="/policies">Privacy & Policies</a></footer>`);
}

function injectPageSeo(template,context){
  const data=pageSeo(context);
  const tags=commonTags(data,context.cfg);
  return injectBranding(stripSeo(template),context.cfg).replace('</head>',`${tags}</head>`);
}

function injectProductSeo(template,context){
  const data=productSeo(context);
  const productTags=[
    commonTags(data,context.cfg),
    `<script type="application/ld+json" id="seo-product-schema-server">${safeJson(data.schema)}</script>`,
    `<script type="application/ld+json" id="seo-breadcrumb-schema-server">${safeJson({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${data.base}/`},{'@type':'ListItem',position:2,name:context.product.name,item:data.canonical}]})}</script>`
  ].join('');
  return injectBranding(stripSeo(template),context.cfg).replace('</head>',`${productTags}</head>`);
}

function renderPageFile(filePath,context){return injectPageSeo(fs.readFileSync(filePath,'utf8'),context)}
function renderProductFile(filePath,context){return injectProductSeo(fs.readFileSync(filePath,'utf8'),context)}
module.exports={escapeHtml,pageSeo,productSeo,injectPageSeo,injectProductSeo,renderPageFile,renderProductFile};
