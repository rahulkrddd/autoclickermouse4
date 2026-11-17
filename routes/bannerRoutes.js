const express=require('express'),multer=require('multer'),crypto=require('crypto');
const {auth}=require('../services/adminAuthService'),service=require('../services/bannerService'),Product=require('../models/Product');
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:service.MAX_UPLOAD,files:2,fields:15}}).fields([{name:'desktop',maxCount:1},{name:'mobile',maxCount:1}]);
const handle=fn=>async(q,s)=>{try{await fn(q,s)}catch(e){s.status(e.status||400).json({message:e.code==='LIMIT_FILE_SIZE'?'Each image must be 20 MB or smaller':e.message||'Banner operation failed'})}};
const files=(q,s,n)=>upload(q,s,e=>e?s.status(422).json({message:e.message}):n());
router.get('/api/banners',handle(async(q,s)=>{const state=await service.state();s.set('Cache-Control','no-store');s.json(service.publicRows(state.banners))}));
router.get('/admin/banners',auth,handle(async(q,s)=>{const state=await service.state();s.set('Cache-Control','no-store');s.json({banners:state.banners,max:6,cleanupPending:(state.cleanupPending||[]).length})}));
router.get('/admin/banners/options',auth,handle(async(q,s)=>{const rows=await Product.find({active:true}).select('name slug category').sort({name:1}).lean();s.json({products:rows.map(p=>({name:p.name,slug:p.slug})),categories:[...new Set(rows.map(p=>p.category).filter(Boolean))].sort()})}));
const previewUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:service.MAX_UPLOAD,files:1}}).single('source');
router.post('/admin/banners/preview',auth,(q,s,n)=>previewUpload(q,s,e=>e?s.status(422).json({message:e.message}):n()),handle(async(q,s)=>{
 if(!q.file)throw Error('Choose an image');const sharp=require('sharp'),meta=await sharp(q.file.buffer,{limitInputPixels:40000000,animated:false}).metadata();
 if(!['jpeg','png','webp','avif','heif','gif','tiff'].includes(meta.format))throw Error('Unsupported image format');
 const output=await sharp(q.file.buffer,{limitInputPixels:40000000,animated:false}).rotate().resize(2400,2400,{fit:'inside',withoutEnlargement:true}).png().toBuffer();s.set('Cache-Control','no-store');s.type('png').send(output);
}));
router.post('/admin/banners/cleanup',auth,handle(async(q,s)=>s.json({cleanupPending:await service.retryCleanup()})));
router.patch('/admin/banners/reorder',auth,handle(async(q,s)=>{const state=await service.state(),ids=q.body.ids;
 if(!Array.isArray(ids)||ids.length!==state.banners.length||new Set(ids).size!==ids.length||ids.some(id=>!state.banners.some(b=>b._id===id)))throw Object.assign(Error('Provide every banner exactly once'),{status:422});
 const next=await service.commit(state,ids.map(id=>state.banners.find(b=>b._id===id)));s.json({banners:next.banners});
}));
router.post('/admin/banners',auth,files,handle(async(q,s)=>{
 const data=service.validate(q.body);await service.validateTarget(data);const state=await service.state();if(state.banners.length>=6)throw Object.assign(Error('Maximum 6 banners are allowed per site'),{status:409});
 if(!q.files?.desktop?.[0])throw Object.assign(Error('Desktop banner image is required'),{status:422});
 const uploaded=[];let committed=false;
 try{data.desktop=await service.upload(q.files.desktop[0],'desktop');uploaded.push(data.desktop);if(q.files.mobile?.[0]){data.mobile=await service.upload(q.files.mobile[0],'mobile');uploaded.push(data.mobile)}
 const next=await service.commit(state,[...state.banners,{...data,_id:crypto.randomUUID()}]);committed=true;s.status(201).json({message:'Banner added',banners:next.banners});
 }finally{if(!committed)await service.remove(uploaded)}
}));
router.put('/admin/banners/:id',auth,files,handle(async(q,s)=>{
 const data=service.validate(q.body);await service.validateTarget(data);const state=await service.state(),old=state.banners.find(b=>b._id===q.params.id);if(!old)throw Object.assign(Error('Banner not found'),{status:404});
 const uploaded=[],obsolete=[];let committed=false;
 try{for(const kind of ['desktop','mobile'])if(q.files?.[kind]?.[0]){data[kind]=await service.upload(q.files[kind][0],kind);uploaded.push(data[kind]);if(old[kind])obsolete.push(old[kind])}
 if(q.body.removeMobile==='true'&&!data.mobile){data.mobile=null;if(old.mobile)obsolete.push(old.mobile)}
 const next=await service.commit(state,state.banners.map(b=>b._id===old._id?{...b,...data}:b));committed=true;const pending=await service.remove(obsolete);s.json({message:pending?'Banner updated; image cleanup pending':'Banner updated',banners:next.banners,cleanupPending:pending});
 }finally{if(!committed)await service.remove(uploaded)}
}));
router.delete('/admin/banners/:id',auth,handle(async(q,s)=>{const state=await service.state(),old=state.banners.find(b=>b._id===q.params.id);if(!old)throw Object.assign(Error('Banner not found'),{status:404});
 const next=await service.commit(state,state.banners.filter(b=>b._id!==old._id));const pending=await service.remove([old.desktop,old.mobile]);s.json({message:pending?'Banner deleted; image cleanup pending':'Banner deleted',banners:next.banners,cleanupPending:pending});
}));
module.exports={router};
