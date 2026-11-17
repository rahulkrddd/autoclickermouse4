const crypto=require('crypto');
const ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function candidate(){const bytes=crypto.randomBytes(10);let id='OD';for(let i=0;i<10;i++)id+=ALPHABET[bytes[i]%ALPHABET.length];return id}
async function unique(Order,session){for(let attempt=0;attempt<12;attempt++){const orderId=candidate();let query=Order.exists({orderId});if(session)query=query.session(session);if(!(await query))return orderId}throw Object.assign(new Error('Could not allocate a unique order ID. Please retry.'),{status:503})}
module.exports={candidate,unique};
