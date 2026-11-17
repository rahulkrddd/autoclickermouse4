const sharp=require('sharp');
// Decimal 200 KB also fits a bucket configured with a 200 KiB limit.
const MAX_OUTPUT_BYTES=200000;
async function compressProductImage(file){
 const buffer=file.buffer;
 if(!Buffer.isBuffer(buffer)||!buffer.length)throw Error('A valid image file is required');
 // Decode even small inputs, rejecting corrupt or unsupported images before upload.
 const image=sharp(buffer,{limitInputPixels:40000000,animated:false});
 let meta;try{meta=await image.metadata()}catch{throw Error('Unable to read image. Please upload a valid JPEG, PNG or WebP image')}
 if(!['jpeg','png','webp'].includes(meta.format))throw Error('Only JPEG, JPG, PNG and WebP images are allowed');
 if(buffer.length<=MAX_OUTPUT_BYTES)return {...file,mimetype:{jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[meta.format],size:buffer.length};
 // Keep transparency with WebP; reduce dimensions only when quality alone is insufficient.
 for(const width of [1600,1280,1024,800,640,480,320,160,80,32]){
  for(const quality of [85,75,65,50,35]){
   const output=await sharp(buffer,{limitInputPixels:40000000,animated:false}).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality,effort:5}).toBuffer();
   if(output.length<=MAX_OUTPUT_BYTES)return {...file,buffer:output,size:output.length,mimetype:'image/webp'};
  }
 }
 throw Error('Unable to compress this image below 200 KB. Please choose a smaller image');
}
module.exports={compressProductImage,MAX_OUTPUT_BYTES};
