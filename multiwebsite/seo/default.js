module.exports=function createDefaultSeo(siteId){
  return {
    siteName:siteId,
    description:`Browse products and shop securely from ${siteId}.`,
    keywords:['online store','products'],
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN||'',
    logo:`/logo/${siteId}.ico`,
    favicon:'/favicon.ico',
    socialImage:`/logo/${siteId}.ico`
  };
};