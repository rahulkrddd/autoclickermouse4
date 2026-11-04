const settings=require('./settingsService');
const CLOSED='The store is temporarily closed. Please try again later.';
async function requireOpen(req,res,next){try{const x=await settings.all();if(x.storeOpen===false)return res.status(409).json({message:String(x.maintenanceMessage||'').trim()||CLOSED,code:'STORE_CLOSED'});req.storeSettings=x;next()}catch(e){next(e)}}
module.exports={CLOSED,requireOpen};