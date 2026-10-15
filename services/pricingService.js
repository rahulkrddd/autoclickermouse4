const money=n=>Math.round((Number(n)||0)*100)/100;
function calculate(lines,discount=0,shipping=0){
  const gross=lines.reduce((n,x)=>n+Number(x.p.price)*Number(x.q),0),safeDiscount=Math.min(Math.max(0,Number(discount)||0),gross);let allocated=0;
  const items=lines.map((x,i)=>{const lineGross=money(Number(x.p.price)*Number(x.q));const share=i===lines.length-1?money(safeDiscount-allocated):money(safeDiscount*(lineGross/gross||0));allocated=money(allocated+share);const paidGross=money(lineGross-share),rate=Math.max(0,Number(x.p.taxRate)||0),taxableValue=money(paidGross*100/(100+rate)),taxAmount=money(paidGross-taxableValue);return{p:x.p,q:x.q,lineGross,lineDiscount:share,taxableValue,taxRate:rate,taxAmount,lineTotal:paidGross}});
  const taxAmount=money(items.reduce((n,x)=>n+x.taxAmount,0)),taxableValue=money(items.reduce((n,x)=>n+x.taxableValue,0));
  return{subtotal:money(gross),discount:money(safeDiscount),shippingCharge:money(shipping),taxableValue,taxAmount,grandTotal:money(gross-safeDiscount+Number(shipping||0)),items};
}
module.exports={money,calculate};