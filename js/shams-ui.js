/* ===== Mobile Shop Guide Behavior ===== */
(function(){
  if(!window.OLGA_GOV||!OLGA_GOV.mob||!window.IntersectionObserver) return;
  var r=document.getElementById("olh-root"), g=document.getElementById("grid"); if(!r||!g) return;
  var inGrid=false, quiet=false, qt=0;
  function upd(){ r.classList.toggle("olh-shop",inGrid); r.classList.toggle("olh-shop-quiet",inGrid&&quiet); }
  new IntersectionObserver(function(es){ inGrid=es[0].isIntersecting; clearTimeout(qt);
    if(inGrid&&!quiet) qt=setTimeout(function(){ quiet=true; upd(); },2600);   /* her line about the shop is seen, then she tucks away */
    upd(); },{rootMargin:"0px 0px -30% 0px"}).observe(g);
  document.addEventListener("touchstart",function(e){ if(inGrid&&!quiet&&!r.contains(e.target)){ quiet=true; upd(); } },{passive:true});
})();

/* ===== Shams inside 3D Product View (Mobile & Tablet) ===== */
/* v30 · keeps SHAMS inside the product view on phones & tablets while she explains it */
(function(){
  var r=document.getElementById("olh-root"), o3d=document.getElementById("o3d"), st=document.getElementById("o3dStage");
  if(!r||!o3d||!st) return;
  var box=o3d.querySelector(".o3d__box");
  var MQ=window.matchMedia("(max-width:960px),(max-height:640px)");   /* same breakpoints as the stacked / landscape product view */
  var on=false, raf=0, timers=[];
  function px(v){ return Math.round(v)+"px"; }
  function place(){
    raf=0;
    var want=r.classList.contains("olh-over3d") && o3d.classList.contains("is-open") && MQ.matches;
    if(!want){ if(on) off(); return; }
    /* layout boxes (offsets ignore the opening transform of the card) */
    var vw=o3d.clientWidth||window.innerWidth, vh=o3d.clientHeight||window.innerHeight;
    var bl=box?box.offsetLeft:0, bt=box?box.offsetTop:0;
    var L=bl+st.offsetLeft, T=bt+st.offsetTop, W=st.offsetWidth, H=st.offsetHeight;
    if(!W||!H) return;
    var rtl=(r.dir||r.getAttribute("dir"))==="rtl";
    var wide=W>H*1.05;
    var gh=Math.max(130,Math.min(260,H*(wide?.45:.5),W*.62)), gw=gh*760/960;
    var bw=Math.max(170,wide?Math.min(360,W*.82,W-24):Math.min(290,W*.68,W-24));
    var bmax=Math.max(90,H-gh*1.02-12);
    r.style.setProperty("--o3b",px(Math.max(0,vh-(T+H))));
    r.style.setProperty("--o3s",px(Math.max(0,rtl?vw-(L+W):L)));
    r.style.setProperty("--gh",px(gh)); r.style.setProperty("--gw",px(gw));
    r.style.setProperty("--bw",px(bw)); r.style.setProperty("--bmax",px(bmax));
    o3d.style.setProperty("--o3x",px((rtl?-1:1)*W*.17));
    if(!on){ on=true; r.classList.add("olh-in3d"); o3d.classList.add("o3d--shams"); }
  }
  function off(){
    on=false; r.classList.remove("olh-in3d"); o3d.classList.remove("o3d--shams");
    ["--o3b","--o3s","--gh","--gw","--bw","--bmax"].forEach(function(k){ r.style.removeProperty(k); });
  }
  function sched(){ if(!raf) raf=requestAnimationFrame(place); }
  function burst(){ timers.forEach(clearTimeout); timers=[0,120,380,800].map(function(d){ return setTimeout(sched,d); }); }
  new MutationObserver(burst).observe(r,{attributes:true,attributeFilter:["class","dir"]});
  new MutationObserver(burst).observe(o3d,{attributes:true,attributeFilter:["class"]});
  if(window.ResizeObserver) new ResizeObserver(sched).observe(st);
  window.addEventListener("resize",burst); window.addEventListener("orientationchange",burst);
  if(window.visualViewport) visualViewport.addEventListener("resize",sched);
  if(MQ.addEventListener) MQ.addEventListener("change",burst); else if(MQ.addListener) MQ.addListener(burst);
})();

