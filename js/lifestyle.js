/* Olga lifestyle photos: gift-edit layout, parallax, poster tilt, lightbox */
(function(){
  "use strict";
  var IMG=(window.OLGA&&window.OLGA.IMG)||{}, $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var reduced=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  /* --- gift grid: 3 staggered columns on desktop, 2 on phones --- */
  var grid=$("#gfGrid");
  if(grid){
    var tiles=$$(".gtile",grid).sort(function(a,b){return a.getAttribute("data-gi")-b.getAttribute("data-gi")});
    var cols=$$(".gift__col",grid), mq=window.matchMedia("(max-width:760px)");
    var LAY={d:[[0,1],[2,3],[4,5]], m:[[0,3,5],[2,4,1]]}, PAR={d:["-1","1","-0.5"], m:["-0.6","0.6"]};
    var layout=function(){
      var k=mq.matches?"m":"d", L=LAY[k];
      while(cols.length<3){ var c=document.createElement("div"); c.className="gift__col"; grid.appendChild(c); cols.push(c); }
      cols.forEach(function(c,i){ c.style.display=i<L.length?"":"none"; c.className="gift__col"+(i===1?" gift__col--mid":""); c.setAttribute("data-gpar",PAR[k][i]||"0"); });
      L.forEach(function(ids,i){ ids.forEach(function(id){ cols[i].appendChild(tiles[id]); }); });
    };
    layout(); if(mq.addEventListener) mq.addEventListener("change",layout); else mq.addListener(layout);
    /* parallax drift per column */
    var sec=$("#gift"), on=false, raf=0;
    var tick=function(){ raf=0; if(!on||reduced) return; var r=sec.getBoundingClientRect(), vh=window.innerHeight, p=(vh-r.top)/(vh+r.height)-.5, amp=mq.matches?36:80;
      cols.forEach(function(c){ c.style.setProperty("--gy",(p*amp*parseFloat(c.getAttribute("data-gpar")||0)).toFixed(1)+"px"); }); };
    if("IntersectionObserver" in window) new IntersectionObserver(function(e){ on=e[0].isIntersecting; if(on) tick(); },{rootMargin:"200px 0px"}).observe(sec);
    window.addEventListener("scroll",function(){ if(on&&!raf) raf=requestAnimationFrame(tick); },{passive:true});
    window.addEventListener("resize",function(){ if(on&&!raf) raf=requestAnimationFrame(tick); });
  }
  /* --- poster tilt (mouse only) --- */
  var fr=$("#rtFrame");
  if(fr && !reduced && window.matchMedia("(hover:hover) and (pointer:fine)").matches){
    fr.addEventListener("pointermove",function(e){ var r=fr.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      fr.style.setProperty("--ry",(x*10).toFixed(2)+"deg"); fr.style.setProperty("--rx",(-y*8).toFixed(2)+"deg"); });
    fr.addEventListener("pointerleave",function(){ fr.style.setProperty("--ry","0deg"); fr.style.setProperty("--rx","0deg"); });
  }
  /* --- lightbox --- */
  var box=$("#lbx"), fig=$("#lbxFig"), im=$("#lbxImg"), cap=$("#lbxCap"), cnt=$("#lbxCount"), th=$("#lbxThumbs");
  if(!box) return;
  var list=[], idx=0, lastFocus=null, rtl=function(){return document.documentElement.dir==="rtl"};
  var capOf=function(el){ var k=el.getAttribute("data-lk-cap"), node=k&&document.querySelector('[data-i="'+k+'"]'); return node?node.textContent:""; };
  var show=function(i,dir){
    idx=(i+list.length)%list.length; var el=list[idx], k=el.getAttribute("data-lk");
    fig.classList.remove("is-on"); fig.style.setProperty("--sx",((dir||0)*40)+"px");
    var go=function(){ im.src=IMG[k]||""; cap.textContent=capOf(el); fig.style.setProperty("--sx","0px"); requestAnimationFrame(function(){ fig.classList.add("is-on"); }); };
    if(dir) setTimeout(go,160); else go();
    cnt.innerHTML=list.length>1? String(idx+1).padStart(2,"0")+' <span>/ '+String(list.length).padStart(2,"0")+'</span>' : "";
    $$("button",th).forEach(function(b,j){ b.classList.toggle("is-on",j===idx); if(j===idx && b.scrollIntoView) b.scrollIntoView({block:"nearest",inline:"center"}); });
  };
  var open=function(el){
    var g=el.getAttribute("data-lk-group");
    list=$$('[data-lk-group="'+g+'"]').sort(function(a,b){ return (+a.getAttribute("data-gi")||0)-(+b.getAttribute("data-gi")||0); });
    th.innerHTML=list.map(function(x,j){ return '<button type="button" data-lbx-i="'+j+'" aria-label="'+(j+1)+'"><img src="'+(IMG[x.getAttribute("data-lk")]||"")+'" alt=""></button>'; }).join("");
    box.classList.toggle("lbx--single",list.length<2);
    lastFocus=el; box.classList.add("is-open"); box.setAttribute("aria-hidden","false"); document.body.classList.add("is-locked");
    show(list.indexOf(el)); setTimeout(function(){ $("#lbxClose").focus({preventScroll:true}); },50);
  };
  var close=function(){ if(!box.classList.contains("is-open")) return; box.classList.remove("is-open"); fig.classList.remove("is-on"); box.setAttribute("aria-hidden","true");
    if(!document.querySelector(".modal.is-open,.o3d.is-open,.menu.is-open,#o3d.is-open")) document.body.classList.remove("is-locked");
    if(lastFocus) try{ lastFocus.focus({preventScroll:true}); }catch(e){} };
  var step=function(d){ if(list.length>1) show(idx+d,-d*(rtl()?-1:1)); };
  document.addEventListener("click",function(e){
    var t=e.target.closest("[data-lk]"); if(t && !box.contains(t)){ e.preventDefault(); open(t); return; }
    if(!box.classList.contains("is-open")) return;
    if(e.target.closest("[data-lbx-close]")){ close(); return; }
    if(e.target.closest("#lbxPrev")){ step(-1); return; }
    if(e.target.closest("#lbxNext")){ step(1); return; }
    var b=e.target.closest("[data-lbx-i]"); if(b){ var j=+b.getAttribute("data-lbx-i"); if(j!==idx) show(j,j>idx?(rtl()?1:-1):(rtl()?-1:1)); return; }
    if(e.target===$("#lbxStage")) close();
  });
  window.addEventListener("keydown",function(e){ if(!box.classList.contains("is-open")) return;
    if(e.key==="Escape"){ e.stopImmediatePropagation(); close(); }
    else if(e.key==="ArrowRight"){ step(rtl()?-1:1); } else if(e.key==="ArrowLeft"){ step(rtl()?1:-1); } },true);
  /* swipe */
  var sx=0, sy=0, drag=false, stage=$("#lbxStage");
  stage.addEventListener("pointerdown",function(e){ if(list.length<2||e.target.closest("button")) return; drag=true; sx=e.clientX; sy=e.clientY; fig.classList.add("is-drag"); });
  stage.addEventListener("pointermove",function(e){ if(!drag) return; fig.style.setProperty("--sx",(e.clientX-sx)+"px"); });
  var end=function(e){ if(!drag) return; drag=false; fig.classList.remove("is-drag"); var dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){ var d=dx<0?1:-1; if(rtl()) d=-d; show(idx+d,dx<0?-1:1); } else fig.style.setProperty("--sx","0px"); };
  stage.addEventListener("pointerup",end); stage.addEventListener("pointercancel",end);
})();
