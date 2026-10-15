const siteScopedPlugin=require('../plugins/siteScopedPlugin');
const mongoose=require('mongoose');const schema=new mongoose.Schema({key:{type:String,unique:false,required:true},value:mongoose.Schema.Types.Mixed,description:String,updatedBy:String},{timestamps:{createdAt:false,updatedAt:true},collection:'settings'});schema.index({siteId:1,key:1},{unique:true,name:'uq_settings_site_key'});
schema.plugin(siteScopedPlugin);
module.exports=mongoose.model('Setting',schema);