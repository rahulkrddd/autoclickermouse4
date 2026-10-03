const required=['MONGODB_URI','SESSION_SECRET','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','ADMIN_PASSWORD'];
function validateEnv(){const missing=required.filter(k=>!process.env[k]);if(missing.length)throw new Error('Missing required environment variables: '+missing.join(', '));}
module.exports={validateEnv};