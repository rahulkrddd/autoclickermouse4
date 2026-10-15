const {siteId:configuredSiteId,PATTERN}=require('../config/site');
const READ=['find','findOne','countDocuments','exists'];
const WRITE=['updateOne','updateMany','findOneAndUpdate','findOneAndDelete','deleteOne','deleteMany','replaceOne'];
function rejectForeign(v){if(v!=null&&String(v)!==configuredSiteId)throw new Error('siteId override rejected')}
function scopeQuery(next){try{const q=this.getQuery();rejectForeign(q.siteId);this.where({siteId:configuredSiteId});const u=this.getUpdate?.();if(u){rejectForeign(u.siteId);rejectForeign(u.$set?.siteId);rejectForeign(u.$setOnInsert?.siteId);u.$setOnInsert={...(u.$setOnInsert||{}),siteId:configuredSiteId};delete u.siteId;if(u.$set)delete u.$set.siteId}next()}catch(e){next(e)}}
module.exports=function siteScopedPlugin(schema){
 if(!schema.path('siteId'))schema.add({siteId:{type:String,required:true,immutable:true,lowercase:true,trim:true,match:PATTERN,index:true}});
 schema.pre('validate',function(next){try{rejectForeign(this.siteId);this.siteId=configuredSiteId;next()}catch(e){next(e)}});
 schema.pre('save',function(next){try{rejectForeign(this.siteId);this.siteId=configuredSiteId;next()}catch(e){next(e)}});
 for(const op of [...READ,...WRITE])schema.pre(op,scopeQuery);
 schema.pre('insertMany',function(next,docs){try{for(const d of docs){rejectForeign(d.siteId);d.siteId=configuredSiteId}next()}catch(e){next(e)}});
 schema.pre('aggregate',function(next){try{const p=this.pipeline(),first=p[0]||{},at=('$geoNear'in first||'$search'in first||'$vectorSearch'in first)?1:0;p.splice(at,0,{$match:{siteId:configuredSiteId}});next()}catch(e){next(e)}});
 const original=schema.statics.bulkWrite;schema.statics.bulkWrite=async function(ops,opt){for(const op of ops){const x=Object.values(op)[0];if(!x)continue;if(x.filter)x.filter={...(x.filter||{}),siteId:configuredSiteId};if(x.document){rejectForeign(x.document.siteId);x.document.siteId=configuredSiteId}if(x.update){x.update.$setOnInsert={...(x.update.$setOnInsert||{}),siteId:configuredSiteId};if(x.update.$set)delete x.update.$set.siteId}}return original?original.call(this,ops,opt):this.collection.bulkWrite(ops,opt)};
};