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
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  PRODUCT.update({'name':'Mannas Gifting Store - Kids DIY Animal Painting Gift Kit with Six Paintable Animal Figures and Creative Craft Essentials','variationEnabled':True,'sku':'BASE-SKU','variants':[{'variantId':'blue-7','color':'BLUE','size':'7','material':'Cotton','style':'Modern','price':99,'stock':8,'sku':'BLUE-7-SKU','minOrderQty':1,'maxOrderQty':8,'additionalAttributes':[{'attributeName':'Finish','attributeValue':'Matte'}]}]})
  BASE={**PRODUCT,'id':'plain-product','slug':'plain-product','name':'Plain product','variationEnabled':False,'variants':[],'sku':'PLAIN-SKU'}
  CATALOG.append(BASE)
  async def fresh_home():
   await page.goto('http://navigation.test/')
   await page.evaluate('localStorage.clear();sessionStorage.clear()')
   await page.reload();await page.wait_for_timeout(200)
  await fresh_home()

  PRODUCT['shortDescription']='Creative DIY gift kit with paintable animal figures and colourful craft essentials for every occasion and birthday celebration.'
  PRODUCT['category']='Craft kits';PRODUCT['tags']=['animal painting','DIY gifts']
  for site in ['site-a','site-b','site-c']:
   current_site=site
   for width in [320,360,390,720,1024,1440]:
    await page.set_viewport_size({'width':width,'height':900});await fresh_home()
    for selector in ['.product-name-clamp','.card-description']:
     info=await page.locator(selector).first.evaluate("e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {h:r.height,line:parseFloat(s.lineHeight),clamp:s.webkitLineClamp,overflow:s.overflow,bottom:r.bottom,next:e.nextElementSibling.getBoundingClientRect().top}}")
     record(f'{site} {width}px {selector} two complete lines',info['clamp']=='2' and info['h']<=2*info['line']+1 and info['bottom']<=info['next']+1,info)
    record(f'{site} {width}px no horizontal overflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  current_site='site-b';await page.set_viewport_size({'width':390,'height':844});await fresh_home()
  await page.locator('#globalSearch').fill('animal');await page.wait_for_timeout(100)
  record('Native datalist removed',await page.locator('datalist').count()==0 and await page.locator('#globalSearch').get_attribute('list') is None)
  record('Short keyword suggestions visible',await page.locator('.shop-keyword-option').count()>0 and all(len(t)<50 for t in await page.locator('.shop-keyword-option').all_text_contents()))
  await page.locator('#globalSearch').press('ArrowDown');await page.locator('#globalSearch').press('Enter')
  record('Keyboard selects keyword and filters products',await page.locator('.product-card').count()==1 and await page.locator('#shopKeywordSuggestions').is_hidden())
  await page.locator('#globalSearch').fill('');await page.locator('#globalSearch').press('Escape');await page.locator('#globalSearch').blur()
  for selector in ['.cart-action','.buy-action']:
   await fresh_home();before=await page.evaluate("localStorage.getItem('acm:site-b:cart')")
   await page.locator('.product-card').first.locator(selector).click();await page.wait_for_url('**/product/test-product*');await page.wait_for_timeout(100)
   record(selector+' immediate detail selection message',await page.locator('.shop-toast b').inner_text()=='Please choose a variation')
   record(selector+' no accidental cart add',await page.evaluate("localStorage.getItem('acm:site-b:cart')")==before)
  await page.goto('http://navigation.test/cart');await page.wait_for_timeout(100)
  await page.evaluate("localStorage.setItem('acm:site-b:cart',JSON.stringify([{id:'test-product',variantId:'__base__',quantity:1},{id:'test-product',variantId:'blue-7',quantity:1}]));render(true)")
  await page.wait_for_timeout(100)
  record('Separate base and variation cart rows',await page.locator('.cartrow').count()==2)
  record('Compact cart text spacing',await page.locator('.cartrow > div').first.evaluate("e=>getComputedStyle(e).gap==='5px'"))
  await page.locator('.cartrow').nth(1).locator('select').select_option('2');await page.wait_for_timeout(100)
  record('Variation quantity preserved',await page.evaluate("JSON.parse(localStorage.getItem('acm:site-b:cart')).find(x=>x.variantId==='blue-7').quantity===2"))
  await page.screenshot(path=str(ROOT/'reports/cart-after.png'),full_page=True)
  await fresh_home();await page.screenshot(path=str(ROOT/'reports/home-after.png'),full_page=True)
  record('No browser script errors',not errors,errors)
  await browser.close()
 out={'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'results':results}
 (ROOT/'reports/FIVE_FIXES_BROWSER_RESULTS.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
asyncio.run(main())
