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
  PRODUCT.update({'name':'Kids DIY Animal Painting Kit','category':'Craft kits','subCategory':'Animal figures','tags':['diy'],'image':'/images/product.svg'})
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(e.stack))
  for site in ['site-a','site-b','site-c']:
   current_site=site
   for width in [320,390,700,701,1024,1440]:
    await page.set_viewport_size({'width':width,'height':844});await page.goto('http://navigation.test/',wait_until='domcontentloaded');await page.wait_for_timeout(150)
    key='acm:'+site+':searchHistory'
    await page.evaluate('(key)=>localStorage.removeItem(key)',key)
    await page.locator('#globalSearch').click()
    record(f'{site} {width} empty history is honest',await page.locator('.so-empty').inner_text()=='No recent searches yet. Your searches will appear here.')
    await page.locator('#globalSearch').fill('animal');await page.wait_for_timeout(50)
    record(f'{site} {width} typed actual product with image and category',await page.locator('.so-product-name').first.inner_text()==PRODUCT['name'] and await page.locator('.so-product-image').count()==1 and 'Craft kits' in await page.locator('.so-product-category').inner_text())
    geo=await page.locator('.so-panel').evaluate('e=>{const r=e.getBoundingClientRect();return {x:r.x,w:r.width,b:r.bottom,hit:!!document.elementFromPoint(r.x+20,r.y+70)?.closest("#searchOverlayV3")}}')
    record(f'{site} {width} overlay above products',geo['hit'] and geo['b']<=845 and (width>700 or abs(geo['b']-844)<2),geo)
    await page.locator('#globalSearch').press('Enter')
    record(f'{site} {width} submitted search persisted',await page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))[0]',key)=='animal')
    await page.reload(wait_until='domcontentloaded');await page.wait_for_timeout(150);await page.locator('#globalSearch').fill('');await page.locator('#globalSearch').click()
    record(f'{site} {width} empty input restores history after reload',await page.locator('.so-history-text').inner_text()=='animal' and await page.locator('.so-product-name').count()==0)
    await page.locator('.so-history-remove').click()
    record(f'{site} {width} delete history persists',await page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).length',key)==0)
    await page.locator('.so-close').click()
  current_site='site-b';await page.goto('http://navigation.test/',wait_until='domcontentloaded');await page.wait_for_timeout(150)
  await page.locator('#globalSearch').fill('animal');await page.locator('#globalSearch').press('Enter');await page.locator('#globalSearch').fill('ANIMAL');await page.locator('#globalSearch').press('Enter')
  record('History deduplicated case-insensitively',await page.evaluate("JSON.parse(localStorage.getItem('acm:site-b:searchHistory')).length===1"))
  await page.locator('#globalSearch').fill('animal');await page.locator('#globalSearch').click();await page.locator('.so-product-name').click();await page.wait_for_url('**/product/test-product');await page.wait_for_timeout(350)
  record('Product click opens correct details',page.url.endswith('/product/test-product'))
  await page.goto('http://navigation.test/',wait_until='domcontentloaded');await page.wait_for_timeout(150)
  await page.locator('#globalSearch').click();await page.locator('#globalSearch').fill('no-match-zz')
  record('No match message',await page.locator('.so-empty').inner_text()=='No matching products. Try another search.')
  await page.locator('#globalSearch').fill('animal');await page.locator('#globalSearch').press('ArrowDown');await page.locator('#globalSearch').press('Enter');await page.wait_for_url('**/product/test-product');await page.wait_for_timeout(350)
  record('Keyboard product selection navigates',page.url.endswith('/product/test-product'))
  touch=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  await touch.route('**/*',route_handler);m=await touch.new_page();await m.goto('http://navigation.test/',wait_until='domcontentloaded');await m.wait_for_timeout(150)
  await m.locator('#globalSearch').tap();await m.locator('#globalSearch').fill('animal');await m.locator('.so-product-name').tap();await m.wait_for_url('**/product/test-product');await m.wait_for_timeout(350)
  record('Touch product tap navigates',m.url.endswith('/product/test-product'))
  await m.goto('http://navigation.test/',wait_until='domcontentloaded');await m.wait_for_timeout(150);await m.locator('#globalSearch').tap()
  record('Touch empty focus shows persisted history',await m.locator('.so-history-text').inner_text()=='animal')
  await m.screenshot(path=str(ROOT/'reports/search-history-mobile.png'));await m.locator('#globalSearch').fill('animal');await m.screenshot(path=str(ROOT/'reports/search-products-mobile.png'))
  await page.goto('http://navigation.test/',wait_until='domcontentloaded');await page.wait_for_timeout(200)
  await page.evaluate("localStorage.setItem('acm:site-b:searchHistory',JSON.stringify(['resin','animal']));localStorage.setItem('acm:site-a:searchHistory',JSON.stringify(['private-site-a']))")
  await page.locator('#globalSearch').click();record('Existing current-source history retained',await page.locator('.so-history-text').all_text_contents()==['resin','animal'])
  record('Other site history not exposed','private-site-a' not in await page.locator('.so-options').inner_text())
  await page.locator('.so-history-text').nth(1).click();record('History click repeats search',await page.locator('#globalSearch').input_value()=='animal' and await page.locator('#searchOverlayV3').get_attribute('data-open')=='false')
  await page.locator('#globalSearch').fill('resin');await page.locator('.search > button').click();record('Search button saves history',await page.evaluate("JSON.parse(localStorage.getItem('acm:site-b:searchHistory'))[0]==='resin'"))
  await page.locator('#globalSearch').click();await page.locator('#globalSearch').press('Escape');record('Escape closes and restores scrolling',await page.locator('#searchOverlayV3').get_attribute('data-open')=='false' and await page.evaluate("document.body.style.overflow!=='hidden'"))
  await page.evaluate("localStorage.setItem('acm:site-b:searchHistory','bad-json')");await page.locator('#globalSearch').click();record('Malformed history handled safely',await page.locator('.so-empty').count()==1)
  await page.locator('.so-close').click();await page.locator('#ordersBtn').click();record('Orders login still works',await page.locator('#login').evaluate("e=>e.classList.contains('open')"));await page.locator('#login .close').click()
  await page.locator('#adminBtn').click();record('Admin login still works',await page.locator('#login').evaluate("e=>e.classList.contains('open')"));await page.locator('#login .close').click()
  await page.evaluate("localStorage.setItem('acm:site-b:cart',JSON.stringify([{id:'test-product',variantId:'__base__',quantity:2}]))")
  await page.goto('http://navigation.test/cart',wait_until='domcontentloaded');await page.wait_for_timeout(200)
  record('Cart existing item preserved',await page.locator('.cartrow').count()==1)
  await page.locator('#globalSearch').fill('animal');await page.locator('#globalSearch').press('Enter');await page.wait_for_url('**/?q=animal');await page.wait_for_timeout(200)
  record('Search from cart reaches home query',await page.locator('#globalSearch').input_value()=='animal' and await page.locator('.product-card').count()==1)
  record('No browser errors',not errors,errors)
  await browser.close()
 out={'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'results':results}
 (ROOT/'reports/SEARCH_INTEGRATED_RESULTS.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
asyncio.run(main())
