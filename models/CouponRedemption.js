const mongoose=require('mongoose');
const schema=new mongoose.Schema({couponId:{type:mongoose.Schema.Types.ObjectId,ref:'Coupon',required:true},customerKey:{type:String,required:true},orderId:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true},amount:{type:Number,min:0,default:0}},{timestamps:true,collection:'coupon_redemptions'});
schema.index({couponId:1,orderId:1},{unique:true});schema.index({couponId:1,customerKey:1});
module.exports=mongoose.model('CouponRedemption',schema);