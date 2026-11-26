/* v25 · frame governor — on phones the heavy decorative loops (Shams' canvas figure) pause
   while the page is scrolling or a bag animation is playing, and otherwise run at 30 fps,
   so scrolling, taps and the add-to-bag flight always get the full frame budget. */
window.OLGA_GOV=(function(){
  var mob=window.matchMedia("(max-width:760px),(pointer:coarse)").matches, busy=0, lastScroll=-1e9, lastTouch=-1e9, last=0;
  addEventListener("scroll",function(){ lastScroll=performance.now(); },{passive:true});
  addEventListener("touchmove",function(){ lastTouch=performance.now(); },{passive:true});
  function scrolling(now){ now=now||performance.now(); return now-lastScroll<240 || now-lastTouch<180; }
  return {
    mob:mob,
    busy:function(d){ busy=Math.max(0,busy+d); },
    isBusy:function(){ return busy>0; },
    scrolling:scrolling,
    allow:function(ts){ if(!mob) return true; if(busy>0||scrolling()) return false;
      if(document.body.classList.contains("is-locked")){ var o=document.getElementById("olh-root"); if(!o||!(o.classList.contains("is-open")||o.classList.contains("olh-over3d"))) return false; } if(ts-last<29) return false; last=ts; return true; }
  };
})();
