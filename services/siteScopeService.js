const {PATTERN}=require('../config/site');
function assertSiteId(siteId){if(!PATTERN.test(String(siteId||'')))throw new Error('Invalid siteId');return siteId}
function filter(siteId,query={}){assertSiteId(siteId);if(query.siteId&&query.siteId!==siteId)throw new Error('Cross-site filter rejected');return {...query,siteId}}
function document(siteId,value={}){assertSiteId(siteId);if(value.siteId&&value.siteId!==siteId)throw new Error('Cross-site document rejected');return {...value,siteId}}
function stripClientSiteId(value={}){const out={...value};delete out.siteId;return out}
module.exports={assertSiteId,filter,document,stripClientSiteId};