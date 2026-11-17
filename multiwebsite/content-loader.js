const fs = require('fs');
const path = require('path');

const FAQ_ROOT = path.join(__dirname, 'faqs');
const POLICY_ROOT = path.join(__dirname, 'policies');
const SAFE_SITE_ID = /^[a-z0-9][a-z0-9_-]{2,49}$/;
const EMPTY_POLICIES = Object.freeze({
  STORE_NAME: '', COMPANY_NAME: '', EMAIL: '', MOBILE: '', ADDRESS: '',
  PRIVACY_POLICY: '', SHIPPING_POLICY: '', RETURN_POLICY: '', REFUND_POLICY: '',
  TERMS_AND_CONDITIONS: '', DISCLAIMER: ''
});

function loadModule(root, siteId) {
  const normalized = String(siteId || '').trim().toLowerCase();
  const candidates = SAFE_SITE_ID.test(normalized) ? [`${normalized}.js`, 'default.js'] : ['default.js'];
  for (const file of candidates) {
    const target = path.join(root, file);
    if (!fs.existsSync(target)) continue;
    delete require.cache[require.resolve(target)];
    return require(target);
  }
  return null;
}

function loadFaq(siteId) {
  const value = loadModule(FAQ_ROOT, siteId);
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && typeof item === 'object')
    .map(item => ({ question: String(item.question || '').trim(), answer: String(item.answer || '').trim() }))
    .filter(item => item.question || item.answer);
}

function loadPolicies(siteId) {
  const value = loadModule(POLICY_ROOT, siteId);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...EMPTY_POLICIES };
  return Object.fromEntries(Object.keys(EMPTY_POLICIES).map(key => [key, String(value[key] || '').trim()]));
}

module.exports = { loadFaq, loadPolicies };
