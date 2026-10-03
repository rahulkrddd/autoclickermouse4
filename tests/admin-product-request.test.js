const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');

test('create product marks backend-required fields and sends initial stock',()=>{
  const x=read('public/js/admin.js');
  for(const id of ['id','slug','name','price']) assert.match(x,new RegExp("\\['"+id+"'"));
  assert.match(x,/required-mark/);
  assert.match(x,/aria-required/);
  assert.match(x,/\['stock','Initial stock'\]/);
  assert.match(x,/,'price','stock','oldPrice'/);
});

test('product pagination uses the same structure as order pagination',()=>{
  const h=read('public/admin.html');
  const orders=h.match(/<div class="admin-pagination"><span id="orderShowing".*?<\/div>/s)?.[0];
  const products=h.match(/<div class="admin-pagination product-pagination"><span id="productShowing".*?<\/div>/s)?.[0];
  assert.ok(orders);
  assert.ok(products);
  assert.match(products,/productPrev/);
  assert.match(products,/productNext/);
  assert.ok(h.indexOf('id="productList"') < h.indexOf('class="admin-pagination product-pagination"'));
});

test('product previous and next are bounded and server-driven',()=>{
  const x=read('public/js/admin.js');
  assert.match(x,/page=Math\.max\(1,Number\(requestedPage\)\|\|1\)/);
  assert.match(x,/productPager\.hasPrevious/);
  assert.match(x,/productPager\.hasNext/);
  assert.match(x,/\/admin\/products-data\?/);
  assert.match(x,/productPrev'\)\.onclick=.*hasPrevious.*loadProductPage\(productPager\.page-1\)/s);
  assert.match(x,/productNext'\)\.onclick=.*hasNext.*loadProductPage\(productPager\.page\+1\)/s);
});

test('product pager has one authoritative state renderer and clickable navigation',()=>{
  const x=read('public/js/admin.js');
  assert.match(x,/function updateProductPagination\(\)/);
  assert.match(x,/productPrev'\)\.onclick=.*productPager\.hasPrevious/s);
  assert.match(x,/productNext'\)\.onclick=.*productPager\.hasNext/s);
  assert.doesNotMatch(x,/if\(productRequestActive\)return/);
  assert.match(x,/renderProductsBase\(\)/);
});

test('admin script does not bind removed search button IDs before pager setup',()=>{
  const x=read('public/js/admin.js');
  assert.doesNotMatch(x,/\$\('#orderSearchBtn'\)\.onclick/);
  assert.doesNotMatch(x,/\$\('#orderClearBtn'\)\.onclick/);
  assert.doesNotMatch(x,/\$\('#productSearchBtn'\)\.onclick/);
  assert.doesNotMatch(x,/\$\('#productClearBtn'\)\.onclick/);
  assert.equal((x.match(/load\(\)\.catch/g)||[]).length,1);
  assert.ok(x.lastIndexOf('load().catch')>x.indexOf('function updateProductPagination'));
});