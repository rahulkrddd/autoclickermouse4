const path=require('path');
const fs=require('fs');
const {siteId}=require('../../config/site');

const SEO_ROOT=__dirname;
const SAFE_SITE_ID=/^[a-z0-9][a-z0-9_-]{2,49}$/;

function loadSiteConfig(){
  const normalized=String(siteId||'').trim().toLowerCase();
  const target=SAFE_SITE_ID.test(normalized)?path.join(SEO_ROOT,`${normalized}.js`):'';
  if(target&&fs.existsSync(target)){
    delete require.cache[require.resolve(target)];
    return require(target);
  }
  return require('./default')(normalized||'site');
}

function current(){
  const configured=loadSiteConfig();
  return Object.freeze({
    ...configured,
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN||configured.canonicalDomain||'',
    siteId
  });
}

function faviconPath(){
  const root=path.join(__dirname,'..','logo');
  const candidate=path.join(root,`${siteId}.ico`);
  return fs.existsSync(candidate)?candidate:path.join(root,'default.ico');
}

module.exports={current,faviconPath};
