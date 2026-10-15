/*
===============================================================================
 MyEcomm - VERSION 1: Professional Web Solutions
 File: public/redesign.js
 Scope: visual text, branding and CSS only. No commerce/business logic changes.
===============================================================================
*/
(() => {
  'use strict';

  const TEXT = {
    websiteName: 'MyEcomm', searchPlaceholder: 'Search website packages and digital services',
    features: { showServiceShowcase: true }, common: { previous: 'Previous', next: 'Next' },
    navigation: { admin:'Admin', myOrders:'My Orders', reviews:'Reviews', faqs:'Help & FAQs', cart:'Cart', store:'Shop', logout:'Logout' },
    home: { browserTitle:'', badge:'WEB DESIGN • E-COMMERCE • BUSINESS SOLUTIONS', headingLine1:'Professional websites.', headingLine2:'Built for real business growth.', description:'Choose a practical website package designed around your business goals, operations and customer experience.', allCategories:'All categories', featured:'Featured', priceLowHigh:'Price: Low to High', priceHighLow:'Price: High to Low', wishlist:'♡ Wishlist', policies:'Privacy, Shipping & Returns' },
    cart: { browserTitle:'Shopping Cart', heading:'Your Shopping Cart', summaryHeading:'Price Details', couponPlaceholder:'Enter coupon code', apply:'Apply', checkout:'Proceed to Checkout' },
    reviews: { browserTitle:'Customer Reviews', heading:'What Our Customers Say' },
    faq: { browserTitle:'Help & FAQs', searchPlaceholder:'Search FAQs', all:'All' },
    policies: { browserTitle:'Policies', heading:'Store Policies' },
    product: { browserTitle:'Product', relatedHeading:'You May Also Like' }, orders: { browserTitle:'My Orders' },
    admin: { browserTitle:'Admin', brandSuffix:' Admin', overviewLabel:'STORE OVERVIEW', overviewHeading:'Store performance', overviewDescription:'Manage orders, products, inventory and customer activity.', ordersHeading:'Orders', ordersDescription:'Review orders, confirm fulfilment and download invoices.', manualOrder:'Create Manual Order', productsHeading:'Products', productsDescription:'Manage product details, images, pricing and stock.', addProduct:'Add Product', couponsHeading:'Coupons & Offers', createCoupon:'Create Coupon', pickupHeading:'Pickup Locations', addLocation:'Add Location', settingsHeading:'Store Settings', inventoryHeading:'Inventory Logs', activityHeading:'Customer Activity' },
    showcase: { eyebrow:'WEBSITE SOLUTIONS', heading:'Right website for every stage of business', description:'From a focused company website to a complete commerce platform, select the solution that matches your current needs.', featuredIndex:3, shopTitle:'Choose a website package', services:[
      ['◫','Static Website','Professional and responsive business website for a clear online presence.'],
      ['⚙','Dynamic Website','Admin panel, content management, blogs and business forms.'],
      ['🛒','E-Commerce Website','Products, cart, checkout, orders and payment-ready shopping experience.'],
      ['◆','Custom E-Commerce Solution','Advanced online store tailored to your workflow and business requirements.'],
      ['🎓','Coaching Website','Courses, enquiries, payment integration and student-focused information.'],
      ['🏫','School Website','Admissions, notices, events, results and academic information.'],
      ['🏢','Corporate Website','Company profile, services, portfolio and lead-focused contact experience.'],
      ['📈','Business Growth Package','Website foundation, branding alignment, SEO basics and launch support.']
    ] }
  };
  const DESIGN = { language:'en', direction:'ltr' };
  const SITE = { name: '', logo: '' };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const currentPath = () => location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const siteName = () => SITE.name || TEXT.websiteName || document.querySelector('.brand')?.textContent?.trim() || 'Store';
  const pageTitle = label => label ? `${label} | ${siteName()}` : siteName();
  const setText = (selector, value) => { const el = document.querySelector(selector); if (el && value !== undefined) el.textContent = value; };
  const setPlaceholder = (selector, value) => { const el = document.querySelector(selector); if (el && value !== undefined) el.placeholder = value; };

  const loadSite = async () => {
    try {
      const response = await fetch('/api/seo-config', { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const config = await response.json();
      SITE.name = String(config.websiteName || config.siteName || config.storeName || config.title || config.name || '').trim();
      SITE.logo = String(config.logo || '').trim();
    } catch (_) {}
  };

  const CSS = `
:root{--primary:#146ef5;--primary-dark:#0b55c7;--ink:#10213d;--muted:#5d6b82;--bg:#f4f7fb;--surface:#fff;--line:#d7e0ed;--nav2:#07152f}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:Inter,"Segoe UI",Arial,sans-serif!important;background:var(--bg)!important;color:var(--ink)!important;font-size:14px!important;line-height:1.5}.nav{min-height:64px;background:#fff!important;color:var(--ink)!important;border-bottom:1px solid var(--line);box-shadow:0 2px 8px rgba(20,54,94,.07);position:sticky;top:0;z-index:1000}.brand{display:inline-flex!important;align-items:center;gap:8px;color:#0b3f91!important;font-size:1.25rem!important;font-weight:900!important;text-decoration:none}.site-brand-logo{width:42px;height:34px;object-fit:contain}.site-brand-text{color:#0b3f91}.navlinks a,#adminBtn,#ordersBtn{color:var(--ink)!important;font-size:13px!important;font-weight:650!important}.navlinks a:hover,#adminBtn:hover,#ordersBtn:hover{color:var(--primary)!important}.search{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff}.search:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px rgba(20,110,245,.2)}.search button,.count{background:var(--primary)!important;color:#fff!important}.hero{background:radial-gradient(circle at 85% 20%,rgba(20,110,245,.14),transparent 27%),linear-gradient(120deg,#eef6ff,#f4fbff)!important;padding:34px 24px!important;border-bottom:1px solid #d6e3f3}.hero>div,.shell{max-width:1280px!important;margin-inline:auto}.hero .badge{display:inline-flex;background:#fff!important;color:#0b55c7!important;border:1px solid #b9d3f5;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:800}.hero h1{margin:10px 0 8px!important;max-width:800px;color:var(--ink)!important;font-size:clamp(1.85rem,4vw,3.4rem)!important;line-height:1.08!important;letter-spacing:-.025em}.hero p{max-width:62ch;color:var(--muted)!important;font-size:1rem!important}.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.card,.order,.panel,.review,.cartrow,.product{background:#fff!important;border:1px solid var(--line)!important;border-radius:12px!important;box-shadow:0 1px 3px rgba(20,54,94,.08)!important}.card{overflow:hidden;transition:.2s ease}.card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(20,54,94,.15)!important}.card img{height:220px;object-fit:contain;background:#fff}.primary{background:var(--primary)!important;color:#fff!important;border-color:var(--primary)!important}.primary:hover{background:var(--primary-dark)!important}.dark,th,.footer{background:var(--nav2)!important;color:#fff!important}.pill,input,textarea,select{border-radius:8px}.myecomm-services{max-width:1280px;margin:auto;padding:34px 24px 8px}.myecomm-services__head{text-align:center;max-width:780px;margin:0 auto 22px}.myecomm-services__eyebrow{display:inline-flex;padding:6px 11px;border-radius:999px;background:#dcecff;color:#084aaf;font-size:11px;font-weight:800;letter-spacing:.08em}.myecomm-services h2{font-size:clamp(1.55rem,3vw,2.35rem);margin:10px 0 8px}.myecomm-services__head p{color:var(--muted)}.myecomm-services__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.myecomm-service{padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(20,54,94,.08);transition:.22s}.myecomm-service:hover{transform:translateY(-4px);border-color:#9fc4f3}.myecomm-service__icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#eaf3ff;color:#0b5fd7;font-size:20px}.myecomm-service h3{margin:14px 0 7px;font-size:16px}.myecomm-service p{margin:0;color:var(--muted);font-size:13px}.myecomm-service--featured{background:linear-gradient(145deg,#0b397d,#126fe8);border-color:#126fe8;color:#fff}.myecomm-service--featured p{color:#fff}.myecomm-shop-title{max-width:1280px;margin:18px auto 0;padding:0 24px}.modal{background:rgba(3,12,30,.72)!important}.modal .panel,dialog,.popup{background:#fff!important;color:var(--ink)!important}
@media(max-width:1000px){.grid,.myecomm-services__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.nav{min-height:58px}.site-brand-logo{width:34px;height:28px}.hero{padding:22px 12px!important}.hero h1{font-size:clamp(1.55rem,8vw,2.15rem)!important}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.card img{height:138px}.myecomm-services{padding:26px 12px 6px}.myecomm-services__grid{grid-template-columns:1fr;gap:10px}.myecomm-shop-title{padding:0 12px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;
  const style = document.createElement('style');
  style.id = 'website-design-final-layer';
  style.textContent = CSS;
  document.head.appendChild(style);

  const applyBrand = () => {
    const name = siteName();
    const adminSuffix = currentPath() === '/admin' ? TEXT.admin.brandSuffix : '';
    document.querySelectorAll('.brand').forEach(brand => {
      brand.replaceChildren();
      if (SITE.logo) {
        const image = document.createElement('img');
        image.className = 'site-brand-logo'; image.src = SITE.logo; image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        image.addEventListener('error', () => image.remove(), { once: true });
        brand.appendChild(image);
      }
      const text = document.createElement('span');
      text.className = 'site-brand-text'; text.textContent = `${name}${adminSuffix}`;
      brand.appendChild(text); brand.setAttribute('aria-label', `${name}${adminSuffix}`);
    });
  };

  const applyNavigation = () => {
    setText('#adminBtn', TEXT.navigation.admin); setText('#ordersBtn', TEXT.navigation.myOrders);
    document.querySelectorAll('.navlinks a').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href === '/review') link.textContent = TEXT.navigation.reviews;
      else if (href === '/faqs' || href === '/faq') link.textContent = TEXT.navigation.faqs;
      else if (href === '/') link.textContent = TEXT.navigation.store;
      else if (href === '/cart') {
        const count = link.querySelector('#cartCount')?.textContent || '0';
        link.innerHTML = `${escapeHtml(TEXT.navigation.cart)} <span class="count" id="cartCount">${escapeHtml(count)}</span>`;
      }
    });
    setPlaceholder('#globalSearch', TEXT.searchPlaceholder);
  };

  const injectShowcase = () => {
    if (!TEXT.features.showServiceShowcase || document.querySelector('.myecomm-services')) return;
    const hero = document.querySelector('.hero');
    const shell = document.querySelector('main.shell, .shell');
    if (!hero || !shell) return;
    const section = document.createElement('section');
    section.className = 'myecomm-services'; section.setAttribute('aria-labelledby', 'myecomm-services-title');
    section.innerHTML = `<div class="myecomm-services__head"><span class="myecomm-services__eyebrow">${escapeHtml(TEXT.showcase.eyebrow)}</span><h2 id="myecomm-services-title">${escapeHtml(TEXT.showcase.heading)}</h2><p>${escapeHtml(TEXT.showcase.description)}</p></div><div class="myecomm-services__grid">${TEXT.showcase.services.map((item, index) => `<article class="myecomm-service${index === TEXT.showcase.featuredIndex ? ' myecomm-service--featured' : ''}"><div class="myecomm-service__icon" aria-hidden="true">${escapeHtml(item[0])}</div><h3>${escapeHtml(item[1])}</h3><p>${escapeHtml(item[2])}</p></article>`).join('')}</div>`;
    hero.insertAdjacentElement('afterend', section);
    if (!document.querySelector('.myecomm-shop-title')) {
      const title = document.createElement('h2'); title.className = 'myecomm-shop-title'; title.textContent = TEXT.showcase.shopTitle;
      shell.insertAdjacentElement('beforebegin', title);
    }
  };

  const applyPage = () => {
    applyBrand(); applyNavigation();
    const path = currentPath();
    if (path === '/') {
      document.title = TEXT.home.browserTitle || pageTitle('');
      setText('.hero .badge', TEXT.home.badge);
      const heading = document.querySelector('.hero h1');
      if (heading) heading.innerHTML = `${escapeHtml(TEXT.home.headingLine1)}<br>${escapeHtml(TEXT.home.headingLine2)}`;
      setText('.hero p', TEXT.home.description); injectShowcase();
      setText('#category option[value=""]', TEXT.home.allCategories); setText('#sort option[value="featured"]', TEXT.home.featured);
      setText('#sort option[value="low"]', TEXT.home.priceLowHigh); setText('#sort option[value="high"]', TEXT.home.priceHighLow);
      setText('#wishlistFilter', TEXT.home.wishlist); setText('#homePrev', TEXT.common.previous); setText('#homeNext', TEXT.common.next);
      const footer = document.querySelector('.footer');
      if (footer) footer.innerHTML = `© ${new Date().getFullYear()} ${escapeHtml(siteName())} · <a href="/policies">${escapeHtml(TEXT.home.policies)}</a>`;
    } else if (path === '/cart') {
      document.title = pageTitle(TEXT.cart.browserTitle); setText('main.shell > h1', TEXT.cart.heading);
      setText('main.shell > .order h2:first-child', TEXT.cart.summaryHeading); setPlaceholder('#coupon', TEXT.cart.couponPlaceholder);
      setText('#apply', TEXT.cart.apply); setText('#checkout', TEXT.cart.checkout);
    } else if (path === '/review') {
      document.title = pageTitle(TEXT.reviews.browserTitle); setText('main.shell > h1', TEXT.reviews.heading);
      setText('#prev', TEXT.common.previous); setText('#next', TEXT.common.next);
    } else if (path === '/faqs' || path === '/faq') {
      document.title = pageTitle(TEXT.faq.browserTitle); setPlaceholder('#fq', TEXT.faq.searchPlaceholder);
      setText('#fc option[value=""]', TEXT.faq.all);
    } else if (path === '/policies') {
      document.title = pageTitle(TEXT.policies.browserTitle); setText('main.shell h1', TEXT.policies.heading);
      /* Dynamic policy section headings/content are intentionally untouched. */
    } else if (path.startsWith('/product')) {
      document.title = pageTitle(TEXT.product.browserTitle); setText('#relatedSection > h2', TEXT.product.relatedHeading);
    } else if (path === '/my-orders') {
      document.title = pageTitle(TEXT.orders.browserTitle); setText('#prev', TEXT.common.previous);
      setText('#next', TEXT.common.next); setText('#logout', TEXT.navigation.logout);
    } else if (path === '/admin') {
      document.title = pageTitle(TEXT.admin.browserTitle); setText('.admin-overview-head small', TEXT.admin.overviewLabel);
      setText('.admin-overview-head h1', TEXT.admin.overviewHeading); setText('.admin-overview-head p', TEXT.admin.overviewDescription);
      setText('#ordersSectionTitle', TEXT.admin.ordersHeading); setText('#ordersSectionDescription', TEXT.admin.ordersDescription);
      setText('#newManualOrder', TEXT.admin.manualOrder); setText('#products .admin-section-head h2', TEXT.admin.productsHeading);
      setText('#products .admin-section-head p', TEXT.admin.productsDescription); setText('#newProduct', TEXT.admin.addProduct);
      setText('#coupons h2', TEXT.admin.couponsHeading); setText('#newCoupon', TEXT.admin.createCoupon);
      setText('#pickup h2', TEXT.admin.pickupHeading); setText('#newPickup', TEXT.admin.addLocation);
      setText('#settings h2', TEXT.admin.settingsHeading); setText('#inventory h2', TEXT.admin.inventoryHeading);
      setText('#leads h2', TEXT.admin.activityHeading);
    }
  };

  const initialize = async () => {
    document.documentElement.lang = DESIGN.language; document.documentElement.dir = DESIGN.direction;
    await loadSite(); applyPage();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  window.REDESIGN_CONTROL = Object.freeze({ TEXT, DESIGN });
})();