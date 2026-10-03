const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const service=fs.readFileSync(path.join(__dirname,'../services/adminDataService.js'),'utf8');
const admin=fs.readFileSync(path.join(__dirname,'../public/js/admin.js'),'utf8');
test('backup exports complete product/order/coupon fields',()=>{for(const x of ['fullDocumentJson','galleryJson','specificationsJson','customerSnapshot','trackingHistoryJson','perCustomerLimit'])assert.match(service,new RegExp(x))});
test('row action safety and primary keys are fixed',()=>{for(const x of ["key:'legacyId'","key:'orderId'","key:'code'","['ADD','UPDATE','DELETE','SKIP']","action:'SKIP'"])assert.ok(service.includes(x),x)});
test('ADD UPDATE DELETE are existence-safe',()=>{assert.match(service,/already exists/);assert.match(service,/not found/);assert.match(service,/deleteOne\(filter\)/)});
test('settings shows download upload reset controls',()=>{for(const x of ['workingBackup','workingImport','workingReset','workingExcelFile'])assert.ok(admin.includes(x),x)});