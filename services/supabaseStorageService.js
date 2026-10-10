const crypto=require('crypto');
const{getSupabase}=require('../config/supabase');
const{siteId:configuredSiteId,PATTERN}=require('../config/site');
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
const MAX=5*1024*1024;
const bucketName=()=>String(process.env.SUPABASE_STORAGE_BUCKET||'').trim();
function validateImage(file){if(!file)throw Error('A valid image file is required');if(!ALLOWED.has(file.mimetype))throw Error('Only JPEG, JPG, PNG and WebP images are allowed');if(!Number.isFinite(file.size)||file.size<=0||file.size>MAX)throw Error('Each image must be 5 MB or smaller');return true}
function safeProductId(v){const x=String(v||'').trim().replace(/[^a-zA-Z0-9_-]/g,'-').replace(/-+/g,'-').slice(0,100);if(!x)throw Error('Invalid product ID for image storage');return x}
function isManagedSupabaseImage(meta,siteId=configuredSiteId){const bucket=bucketName();const escaped=String(siteId||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp('^'+escaped+'/products/[a-zA-Z0-9_-]+/[a-f0-9-]+\\.(jpg|png|webp)$');return Boolean(PATTERN.test(String(siteId||''))&&meta&&typeof meta==='object'&&bucket&&meta.bucket===bucket&&typeof meta.path==='string'&&pattern.test(meta.path)&&!meta.path.includes('..'))}
async function uploadProductImage(siteId,file,productId){if(!PATTERN.test(String(siteId||''))||siteId!==configuredSiteId)throw Error('Invalid site for image storage');validateImage(file);if(!Buffer.isBuffer(file.buffer))throw Error('A valid image file is required');const client=getSupabase(),bucket=bucketName();if(!client||!bucket)throw Error('Supabase Storage is not configured');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.mimetype];const objectPath=`${siteId}/products/${safeProductId(productId)}/${crypto.randomUUID()}.${ext}`;


const {error}=await client.storage
  .from(bucket)
  .upload(objectPath,file.buffer,{
      contentType:file.mimetype,
      upsert:false,
      cacheControl:'3600'
  });

if(error){
    console.error('SUPABASE ERROR:', error);
    throw Error(
        error.message ||
        JSON.stringify(error)
    );
}
const{data}=client.storage.from(bucket).getPublicUrl(objectPath);if(!data?.publicUrl){await client.storage.from(bucket).remove([objectPath]).catch(()=>{});throw Error('Unable to create public image URL')}return{url:data.publicUrl,path:objectPath,bucket,alt:'',thumbnailUrl:'',thumbnailPath:''}}


function metas(input){const a=Array.isArray(input)?input:[input],out=[];for(const m of a){if(!m)continue;out.push(m);if(m.thumbnailPath)out.push({path:m.thumbnailPath,bucket:m.bucket,url:m.thumbnailUrl})}return out}
async function remove(meta){if(!isManagedSupabaseImage(meta))return{deleted:[],failed:[]};const client=getSupabase();if(!client)return{deleted:[],failed:[meta.path]};const{error}=await client.storage.from(meta.bucket).remove([meta.path]);return error?{deleted:[],failed:[meta.path]}:{deleted:[meta.path],failed:[]}}
async function removeMany(metadata){const unique=new Map();for(const m of metas(metadata))if(isManagedSupabaseImage(m))unique.set(`${m.bucket}:${m.path}`,m);const result={deleted:[],failed:[]};for(const m of unique.values()){try{const r=await remove(m);result.deleted.push(...r.deleted);result.failed.push(...r.failed)}catch{result.failed.push(m.path)}}return result}
module.exports={validateImage,uploadProductImage,remove,removeMany,isManagedSupabaseImage,MAX_IMAGE_BYTES:MAX,ALLOWED_MIME_TYPES:[...ALLOWED]};