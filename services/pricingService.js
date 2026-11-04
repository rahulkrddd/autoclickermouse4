const money=n=>Math.round((Number(n)||0)*100)/100;
function calculate(lines,discount=0,shipping=0,eligibleIds=null){
 const gross=money(lines.reduce((n,x)=>n+Number(x.p.price)*Number(x.q),0));const ids=eligibleIds?new Set(eligibleIds.map(String)):null;
 const eligible=lines.map(x=>!ids||ids.has(String(x.p._id)));const eligibleGross=money(lines.reduce((n,x,i)=>n+(eligible[i]?Number(x.p.price)*x.q:0),0));
 const safeDiscount=Math.min(Math.max(0,money(discount)),eligibleGross);let remaining=safeDiscount,remainingGross=eligibleGross;
 const items=lines.map((x,i)=>{const lineGross=money(Number(x.p.price)*Number(x.q));let share=0;if(eligible[i]&&remainingGross>0){share=Math.min(lineGross,remaining,money(remaining*lineGross/remainingGross));remaining=money(remaining-share);remainingGross=money(remainingGross-lineGross)}const paidGross=money(lineGross-share),rate=Math.max(0,Number(x.p.taxRate)||0),taxableValue=money(paidGross*100/(100+rate)),taxAmount=money(paidGross-taxableValue);return{p:x.p,product:x.product,resolved:x.resolved,variantId:x.variantId,q:x.q,lineGross,lineDiscount:share,taxableValue,taxRate:rate,taxAmount,lineTotal:paidGross}});
 const taxAmount=money(items.reduce((n,x)=>n+x.taxAmount,0)),taxableValue=money(items.reduce((n,x)=>n+x.taxableValue,0));return{subtotal:gross,discount:money(safeDiscount-remaining),shippingCharge:money(shipping),taxableValue,taxAmount,grandTotal:money(gross-safeDiscount+remaining+Number(shipping||0)),items};
}
module.exports={money,calculate};