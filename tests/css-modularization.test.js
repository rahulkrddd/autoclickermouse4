const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const cssDir=path.join(__dirname,'..','public','css');
const fragments=['01-foundation.css','02-shared-components.css','03-storefront.css','04-product-checkout.css','05-orders-cart-reviews.css','06-admin-foundation.css','07-admin-products.css','08-responsive-enhancements.css'];
const pages={
  'index.html':'home.css','product.html':'product-page.css','cart.html':'cart-page.css','orders.html':'orders-page.css',
  'review.html':'reviews-page.css','faq.html':'faq-page.css','policies.html':'policies-page.css','admin.html':'admin-page.css'
};
test('modular fragments preserve original CSS byte for byte',()=>{
  const original=fs.readFileSync(path.join(cssDir,'app.original.css'));
  const joined=Buffer.concat(fragments.map(f=>fs.readFileSync(path.join(cssDir,f))));
  assert.equal(crypto.createHash('sha256').update(joined).digest('hex'),crypto.createHash('sha256').update(original).digest('hex'));
  assert.deepEqual(joined,original);
});
test('every page uses its dedicated stylesheet',()=>{
  for(const [html,css] of Object.entries(pages)){
    const source=fs.readFileSync(path.join(__dirname,'..','public',html),'utf8');
    assert.match(source,new RegExp(`/css/${css.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
    assert.equal(fs.existsSync(path.join(cssDir,css)),true);
  }
});
test('shared entrypoint imports every fragment once in original order',()=>{
  const app=fs.readFileSync(path.join(cssDir,'app.css'),'utf8');
  let last=-1;
  for(const f of fragments){const at=app.indexOf(f);assert.ok(at>last);assert.equal(app.indexOf(f,at+1),-1);last=at;}
});