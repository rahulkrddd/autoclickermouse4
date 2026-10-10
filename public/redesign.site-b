/*
===============================================================================
 Manna's Little Creation - DYNAMIC MULTI-SITE WEBSITE DESIGN CONTROL
 File: public/redesign.js

 PURPOSE:
 Converts the existing storefront visual layer into a compact, interactive
 gifting, art, craft, pop-colouring and resin-art e-commerce experience.

 SAFE SCOPE:
 This file changes only visible text, branding and final-layer CSS. It does not
 change APIs, database logic, checkout, payments, routes, inventory, admin
 operations, cart or wishlist behaviour.
===============================================================================
*/
(() => {
  'use strict';

  /* ========================= 1. WEBSITE WORDS ============================= */
  const TEXT = {
websiteName: "Manna's Little Creations",
websiteNameFirst: "",
websiteNameHighlight: "",
    searchPlaceholder: 'Search gifts, resin art, craft kits and colours',

    navigation: {
      admin: 'Admin',
      myOrders: 'My Orders',
      reviews: 'Reviews',
      faqs: 'Help & FAQs',
      cart: 'Cart',
      store: 'Shop',
      logout: 'Logout'
    },

    home: {
      browserTitle: "Manna's Little Creation | Gifts, Art & Craft",
      badge: 'HANDMADE • CREATIVE • THOUGHTFUL',
      headingLine1: 'Little creations.',
      headingLine2: 'Big smiles.',
      description: 'Thoughtful gifts, colourful art, resin creations and easy craft essentials, made to add a personal touch to every moment.',
      allCategories: 'All categories',
      featured: 'Featured',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
      wishlist: '♡ Wishlist',
      previous: 'Previous',
      next: 'Next',
      footerBrand: "Manna's Little Creation",
      policies: 'Privacy, Shipping & Returns'
    },

    cart: {
      browserTitle: "Shopping Cart | Manna's Little Creation",
      heading: 'Your Shopping Cart',
      summaryHeading: 'Price Details',
      couponPlaceholder: 'Enter coupon code',
      apply: 'Apply',
      checkout: 'Proceed to Checkout'
    },

    reviews: {
      browserTitle: 'Customer Reviews',
      heading: 'What Our Customers Say',
      previous: 'Previous',
      next: 'Next'
    },

    faq: {
      browserTitle: 'Help & FAQs',
      searchPlaceholder: 'Search help topics',
      all: 'All',
      categories: ['General', 'Payment', 'Delivery', 'Products']
    },

    policies: {
      browserTitle: 'Privacy, Shipping & Returns',
      heading: 'Store Policies',
      sectionHeading: 'Shipping, returns and product care'
    },

    product: {
      browserTitle: "Product | Manna's Little Creation",
      relatedHeading: 'You May Also Like'
    },

    orders: {
      browserTitle: 'My Orders',
      previous: 'Previous',
      next: 'Next',
      logout: 'Logout'
    },

    admin: {
      browserTitle: "Manna's Little Creation Admin",
      brandSuffix: ' Admin',
      overviewLabel: 'STORE OVERVIEW',
      overviewHeading: 'Store performance',
      overviewDescription: 'Manage orders, products, inventory and customer activity.',
      ordersHeading: 'Orders',
      ordersDescription: 'Review orders, confirm fulfilment and download invoices.',
      manualOrder: 'Create Manual Order',
      productsHeading: 'Products',
      productsDescription: 'Manage product details, images, pricing and stock.',
      addProduct: 'Add Product',
      couponsHeading: 'Coupons & Offers',
      createCoupon: 'Create Coupon',
      pickupHeading: 'Pickup Locations',
      addLocation: 'Add Location',
      settingsHeading: 'Store Settings',
      inventoryHeading: 'Inventory Logs',
      activityHeading: 'Customer Activity'
    }
  };

  /* ========================= 2. DESIGN CONTROLS ============================ */
  const DESIGN = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    favicon: '',
    language: 'en',
    direction: 'ltr',

    ui: {
      stickyNavigation: true,
      smoothScroll: true,
      showCardHoverLift: true,
      showFocusRing: true,
      respectReducedMotion: true,
      imageFit: 'contain',
      buttonTextTransform: 'none',
      maxTextWidth: '62ch'
    },

    colours: {
      nav: '#ffffff',
      navSecondary: '#5b294b',
      primary: '#c44f7a',
      primaryHover: '#a93d66',
      primarySoft: '#f8dce7',
      accent: '#7b5aa6',
      text: '#212121',
      mutedText: '#69636a',
      pageBackground: '#f7f7f8',
      surface: '#ffffff',
      border: '#e2dde1',
      success: '#18864b',
      danger: '#c62828',
      heroStart: '#fff8fb',
      heroEnd: '#f5e8ff',
      link: '#8f315c',
      focus: '#7b5aa6',
      selectionBackground: '#f2bfd3',
      selectionText: '#2d1724',
      overlay: 'rgba(31, 22, 29, .64)',
      inputBackground: '#ffffff'
    },

    layout: {
      contentWidth: '1280px',
      desktopGridColumns: 4,
      tabletGridColumns: 3,
      mobileGridColumns: 2,
      sectionPaddingDesktop: '34px 24px',
      sectionPaddingMobile: '22px 12px',
      cardGap: '16px',
      mobileCardGap: '8px',
      navigationHeight: '64px',
      cardImageHeight: '220px',
      mobileCardImageHeight: '138px',
      footerPadding: '30px 20px',
      modalMaxWidth: '620px'
    },

    typography: {
      brandSize: '1.22rem',
      heroSize: 'clamp(1.85rem, 4vw, 3.4rem)',
      heroLineHeight: '1.08',
      bodySize: '14px',
      heroDescriptionSize: '1rem',
      headingWeight: 700,
      bodyLineHeight: '1.5',
      letterSpacing: 'normal',
      buttonWeight: 600
    },

    shape: {
      smallRadius: '6px',
      controlRadius: '8px',
      cardRadius: '10px',
      panelRadius: '12px',
      pillRadius: '999px',
      imageRadius: '8px',
      inputRadius: '7px'
    },

    effects: {
      cardShadow: '0 1px 3px rgba(41, 23, 35, .08)',
      cardHoverShadow: '0 7px 18px rgba(74, 42, 63, .14)',
      cardHoverLift: '-3px',
      transition: '.2s ease',
      modalBackdropBlur: '3px',
      focusRing: '0 0 0 3px rgba(123, 90, 166, .24)'
    }
  };

  const css = `
    :root {
      --nav: ${DESIGN.colours.nav};
      --nav2: ${DESIGN.colours.navSecondary};
      --orange: ${DESIGN.colours.primary};
      --yellow: ${DESIGN.colours.primarySoft};
      --ink: ${DESIGN.colours.text};
      --muted: ${DESIGN.colours.mutedText};
      --bg: ${DESIGN.colours.pageBackground};
      --line: ${DESIGN.colours.border};
      --ok: ${DESIGN.colours.success};
      --bad: ${DESIGN.colours.danger};
      --site-surface: ${DESIGN.colours.surface};
      --site-link: ${DESIGN.colours.link};
      --site-max-width: ${DESIGN.layout.contentWidth};
      --site-card-radius: ${DESIGN.shape.cardRadius};
      --site-control-radius: ${DESIGN.shape.controlRadius};
      --site-panel-radius: ${DESIGN.shape.panelRadius};
      --site-shadow: ${DESIGN.effects.cardShadow};
      --site-hover-shadow: ${DESIGN.effects.cardHoverShadow};
    }

    html, body { font-family: ${DESIGN.fontFamily} !important; }
    html { scroll-behavior: ${DESIGN.ui.smoothScroll ? 'smooth' : 'auto'}; }
    body {
      color: var(--ink) !important;
      background: var(--bg) !important;
      font-size: ${DESIGN.typography.bodySize} !important;
      line-height: ${DESIGN.typography.bodyLineHeight};
      letter-spacing: ${DESIGN.typography.letterSpacing};
    }
    ::selection { background: ${DESIGN.colours.selectionBackground}; color: ${DESIGN.colours.selectionText}; }

    /* Compact marketplace-style navigation */
    .nav {
      min-height: ${DESIGN.layout.navigationHeight};
      background: var(--nav) !important;
      color: var(--ink) !important;
      border-bottom: 1px solid var(--line);
      box-shadow: 0 2px 8px rgba(39, 25, 34, .06);
      position: ${DESIGN.ui.stickyNavigation ? 'sticky' : 'relative'};
      top: 0;
      z-index: 1000;
    }
.brand{
    color:#1d4ea5 !important;
    font-size:1.35rem !important;
    font-weight:900 !important;
    line-height:1 !important;
    white-space:nowrap;
    letter-spacing:-0.02em;
    font-family:
      "Trebuchet MS",
      "Comic Sans MS",
      "Segoe UI",
      sans-serif !important;
}

.brand span{
    color:#f28c28 !important;
    font-weight:900 !important;
}

.mlc-brand-text{
    font-family:
      "Comic Sans MS",
      "Trebuchet MS",
      sans-serif !important;

    font-weight:900 !important;

    background:
      linear-gradient(
        90deg,
        #1d4ea5 0%,
        #1d4ea5 45%,
        #ff7a18 46%,
        #ffd000 60%,
        #39b54a 75%,
        #1b75ff 100%
      );

    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;

    background-clip:text;

    letter-spacing:-0.03em;
}
    .navlinks a { color: var(--ink) !important; font-size: 13px; font-weight: 600; }
    .navlinks a:hover { color: ${DESIGN.colours.primary} !important; }
    .search { border: 1px solid var(--line); border-radius: ${DESIGN.shape.controlRadius}; overflow: hidden; background: #fff; }
    .search:focus-within { border-color: ${DESIGN.colours.accent}; box-shadow: ${DESIGN.effects.focusRing}; }
    .search input { border: 0 !important; box-shadow: none !important; }
    .search button, .count { background: ${DESIGN.colours.primary} !important; color: #fff !important; }
    .count { min-width: 20px; height: 20px; display: inline-grid; place-items: center; border-radius: 999px; font-size: 11px; }

/* FIX: Keep Admin and My Orders visible in navigation */
#adminBtn,
#ordersBtn {
  display: inline-flex !important;
  align-items: center;
  visibility: visible !important;
  opacity: 1 !important;
  color: var(--ink) !important;
  -webkit-text-fill-color: var(--ink) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}

#adminBtn:hover,
#ordersBtn:hover {
  color: ${DESIGN.colours.primary} !important;
  -webkit-text-fill-color: ${DESIGN.colours.primary} !important;
}




    /* Compact hero: short content first, products visible sooner */
    .hero {
      background:
        radial-gradient(circle at 85% 20%, rgba(196,79,122,.12), transparent 27%),
        linear-gradient(120deg, ${DESIGN.colours.heroStart}, ${DESIGN.colours.heroEnd}) !important;
      padding: ${DESIGN.layout.sectionPaddingDesktop} !important;
      border-bottom: 1px solid #eadfe6;
    }
    .hero > div, .shell { max-width: var(--site-max-width) !important; margin-inline: auto; }
    .hero .badge {
      display: inline-flex;
      background: #fff !important;
      color: ${DESIGN.colours.primaryHover} !important;
      border: 1px solid #ebc5d4;
      border-radius: ${DESIGN.shape.pillRadius};
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .45px;
    }
    .hero h1 {
      margin: 10px 0 8px !important;
      max-width: 760px;
      color: var(--ink) !important;
      font-size: ${DESIGN.typography.heroSize} !important;
      line-height: ${DESIGN.typography.heroLineHeight} !important;
      font-weight: ${DESIGN.typography.headingWeight} !important;
      letter-spacing: -.025em;
    }
    .hero p {
      margin: 0 !important;
      max-width: ${DESIGN.ui.maxTextWidth};
      color: var(--muted) !important;
      font-size: ${DESIGN.typography.heroDescriptionSize} !important;
    }

    /* Marketplace controls and product grid */
    .grid {
      grid-template-columns: repeat(${DESIGN.layout.desktopGridColumns}, minmax(0, 1fr));
      gap: ${DESIGN.layout.cardGap};
    }
    .card {
      overflow: hidden;
      border: 1px solid var(--line) !important;
      border-radius: var(--site-card-radius) !important;
      background: var(--site-surface) !important;
      box-shadow: var(--site-shadow) !important;
      transition: transform ${DESIGN.effects.transition}, box-shadow ${DESIGN.effects.transition}, border-color ${DESIGN.effects.transition} !important;
    }
    .card:hover {
      transform: translateY(${DESIGN.effects.cardHoverLift}) !important;
      border-color: #d3c1cb !important;
      box-shadow: var(--site-hover-shadow) !important;
    }
    .card img {
      width: 100%;
      height: ${DESIGN.layout.cardImageHeight};
      object-fit: ${DESIGN.ui.imageFit};
      background: #fff;
      border-radius: 0 !important;
      transition: transform .28s ease;
    }
    .card:hover img { transform: scale(1.025); }
    .card h2, .card h3 { font-size: 15px !important; line-height: 1.35 !important; font-weight: 600 !important; }
    .card p { color: var(--muted); font-size: 13px; }
    .pill, input, textarea, select { border-radius: var(--site-control-radius); }
    input, textarea, select { background: ${DESIGN.colours.inputBackground}; border-color: var(--line); }
    .panel, .order, .review, .cartrow, .product {
      border-radius: var(--site-panel-radius) !important;
      border-color: var(--line) !important;
    }
    .primary {
      color: #fff !important;
      background: ${DESIGN.colours.primary} !important;
      border-color: ${DESIGN.colours.primary} !important;
    }
    .primary:hover { background: ${DESIGN.colours.primaryHover} !important; border-color: ${DESIGN.colours.primaryHover} !important; }
    .dark, th, .footer { color: #fff !important; background: var(--nav2) !important; }
    .badge, .discount-badge { color: #fff !important; background: ${DESIGN.colours.danger} !important; }
    .click, a.shop-link { color: var(--site-link) !important; }
    .footer { padding: ${DESIGN.layout.footerPadding}; }
    .footer a { color: #f7dbe7 !important; }
    .panel { width: min(${DESIGN.layout.modalMaxWidth}, 100%); }
    .modal { background: ${DESIGN.colours.overlay}; backdrop-filter: blur(${DESIGN.effects.modalBackdropBlur}); }
    button, .pill {
      font-weight: ${DESIGN.typography.buttonWeight};
      text-transform: ${DESIGN.ui.buttonTextTransform};
      transition: background-color ${DESIGN.effects.transition}, color ${DESIGN.effects.transition}, border-color ${DESIGN.effects.transition}, transform ${DESIGN.effects.transition};
    }
    button:active, .pill:active { transform: scale(.98); }
    h1, h2, h3, .brand { font-weight: ${DESIGN.typography.headingWeight}; }
    img { border-radius: ${DESIGN.shape.imageRadius}; }

    ${DESIGN.ui.showFocusRing ? `:where(a,button,input,select,textarea,summary):focus-visible { outline: none; box-shadow: ${DESIGN.effects.focusRing} !important; }` : ''}
    ${DESIGN.ui.showCardHoverLift ? '' : '.card:hover,.review:hover { transform:none !important; }'}

    @media (max-width: 1000px) {
      .grid { grid-template-columns: repeat(${DESIGN.layout.tabletGridColumns}, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .nav { min-height: 58px; }
.brand {
    font-size: 1.05rem !important;
    font-weight: 900 !important;
}
      .navlinks a { font-size: 12px; }
      .hero { padding: ${DESIGN.layout.sectionPaddingMobile} !important; }
      .hero h1 { font-size: clamp(1.55rem, 8vw, 2.15rem) !important; margin-top: 8px !important; }
      .hero p { font-size: 13px !important; }
      .hero .badge { font-size: 9px; padding: 4px 8px; }
      .grid { grid-template-columns: repeat(${DESIGN.layout.mobileGridColumns}, minmax(0, 1fr)); gap: ${DESIGN.layout.mobileCardGap}; }
      .card img { height: ${DESIGN.layout.mobileCardImageHeight}; }
      .card h2, .card h3 { font-size: 13px !important; }
      .card p { font-size: 12px; }
    }
    ${DESIGN.ui.respectReducedMotion ? `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }` : ''}
  
@media (max-width:700px){

  .nav:has(#adminBtn) #wishlistFilter::before{
      background-image:url('/svg/wishlist-nocolor.svg') !important;
  }

  .nav:has(#adminBtn) #wishlistFilter.active::before{
      background-image:url('/svg/wishlist-red.svg') !important;
  }

.mlc-brand-text{
    font-size:0.95rem !important;
}
}
  
  `;
  


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

    const suffix =
      location.pathname === '/admin'
        ? TEXT.admin.brandSuffix
        : '';

element.innerHTML =
`<span class="mlc-brand-text">Manna's Little Creations</span>${suffix}`;

    element.setAttribute(
      'aria-label',
      `${TEXT.websiteName}${suffix}`
    );

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
      if (footer) footer.innerHTML = `© ${new Date().getFullYear()} ${TEXT.home.footerBrand} · <a href="/policies">${TEXT.home.policies}</a>`;
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
      [TEXT.faq.all, ...TEXT.faq.categories].forEach((value, index) => {
        if (options[index]) options[index].textContent = value;
      });
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

  const applyDocumentSettings = () => {
    document.documentElement.lang = DESIGN.language || 'en';
    document.documentElement.dir = DESIGN.direction === 'rtl' ? 'rtl' : 'ltr';
    if (DESIGN.favicon) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = DESIGN.favicon;
    }
  };

  applyDocumentSettings();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPageText, { once: true });
  } else {
    applyPageText();
  }

  const publicControl = Object.freeze({ TEXT, DESIGN });
  window.REDESIGN_CONTROL = publicControl;
  window.WEBSITE_DESIGN_CONTROL = publicControl;
})();