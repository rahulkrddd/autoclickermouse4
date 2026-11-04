const mongoose=require('mongoose');
function sameSite(siteId,...docs){for(const doc of docs.filter(Boolean))if(String(doc.siteId)!==String(siteId))throw new Error('Cross-site reference rejected');return true}
function validObjectId(id){if(!mongoose.isValidObjectId(id))throw new Error('Invalid identifier');return id}
module.exports={sameSite,validObjectId};