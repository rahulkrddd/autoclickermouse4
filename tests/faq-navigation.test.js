const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const faq=fs.readFileSync('public/faq.html','utf8');
test('FAQ inline script is isolated so common.js can initialize navigation',()=>{assert.match(faq,/<script>\(\(\)=>\{const data=/);assert.match(faq,/run\(\)\}\)\(\);<\/script>/);const inline=faq.match(/<script>(\(\(\)=>\{const data.*?<\/script>)/s)?.[1].replace(/<\/script>$/,'');assert.ok(inline);new vm.Script(inline);new vm.Script(fs.readFileSync('public/js/common.js','utf8'))});
test('FAQ keeps Admin and My Orders controls and login modal contract',()=>{for(const id of ['adminBtn','ordersBtn','login','loginTitle','loginForm','loginInput','loginMsg'])assert.match(faq,new RegExp(`id="${id}"`));const common=fs.readFileSync('public/js/common.js','utf8');assert.match(common,/a\.onclick=\(\)=>open\('admin'\)/);assert.match(common,/o\.onclick=\(\)=>/);assert.match(faq,/<script src="\/js\/common\.js"><\/script>/)});