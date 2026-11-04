// Public, site-scoped read cache only. Never used for checkout or authorization.
const entries=new Map(),pending=new Map();let generation=0;
const MAX_ENTRIES=300;
async function get(key,loader,{ttl=10000,stale=60000,fresh=false}={}){
 const now=Date.now(),entry=entries.get(key);
 const refresh=()=>{
  if(pending.has(key))return pending.get(key);
  const version=generation;
  const task=Promise.resolve().then(loader).then(value=>{
   if(version===generation){entries.delete(key);entries.set(key,{value,at:Date.now()});while(entries.size>MAX_ENTRIES)entries.delete(entries.keys().next().value)}
   return value;
  }).finally(()=>{if(pending.get(key)===task)pending.delete(key)});
  pending.set(key,task);return task;
 };
 if(!fresh&&entry&&now-entry.at<ttl)return entry.value;
 if(!fresh&&entry&&now-entry.at<stale){refresh().catch(error=>console.error('Public cache refresh:',error.message));return entry.value}
 return refresh();
}
function clear(){generation++;entries.clear();pending.clear()}
function put(key,value,version=generation){if(version!==generation)return;entries.delete(key);entries.set(key,{value,at:Date.now()});while(entries.size>MAX_ENTRIES)entries.delete(entries.keys().next().value)}
module.exports={get,clear,put,stamp:()=>generation};