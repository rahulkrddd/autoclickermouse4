from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
 for gateways in [['cashfree'],['razorpay'],['cashfree','razorpay']]:
  for gateway in gateways:
   page=browser.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def route(rt):
    req=rt.request;url=req.url;path=url.split('://',1)[1].split('/',1)[1].split('?')[0];data={}
    if 'checkout.razorpay.com' in url:return rt.fulfill(content_type='application/javascript',body="window.Razorpay=function(o){window.testRazorpay=o;this.open=()=>{window.gatewayOpened='razorpay'}}")
    if 'sdk.cashfree.com' in url:return rt.fulfill(content_type='application/javascript',body="window.Cashfree=()=>({checkout:async()=>{window.gatewayOpened='cashfree';return {error:{message:'Payment cancelled by test'}}}})")
    if path=='site-context.js':return rt.fulfill(content_type='application/javascript',body="window.__SITE_ID__='site-b';")
    if path=='redesign.js':return rt.fulfill(content_type='application/javascript',body='')
    if path=='my-orders' and req.method=='GET':return rt.fulfill(content_type='text/html',body=(root/'public/orders.html').read_text())
    if path=='my-orders':data={'orders':[]}
    elif path=='api/payments/config':data={g:{'enabled':g in gateways} for g in ['cashfree','razorpay']}
    elif path=='api/products':data=[{'id':'p','name':'Product','price':100,'stock':4,'active':True,'deliveryAvailable':True,'buyNowEnabled':True,'minOrderQty':1}]
    elif path=='api/settings/public':data={'deliveryEnabled':True,'pickupEnabled':False,'codEnabled':False}
    elif path=='api/pickup-locations':data=[]
    elif path=='api/seo-config':data={'siteName':'Test Store'}
    elif path=='api/payments/create-order':
     requests.append(req.post_data_json);data={'gateway':gateway,'id':'gw','key':'test','amount':10000,'currency':'INR','paymentSessionId':'session','internalOrderId':'key'}
    elif path.startswith('api/'):data={}
    else:
     file=root/'public'/path
     if file.is_file():return rt.fulfill(path=str(file))
     return rt.fulfill(status=404,body='')
    return rt.fulfill(content_type='application/json',body=json.dumps(data))
   page.route('**/*',route)
   page.goto('http://localhost:3000/my-orders?mobileNumber=9876543210');page.wait_for_timeout(200)
   page.evaluate("async()=>{await openDirectCheckout([{productId:'p',quantity:1}],{name:'Test User',mobile:'9876543210',address:'Test delivery address',pincode:'560001'})}")
   page.locator('#co_pay').click()
   if len(gateways)>1:page.locator('[data-gateway="'+gateway+'"]').click()
   page.wait_for_function('window.gatewayOpened!==undefined')
   assert page.evaluate('window.gatewayOpened')==gateway
   assert len(requests)==1 and requests[0]['gateway']==gateway
   if gateway=='cashfree':
    assert page.locator('#co_pay').is_enabled()
    assert 'Payment cancelled by test' in page.locator('body').inner_text()
   else:
    page.evaluate('window.testRazorpay.modal.ondismiss()');assert page.locator('#co_pay').is_enabled()
   assert not errors,errors
   results.append({'gateways':gateways,'selected':gateway,'gateway_opened':True,'button_restored':True,'uncaught_errors':errors})
   page.close()
 browser.close()
(root/'reports/REORDER_BROWSER_RESULTS.json').write_text(json.dumps(results,indent=2))
print('Browser scenarios passed:',len(results))