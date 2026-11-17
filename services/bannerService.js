const crypto=require('crypto'),sharp=require('sharp');
const Banner=require('../models/Banner'),Product=require('../models/Product');
const {siteId}=require('../config/site'),{getSupabase}=require('../config/supabase');
const MAX_BANNERS=6,MAX_UPLOAD=20*1024*1024;
const sizes={desktop:{width:1400,height:680},mobile:{width:1050,height:510}};
const fail=(message,status=422)=>Object.assign(Error(message),{status});
const text=(v,max)=>String(v??'').trim().slice(0,max);
function date(v){if(!v)return null;const d=new Date(v);if(!Number.isFinite(d.getTime()))throw fail('Invalid schedule date');return d}
function validate(body){
 if(body.siteId!==undefined&&body.siteId!==siteId)throw fail('Site override rejected',403);
 const title=text(body.title,100),altText=text(body.altText,180),action=text(body.action||'search',20),target=text(body.target,200);
 const borderColor=body.borderColor===undefined?'#808000':String(body.borderColor).trim();
 if(!/^#[0-9a-fA-F]{6}$/.test(borderColor))throw fail('Choose a valid border color');
 if(!title)throw fail('Banner title is required');
 if(!['search','product','category','none'].includes(action))throw fail('Invalid banner action');
 if(action!=='none'&&!target)throw fail('Choose a search term, product or category');
 const startsAt=date(body.startsAt),endsAt=date(body.endsAt);
 if(startsAt&&endsAt&&endsAt<=startsAt)throw fail('End date must be after start date');
 return{title,altText,borderColor:borderColor.toLowerCase(),action,target:action==='none'?'':target,active:body.active===true||body.active==='true',startsAt,endsAt};
}
async function validateTarget(data){
 if(data.action==='product'&&!(await Product.exists({slug:data.target,active:true})))throw fail('Selected product is not available on this site');
 if(data.action==='category'&&!(await Product.exists({category:data.target,active:true})))throw fail('Selected category is not available on this site');
}
function eligible(b,now=Date.now()){return b.active===true&&(!b.startsAt||new Date(b.startsAt).getTime()<=now)&&(!b.endsAt||new Date(b.endsAt).getTime()>now)}
function publicRows(rows){return rows.filter(b=>eligible(b)).sort((a,b)=>a.sortOrder-b.sortOrder).map(b=>({_id:b._id,title:b.title,altText:b.altText,borderColor:b.borderColor||'#808000',desktop:{url:b.desktop.url},mobile:b.mobile?.url?{url:b.mobile.url}:null,action:b.action,target:b.target,startsAt:b.startsAt,endsAt:b.endsAt}));}
let ready;
async function state(){
 if(!ready)ready=Banner.init().then(()=>Banner.createIndexes()).catch(e=>{ready=null;throw e});await ready;
 try{await Banner.updateOne({key:'homepage'},{$setOnInsert:{key:'homepage',banners:[],__v:0}},{upsert:true})}catch(e){if(e.code!==11000)throw e}
 return Banner.findOne({key:'homepage'}).lean();
}
async function commit(previous,rows){
 if(rows.length>MAX_BANNERS)throw fail('Maximum 6 banners are allowed per site',409);
 const result=await Banner.findOneAndUpdate({key:'homepage',__v:previous.__v||0},{$set:{banners:rows.map((b,i)=>({...b,sortOrder:i}))},$inc:{__v:1}},{new:true,runValidators:true}).lean();
 if(!result)throw fail('Banners changed in another session. Refresh and retry.',409);
 require('./publicReadCache').clear();return result;
}
async function optimize(file,kind){
 if(!file||!Buffer.isBuffer(file.buffer)||file.buffer.length===0||file.buffer.length>MAX_UPLOAD)throw fail('Choose an image up to 20 MB');
 const dim=sizes[kind];if(!dim)throw fail('Invalid banner image type');
 let meta;try{meta=await sharp(file.buffer,{limitInputPixels:40000000,animated:false}).metadata()}catch{throw fail('Unsupported or damaged image. Use JPG, PNG, WebP, AVIF, GIF or TIFF.')}
 if(!['jpeg','png','webp','avif','heif','gif','tiff'].includes(meta.format))throw fail('Unsupported image format. SVG and executable files are not allowed.');
 const crop=file.crop;let image=sharp(file.buffer,{limitInputPixels:40000000,animated:false}).rotate();
 if(crop){
  const values=['left','top','width','height'].map(k=>Number(crop[k]));
  if(values.some(v=>!Number.isFinite(v)||v<0)||values[2]<1||values[3]<1)throw fail('Invalid crop area');
  // Browser crop is already baked into uploaded WebP; optional API crop uses auto-oriented coordinates.
  const rotated=await image.toBuffer({resolveWithObject:true});
  const [left,top,width,height]=values.map(Math.round);
  if(left+width>rotated.info.width||top+height>rotated.info.height)throw fail('Crop area is outside image');
  image=sharp(rotated.data).extract({left,top,width,height});
 }
 const base=await image.resize(dim.width,dim.height,{fit:'cover',position:'centre',withoutEnlargement:false}).toBuffer();
 let buffer;for(const quality of [86,78,68,56,42]){buffer=await sharp(base).webp({quality,effort:4}).toBuffer();if(buffer.length<=400000)break}
 if(buffer.length>1024*1024)throw fail('Image is too complex. Choose a simpler banner.');
 return{buffer,...dim};
}
async function upload(file,kind){
 const output=await optimize(file,kind),client=getSupabase(),bucket=process.env.SUPABASE_STORAGE_BUCKET;
 if(!client||!bucket)throw fail('Supabase Storage is not configured',503);
 const path=`${siteId}/sliders/${crypto.randomUUID()}.webp`;
 const {error}=await client.storage.from(bucket).upload(path,output.buffer,{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(error)throw error;
 const {data}=client.storage.from(bucket).getPublicUrl(path);
 return{url:data.publicUrl,path,bucket,width:output.width,height:output.height};
}
function managed(m){return m&&m.bucket===process.env.SUPABASE_STORAGE_BUCKET&&new RegExp('^'+siteId+'/sliders/[a-f0-9-]+\\.webp$').test(m.path||'')}
async function remove(images){
 const failed=[];for(const m of images.filter(Boolean)){
  if(!managed(m)){failed.push(m);continue}
  try{const client=getSupabase();if(!client)throw Error('Storage unavailable');const {error}=await client.storage.from(m.bucket).remove([m.path]);if(error)throw error}catch{failed.push(m)}
 }
 if(failed.length)await Banner.updateOne({key:'homepage'},{$addToSet:{cleanupPending:{$each:failed}}});
 return failed.length;
}
async function retryCleanup(){const s=await state(),pending=s.cleanupPending||[];if(!pending.length)return 0;
 // Pull only this batch, retaining entries added by concurrent requests.
 await Banner.updateOne({key:'homepage'},{$pull:{cleanupPending:{path:{$in:pending.map(m=>m.path)}}}});return remove(pending);
}
module.exports={MAX_BANNERS,MAX_UPLOAD,sizes,validate,validateTarget,eligible,publicRows,state,commit,optimize,upload,remove,retryCleanup};
