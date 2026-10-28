"""Offline browser navigation regression tests. API responses are explicit fixtures, not live services."""
import asyncio, json, mimetypes, re
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
ORIGINAL_FAQ=(ROOT/'reports/fixtures/faq.before.html').read_text()
PAGES={'/':'index','/FAQs':'faq','/cart':'cart','/review':'review','/my-orders':'orders','/admin':'admin','/policies':'policies','/product/test-product':'product'}
PRODUCT={'id':'test-product','slug':'test-product','name':'Navigation Test Product','price':100,'oldPrice':120,'stock':20,'active':True,'addToCartEnabled':True,'image':'/images/product.svg','images':['/images/product.svg'],'variants':[],'category':'Test','description':'Test','shortDescription':'Test','minOrderQty':1,'maxOrderQty':20}
CATALOG=[PRODUCT]
results=[]
def record(name,ok,detail=''):
 results.append({'test':name,'passed':bool(ok),'detail':str(detail)})
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome',args=['--no-sandbox'])
  context=await browser.new_context()
  baseline=False
  current_site="site-a"
  requests=[]
  async def route_handler(route):
   nonlocal baseline
   u=urlparse(route.request.url); path=u.path; requests.append((path,route.request.method))
   if u.hostname!='navigation.test':
    return await route.fulfill(status=200,body='window.Razorpay=function(){};window.Cashfree=function(){return {}};',content_type='application/javascript')
   if path in PAGES and route.request.method=='GET':
    text=ORIGINAL_FAQ if baseline and path=='/FAQs' else (ROOT/'public'/f'{PAGES[path]}.html').read_text()
    return await route.fulfill(body=text,content_type='text/html')
   if path=='/site-context.js':return await route.fulfill(body=f"window.__SITE_ID__='{current_site}';",content_type='application/javascript')
   if path=='/redesign.js':file=ROOT/f'multiwebsite/redesign/{current_site}.js'
   elif path=='/js/seo.js':file=ROOT/'multiwebsite/public/js/seo.js'
   else:file=ROOT/'public'/path.lstrip('/')
   if file.is_file():return await route.fulfill(body=file.read_bytes(),content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
   data={}
   if path=='/api/products':data=CATALOG
   elif path.startswith('/api/products/'):data=PRODUCT
   elif path=='/api/site-content/faqs':data=[{'question':'Where is my order?','answer':'Use My Orders.','category':'Orders'},{'question':'How to view cart?','answer':'Use Cart.','category':'Shopping'}]
   elif path=='/api/site-content/policies':data={'STORE_NAME':'Test Store','PRIVACY_POLICY':'Test policy'}
   elif path=='/api/settings/public':data={'storeOpen':True,'shippingCharge':0,'freeShippingThreshold':0,'paymentGateways':{}}
   elif path=='/api/seo-config':data={'siteName':'Test Store','title':'Test Store','description':'Test','baseUrl':'http://navigation.test'}
   elif path=='/review/getOrders':data=[]
   elif path=='/my-orders':data={'orders':[{'order_id':'TEST-001','name':'Test Customer','mobile':'9999999999','items':[],'feedback':'NA','current_status':'Order Placed','currency':'INR','date':'2026-10-27','time':'12:00','address':'Test address','paymentMethod':'cod','deliveryMode':'delivery'}],'success':True,'message':'OK'}
   elif path=='/admin/admin-login':data={'success':True,'message':'OK'}
   elif path.startswith('/admin/'):
    if any(x in path for x in ['products','orders']):data={'items':[],'products':[],'orders':[],'total':0,'totalRecords':0,'totalPages':1,'page':1}
    elif any(x in path for x in ['coupons','pickups','logs','activity','customers']):data=[]
   elif path=='/api/track':data={'ok':True}
   elif path.endswith('.ico'):return await route.fulfill(status=404,body='Binary not supplied')
   else:return await route.fulfill(status=404,body='Unmocked '+path)
   return await route.fulfill(body=json.dumps(data),content_type='application/json')
  await context.route('**/*',route_handler)
  await context.add_init_script("for(const site of ['site-a','site-b','site-c'])localStorage.setItem('acm:'+site+':cart',JSON.stringify([{id:'test-product',variantId:'__base__',quantity:3}]));")
  page=await context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  baseline=True;await page.goto('http://navigation.test/FAQs');await page.wait_for_timeout(200)
  record('Baseline reproduces FAQ badge stuck at zero',await page.locator('#cartCount').inner_text()=='0')
  record('Baseline reproduces missing Admin handler',await page.locator('#adminBtn').evaluate('(e)=>e.onclick===null'))
  record('Baseline reproduces missing Orders handler',await page.locator('#ordersBtn').evaluate('(e)=>e.onclick===null'))
  baseline=False;errors.clear();await page.reload();await page.wait_for_timeout(250)
  record('FAQ badge restores site cart quantity',await page.locator('#cartCount').inner_text()=='3')
  record('FAQ no browser script errors',not errors,errors)
  record('FAQ missing nav-active script removed',await page.locator('script[src*="nav-active"]').count()==0)
  await page.locator('#adminBtn').click();record('FAQ Admin opens existing login modal',await page.locator('#login').evaluate('(e)=>e.classList.contains("open")') and await page.locator('#loginTitle').inner_text()=='Admin Login')
  await page.locator('#login .close').click();record('FAQ login close works',not await page.locator('#login').evaluate('(e)=>e.classList.contains("open")'))
  await page.locator('#ordersBtn').click();record('FAQ Orders asks mobile when absent',await page.locator('#loginTitle').inner_text()=='Find My Orders')
  await page.locator('#loginInput').fill('abc123xyz');record('Existing numeric input filter preserved',await page.locator('#loginInput').input_value()=='123')
  await page.locator('#loginInput').fill('9999999999');await page.locator('#loginForm button').click();await page.wait_for_url('**/my-orders?mobileNumber=9999999999');record('FAQ Orders submit navigates',True)
  record('FAQ Orders uses original POST endpoint',('/my-orders','POST') in requests)
  await page.goto('http://navigation.test/FAQs');await page.locator('#ordersBtn').click();await page.wait_for_url('**/my-orders?mobileNumber=9999999999');record('FAQ saved mobile navigation preserved',True)
  await page.goto('http://navigation.test/FAQs');await page.locator('#adminBtn').click();await page.locator('#loginInput').fill('1234');await page.locator('#loginForm button').click();await page.wait_for_url('**/admin');record('FAQ Admin submit navigates',True)
  record('FAQ Admin uses original POST endpoint',('/admin/admin-login','POST') in requests)
  for selector,dest in [('a[href="/cart"]','/cart'),('a[href="/review"]','/review'),('.brand','/')]:
   await page.goto('http://navigation.test/FAQs');await page.locator(selector).first.click();await page.wait_for_url('http://navigation.test'+dest);record('FAQ link navigates '+dest,True)
  await page.goto('http://navigation.test/FAQs');await page.locator('#fq').fill('view cart');record('FAQ search preserved',await page.locator('.q').count()==1)
  await page.locator('.q').click();record('FAQ expand preserved',await page.locator('.q').get_attribute('aria-expanded')=='true')
  await page.locator('.q').click();record('FAQ collapse preserved',await page.locator('.q').get_attribute('aria-expanded')=='false')
  await page.locator('#fq').fill('not present');record('FAQ empty search state preserved','No FAQs match' in await page.locator('#list').inner_text())
  for path in ['/','/FAQs','/cart','/review','/product/test-product']:
   errors.clear();await page.goto('http://navigation.test'+path);await page.wait_for_timeout(200)
   record('Page script smoke '+path,not errors,errors)
   record('Cart badge on '+path,await page.locator('#cartCount').inner_text()=='3')
   if await page.locator('#globalSearch').count():
    await page.locator('#globalSearch').fill('test product');await page.locator('.search button').click();await page.wait_for_timeout(150)
    record('Search button navigation '+path,page.url=='http://navigation.test/?q=test%20product' if path!='/' else await page.locator('#globalSearch').input_value()=='test product')
  for path in ['/my-orders?mobileNumber=9999999999','/admin','/policies']:
   errors.clear();await page.goto('http://navigation.test'+path);await page.wait_for_timeout(200);record('Page script smoke '+path,not errors,errors)
   if await page.locator('a[href="/"]').count():
    await page.locator('a[href="/"]').first.click();await page.wait_for_url('http://navigation.test/');record('Return to store '+path,True)
  await page.goto('http://navigation.test/FAQs')
  await page.evaluate("localStorage.setItem('acm:site-a:cart',JSON.stringify([{id:'test-product',quantity:5}]));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
  record('History restore refreshes badge',await page.locator('#cartCount').inner_text()=='5')
  second=await context.new_page();await second.goto('http://navigation.test/policies');await second.evaluate("localStorage.setItem('acm:site-a:cart',JSON.stringify([{id:'test-product',quantity:7}]))");await page.wait_for_timeout(100)
  record('Other tab cart update refreshes badge',await page.locator('#cartCount').inner_text()=='7')
  await second.evaluate("localStorage.setItem('acm:site-b:cart',JSON.stringify([{id:'test-product',quantity:99}]))");await page.wait_for_timeout(100)
  record('Other site cart cannot change current badge',await page.locator('#cartCount').inner_text()=='7')
  await page.set_viewport_size({'width':375,'height':812});await page.locator('#adminBtn').click();record('Mobile FAQ Admin modal works',await page.locator('#login').evaluate('(e)=>e.classList.contains("open")'))
  for site in ['site-b','site-c']:
   current_site=site
   errors.clear();await page.goto('http://navigation.test/FAQs');await page.wait_for_timeout(200)
   record(site+' FAQ script smoke',not errors,errors)
   record(site+' FAQ site-scoped cart badge',await page.locator('#cartCount').inner_text()=='3')
   await page.locator('#adminBtn').click();record(site+' FAQ Admin modal',await page.locator('#loginTitle').inner_text()=='Admin Login')
   await page.locator('#login .close').click();await page.locator('#ordersBtn').click();record(site+' FAQ Orders modal',await page.locator('#loginTitle').inner_text()=='Find My Orders')
   await page.locator('#login .close').click();await page.locator('a[href="/cart"]').click();await page.wait_for_url('**/cart');record(site+' FAQ Cart navigation',True)
  current_site='site-a'
  PRODUCT.update({'name':'Mannas Gifting Store - Kids DIY Animal Painting Gift Kit with Six Paintable Animal Figures and Creative Craft Essentials','variationEnabled':True,'sku':'BASE-SKU','variants':[{'variantId':'blue-7','color':'BLUE','size':'7','material':'Cotton','style':'Modern','price':99,'stock':8,'sku':'BLUE-7-SKU','minOrderQty':1,'maxOrderQty':8,'additionalAttributes':[{'attributeName':'Finish','attributeValue':'Matte'}]}]})
  BASE={**PRODUCT,'id':'plain-product','slug':'plain-product','name':'Plain product','variationEnabled':False,'variants':[],'sku':'PLAIN-SKU'}
  CATALOG.append(BASE)
  async def fresh_home():
   await page.goto('http://navigation.test/')
   await page.evaluate('localStorage.clear();sessionStorage.clear()')
   await page.reload();await page.wait_for_timeout(200)
  await fresh_home()
  before=await page.evaluate("localStorage.getItem('acm:site-a:cart')")
  await page.locator('.product-card').first.locator('.cart-action').click();await page.wait_for_url('**/product/test-product')
  record('Variation Add opens detail page without adding item',await page.evaluate("localStorage.getItem('acm:site-a:cart')")==before)
  record('Variation detail selector available',await page.locator('[data-variant-id="blue-7"]').count()==1)
  await fresh_home();await page.evaluate('window.__checkoutCalled=false;window.openDirectCheckout=()=>window.__checkoutCalled=true')
  await page.locator('.product-card').first.locator('.buy-action').click();await page.wait_for_url('**/product/test-product')
  record('Variation Buy Now opens detail page',True)
  await page.locator('[data-variant-id="blue-7"]').click();await page.locator('#add').click()
  cart=await page.evaluate("JSON.parse(localStorage.getItem('acm:site-a:cart'))")
  record('Detail Add preserves selected variation ID',any(x.get('variantId')=='blue-7' for x in cart))
  await page.evaluate('window.__checkoutItems=null;window.openDirectCheckout=(items)=>window.__checkoutItems=items')
  await page.locator('#buy').click();items=await page.evaluate('window.__checkoutItems')
  record('Detail Buy Now passes selected variation to existing checkout',items[0]['variantId']=='blue-7')
  await page.evaluate('selectedVariant=null');await page.locator('#buy').click()
  record('Detail option warning is English','Please select an available option.' in await page.locator('.shop-toast').inner_text())
  await page.evaluate('addCart(p,1,null)')
  record('Shared Add option warning is English','Please select an available option.' in await page.locator('.shop-toast').inner_text())
  await fresh_home();await page.locator('.product-card').nth(1).locator('.cart-action').click()
  record('Non-variation Add remains direct cart add',any(x['id']=='plain-product' for x in await page.evaluate("JSON.parse(localStorage.getItem('acm:site-a:cart'))")))
  await page.evaluate('window.__checkoutItems=null;window.openDirectCheckout=(items)=>window.__checkoutItems=items')
  await page.locator('.product-card').nth(1).locator('.buy-action').click()
  record('Non-variation Buy remains direct checkout',(await page.evaluate('window.__checkoutItems'))[0]['productId']=='plain-product')
  await page.evaluate("localStorage.setItem('acm:site-a:cart',JSON.stringify([{id:'test-product',variantId:'__base__',quantity:1},{id:'test-product',variantId:'blue-7',quantity:1}]))")
  # add_init_script seeds storage on navigation, so restore fixture after load then render.
  await page.goto('http://navigation.test/cart');await page.wait_for_timeout(150)
  await page.evaluate("localStorage.setItem('acm:site-a:cart',JSON.stringify([{id:'test-product',variantId:'__base__',quantity:1},{id:'test-product',variantId:'blue-7',quantity:1}]));render(true)")
  await page.wait_for_timeout(150)
  rows=page.locator('.cartrow');record('Base and variant cart rows remain separate',await rows.count()==2)
  base_text=await rows.nth(0).inner_text();variant_text=await rows.nth(1).inner_text()
  record('Base cart has no redundant Base labels','Base product' not in base_text and 'Base' not in base_text.splitlines())
  record('Base cart retains name price and SKU',PRODUCT['name'] in base_text and '₹100' in base_text and 'SKU: BASE-SKU' in base_text)
  record('Variant cart shows attributes once',all(variant_text.count(t)==1 for t in ['Color: BLUE','Size: 7','Material: Cotton','Style: Modern','Finish: Matte']))
  record('Variant cart retains variation SKU and price','BLUE-7-SKU' in variant_text and '₹99' in variant_text)
  href=await rows.nth(1).locator('h3 a').get_attribute('href');record('Variant cart detail link retains variant query','?variant=blue-7' in href)
  await rows.nth(1).locator('select').select_option('2');await page.wait_for_timeout(100)
  record('Cart quantity still updates only selected variation',any(x.get('variantId')=='blue-7' and x['quantity']==2 for x in await page.evaluate("JSON.parse(localStorage.getItem('acm:site-a:cart'))")))
  await rows.nth(1).locator('button').click();await page.wait_for_timeout(100)
  cart=await page.evaluate("JSON.parse(localStorage.getItem('acm:site-a:cart'))")
  record('Cart remove still preserves base item',len(cart)==1 and cart[0]['variantId']=='__base__')
  for site in ['site-a','site-b','site-c']:
   current_site=site
   await fresh_home()
   for width in [320,360,375,390,412,720,1024,1440,1902]:
    await page.set_viewport_size({'width':width,'height':900});await page.wait_for_timeout(60)
    title=await page.locator('.product-name-clamp').first.evaluate("""e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {text:e.textContent,client:e.clientHeight,scroll:e.scrollHeight,overflow:s.overflow,lineClamp:s.webkitLineClamp,bottom:r.bottom,next:e.nextElementSibling.getBoundingClientRect().top}}""")
    record(f'{site} full title at {width}px',title['text']==PRODUCT['name'] and title['scroll']<=title['client']+1 and title['bottom']<=title['next']+1,title)
    footer=await page.locator('.footer').evaluate("""e=>{const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()].filter(r=>r.width>0);const r=e.getBoundingClientRect();return {height:r.height,width:r.width,viewport:innerWidth,textWidth:range.getBoundingClientRect().width,lines:[...new Set(rects.map(r=>Math.round(r.top)))].length,font:getComputedStyle(e).fontSize,scroll:e.scrollWidth,client:e.clientWidth}}""")
    record(f'{site} compact single-line footer at {width}px',footer['lines']==1 and footer['width']<=width+1 and footer['scroll']<=footer['client']+1 and footer['height']<55,footer)
  # Long unbroken titles and larger browser text settings must remain readable.
  await page.locator('.product-name-clamp').first.evaluate("e=>e.textContent='UnbrokenProductName'.repeat(15)")
  await page.set_viewport_size({'width':320,'height':900})
  record('Long unbroken product title wraps without clipping',await page.locator('.product-name-clamp').first.evaluate('e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1'))
  await page.add_style_tag(content='html {font-size: 22px !important;}')
  record('Larger text setting does not clip product title',await page.locator('.product-name-clamp').first.evaluate('e=>e.scrollHeight<=e.clientHeight+1'))
  await browser.close()
 report={'mode':'Offline Chromium with mocked API responses; not live database/payment verification','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
 (ROOT/'reports/STOREFRONT_BROWSER_RESULTS.json').write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2))
asyncio.run(main())
