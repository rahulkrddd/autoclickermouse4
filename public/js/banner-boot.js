/* Bounded banner-first reveal. Network requests for the rest of the store still run in parallel. */
(()=>{'use strict';document.documentElement.classList.add('banner-boot');let done=false;
window.finishBannerBoot=()=>{if(done)return;done=true;document.documentElement.classList.remove('banner-boot');clearTimeout(timer)};
const timer=setTimeout(window.finishBannerBoot,6500);
})();
