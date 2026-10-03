const mongoose=require('mongoose');
const image={url:String,path:String,bucket:String,alt:String,thumbnailUrl:String,thumbnailPath:String};
const normalize=v=>String(v??'').trim();
const normalizeSlug=v=>normalize(v).toLowerCase();
const normalizeSku=v=>{const x=normalize(v).toUpperCase();return x||undefined};
const schema=new mongoose.Schema({
  legacyId:{type:String,required:true,trim:true,immutable:true},
  sku:{type:String,trim:true,set:normalizeSku},
  productCode:{type:String,trim:true},
  slug:{type:String,required:true,trim:true,set:normalizeSlug},
  name:{type:String,required:true,trim:true},shortDescription:String,description:String,category:String,subCategory:String,tags:[String],
  price:{type:Number,min:0,required:true},oldPrice:{type:Number,min:0,default:0},currency:{type:String,default:'INR'},
  stock:{type:Number,min:0,default:0},reservedStock:{type:Number,min:0,default:0},minOrderQty:{type:Number,min:1,default:1},
  maxOrderQty:{type:Number,default:null,validate:{validator:v=>v==null||v>=1,message:'maxOrderQty must be null or at least 1'}},
  active:{type:Boolean,default:true},featured:{type:Boolean,default:false},buyNowEnabled:{type:Boolean,default:true},addToCartEnabled:{type:Boolean,default:true},
  selfPickupAvailable:{type:Boolean,default:false},homeDeliveryAvailable:{type:Boolean,default:true},codAvailable:{type:Boolean,default:false},
  pickupLocationIds:[{type:mongoose.Schema.Types.ObjectId,ref:'PickupLocation'}],allowBackorder:{type:Boolean,default:false},badge:String,
  primaryImage:image,gallery:[{...image,sortOrder:Number}],features:[String],specifications:{type:Map,of:String},weight:{type:Number,min:0},
  dimensions:{length:Number,width:Number,height:Number,unit:String},taxRate:{type:Number,min:0,default:0},hsnCode:String
},{timestamps:true,collection:'products'});
schema.index({legacyId:1},{unique:true,name:'uq_products_legacyId'});
schema.index({slug:1},{unique:true,name:'uq_products_slug'});
schema.index({sku:1},{unique:true,partialFilterExpression:{sku:{$type:'string',$gt:''}},name:'uq_products_sku_nonempty'});
schema.index({active:1,createdAt:-1,_id:-1},{name:'products_active_created_id'});
schema.index({active:1,featured:1,createdAt:-1,_id:-1},{name:'products_active_featured_created_id'});
schema.index({active:1,category:1,createdAt:-1,_id:-1},{name:'products_active_category_created_id'});
schema.pre('validate',function(next){this.legacyId=normalize(this.legacyId);this.slug=normalizeSlug(this.slug);this.sku=normalizeSku(this.sku);if(this.maxOrderQty!=null&&this.maxOrderQty<this.minOrderQty)this.invalidate('maxOrderQty','maxOrderQty must be >= minOrderQty');next()});
module.exports=mongoose.model('Product',schema);