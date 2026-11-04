const PATTERN=/^[a-z0-9][a-z0-9_-]{2,49}$/;
function normalizeSiteId(value){return String(value||'').trim().toLowerCase()}
function requireSiteId(value=process.env.SITE_ID){const siteId=normalizeSiteId(value);if(!PATTERN.test(siteId))throw new Error('SITE_ID is required and must match ^[a-z0-9][a-z0-9_-]{2,49}$');return siteId}
const siteId=requireSiteId();
module.exports={siteId,PATTERN,normalizeSiteId,requireSiteId};