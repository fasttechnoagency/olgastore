/* =====================================================================
   OLGA v8 · Motion engine — scroll-linked effects tuned for phones first.
   Only transform / opacity / CSS variables are touched (GPU-friendly), every
   listener is passive, nothing hijacks the native scroll, and everything turns
   itself off for "reduce motion" users.
   ===================================================================== */
(function(){
"use strict";
var A=window.OLGA||{}, IMG=A.IMG||{};
if(IMG.card_stage){ var _st=new URL(IMG.card_stage, document.baseURI).href; document.documentElement.style.setProperty("--stage",'url("'+_st+'")'); }
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var vh=innerHeight, vw=innerWidth, mob=vw<=760, lastY=scrollY, vel=0, skew=0, raf=0;
var prog=$("#sprog"), marq=$("#marqSkew"), ftWord=$("#ftWord");
var speedEls=[], riseEls=[], atHero=null;
document.documentElement.classList.toggle("at-hero",scrollY<innerHeight*0.55);

/* stagger: cards/tiles enter one after another, per visual row on phones */
function cols(el){ var s=getComputedStyle(el).gridTemplateColumns; return s&&s!=="none"?s.split(" ").length:1; }
function stagger(root){
  if(!root) return; var c=cols(root);
  Array.prototype.forEach.call(root.children,function(ch,i){ ch.style.setProperty("--i",c>1?(i%c):Math.min(i,1)); });
}
["#grid",".bento",".mvv",".contact__grid"].forEach(function(s){ var el=$(s); stagger(el); if(el&&window.MutationObserver) new MutationObserver(function(){ stagger(el); }).observe(el,{childList:true}); });
addEventListener("resize",function(){ ["#grid",".bento",".mvv",".contact__grid"].forEach(function(s){ stagger($(s)); }); },{passive:true});

/* sections that rise and unfold as they enter */
function collect(){
  vh=innerHeight; vw=innerWidth; mob=vw<=760;
  speedEls=$$("[data-speed]").map(function(el){ return {el:el,k:+el.getAttribute("data-speed")}; });
  riseEls=$$(".reels,.contact .contact__grid,.essence__head").map(function(el){ return {el:el}; });
}
function frame(){
  raf=0;
  var y=scrollY, dy=y-lastY; lastY=y;
  vel=vel*0.82+dy*0.18;
  var doc=document.documentElement.scrollHeight-vh;
  var ah=y<vh*0.55; if(ah!==atHero){ atHero=ah; document.documentElement.classList.toggle("at-hero",ah); }
  if(prog) prog.style.setProperty("--p",clamp(y/Math.max(1,doc),0,1).toFixed(4));
  if(!reduced){
    /* marquee leans with your scroll speed */
    var target=clamp(-vel*(mob?0.12:0.08),-9,9); skew+= (target-skew)*0.25;
    if(marq) marq.style.setProperty("--skew",skew.toFixed(2)+"deg"), marq.style.transform="skewX("+skew.toFixed(2)+"deg)";
    /* soft parallax */
    var SR=[], RR=[], i, j;
    for(i=0;i<speedEls.length;i++) SR[i]=speedEls[i].el.getBoundingClientRect();
    for(j=0;j<riseEls.length;j++) RR[j]=riseEls[j].el.getBoundingClientRect();
    var FR=ftWord?ftWord.getBoundingClientRect():null;
    for(i=0;i<speedEls.length;i++){ var o=speedEls[i], r=SR[i];
      if(r.bottom<-200||r.top>vh+200) continue;
      var c=(r.top+r.height/2-vh/2)*o.k*(mob?.55:1), cs="translate3d(0,"+c.toFixed(1)+"px,0)"; if(o.last!==cs){ o.last=cs; o.el.style.transform=cs; } }
    /* rise & unfold */
    for(j=0;j<riseEls.length;j++){ var e=riseEls[j].el, rr=RR[j];
      if(rr.top>vh*1.1||rr.bottom<0){ continue; }
      var p=clamp((vh-rr.top)/(vh*(mob?.55:.75)),0,1), ez=1-Math.pow(1-p,3);
      e.style.transform=p>=1?"":"translate3d(0,"+((1-ez)*(mob?40:80)).toFixed(1)+"px,0) scale("+(0.94+0.06*ez).toFixed(4)+")";
      e.style.opacity=p>=1?"":(0.35+0.65*ez).toFixed(3); }
    /* the giant footer word slides across */
    if(ftWord){ var fr=FR; if(fr.top<vh&&fr.bottom>0){ var fp=clamp((vh-fr.top)/(vh+fr.height),0,1); ftWord.style.transform="translate3d("+((0.5-fp)*(mob?7:5)).toFixed(2)+"%,0,0)"; } }
  }
  if(Math.abs(vel)>0.15||Math.abs(skew)>0.05) raf=requestAnimationFrame(frame);
}
function kick(){ if(!raf) raf=requestAnimationFrame(frame); }
addEventListener("scroll",kick,{passive:true});
addEventListener("resize",function(){ collect(); kick(); },{passive:true});
addEventListener("load",function(){ collect(); kick(); });
collect(); kick();
})();
