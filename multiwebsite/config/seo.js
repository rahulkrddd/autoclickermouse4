const path=require('path');
const fs=require('fs');
const {siteId}=require('../../config/site');

const configs = {
  "site-a": {
    siteName: "Auto Clicker Mouse",
    description:
      "Buy Auto Clicker Mouse, Dual Mode Auto Clicker Mouse, USB Auto Click Mouse, Programmable Mouse, Auto Clicking Mouse and Productivity Accessories online at best prices.",
    keywords: [
      "auto clicker mouse",
      "dual mode auto clicker mouse",
      "usb auto clicker mouse",
      "automatic clicking mouse",
      "programmable mouse",
      "mouse jiggler",
      "usb mouse jiggler",
      "office productivity mouse",
      "gaming auto clicker mouse",
      "macro mouse",
      "auto clicking device",
      "computer accessories",
      "wireless mouse",
      "rgb gaming mouse",
      "mouse pad",
      "usb hub",
      "clicking mouse",
      "auto click mouse india"
    ],
    logo:'/logo/site-a.ico',
    favicon:'/logo/site-a.ico',
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN || '',
    socialImage:'/logo/site-a.ico'
  },

  "site-b": {
    siteName: "Manna's Gifting",
    description:
      "Handmade gifts, resin art, art and craft kits, personalized gifts, gifting hampers, DIY craft products, coloring kits and creative handmade products for every occasion.",
    keywords: [
      "handmade gifts",
      "personalized gifts",
      "resin art",
      "resin keychain",
      "gift hampers",
      "art and craft",
      "diy craft kit",
      "creative gifts",
      "birthday gifts",
      "anniversary gifts",
      "return gifts",
      "kids craft kit",
      "coloring kit",
      "paintable moulds",
      "white cement art",
      "custom gifts",
      "handmade products",
      "home decor gifts",
      "gift box",
      "resin alphabet keychain"
    ],
    logo:'/logo/site-b.ico',
    favicon:'/logo/site-b.ico',
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN || '',
    socialImage:'/logo/site-b.ico'
  },

  "site-c": {
    siteName: "MyEcomm",
    description:
      "Ecommerce Website Builder with complete admin panel, inventory management, orders, coupons, analytics, customer management and multi-site ecommerce solutions.",
    keywords: [
      "ecommerce website builder",
      "online store builder",
      "ecommerce software",
      "website builder",
      "multi vendor ecommerce",
      "online shop website",
      "inventory management",
      "order management",
      "coupon management",
      "admin dashboard",
      "ecommerce platform",
      "shopping cart software",
      "online business website",
      "custom ecommerce website",
      "small business ecommerce",
      "product management",
      "customer management",
      "analytics dashboard",
      "multi site ecommerce",
      "ready ecommerce solution"
    ],
    logo:'/logo/site-c.ico',
    favicon:'/logo/site-c.ico',
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN || '',
    socialImage:'/logo/site-c.ico'
  }
};

function current(){
  const configured=configs[siteId]||{
    siteName:siteId,
    description:`Browse products and shop securely from ${siteId}.`,
    keywords:['online store','products'],
    canonicalDomain:process.env.SITE_CANONICAL_DOMAIN||'',
    logo:`/logo/${siteId}.ico`,
    favicon:'/favicon.ico',
    socialImage:`/logo/${siteId}.ico`
  };
  return Object.freeze({...configured,siteId});
}
function faviconPath(){
  const root=path.join(__dirname,'..','logo');
  const candidate=path.join(root,`${siteId}.ico`);
  return fs.existsSync(candidate)?candidate:path.join(root,'default.ico');
}
module.exports={current,faviconPath};
