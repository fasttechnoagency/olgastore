/* =====================================================================
   OLGA · Language transition engine  —  window.OlgaLangFX.play(lang, swap, btn)
   Timeline:  curtain → wreath grows → olive pressed → golden drop →
              oil rises & reveals flag (JO / US) → OLGA logo in gold → exit
   ===================================================================== */
(function(){
  "use strict";
  var root=document.getElementById("olx"); if(!root||!root.animate) return;
  var NS="http://www.w3.org/2000/svg";
  var $=function(id){return document.getElementById(id)};
  var RM=window.matchMedia("(prefers-reduced-motion: reduce)");
  var EASE="cubic-bezier(.22,1,.36,1)", EASE2="cubic-bezier(.65,0,.35,1)", BACK="cubic-bezier(.34,1.56,.64,1)", IN="cubic-bezier(.55,0,.85,.35)";
  var COPY={
    ar:{greet:"أهلاً وسهلاً",sub:"العربية · الأردن",skip:"انقر للتخطي"},
    en:{greet:"Welcome",sub:"English · United States",skip:"Tap to skip"}
  };

  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
  function star(cx,cy,R,r,n){var p=[];for(var i=0;i<n*2;i++){var a=-Math.PI/2+i*Math.PI/n,rr=i%2?r:R;p.push((cx+Math.cos(a)*rr).toFixed(1)+","+(cy+Math.sin(a)*rr).toFixed(1));}return "M"+p.join("L")+"Z";}

  /* ---------- flags (pure SVG, official colours) ---------- */
  function flagJO(){
    return '<svg x="90" y="90" width="220" height="220" viewBox="0 0 10080 5040" preserveAspectRatio="xMinYMid slice">'+
      '<rect width="10080" height="1680" fill="#000000"/><rect y="1680" width="10080" height="1680" fill="#FFFFFF"/><rect y="3360" width="10080" height="1680" fill="#316218"/>'+
      '<path d="M0 0L5040 2520L0 5040Z" fill="#CE1126"/><path d="'+star(1600,2520,370,170,7)+'" fill="#FFFFFF"/></svg>';
  }
  function flagUS(){
    var s='<svg x="90" y="90" width="220" height="220" viewBox="0 0 7410 3900" preserveAspectRatio="xMinYMid slice">';
    for(var i=0;i<13;i++) s+='<rect y="'+i*300+'" width="7410" height="300" fill="'+(i%2?"#FFFFFF":"#B22234")+'"/>';
    s+='<rect width="2964" height="2100" fill="#4D6A3F"/>'; var d="";
    for(var r=0;r<9;r++){var n=r%2?5:6;for(var j=0;j<n;j++){d+=star(247*(r%2?2+2*j:1+2*j),210*(r+1),120,46,5);}}
    return s+'<path d="'+d+'" fill="#FFFFFF"/></svg>';
  }

  /* ---------- olive branch generator ---------- */
  var BR=[[[196,352],[128,350],[58,300],[52,214]],[[52,214],[48,150],[78,96],[124,60]]];
  var LEAF="M0,0 C5,-5 14,-6 24,0 C14,6 5,5 0,0Z";
  function bz(s,t,k){var u=1-t;return u*u*u*s[0][k]+3*u*u*t*s[1][k]+3*u*t*t*s[2][k]+t*t*t*s[3][k];}
  function bd(s,t,k){var u=1-t;return 3*u*u*(s[1][k]-s[0][k])+6*u*t*(s[2][k]-s[1][k])+3*t*t*(s[3][k]-s[2][k]);}
  function at(t){var i=t<.5?0:1,tt=t<.5?t*2:(t-.5)*2,s=BR[i];return {x:bz(s,tt,0),y:bz(s,tt,1),a:Math.atan2(bd(s,tt,1),bd(s,tt,0))*180/Math.PI};}
  function branch(g,animated){
    var out={stem:null,leaves:[],olives:[]};
    out.stem=el("path",{d:"M"+BR[0][0]+" C"+BR[0][1]+" "+BR[0][2]+" "+BR[0][3]+" C"+BR[1][1]+" "+BR[1][2]+" "+BR[1][3],fill:"none",stroke:"#88985A","stroke-width":"2.4","stroke-linecap":"round",pathLength:"1","stroke-dasharray":"1","stroke-dashoffset":animated?"1":"0"},g);
    var N=11;
    for(var i=0;i<N;i++){
      var t=.06+i*(.92/(N-1)), p=at(t), last=i===N-1, len=26-i*.9;
      var sides=last?[0]:[-1,1];
      sides.forEach(function(sd){
        var sc=(len/24)*(sd>0?.8:1);
        var gg=el("g",{transform:"translate("+p.x.toFixed(1)+" "+p.y.toFixed(1)+") rotate("+(p.a+sd*40).toFixed(1)+") scale("+sc.toFixed(3)+")"},g);
        var lf=el("g",{},gg);
        el("path",{d:LEAF,fill:"url(#olxLeaf)"},lf);
        el("path",{d:"M2,0 L21,0",stroke:"#E4E8DA","stroke-opacity":".35","stroke-width":".9",fill:"none"},lf);
        if(animated) lf.style.transform="scale(0)";
        out.leaves.push({el:lf,t:t});
      });
    }
    [.2,.42,.63,.83].forEach(function(t,k){
      var p=at(t), n=(p.a-90)*Math.PI/180, ox=p.x+Math.cos(n)*10, oy=p.y+Math.sin(n)*10;
      var gg=el("g",{transform:"translate("+ox.toFixed(1)+" "+oy.toFixed(1)+") rotate("+(p.a-90).toFixed(1)+")"},g);
      var o=el("g",{},gg);
      el("ellipse",{rx:"8.5",ry:"6.2",fill:k%2?"url(#olxOliveG)":"url(#olxOliveR)"},o);
      el("ellipse",{cx:"-2.5",cy:"-2.6",rx:"2.4",ry:"1.5",fill:"#FFFFFF",opacity:".45"},o);
      if(animated) o.style.transform="scale(0)";
      out.olives.push(o);
    });
    return out;
  }

  /* build emblem wreath (both sides) */
  var wreath=$("olxWreath"), W=[];
  W.push(branch(el("g",{},wreath),true));
  W.push(branch(el("g",{transform:"matrix(-1 0 0 1 400 0)"},wreath),true));
  /* decorative background branches */
  (function(){var d=$("olxDeco");
    branch(el("g",{transform:"translate(-70 420) scale(1.9) rotate(-14 200 200)"},d),false);
    branch(el("g",{transform:"translate(1070 -120) scale(-1.9 1.9) rotate(-14 200 200)"},d),false);
    branch(el("g",{transform:"translate(1050 560) scale(-1.4 -1.4) rotate(20 200 200)"},d),false);
  })();

  /* ripples + splash */
  var rip=$("olxRipples"), ripples=[], splash=[];
  for(var r=0;r<3;r++){var g=el("g",{transform:"translate(200 200)"},rip);var c=el("circle",{r:"1",fill:"none",stroke:"#DFC292","stroke-width":"1.6","vector-effect":"non-scaling-stroke",opacity:"0"},g);ripples.push(c);}
  var sp=$("olxSplash");
  for(var s=0;s<12;s++){var g2=el("g",{transform:"translate(200 200) rotate("+(s*30+((s%3)*7))+")"},sp);var dd=el("circle",{r:(1.6+(s%3)*.9).toFixed(1),fill:"#E6C793",opacity:"0"},g2);splash.push(dd);}

  /* wave paths */
  function wave(){var s="M-260,0";for(var x=-260;x<660;x+=60)s+=" q15,-8 30,0 t30,0";return s;}
  var WAVE=wave(), WAVE_CLOSED=WAVE+" L660,440 L-260,440 Z";
  var wClip=$("olxWaveClip"), crest=$("olxCrest"), crestB=$("olxCrestB");
  wClip.setAttribute("d",WAVE_CLOSED); crest.setAttribute("d",WAVE); crestB.setAttribute("d",WAVE);
  var foldG=$("olxFoldG");

  /* particles */
  var PBOX=$("olxParticles"), parts=[];
  for(var q=0;q<26;q++){var sp2=document.createElement("i");sp2.className="olx__p";sp2.style.left=(Math.random()*100).toFixed(2)+"%";sp2.style.setProperty("--s",(3+Math.random()*7).toFixed(1)+"px");PBOX.appendChild(sp2);parts.push(sp2);}

  var logoPaths=[].slice.call(document.querySelectorAll("#olxLogo path"));

  /* ---------- runtime state ---------- */
  var anims=[], timers=[], raf=0, state=null;
  /* global tempo: every duration, delay and timer is multiplied by SPEED (1 = original ~4.5s) */
  var SPEED=.3;
  function A(node,kf,opt){var o=Object.assign({fill:"both",easing:EASE},opt);if(o.duration>1)o.duration=Math.round(o.duration*SPEED);if(o.delay)o.delay=Math.round(o.delay*SPEED);var a=node.animate(kf,o);anims.push(a);return a;}
  function T(fn,ms){timers.push(setTimeout(fn,Math.round(ms*SPEED)));}
  function cleanup(){
    anims.forEach(function(a){try{a.cancel()}catch(e){}}); anims=[];
    timers.forEach(clearTimeout); timers=[]; cancelAnimationFrame(raf);
  }
  function center(btn){
    var r=btn&&btn.getBoundingClientRect();
    if(!r||(!r.width&&!r.height)) return {x:innerWidth/2,y:innerHeight/2};
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  }
  function radius(c){return Math.ceil(Math.hypot(Math.max(c.x,innerWidth-c.x),Math.max(c.y,innerHeight-c.y)))+20;}
  function block(e){e.preventDefault();}

  /* oil level + cloth folds loop */
  function loop(st){
    var t0=performance.now();
    function f(now){
      var e=now-t0, lvl;
      var k=Math.min(1,Math.max(0,(e-st.riseAt*SPEED)/(st.riseDur*SPEED))); k=1-Math.pow(1-k,3);
      lvl=st.riseAt<0?78:(322-262*k);
      var ph=-((e*.06/SPEED)%60), ph2=-((e*.035/SPEED+30)%60);
      wClip.setAttribute("transform","translate("+ph.toFixed(2)+" "+lvl.toFixed(2)+")");
      crest.setAttribute("transform","translate("+ph.toFixed(2)+" "+lvl.toFixed(2)+")");
      crestB.setAttribute("transform","translate("+ph2.toFixed(2)+" "+(lvl+5).toFixed(2)+")");
      foldG.setAttribute("gradientTransform","translate("+((e*.05)%120).toFixed(2)+" 0)");
      raf=requestAnimationFrame(f);
    }
    raf=requestAnimationFrame(f);
  }

  function setCopy(lang){
    var c=COPY[lang], g=$("olxGreet"), s=$("olxSub");
    g.textContent=c.greet; g.className="olx__greet is-"+lang; g.lang=lang; g.dir=lang==="ar"?"rtl":"ltr";
    s.textContent=c.sub; s.className="olx__sub is-"+lang; s.lang=lang; s.dir=g.dir;
    $("olxSkip").textContent=c.skip;
    $("olxFlag").innerHTML=lang==="ar"?flagJO():flagUS();
  }

  function finishExit(st){
    if(st.exiting) return; st.exiting=true;
    if(!st.swapped){st.swapped=true;st.swap();}
    timers.forEach(clearTimeout); timers=[];
    var c=center(st.btn), R=radius(c);
    var stage=$("olxStage");
    var fast=st.reduced;
    A(stage,[{opacity:1,transform:"none",filter:"blur(0)"},{opacity:0,transform:"scale(.94)",filter:"blur(6px)"}],{duration:fast?250:520,easing:EASE2});
    var bg=A($("olxBg"),[{clipPath:"circle("+R+"px at "+c.x+"px "+c.y+"px)",opacity:1},{clipPath:"circle(0px at "+c.x+"px "+c.y+"px)",opacity:fast?0:1}],{duration:fast?300:780,delay:fast?0:120,easing:EASE2});
    bg.finished.then(end,end);
    function end(){
      if(state!==st) return;
      cleanup(); root.classList.remove("is-on"); state=null;
      document.removeEventListener("keydown",st.key);
      try{st.btn&&st.btn.focus({preventScroll:true});}catch(e){}
    }
  }

  function play(lang,swap,btn){
    if(state){ return; }                       /* ignore double clicks */
    cleanup(); setCopy(lang);
    var st=state={lang:lang,swap:swap,btn:btn,swapped:false,exiting:false,reduced:RM.matches,riseAt:-1,riseDur:900};
    var c=center(btn), R=radius(c);
    root.classList.add("is-on");
    st.key=function(e){if(e.key==="Escape"||e.key==="Enter"||e.key===" "){e.preventDefault();finishExit(st);}};
    document.addEventListener("keydown",st.key);
    var doSwap=function(){ if(!st.swapped){st.swapped=true;swap();} };

    /* ---- reduced motion: calm cross-fade with the finished emblem ---- */
    if(st.reduced){
      W.forEach(function(b){A(b.stem,[{strokeDashoffset:0},{strokeDashoffset:0}],{duration:1});b.leaves.forEach(function(l){A(l.el,[{transform:"none"},{transform:"none"}],{duration:1})});b.olives.forEach(function(o){A(o,[{transform:"none"},{transform:"none"}],{duration:1})});});
      A($("olxRing"),[{strokeDashoffset:0},{strokeDashoffset:0}],{duration:1});
      A($("olxTint"),[{opacity:0},{opacity:0}],{duration:1});
      logoPaths.forEach(function(p){A(p,[{strokeDashoffset:0,fillOpacity:1,strokeWidth:0},{strokeDashoffset:0,fillOpacity:1,strokeWidth:0}],{duration:1})});
      [$("olxGreet"),$("olxSub")].forEach(function(n){A(n,[{opacity:1},{opacity:1}],{duration:1})});
      A($("olxBg"),[{clipPath:"circle("+R+"px at 50% 50%)",opacity:0},{clipPath:"circle("+R+"px at 50% 50%)",opacity:1}],{duration:260,easing:"ease"});
      A($("olxStage"),[{opacity:0},{opacity:1}],{duration:260,easing:"ease"});
      loop(st);
      T(doSwap,300); T(function(){finishExit(st)},1500);
      return;
    }

    /* ---- 1 · curtain of night opens from the button ---- */
    A($("olxBg"),[{clipPath:"circle(0px at "+c.x+"px "+c.y+"px)"},{clipPath:"circle("+R+"px at "+c.x+"px "+c.y+"px)"}],{duration:760,easing:EASE2});
    A($("olxStage"),[{opacity:1,transform:"none",filter:"blur(0)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:1});
    A($("olxDeco"),[{opacity:0,transform:"scale(1.08) rotate(-2deg)"},{opacity:.09,transform:"scale(1) rotate(0)"}],{duration:2600,delay:200});
    parts.forEach(function(p){
      var d=2600+Math.random()*1800, dl=200+Math.random()*1600, dx=(Math.random()*80-40);
      A(p,[{opacity:0,transform:"translate(0,0) scale(.6)"},{opacity:.9,offset:.25},{opacity:.7,offset:.7},{opacity:0,transform:"translate("+dx+"px,-"+(55+Math.random()*40)+"vh) scale(1.1)"}],{duration:d,delay:dl,easing:"cubic-bezier(.3,.6,.4,1)"});
    });

    /* ---- 2 · golden frame + olive wreath grow ---- */
    A($("olxHaloC"),[{opacity:0,transform:"scale(.6)"},{opacity:1,transform:"scale(1)"}],{duration:1100,delay:200});
    $("olxHaloC").style.transformOrigin="200px 200px";
    A($("olxRing"),[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1000,delay:160,easing:EASE2});
    A($("olxRing2"),[{opacity:0},{opacity:.7}],{duration:800,delay:500});
    W.forEach(function(b){
      A(b.stem,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:900,delay:240,easing:EASE2});
      b.leaves.forEach(function(l){A(l.el,[{transform:"scale(0)"},{transform:"scale(1.15)",offset:.7},{transform:"scale(1)"}],{duration:520,delay:320+l.t*720,easing:EASE});});
      b.olives.forEach(function(o,i){A(o,[{transform:"scale(0)"},{transform:"scale(1.25)",offset:.6},{transform:"scale(1)"}],{duration:520,delay:760+i*110,easing:BACK});});
    });

    /* ---- 3 · the ripe olive is pressed ---- */
    var press=$("olxPress"), olive=$("olxOlive");
    A(press,[{opacity:0,transform:"translateY(-18px)"},{opacity:1,transform:"none"}],{duration:520,delay:420});
    A(olive,[{transform:"scale(1)"},{transform:"scale(1)",offset:.2},{transform:"scale(1.32,.68)",offset:.45},{transform:"scale(.9,1.12)",offset:.65},{transform:"scale(1.18,.8)",offset:.82},{transform:"scale(.92,.92)"}],{duration:700,delay:780,easing:"ease-in-out"});
    A(press,[{opacity:1},{opacity:0,transform:"translateY(-10px)"}],{duration:500,delay:1550,fill:"forwards"});

    /* ---- 4 · a golden drop falls into the frame ---- */
    var drop=$("olxDrop");
    A(drop,[
      {opacity:0,transform:"translate(200px,52px) scale(.1)"},
      {opacity:1,transform:"translate(200px,58px) scale(.75,.9)",offset:.32},
      {opacity:1,transform:"translate(200px,64px) scale(.7,1.05)",offset:.45},
      {opacity:1,transform:"translate(200px,192px) scale(.62,1.45)",offset:.92,easing:IN},
      {opacity:0,transform:"translate(200px,200px) scale(1.6,.2)"}
    ],{duration:820,delay:1080,easing:"ease-out"});
    var IMPACT=1860;
    ripples.forEach(function(rc,i){A(rc,[{opacity:.9,transform:"scale(4)"},{opacity:0,transform:"scale("+(150+i*30)+")"}],{duration:1300,delay:IMPACT+i*150,easing:"cubic-bezier(.16,1,.3,1)"});});
    splash.forEach(function(d,i){var dist=24+(i%4)*9;A(d,[{opacity:1,transform:"translate(0,0) scale(1)"},{opacity:0,transform:"translate("+dist+"px,0) scale(.2)"}],{duration:620+(i%3)*80,delay:IMPACT,easing:"cubic-bezier(.16,1,.3,1)"});});
    A($("olxEmblem"),[{transform:"none"},{transform:"scale(1.035)",offset:.25},{transform:"none"}],{duration:620,delay:IMPACT,easing:EASE});

    /* ---- 5 · oil rises and the flag appears ---- */
    st.riseAt=IMPACT; st.riseDur=950; loop(st);
    A($("olxFlag"),[{transform:"scale(1.18)",filter:"saturate(.6)"},{transform:"scale(1)",filter:"saturate(1)"}],{duration:1500,delay:IMPACT,easing:EASE});
    A($("olxTint"),[{opacity:.78},{opacity:0}],{duration:800,delay:IMPACT+800,easing:"ease-out"});
    A($("olxSheen"),[{opacity:0,transform:"rotate(18deg) translateX(0)"},{opacity:1,offset:.2},{opacity:0,transform:"rotate(18deg) translateX(520px)"}],{duration:900,delay:IMPACT+1050,easing:EASE2});
    $("olxSheen").style.transformOrigin="200px 200px"; $("olxSheen").removeAttribute("transform");

    /* language swap happens behind the closed curtain */
    T(doSwap,860);

    /* ---- 6 · OLGA logo written in liquid gold + greeting ---- */
    logoPaths.forEach(function(p,i){
      A(p,[{strokeDashoffset:1,fillOpacity:0,strokeWidth:46},{strokeDashoffset:0,fillOpacity:0,strokeWidth:46,offset:.62},{strokeDashoffset:0,fillOpacity:1,strokeWidth:0}],{duration:1300,delay:1500+i*70,easing:EASE2});
    });
    A($("olxLogo"),[{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:700,delay:1450});
    A($("olxGreet"),[{opacity:0,transform:"translateY(14px)",filter:"blur(8px)",clipPath:"inset(0 50% 0 50%)"},{opacity:1,transform:"none",filter:"blur(0)",clipPath:"inset(0 0 0 0)"}],{duration:900,delay:2350});
    A($("olxSub"),[{opacity:0,letterSpacing:lang==="ar"?".3em":".9em"},{opacity:.9,letterSpacing:lang==="ar"?".06em":".42em"}],{duration:1000,delay:2550});

    /* ---- 7 · exit: curtain closes into the language button ---- */
    T(function(){finishExit(st)},3700);
  }

  root.addEventListener("click",function(){ if(state) finishExit(state); });
  root.addEventListener("wheel",block,{passive:false});
  root.addEventListener("touchmove",block,{passive:false});

  window.OlgaLangFX={play:play,busy:function(){return !!state;}};
})();
