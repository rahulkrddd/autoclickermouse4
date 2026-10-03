/*
===============================================================================
 AutoClickerMouse - ONE FILE WEBSITE DESIGN CONTROL
 File: public/WEBSITE_DESIGN.js

 HOW TO REDESIGN LATER:
 1. Change words only inside TEXT.
 2. Change colours, sizes, spacing, curves and shadows only inside DESIGN.
 3. Save this file and refresh the website.

 This file is intentionally loaded after page CSS, so these values are the final
 visual layer. It does not change APIs, database logic, checkout, payments,
 inventory, routes, admin operations, cart, wishlist or existing functionality.
===============================================================================
*/
(() => {
  'use strict';

  /* ========================= 1. ALL MAIN WEBSITE WORDS ===================== */
  const TEXT = {
    websiteName: 'AutoClickMouse',
    websiteNameFirst: 'AutoClick',
    websiteNameHighlight: 'Mouse',
    searchPlaceholder: 'Search AutoClickerMouse',

    navigation: {
      admin: 'Admin',
      myOrders: 'My Orders',
      reviews: 'Reviews',
      faqs: 'FAQs',
      cart: 'Cart',
      store: 'Store',
      logout: 'Logout'
    },

    home: {
      browserTitle: 'AutoClickerMouse',
      badge: 'ADVANCED MULTI-PRODUCT STORE',
      headingLine1: 'Click smarter.',
      headingLine2: 'Shop better.',
      description: 'Premium accessories, clear tracking, verified reviews and secure checkout in one fast responsive store.',
      allCategories: 'All categories',
      featured: 'Featured',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
      wishlist: '♡ Wishlist',
      previous: 'Previous',
      next: 'Next',
      footerBrand: 'AutoClickerMouse',
      policies: 'Privacy & Policies'
    },

    cart: {
      browserTitle: 'Cart',
      heading: 'Shopping Cart',
      summaryHeading: 'Order Summary',
      couponPlaceholder: 'Coupon code',
      apply: 'Apply',
      checkout: 'Proceed to Checkout'
    },

    reviews: {
      browserTitle: 'Premium Reviews',
      heading: 'Verified Customer Reviews',
      previous: 'Previous',
      next: 'Next'
    },

    faq: {
      browserTitle: 'FAQs',
      searchPlaceholder: 'Search FAQs',
      all: 'All',
      categories: ['General', 'Payment', 'Delivery', 'Services']
    },

    policies: {
      browserTitle: 'Policies',
      heading: 'Privacy & Policies',
      sectionHeading: 'Returns, warranty and shipping'
    },

    product: {
      browserTitle: 'Product Detail',
      relatedHeading: 'Related Products'
    },

    orders: {
      browserTitle: 'My Orders',
      previous: 'Previous',
      next: 'Next',
      logout: 'Logout'
    },

    admin: {
      browserTitle: 'AutoClickerMouse Admin',
      brandSuffix: ' Admin',
      overviewLabel: 'ADMIN OVERVIEW',
      overviewHeading: 'Store performance',
      overviewDescription: 'Open a section or apply an order filter directly.',
      ordersHeading: 'Orders',
      ordersDescription: 'Edit orders, confirm fulfilment and download invoices.',
      manualOrder: 'Create Manual Order',
      productsHeading: 'Products',
      productsDescription: 'All purchase controls, media and stock operations.',
      addProduct: 'Add Product',
      couponsHeading: 'Advanced Coupons',
      createCoupon: 'Create Coupon',
      pickupHeading: 'Pickup Locations',
      addLocation: 'Add Location',
      settingsHeading: 'Store Settings',
      inventoryHeading: 'Inventory Logs',
      activityHeading: 'Customer Activity'
    }
  };

  /* ========================= 2. COMPLETE DESIGN CONTROLS =================== */
  const DESIGN = {
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
    colours: {
      nav: '#080d1d', navSecondary: '#121a33', primary: '#ff8a00', primarySoft: '#ffb347',
      accent: '#7c4dff', accentSoft: '#a78bfa', text: '#f8fafc', mutedText: '#b8c1dc',
      pageBackground: '#060814', surface: 'rgba(24,27,43,.88)', surfaceStrong: '#181b2b',
      surfaceLight: '#f8fafc', lightText: '#111827', border: 'rgba(255,255,255,.16)',
      success: '#22c783', successSoft: '#e7fff5', danger: '#ef4444', dangerSoft: '#fff1f2',
      warning: '#fbbf24', info: '#38bdf8', link: '#67e8f9', disabled: '#64748b',
      heroStart: '#111939', heroMiddle: '#24114d', heroEnd: '#ff8a00'
    },
    layout: {
      contentWidth: '1320px', desktopGridColumns: 4, tabletGridColumns: 2, mobileGridColumns: 2,
      sectionPaddingDesktop: '88px 28px', sectionPaddingMobile: '48px 16px', cardGap: '22px', mobileCardGap: '10px'
    },
    typography: { brandSize: '1.5rem', heroSize: 'clamp(2.8rem,8vw,6.6rem)', heroLineHeight: '.9', bodySize: '1rem', heroDescriptionSize: '1.18rem' },
    shape: { smallRadius: '10px', controlRadius: '14px', cardRadius: '24px', panelRadius: '26px', pillRadius: '999px' },
    effects: {
      glassBlur: '18px', shadow: '0 12px 38px rgba(0,0,0,.3)', hoverShadow: '0 24px 64px rgba(124,77,255,.26)',
      hoverLift: '-7px', focusRing: '0 0 0 4px rgba(124,77,255,.24)', transition: '.28s ease'
    },
    pagination: { background: 'rgba(24,27,43,.92)', text: '#f8fafc', pageBackground: 'rgba(124,77,255,.18)', disabledOpacity: '.42' }
  };
  const css = `
  :root{
    --nav:${DESIGN.colours.nav};--nav2:${DESIGN.colours.navSecondary};--orange:${DESIGN.colours.primary};--yellow:${DESIGN.colours.primarySoft};
    --ink:${DESIGN.colours.text};--muted:${DESIGN.colours.mutedText};--bg:${DESIGN.colours.pageBackground};--line:${DESIGN.colours.border};
    --ok:${DESIGN.colours.success};--bad:${DESIGN.colours.danger};--site-accent:${DESIGN.colours.accent};--site-surface:${DESIGN.colours.surface};
    --site-light:${DESIGN.colours.surfaceLight};--site-light-text:${DESIGN.colours.lightText};--site-link:${DESIGN.colours.link};
    --site-max:${DESIGN.layout.contentWidth};--site-radius:${DESIGN.shape.cardRadius};--site-panel-radius:${DESIGN.shape.panelRadius};
    --site-control-radius:${DESIGN.shape.controlRadius};--site-shadow:${DESIGN.effects.shadow};--site-hover-shadow:${DESIGN.effects.hoverShadow};
  }
  *{box-sizing:border-box}html{scroll-behavior:smooth;color-scheme:dark}html,body{font-family:${DESIGN.fontFamily}!important}
  body{min-height:100vh;color:var(--ink)!important;font-size:${DESIGN.typography.bodySize};background:radial-gradient(circle at 12% 0%,rgba(124,77,255,.18),transparent 32%),radial-gradient(circle at 100% 16%,rgba(255,138,0,.12),transparent 30%),${DESIGN.colours.pageBackground}!important}
  body::selection{background:${DESIGN.colours.accent};color:#fff}.shell,.hero>div{max-width:var(--site-max)!important}
  h1,h2,h3,h4,b,strong,label{color:var(--ink)}p,small,.muted{color:var(--muted)!important}a{transition:color ${DESIGN.effects.transition}}
  .nav{background:rgba(8,13,29,.9)!important;border-bottom:1px solid var(--line)!important;box-shadow:0 10px 32px rgba(0,0,0,.3);backdrop-filter:blur(${DESIGN.effects.glassBlur})}
  .brand{font-size:${DESIGN.typography.brandSize}!important;color:#fff!important}.brand span{color:var(--orange)!important}.navlinks a,.navlinks button{color:#fff!important}.navlinks a:hover,.navlinks button:hover{color:var(--yellow)!important}
  .search input{background:rgba(255,255,255,.11)!important;color:#fff!important;border:1px solid var(--line)!important}.search input::placeholder,input::placeholder,textarea::placeholder{color:#aeb8d5!important}
  .search button,.count{color:#fff!important;background:linear-gradient(135deg,var(--orange),var(--site-accent))!important}
  .hero{position:relative;overflow:hidden;padding:${DESIGN.layout.sectionPaddingDesktop}!important;background:linear-gradient(135deg,${DESIGN.colours.heroStart},${DESIGN.colours.heroMiddle} 52%,${DESIGN.colours.heroEnd} 145%)!important}
  .hero::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(255,255,255,.16) 1px,transparent 1px);background-size:28px 28px;opacity:.2}.hero>div{position:relative;z-index:1}
  .hero h1{font-size:${DESIGN.typography.heroSize}!important;line-height:${DESIGN.typography.heroLineHeight}!important;color:#fff!important;letter-spacing:-.045em}.hero p{font-size:${DESIGN.typography.heroDescriptionSize}!important;color:#dce4ff!important}.hero .badge{background:linear-gradient(135deg,#ff5f6d,var(--orange))!important}
  .grid{grid-template-columns:repeat(${DESIGN.layout.desktopGridColumns},minmax(0,1fr));gap:${DESIGN.layout.cardGap}!important}
  .card,.review,.order,.cartrow,.product,.panel,.tabpane,.stat,.admin-overview,.admin-list-card,.settings-card,.tracking-card,.address-card,.info-item,.detail-grid section,.ordered-product,.history-order,.checkout-product{color:var(--ink)!important;background:var(--site-surface)!important;border:1px solid var(--line)!important;border-radius:var(--site-radius)!important;box-shadow:var(--site-shadow)!important;backdrop-filter:blur(${DESIGN.effects.glassBlur})}
  .card{overflow:hidden;transition:transform ${DESIGN.effects.transition},box-shadow ${DESIGN.effects.transition},border-color ${DESIGN.effects.transition}}.card:hover,.review:hover{transform:translateY(${DESIGN.effects.hoverLift})!important;border-color:rgba(124,77,255,.62)!important;box-shadow:var(--site-hover-shadow)!important}.card img{background:rgba(255,255,255,.96)!important;transition:transform .48s ease}.card:hover img{transform:scale(1.06)}
  .card h3,.review h2,.order h2,.cartrow h3,.product h1,.product h2,.panel h2{color:#fff!important}.price{color:#fff!important}.old{color:#99a5c7!important}.stars,.feedback-stars button.on{color:var(--orange)!important}
  .badge,.discount-badge{color:#fff!important;background:linear-gradient(135deg,#ff5f6d,var(--orange))!important}.stock-status,.status-chip,.state-on,.admin-stock-good{color:#08785b!important;background:${DESIGN.colours.successSoft}!important}.stock-status.out-of-stock,.state-off,.admin-stock-out{color:#b91c1c!important;background:${DESIGN.colours.dangerSoft}!important}
  button,.pill,.cart-action,.buy-action{transition:transform ${DESIGN.effects.transition},filter ${DESIGN.effects.transition},box-shadow ${DESIGN.effects.transition}}
  .primary,.buy-action,#checkout,.pay-button{color:#fff!important;border-color:transparent!important;background:linear-gradient(135deg,var(--orange),var(--site-accent))!important;box-shadow:0 10px 26px rgba(124,77,255,.28)!important}.primary:hover,.buy-action:hover,#checkout:hover{filter:brightness(1.1);transform:translateY(-2px)}
  .cart-action,.pill:not(.primary):not(.danger),.table-action,.overview-toggle{color:#fff!important;border:1px solid rgba(124,77,255,.55)!important;background:rgba(124,77,255,.13)!important}.danger,.table-delete,.admin-product-delete{color:#fff!important;background:linear-gradient(135deg,#dc2626,#f43f5e)!important;border-color:transparent!important}
  button:disabled,.pill:disabled{opacity:${DESIGN.pagination.disabledOpacity}!important;filter:saturate(.45)!important;cursor:not-allowed!important}
  input,textarea,select{color:#fff!important;background:rgba(255,255,255,.09)!important;border:1px solid var(--line)!important;border-radius:var(--site-control-radius)!important}option{color:#111;background:#fff}input:focus,textarea:focus,select:focus{outline:none!important;border-color:var(--site-accent)!important;box-shadow:${DESIGN.effects.focusRing}!important}
  .notice{color:#dce4ff!important;background:rgba(56,189,248,.1)!important;border-left-color:${DESIGN.colours.info}!important}.close{color:#7f1d1d!important;background:#ffe4e6!important}.modal{background:rgba(1,3,12,.78)!important;backdrop-filter:blur(7px)}
  .toolbar select,.field select{background-color:rgba(255,255,255,.09)!important;background-image:none!important}.tablewrap{background:rgba(13,17,34,.75)!important;border-color:var(--line)!important}th{background:linear-gradient(135deg,var(--nav2),#291b52)!important;color:#fff!important}td{color:#dce3f7!important;border-color:var(--line)!important}tbody tr:nth-child(even),tbody tr:hover{background:rgba(255,255,255,.035)!important}
  .click,.order-link,.customer-link,summary,.shop-toast a{color:var(--site-link)!important}.specs td,.kv{border-color:var(--line)!important}.progress{background:rgba(255,255,255,.15)!important}.progress div{background:linear-gradient(90deg,var(--orange),var(--site-accent),var(--ok))!important}
  .info-item,.address-card,.tracking-card,.ordered-product,.history-order,.checkout-product,.detail-grid section{background:rgba(255,255,255,.055)!important}.info-item strong,.ordered-product b,.ordered-product strong{color:#fff!important}
  .buyer-welcome{background:linear-gradient(135deg,#17233e,#28164f)!important;border:1px solid var(--line)}.buyer-welcome p{color:#dce4ff!important}.order-totals,.order-totals p{color:#dce3f7!important}
  .faq .q,.faq .a{color:#fff!important;background:var(--site-surface)!important;border:1px solid var(--line)!important}.faq .q:hover{border-color:var(--site-accent)!important}.faq .a{border-top:0!important;border-radius:0 0 var(--site-control-radius) var(--site-control-radius)!important}
  .home-pagination,.admin-pagination,body:has(#reviews) main.shell>.toolbar{color:${DESIGN.pagination.text}!important;background:${DESIGN.pagination.background}!important;border:1px solid var(--line)!important;box-shadow:var(--site-shadow)!important}.home-pagination span,.admin-pagination span,#page{color:var(--muted)!important}.home-pagination b,.admin-pagination b{color:#fff!important;background:${DESIGN.pagination.pageBackground}!important}.home-pagination .pill,.admin-pagination .pill,body:has(#reviews) main.shell>.toolbar .pill{color:#fff!important;background:rgba(124,77,255,.14)!important;border-color:rgba(124,77,255,.5)!important}
  body:has(#reviews) main.shell>h1,body:has(#rows) main.shell>h1,body:has(#stats) main.shell>h1{color:#fff!important}body:has(#reviews) main.shell>h1::after{background:linear-gradient(90deg,var(--orange),var(--site-accent))!important}body:has(#reviews) #reviews .review,body:has(#rows) .cartrow,body:has(#rows) main.shell>.order{background:var(--site-surface)!important;border-color:var(--line)!important}body:has(#reviews) #reviews .review h2,body:has(#rows) .cartrow h3{color:#fff!important}body:has(#reviews) #reviews .review>p:not(.muted){color:#dce3f7!important}
  body:has(#stats),body:has(#rows),body:has(#reviews){background:radial-gradient(circle at top left,rgba(124,77,255,.16),transparent 36%),${DESIGN.colours.pageBackground}!important}body:has(#stats) .tabpane,body:has(#stats) .stat,body:has(#stats) .tabs,body:has(#stats) .admin-list-card,body:has(#stats) .settings-card,body:has(#stats) .admin-product-card{color:#fff!important;background:var(--site-surface)!important;border-color:var(--line)!important}body:has(#stats) .tabs .pill.primary{background:linear-gradient(135deg,var(--orange),var(--site-accent))!important}body:has(#stats) .admin-product-title-wrap h3,body:has(#stats) .admin-product-price strong,body:has(#stats) .admin-product-metric strong,body:has(#stats) .stat b,body:has(#stats) #coupons h2{color:#fff!important}body:has(#stats) .admin-product-image-wrap{background:rgba(255,255,255,.94)!important}body:has(#stats) .admin-product-metric,body:has(#stats) .admin-product-limits>div{background:rgba(255,255,255,.06)!important;border-color:var(--line)!important}body:has(#stats) .settings-savebar{background:rgba(38,25,72,.94)!important;border-color:rgba(124,77,255,.5)!important}
  .shop-toast,.admin-toast,.page-content-loader-card,.smart-loader{color:#fff!important;background:rgba(18,22,40,.96)!important;border-color:var(--line)!important}.page-content-loader{background:rgba(6,8,20,.86)!important}.page-content-loader-ring,.smart-loader span{border-color:rgba(255,255,255,.18)!important;border-top-color:var(--orange)!important}
  ::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-track{background:var(--nav)}::-webkit-scrollbar-thumb{border-radius:999px;background:linear-gradient(var(--orange),var(--site-accent))}
  @media(max-width:1000px){.grid{grid-template-columns:repeat(${DESIGN.layout.tabletGridColumns},minmax(0,1fr))}}
  @media(max-width:700px){.hero{padding:${DESIGN.layout.sectionPaddingMobile}!important}.grid{grid-template-columns:repeat(${DESIGN.layout.mobileGridColumns},minmax(0,1fr));gap:${DESIGN.layout.mobileCardGap}!important}.card{border-radius:18px!important}.home-pagination{grid-template-columns:minmax(0,1fr) 64px 80px 64px!important}.home-pagination .pill{font-size:.6rem!important}.panel{background:rgba(24,27,43,.97)!important}}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  `;
  document.getElementById('website-design-final-layer')?.remove();
  const style = document.createElement('style');
  style.id = 'website-design-final-layer';
  style.textContent = css;
  document.head.appendChild(style);

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value !== undefined) element.textContent = value;
  };
  const setPlaceholder = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value !== undefined) element.placeholder = value;
  };
  const setBrand = () => {
    document.querySelectorAll('.brand').forEach(element => {
      const suffix = location.pathname === '/admin' ? TEXT.admin.brandSuffix : '';
      element.innerHTML = `${TEXT.websiteNameFirst}<span>${TEXT.websiteNameHighlight}</span>${suffix}`;
    });
  };
  const setNavigation = () => {
    setText('#adminBtn', TEXT.navigation.admin);
    setText('#ordersBtn', TEXT.navigation.myOrders);
    document.querySelectorAll('.navlinks a').forEach(link => {
      if (link.getAttribute('href') === '/review') link.textContent = TEXT.navigation.reviews;
      if (link.getAttribute('href') === '/FAQs') link.textContent = TEXT.navigation.faqs;
      if (link.getAttribute('href') === '/') link.textContent = TEXT.navigation.store;
      if (link.getAttribute('href') === '/cart') {
        const count = link.querySelector('#cartCount')?.textContent || '0';
        link.innerHTML = `${TEXT.navigation.cart} <span class="count" id="cartCount">${count}</span>`;
      }
    });
    setPlaceholder('#globalSearch', TEXT.searchPlaceholder);
  };

  function applyPageText() {
    setBrand();
    setNavigation();
    const path = location.pathname.replace(/\/$/, '') || '/';

    if (path === '/') {
      document.title = TEXT.home.browserTitle;
      setText('.hero .badge', TEXT.home.badge);
      const heading = document.querySelector('.hero h1');
      if (heading) heading.innerHTML = `${TEXT.home.headingLine1}<br>${TEXT.home.headingLine2}`;
      setText('.hero p', TEXT.home.description);
      setText('#category option[value=""]', TEXT.home.allCategories);
      setText('#sort option[value="featured"]', TEXT.home.featured);
      setText('#sort option[value="low"]', TEXT.home.priceLowHigh);
      setText('#sort option[value="high"]', TEXT.home.priceHighLow);
      setText('#wishlistFilter', TEXT.home.wishlist);
      setText('#homePrev', TEXT.home.previous);
      setText('#homeNext', TEXT.home.next);
      const footer = document.querySelector('.footer');
      if (footer) footer.innerHTML = `© ${TEXT.home.footerBrand} · <a href="/policies">${TEXT.home.policies}</a>`;
    } else if (path === '/cart') {
      document.title = TEXT.cart.browserTitle;
      setText('main.shell > h1', TEXT.cart.heading);
      setText('main.shell > .order h2:first-child', TEXT.cart.summaryHeading);
      setPlaceholder('#coupon', TEXT.cart.couponPlaceholder);
      setText('#apply', TEXT.cart.apply);
      setText('#checkout', TEXT.cart.checkout);
    } else if (path === '/review') {
      document.title = TEXT.reviews.browserTitle;
      setText('main.shell > h1', TEXT.reviews.heading);
      setText('#prev', TEXT.reviews.previous);
      setText('#next', TEXT.reviews.next);
    } else if (path === '/FAQs') {
      document.title = TEXT.faq.browserTitle;
      setPlaceholder('#fq', TEXT.faq.searchPlaceholder);
      const options = document.querySelectorAll('#fc option');
      [TEXT.faq.all, ...TEXT.faq.categories].forEach((value, index) => { if (options[index]) options[index].textContent = value; });
    } else if (path === '/policies') {
      document.title = TEXT.policies.browserTitle;
      setText('main.shell h1', TEXT.policies.heading);
      setText('main.shell h2', TEXT.policies.sectionHeading);
    } else if (path.startsWith('/product')) {
      document.title = TEXT.product.browserTitle;
      setText('#relatedSection > h2', TEXT.product.relatedHeading);
    } else if (path === '/my-orders') {
      document.title = TEXT.orders.browserTitle;
      setText('#prev', TEXT.orders.previous);
      setText('#next', TEXT.orders.next);
      setText('#logout', TEXT.orders.logout);
    } else if (path === '/admin') {
      document.title = TEXT.admin.browserTitle;
      setText('.admin-overview-head small', TEXT.admin.overviewLabel);
      setText('.admin-overview-head h1', TEXT.admin.overviewHeading);
      setText('.admin-overview-head p', TEXT.admin.overviewDescription);
      setText('#ordersSectionTitle', TEXT.admin.ordersHeading);
      setText('#ordersSectionDescription', TEXT.admin.ordersDescription);
      setText('#newManualOrder', TEXT.admin.manualOrder);
      setText('#products .admin-section-head h2', TEXT.admin.productsHeading);
      setText('#products .admin-section-head p', TEXT.admin.productsDescription);
      setText('#newProduct', TEXT.admin.addProduct);
      setText('#coupons h2', TEXT.admin.couponsHeading);
      setText('#newCoupon', TEXT.admin.createCoupon);
      setText('#pickup h2', TEXT.admin.pickupHeading);
      setText('#newPickup', TEXT.admin.addLocation);
      setText('#settings h2', TEXT.admin.settingsHeading);
      setText('#inventory h2', TEXT.admin.inventoryHeading);
      setText('#leads h2', TEXT.admin.activityHeading);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyPageText, { once: true });
  else applyPageText();

  // Available in browser console for quick inspection, without affecting app logic.
  window.WEBSITE_DESIGN_CONTROL = Object.freeze({ TEXT, DESIGN });
})();