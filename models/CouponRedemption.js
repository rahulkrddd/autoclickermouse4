const siteScopedPlugin=require('../plugins/siteScopedPlugin');
const mongoose=require('mongoose');
const schema=new mongoose.Schema({couponId:{type:mongoose.Schema.Types.ObjectId,ref:'Coupon',required:true},customerKey:{type:String,required:true},orderId:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true},amount:{type:Number,min:0,default:0}},{timestamps:true,collection:'coupon_redemptions'});
schema.index({couponId:1,orderId:1},{unique:false});schema.index({couponId:1,customerKey:1});
schema.index({siteId:1,couponId:1,orderId:1},{unique:true,name:'uq_redemption_site_coupon_order'});
schema.plugin(siteScopedPlugin);
module.exports=mongoose.model('CouponRedemption',schema);