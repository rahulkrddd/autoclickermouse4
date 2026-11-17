const mongoose=require('mongoose'),siteScopedPlugin=require('../plugins/siteScopedPlugin');
const image=new mongoose.Schema({url:String,path:String,bucket:String,width:Number,height:Number},{_id:false});
const entry=new mongoose.Schema({_id:{type:String,required:true},title:{type:String,required:true,maxlength:100},altText:{type:String,maxlength:180},borderColor:{type:String,default:"#808000",match:/^#[0-9a-fA-F]{6}$/},desktop:{type:image,required:true},mobile:image,action:{type:String,enum:['search','product','category','none'],default:'search'},target:{type:String,maxlength:200},active:{type:Boolean,default:true},sortOrder:{type:Number,default:0},startsAt:Date,endsAt:Date},{_id:false});
const schema=new mongoose.Schema({key:{type:String,default:'homepage',enum:['homepage']},banners:{type:[entry],default:[],validate:v=>v.length<=6},cleanupPending:{type:[image],default:[]}},{timestamps:true,collection:'banners'});
schema.plugin(siteScopedPlugin);schema.index({siteId:1,key:1},{unique:true,name:'uq_banner_set_site_key'});
module.exports=mongoose.model('Banner',schema);
