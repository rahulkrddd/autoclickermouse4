const mongoose=require('mongoose');
async function connectDB(){mongoose.set('strictQuery',true);await mongoose.connect(process.env.MONGODB_URI,{dbName:process.env.MONGODB_DB_NAME||undefined,autoIndex:false});return mongoose.connection}
async function closeDB(){await mongoose.connection.close()}
module.exports={connectDB,closeDB};