/* ===== Shams Speech Bubble Face-Avoidance Layout ===== */
/* v31 · SHAMS's speech bubble never covers her face, on any screen size.
   Measures her canvas and the bubble in the guide's own coordinates (so opening
   animations and transforms don't fool it) and lifts the bubble above her head
   whenever they would overlap; if the screen is too short, the bubble scrolls instead. */
(function(){
  var g=document.getElementById("olh-guide"), b=document.getElementById("olh-bubble"), cv=document.getElementById("olh-canvas"), r=document.getElementById("olh-root");
  if(!g||!b||!cv||!r) return;
  /* head box inside the 760x960 canvas: figure at x142,y52 (476x900), head ~x313-442, y52-202 */
  var HEAD={l:.39,r:.61,t:.075,b:.23};
  var raf=0;
  function fit(){
    raf=0;
    b.style.bottom=""; b.style.maxHeight=""; b.style.overflowY="";
    var cw=cv.offsetWidth, ch=cv.offsetHeight; if(!cw||!ch||!b.offsetWidth) return;
    var cx=cv.offsetLeft, cy=cv.offsetTop;
    var hl=cx+cw*HEAD.l, hr=cx+cw*HEAD.r, ht=cy+ch*HEAD.t, gap=Math.max(10,ch*.06);
    var bl=b.offsetLeft, br=bl+b.offsetWidth, bt=b.offsetTop, bb=bt+b.offsetHeight;
    if(!(bl<hr && br>hl) || bb<=ht-gap) return;              /* already clear of her face */
    var shift=bb-(ht-gap), cur=parseFloat(getComputedStyle(b).bottom)||0;
    b.style.bottom=(cur+shift)+"px";
    var top=g.getBoundingClientRect().top+bt-shift, minTop=8;
    if(top<minTop){ b.style.maxHeight=Math.max(80,b.offsetHeight-(minTop-top))+"px"; b.style.overflowY="auto"; }
  }
  function sched(){ if(!raf) raf=requestAnimationFrame(fit); }
  new MutationObserver(sched).observe(b,{attributes:true,attributeFilter:["class"],childList:true,subtree:true,characterData:true});
  new MutationObserver(sched).observe(r,{attributes:true,attributeFilter:["class","dir"]});
  if(window.ResizeObserver){ var ro=new ResizeObserver(sched); ro.observe(cv); ro.observe(g); }
  window.addEventListener("resize",sched); window.addEventListener("orientationchange",function(){ setTimeout(sched,250); });
  if(window.visualViewport) visualViewport.addEventListener("resize",sched);
  sched();
})();

/* ===== Responsive Scroll & Drawer Helpers ===== */
(function(){
 var r=document.getElementById("olh-root"),t=0;
 var es=document.getElementById("essence");
 if(r&&es&&window.IntersectionObserver){new IntersectionObserver(function(en){en.forEach(function(e){var vh=window.innerHeight||800;r.classList.toggle("olh-ess",e.isIntersecting&&e.intersectionRect.height/vh>.6)})},{threshold:[0,.2,.4,.5,.6,.7,.8,.9,1]}).observe(es);}
 if(r){window.addEventListener("scroll",function(){r.classList.add("olh-scroll");clearTimeout(t);t=setTimeout(function(){r.classList.remove("olh-scroll")},900)},{passive:true});}
 document.addEventListener("click",function(e){var b=e.target&&e.target.closest&&e.target.closest("#toCheckout,#backBtn");if(!b)return;
  setTimeout(function(){var d=document.querySelector(".drawer"),db=document.getElementById("drawerBody");if(d)d.scrollTop=0;if(db)db.scrollTop=0},40)});
})();
