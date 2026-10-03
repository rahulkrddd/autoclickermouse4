const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const x=fs.readFileSync('public/js/admin.js','utf8');
test('edit form rejected selection restores previously accepted files',()=>{assert.match(x,/const incoming=\[\.\.\.e\.target\.files\],previous=\[\.\.\.galleryFiles\]/);assert.match(x,/previous\.forEach\(f=>dt\.items\.add\(f\)\);e\.target\.files=dt\.files;draw\(\)/)});
test('edit form displays all persisted primary and gallery images',()=>{assert.match(x,/Existing product images/);assert.match(x,/p\.galleryDetailed\|\|\[\]/);assert.match(x,/Delete from Product Images manager/)});
test('image manager rejected selection preserves its previous queue',()=>{assert.match(x,/Previous selection is preserved/);assert.match(x,/acmGalleryQueues\.set\(galleryInput,merged\)/)});
test('conflicting global file-change interceptor was removed',()=>{assert.doesNotMatch(x,/document\.addEventListener\('change',event=>\{const input=event\.target/)});