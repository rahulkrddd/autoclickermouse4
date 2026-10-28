const siteScopedPlugin=require('../plugins/siteScopedPlugin');
const mongoose=require('mongoose');
const clean=v=>String(v??'').trim();
const upper=v=>{const x=clean(v).toUpperCase();return x||undefined};
const imageSchema=new mongoose.Schema({url:{type:String,trim:true,default:''},path:{type:String,trim:true,default:''},bucket:{type:String,trim:true,default:''},alt:{type:String,trim:true,default:''},thumbnailUrl:{type:String,trim:true,default:''},thumbnailPath:{type:String,trim:true,default:''},sortOrder:{type:Number,min:0,default:0},primary:{type:Boolean,default:false}},{_id:true});
const attributeSchema=new mongoose.Schema({attributeName:{type:String,required:true,trim:true},attributeValue:{type:String,required:true,trim:true}},{_id:false});
const variantSchema=new mongoose.Schema({
  variantId:{type:String,required:true,trim:true},variantCode:{type:String,trim:true,default:''},sku:{type:String,trim:true,default:'',set:v=>clean(v).toUpperCase()},barcode:{type:String,trim:true,default:''},
  color:{type:String,trim:true,default:''},size:{type:String,trim:true,default:''},material:{type:String,trim:true,default:''},style:{type:String,trim:true,default:''},
  price:{type:Number,required:true,min:0},oldPrice:{type:Number,min:0,default:0},currency:{type:String,trim:true,uppercase:true,default:'INR'},stock:{type:Number,min:0,default:0},reservedStock:{type:Number,min:0,default:0},
  minOrderQty:{type:Number,min:1,default:1},maxOrderQty:{type:Number,min:1,default:1},imageUrl:{type:String,trim:true,default:''},images:{type:[imageSchema],default:[]},active:{type:Boolean,default:true},sortOrder:{type:Number,default:0},
  tags:{type:[String],default:[]},additionalAttributes:{type:[attributeSchema],default:[]}
},{timestamps:true,_id:false});
const schema=new mongoose.Schema({
  legacyId:{type:String,required:true,trim:true,immutable:true},sku:{type:String,trim:true,set:upper},productCode:{type:String,trim:true},slug:{type:String,required:true,trim:true,set:clean},name:{type:String,required:true,trim:true},
  shortDescription:String,description:String,category:String,subCategory:String,tags:{type:[String],default:[]},price:{type:Number,min:0,required:true},oldPrice:{type:Number,min:0,default:0},currency:{type:String,default:'INR'},
  stock:{type:Number,min:0,default:0},reservedStock:{type:Number,min:0,default:0},minOrderQty:{type:Number,min:1,default:1},maxOrderQty:{type:Number,default:null,validate:{validator:v=>v==null||v>=1,message:'maxOrderQty must be null or at least 1'}},
  variationEnabled:{type:Boolean,default:false},variants:{type:[variantSchema],default:[]},
  active:{type:Boolean,default:true},featured:{type:Boolean,default:false},buyNowEnabled:{type:Boolean,default:true},addToCartEnabled:{type:Boolean,default:true},selfPickupAvailable:{type:Boolean,default:false},homeDeliveryAvailable:{type:Boolean,default:true},codAvailable:{type:Boolean,default:false},pickupLocationIds:[{type:mongoose.Schema.Types.ObjectId,ref:'PickupLocation'}],freeShipping:{type:Boolean,default:false},allowBackorder:{type:Boolean,default:false},badge:{type:String,trim:true,default:'NEW',set:v=>clean(v)||'NEW'},
  primaryImage:{type:imageSchema,default:()=>({})},gallery:{type:[imageSchema],default:[]},features:{type:[String],default:[]},specifications:{type:Map,of:String},weight:{type:Number,min:0},dimensions:{length:Number,width:Number,height:Number,unit:String},taxRate:{type:Number,min:0,default:0},hsnCode:String
},{timestamps:true,collection:'products'});
function norm(v){return clean(v).toLowerCase()}
schema.pre('validate',function(next){
  this.variationEnabled=this.variationEnabled===true;
  if(this.maxOrderQty!=null&&this.maxOrderQty<this.minOrderQty)this.invalidate('maxOrderQty','maxOrderQty must be >= minOrderQty');
  if(!this.variationEnabled){this.variants=[];return next()}
  if(!this.variants.length)this.invalidate('variants','At least one variant is required when variations are enabled');
  const ids=new Set(),skus=new Set(),combos=new Set();
  for(const v of this.variants){
    v.variantId=clean(v.variantId); v.variantCode=clean(v.variantCode); v.sku=clean(v.sku).toUpperCase();
    if(!v.variantId){this.invalidate('variants','Every variant requires variantId');continue}
    const id=norm(v.variantId); if(ids.has(id))this.invalidate('variants',`Duplicate variantId: ${v.variantId}`); ids.add(id);
    if(v.sku){const s=norm(v.sku);if(skus.has(s))this.invalidate('variants',`Duplicate variant SKU: ${v.sku}`);skus.add(s)}
    if(v.maxOrderQty<v.minOrderQty)this.invalidate('variants',`maxOrderQty must be >= minOrderQty for ${v.variantId}`);
    if(v.reservedStock>v.stock&&!this.allowBackorder)this.invalidate('variants',`reservedStock cannot exceed stock for ${v.variantId}`);
    const attrs=(v.additionalAttributes||[]).map(a=>`${norm(a.attributeName)}=${norm(a.attributeValue)}`).sort();
    const attrNames=new Set();for(const a of v.additionalAttributes||[]){const n=norm(a.attributeName);if(!n||!norm(a.attributeValue))this.invalidate('variants',`Invalid custom attribute in ${v.variantId}`);if(attrNames.has(n))this.invalidate('variants',`Duplicate attribute ${a.attributeName} in ${v.variantId}`);attrNames.add(n)}
    const combo=[norm(v.color),norm(v.size),norm(v.material),norm(v.style),...attrs].join('|');if(combos.has(combo))this.invalidate('variants',`Duplicate variant combination: ${v.variantId}`);combos.add(combo);
  }
  next();
});
schema.methods.getVariant=function(id){return this.variationEnabled?(this.variants||[]).find(v=>norm(v.variantId)===norm(id))||null:null};
schema.methods.getPurchasable=function(variantId){if(!this.variationEnabled||String(variantId||'').trim()==='__base__')return {variant:null,price:this.price,oldPrice:this.oldPrice,sku:this.sku,stock:this.stock,reservedStock:this.reservedStock,minOrderQty:this.minOrderQty,maxOrderQty:this.maxOrderQty,imageUrl:this.primaryImage?.url||''};const v=this.getVariant(variantId);if(!v||v.active===false)return null;return {variant:v,price:v.price,oldPrice:v.oldPrice,sku:v.sku,stock:v.stock,reservedStock:v.reservedStock,minOrderQty:v.minOrderQty,maxOrderQty:v.maxOrderQty,imageUrl:v.imageUrl||v.images?.find(x=>x.primary)?.url||v.images?.[0]?.url||this.primaryImage?.url||''}}
for(const [keys,opts] of [
 [{legacyId:1},{name:'products_legacyId'}],[{slug:1},{name:'products_slug'}],[{active:1,createdAt:-1,_id:-1},{name:'products_active_created_id'}],[{siteId:1,legacyId:1},{unique:true,name:'uq_products_site_legacy'}],[{siteId:1,slug:1},{unique:true,name:'uq_products_site_slug'}],[{siteId:1,sku:1},{unique:true,partialFilterExpression:{sku:{$type:'string',$gt:''}},name:'uq_products_site_sku'}],[{siteId:1,'variants.sku':1},{name:'products_site_variant_sku'}]
])schema.index(keys,opts);
schema.plugin(siteScopedPlugin);
module.exports=mongoose.model('Product',schema);
