const siteScopedPlugin=require('../plugins/siteScopedPlugin');
const mongoose=require('mongoose');
const schema=new mongoose.Schema({key:{type:String,required:true},seq:{type:Number,default:0}},{collection:'counters',versionKey:false});
schema.index({siteId:1,key:1},{unique:true,name:'uq_counters_site_key'});
schema.plugin(siteScopedPlugin);
module.exports=mongoose.model('Counter',schema);