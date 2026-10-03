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
    fontFamily: 'Arial, sans-serif',

    colours: {
      nav: '#131921',
      navSecondary: '#232f3e',
      primary: '#ff9900',
      primarySoft: '#ffd814',
      text: '#0f1111',
      mutedText: '#565959',
      pageBackground: '#f3f4f6',
      surface: '#ffffff',
      border: '#d5d9d9',
      success: '#067d62',
      danger: '#b12704',
      heroStart: '#ffffff',
      heroEnd: '#ffe8b3',
      link: '#007185'
    },

    layout: {
      contentWidth: '1260px',
      desktopGridColumns: 4,
      tabletGridColumns: 2,
      mobileGridColumns: 2,
      sectionPaddingDesktop: '58px 24px',
      sectionPaddingMobile: '36px 16px',
      cardGap: '18px',
      mobileCardGap: '8px'
    },

    typography: {
      brandSize: '1.4rem',
      heroSize: 'clamp(2.2rem, 6vw, 5.5rem)',
      heroLineHeight: '0.95',
      bodySize: '1rem',
      heroDescriptionSize: '1.1rem'
    },

    shape: {
      smallRadius: '8px',
      controlRadius: '12px',
      cardRadius: '14px',
      panelRadius: '16px',
      pillRadius: '999px'
    },

    effects: {
      cardShadow: '0 4px 14px rgba(0,0,0,.05)',
      cardHoverShadow: '0 12px 28px rgba(0,0,0,.13)',
      cardHoverLift: '-5px',
      transition: '.25s'
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
    body { color: var(--ink) !important; background-color: var(--bg) !important; font-size: ${DESIGN.typography.bodySize}; }
    .nav { background: var(--nav) !important; }
    .brand { font-size: ${DESIGN.typography.brandSize} !important; }
    .brand span { color: var(--orange) !important; }
    .search button, .count { background: var(--orange) !important; }
    .hero { background: linear-gradient(115deg, ${DESIGN.colours.heroStart} 0 50%, ${DESIGN.colours.heroEnd}) !important; padding: ${DESIGN.layout.sectionPaddingDesktop} !important; }
    .hero > div, .shell { max-width: var(--site-max-width) !important; }
    .hero h1 { font-size: ${DESIGN.typography.heroSize} !important; line-height: ${DESIGN.typography.heroLineHeight} !important; color: var(--ink) !important; }
    .hero p { font-size: ${DESIGN.typography.heroDescriptionSize} !important; color: var(--muted) !important; }
    .grid { grid-template-columns: repeat(${DESIGN.layout.desktopGridColumns}, minmax(0, 1fr)); gap: ${DESIGN.layout.cardGap}; }
    .card { border-radius: var(--site-card-radius) !important; background: var(--site-surface) !important; border-color: var(--line) !important; box-shadow: var(--site-shadow) !important; transition: ${DESIGN.effects.transition} !important; }
    .card:hover { transform: translateY(${DESIGN.effects.cardHoverLift}) !important; box-shadow: var(--site-hover-shadow) !important; }
    .pill, input, textarea, select { border-radius: var(--site-control-radius); }
    .panel, .order, .review, .cartrow, .product { border-radius: var(--site-panel-radius) !important; }
    .primary { background: var(--yellow) !important; }
    .dark, th, .footer { background: var(--nav2) !important; }
    .badge, .discount-badge { background-color: ${DESIGN.colours.danger} !important; }
    .click, a.shop-link { color: var(--site-link) !important; }
    @media (max-width: 1000px) {
      .grid { grid-template-columns: repeat(${DESIGN.layout.tabletGridColumns}, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .hero { padding: ${DESIGN.layout.sectionPaddingMobile} !important; }
      .grid { grid-template-columns: repeat(${DESIGN.layout.mobileGridColumns}, minmax(0, 1fr)); gap: ${DESIGN.layout.mobileCardGap}; }
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