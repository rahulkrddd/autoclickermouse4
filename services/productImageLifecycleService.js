const {siteId}=require('../config/site');
const Product=require('../models/Product');
const storage=require('./supabaseStorageService');
const cleanAlt=v=>String(v||'').replace(/[<>]/g,'').trim().slice(0,180);
async function uploadAll(files,productId,alt){const uploaded=[];try{for(const f of files){const m=await storage.uploadProductImage(siteId,f,productId);m.alt=cleanAlt(alt);uploaded.push(m)}return uploaded}catch(e){await storage.removeMany(uploaded);throw e}}
async function createWithImages(productAdmin,body,primary,gallery=[]){if(!primary)throw Object.assign(Error('Primary product image is required'),{status:400});if(1+gallery.length>4)throw Object.assign(Error('A product can have a maximum of 4 images'),{status:400});let result,uploaded=[];try{result=await productAdmin.create({...body,image:'',gallery:[]});uploaded=await uploadAll([primary,...gallery],result.product.legacyId,body.imageAlt||body.name);result.product.primaryImage=uploaded[0];result.product.gallery=uploaded.slice(1).map((m,i)=>({...m,sortOrder:i}));await result.product.save();return result}catch(e){await storage.removeMany(uploaded);if(result?.product?._id)await Product.deleteOne({_id:result.product._id}).catch(()=>{});throw e}}
async function replacePrimary(product,file,alt){const old=product.primaryImage?.toObject?.()||product.primaryImage;const meta=(await uploadAll([file],product.legacyId,alt||product.name))[0];try{product.primaryImage=meta;await product.save()}catch(e){await storage.removeMany([meta]);throw e}const cleanup=await storage.removeMany([old]);return{meta,cleanup}}
async function deleteProductImages(product){return storage.removeMany([product.primaryImage,...(product.gallery||[])])}
module.exports={cleanAlt,uploadAll,createWithImages,replacePrimary,deleteProductImages};
