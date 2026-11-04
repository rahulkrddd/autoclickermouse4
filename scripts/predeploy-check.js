require('dotenv').config();const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');let failed=false;
for(const f of ['multiwebsite/logo/default.ico','multiwebsite/logo/site-a.ico','multiwebsite/logo/site-b.ico','multiwebsite/logo/site-c.ico','package-lock.json']){const ok=fs.existsSync(path.join(root,f));console.log(ok?'OK':'MISSING',f);if(!ok)failed=true}
try{require('../config/env').validateEnv();console.log('OK environment validation (secret values not printed)')}catch(e){console.error(e.message);failed=true}
if(!process.env.RECOVERY_BACKUP_SECRET){console.error('Set a stable RECOVERY_BACKUP_SECRET before creating production recovery archives');failed=true}
for(const name of Object.keys(require('../package.json').dependencies)){try{require.resolve(name)}catch{console.error('MISSING dependency',name);failed=true}}
console.log('Live staging tests are still required. This check does not certify production readiness.');process.exitCode=failed?1:0;