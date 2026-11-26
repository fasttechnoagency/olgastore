(function(){
"use strict";
var A=window.OLGA||{}, IMG=A.IMG||{}, CUT=A.CUT||{}, FR=A.FR||[];
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var lerp=function(a,b,t){return a+(b-a)*t};
var DT=1/60; var ease=function(f){return 1-Math.pow(1-f,DT*60)};
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var CFG=window.OLGA_CONFIG||{};
var WA=CFG.whatsappSupport||"962792000155";
document.documentElement.classList.remove("no-js");
if(reduced) document.documentElement.classList.add("reduced");
if($("#year"))$("#year").textContent=new Date().getFullYear();
var LOGO_P2D=null; try{ LOGO_P2D=new Path2D(A.LOGO||""); }catch(e){}
function drawLogo(g,cx,cy,h){
  if(!LOGO_P2D) return; var s=h/726, w=1260*s;
  g.save(); g.translate(cx-w/2,cy-h/2); g.scale(s,s); g.translate(0,726); g.scale(.1,-.1); g.fill(LOGO_P2D); g.restore();
}
var LOGO_SVG='<svg class="logo" viewBox="0 0 1260 726" aria-hidden="true"><use href="#olga-logo"/></svg>';


/* Data loaded from data/products.js & data/translations.js */
var _D=window.OLGA_DATA||{};
var PRODUCTS=_D.PRODUCTS||[];
var CATS=_D.CATS||["all","body","laundry","hammam","sets"];
var REELS=_D.REELS||[];
var JO_CITIES=_D.JO_CITIES||{ar:[],en:[]};
window.OLGA_PRODUCTS=PRODUCTS;
var byId={}, VAR={};
PRODUCTS.forEach(function(p,i){ p.order=i; byId[p.id]=p; p.variants.forEach(function(v){ v.p=p; VAR[v.id]=v; }); });
var sel={}; PRODUCTS.forEach(function(p){ sel[p.id]=p.def; });
var T=window.OLGA_I18N||{en:{},ar:{}};

var LANG="ar";
try{ var sv=localStorage.getItem("olga-lang"); if(sv==="en"||sv==="ar") LANG=sv; }catch(e){}
try{ var qp=new URLSearchParams(location.search).get("lang"); if(qp==="en"||qp==="ar") LANG=qp; }catch(e){}
function t(k){ var v=T[LANG][k]; return v===undefined?(T.en[k]||k):v; }
function L(o){ return o? (o[LANG]!==undefined?o[LANG]:o.en) : ""; }
function money(v){ var n=v.toFixed(2); return LANG==="ar"? n+' <small>'+t("cur")+'</small>' : '<small style="margin:0 4px 0 0">'+t("cur")+'</small>'+n; }
function moneyTxt(v){ return LANG==="ar"? v.toFixed(2)+" "+t("cur") : t("cur")+" "+v.toFixed(2); }

/* ======================= LAZY MEDIA ======================= */
var lazyIO=("IntersectionObserver" in window)? new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ loadMedia(e.target); lazyIO.unobserve(e.target); } }); },{rootMargin:"600px 0px"}) : null;
function loadMedia(el){
  var k=el.getAttribute("data-img");
  if(k){ var src=IMG[k]||pickCut(el,k); if(src && el.getAttribute("src")!==src){ el.onload=function(){ el.classList.add("is-loaded"); }; el.src=src; if(el.complete) el.classList.add("is-loaded"); } return; }
  var b=el.getAttribute("data-bg"); if(b && IMG[b]) el.style.backgroundImage="url("+IMG[b]+")";
}
/* v25 · light copies of the product cut-outs: 240px for the bag orb / toast / drawer / chips,
   560px for category cards and phone product cards. Full-size cut-outs (1600px) stay for
   desktop cards, quick view and 3D. Built at idle time, then swapped in place. */
var THUMBS={}, THUMBM={}, MOBGRID=window.matchMedia("(max-width:760px)").matches;
function pickCut(el,k){
  if(!CUT[k]) return "";
  if(el && el.closest){
    if(el.closest(".mchip,.toast__img,.line-item__img")) return THUMBS[k]||THUMBM[k]||CUT[k];
    if(el.closest(".catc") || (MOBGRID && el.classList.contains("pcard__img"))) return THUMBM[k]||CUT[k];
  }
  return CUT[k];
}
(function buildThumbs(){
  var keys=Object.keys(CUT), i=0, started=false;
  var idle=window.requestIdleCallback?function(f){ return requestIdleCallback(f,{timeout:1200}); }:function(f){ return setTimeout(f,90); };
  function make(k,im,h,store,done){
    var nw=im.naturalWidth, nh=im.naturalHeight; if(!nw||!nh){ done(); return; }
    var hh=Math.min(h,nh), ww=Math.round(hh*nw/nh); if(nw>nh*1.15){ ww=Math.min(Math.round(h*1.3),nw); hh=Math.round(ww*nh/nw); }
    if(hh>=nh){ store[k]=CUT[k]; done(); return; }
    var c=document.createElement("canvas"); c.width=ww; c.height=hh; var g=c.getContext("2d"); g.imageSmoothingEnabled=true; g.imageSmoothingQuality="high"; g.drawImage(im,0,0,ww,hh);
    if(c.toBlob) c.toBlob(function(bl){ if(bl) store[k]=URL.createObjectURL(bl); done(); },"image/webp",.9); else { try{ store[k]=c.toDataURL("image/webp",.9); }catch(e){} done(); }
  }
  function swap(k){
    $$('img[data-img="'+k+'"]').forEach(function(el){ if(!el.getAttribute("src")) return; var s=pickCut(el,k); if(s && el.getAttribute("src")!==s) el.src=s; });
    $$('.toast__img img,.line-item__img img').forEach(function(el){ if(el.getAttribute("src")===CUT[k] && THUMBS[k]) el.src=THUMBS[k]; });
  }
  function one(){
    if(i>=keys.length) return; var k=keys[i++], im=new Image(); im.src=CUT[k];
    var ok=function(){ make(k,im,240,THUMBS,function(){ make(k,im,560,THUMBM,function(){ swap(k); idle(one); }); }); };
    if(im.decode) im.decode().then(ok,function(){ idle(one); }); else { im.onload=ok; im.onerror=function(){ idle(one); }; }
  }
  function go(){ if(started) return; started=true; idle(one); }
  if(document.readyState==="complete") setTimeout(go,600); else window.addEventListener("load",function(){ setTimeout(go,600); });
})();
function lazy(root){ $$("[data-img],[data-bg]",root).forEach(function(el){ if(lazyIO) lazyIO.observe(el); else loadMedia(el); }); }

/* ======================= TEXT FX ======================= */
function splitWords(el){
  function wrap(node,cls){
    var out=document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(function(w){
      if(!w) return;
      if(/^\s+$/.test(w)){ out.appendChild(document.createTextNode(" ")); return; }
      var o=document.createElement("span"); o.className="wl"; var i=document.createElement("span"); if(cls) i.className=cls; i.textContent=w; o.appendChild(i); out.appendChild(o);
    });
    return out;
  }
  Array.prototype.slice.call(el.childNodes).forEach(function(n){
    if(n.nodeType===3) el.replaceChild(wrap(n,""),n);
    else if(n.nodeType===1 && n.tagName!=="BR"){ var tag=n.tagName.toLowerCase(), cls=n.className||""; var f=wrap(n,cls); if(tag==="b"||tag==="strong"){ $$(".wl>span",f).forEach(function(s){ s.style.fontWeight="600"; }); } el.replaceChild(f,n); }
  });
  $$(".wl>span",el).forEach(function(s,i){ s.style.transitionDelay=(i*0.06)+"s"; });
}
var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); if(e.target.querySelector("[data-count]")||e.target.hasAttribute("data-count")) runCounters(e.target); } }); },{threshold:0.12,rootMargin:"0px 0px -6% 0px"});
function observeReveal(root){ $$("[data-reveal],[data-split],[data-clip]",root).forEach(function(el){ if(!el.classList.contains("is-in")) io.observe(el); }); }
function runCounters(root){
  $$("[data-count]",root).forEach(function(el){
    if(el._done) return; el._done=true;
    var to=+el.getAttribute("data-count"), t0=performance.now(), d=1800;
    (function step(now){ var k=clamp((now-t0)/d,0,1), v=Math.round(to*(1-Math.pow(1-k,4))); el.textContent=v; if(k<1) requestAnimationFrame(step); })(t0);
  });
}

/* ======================= RENDER ======================= */
var ICO={
 bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
 eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4 10-10"/></svg>',
 arrow:'<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 leaf:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/></svg>'
};
function curVar(p){ return p.variants[sel[p.id]]||p.variants[0]; }
function qctlHTML(v,big){
  return '<span class="qctl'+(big?' qctl--big':'')+'" data-qctl="'+v.id+'">'+
    (big?'<button type="button" class="btn btn--olive" data-add="'+v.id+'">'+ICO.bag+'<span>'+t("addBag")+'</span></button>'
        :'<button type="button" class="add" data-add="'+v.id+'" aria-label="'+t("addBag")+' — '+L(v.p.name)+'">'+ICO.bag+'<span>'+t("add")+'</span></button>')+
    '<span class="qstep" role="group"><button type="button" class="qstep__btn" data-dec="'+v.id+'" aria-label="−">'+ICO.minus+'</button><span class="qstep__n" aria-live="polite"><b>0</b><small>'+t("inBag")+'</small></span><button type="button" class="qstep__btn" data-inc="'+v.id+'" aria-label="+">'+ICO.plus+'</button></span></span>';
}
function sizesHTML(p,scope){
  if(p.variants.length<2) return '<div class="sizes"><span class="size is-on" style="cursor:default">'+L(p.variants[0].size)+'</span></div>';
  return '<div class="sizes" role="radiogroup">'+p.variants.map(function(v,i){ return '<button type="button" class="size'+(i===sel[p.id]?' is-on':'')+'" role="radio" aria-checked="'+(i===sel[p.id])+'" data-size="'+p.id+'" data-vi="'+i+'" data-scope="'+scope+'">'+L(v.size)+'</button>'; }).join("")+'</div>';
}
function imgH(v){ return v.wide? "40%" : "60%"; }
function cardHTML(p){
  var v=curVar(p);
  return '<article class="pcard" data-pid="'+p.id+'" data-cat="'+p.cat+'" style="--acc:'+p.acc+'" data-reveal>'+
    '<div class="pcard__stage" data-view3d="'+p.id+'" role="button" tabindex="0" aria-label="'+t("view3d")+' — '+L(p.name)+'">'+
      '<span class="pcard__badge">'+L(p.badge)+'</span>'+'<span class="pcard__hint3d"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>'+t("tap3d")+'</span>'+
      '<div class="pcard__acts"><button type="button" class="pcard__act" data-quick="'+p.id+'" aria-label="'+t("quick")+'">'+ICO.eye+'</button>'+
      '<button type="button" class="pcard__act pcard__act--3d" data-view3d="'+p.id+'" aria-label="'+t("view3d")+'">3D</button></div>'+
      '<div class="pcard__tilt"><span class="pcard__shadow"></span><img class="pcard__img" data-img="'+v.cut+'" alt="'+L(p.name)+' '+L(v.size)+'" style="--sc:'+v.sc+';--h:'+imgH(v)+'" draggable="false"></div>'+
    '</div>'+
    '<div class="pcard__body">'+
      '<span class="pcard__cat">'+L(p.type)+'</span>'+
      '<h3 class="pcard__name"><button type="button" data-quick="'+p.id+'">'+L(p.name)+'</button></h3>'+
      '<span class="pcard__alt" lang="'+(LANG==="ar"?"en":"ar")+'">'+p.name[LANG==="ar"?"en":"ar"]+'</span>'+
      sizesHTML(p,"card")+
      '<div class="pcard__foot"><span class="price" data-price="'+p.id+'">'+money(v.price)+'</span>'+qctlHTML(v,false)+'</div>'+
    '</div></article>';
}
var shopState={cat:"all",q:"",sort:"featured"};
var grid=$("#grid");
function renderGrid(){
  var q=shopState.q.trim().toLowerCase();
  var list=PRODUCTS.filter(function(p){
    if(shopState.cat!=="all" && p.cat!==shopState.cat) return false;
    if(!q) return true;
    var hay=(p.name.en+" "+p.name.ar+" "+p.type.en+" "+p.type.ar+" "+p.ing.en+" "+p.ing.ar+" "+p.desc.en+" "+p.desc.ar).toLowerCase();
    return q.split(/\s+/).every(function(w){ return hay.indexOf(w)>=0; });
  });
  if(shopState.sort==="low") list.sort(function(a,b){ return curVar(a).price-curVar(b).price; });
  else if(shopState.sort==="high") list.sort(function(a,b){ return curVar(b).price-curVar(a).price; });
  else list.sort(function(a,b){ return a.order-b.order; });
  var h=list.map(cardHTML).join("");
  if(!list.length) h='<div class="empty-results">'+t("noResults")+'</div>';
  if(shopState.cat==="all" && !q) h+='<div class="promo" data-reveal><div><span class="olga-pill" style="background:var(--white);color:var(--olive)"><b>BatteL</b><span>B2B</span></span><h3 style="margin-top:22px">'+t("promoT")+'</h3></div><p>'+t("promoP")+'</p><a href="#contact" class="btn btn--cream btn--sm" data-scroll-js><span>'+t("promoBtn")+'</span>'+ICO.arrow+'</a></div>';
  grid.innerHTML=h;
  lazy(grid); observeReveal(grid); syncSteppers(); bindTilt(grid);
  // count per filter
  // live status in the toolbar (category · result count)
  renderCatStatus(list.length);
}
/* ===== CATEGORIES v24 ===== */
Object.assign(T.en,{
  catsK:"Shop by category", catsHint:"Tap a category to see its products",
  catD_all:"The complete Olga collection", catD_body:"Nabulsi, shea & laurel", catD_laundry:"Gentle on kids' clothes",
  catD_hammam:"Detox & exfoliation ritual", catD_sets:"Gifts & best value",
  catShowing:"Showing", catFor:"for", catClear:"Show all", catClearS:"All"
});
Object.assign(T.ar,{
  catsK:"تسوّقي حسب الفئة", catsHint:"اختاري فئة لعرض منتجاتها",
  catD_all:"مجموعة أولغا كاملة", catD_body:"نابلسي، شيا وغار", catD_laundry:"لطيف على ملابس الأطفال",
  catD_hammam:"طقس التقشير والديتوكس", catD_sets:"هدايا وعروض أوفر",
  catShowing:"عرض", catFor:"نتائج", catClear:"عرض كل المنتجات", catClearS:"الكل"
});
var CAT_META={
  all:{acc:"#B8944F",img:["laurel-300","nabulsi-900","shea-900"]},
  body:{acc:"#87916B",img:["shea-900","nabulsi-900"]},
  laundry:{acc:"#5B8C42",img:["laundry"]},
  hammam:{acc:"#7C1D2B",img:["moroccan"]},
  sets:{acc:"#9E7A3C",img:["shea-duo"]}
};
var ICO_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function catEsc(s){ return String(s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function catCount(c){ return c==="all"?PRODUCTS.length:PRODUCTS.filter(function(p){ return p.cat===c; }).length; }
function nProducts(n){
  if(LANG==="ar"){ if(n===0) return "لا توجد منتجات"; if(n===1) return "منتج واحد"; if(n===2) return "منتجان"; if(n<=10) return n+" منتجات"; return n+" منتجًا"; }
  return n+(n===1?" product":" products");
}
function catCardHTML(c,i){
  var m=CAT_META[c]||{acc:"#35452D",img:[]}, on=c===shopState.cat;
  var imgs=m.img.map(function(k,j){ return '<img class="catc__b catc__b--'+(j+1)+'" data-img="'+k+'" alt="" draggable="false" decoding="async">'; }).join("");
  return '<button type="button" class="catc catc--'+c+(on?' is-active':'')+'" data-filter="'+c+'" role="tab" id="cat-'+c+'" aria-selected="'+on+'" aria-controls="grid" tabindex="'+(on?0:-1)+'" data-n="'+m.img.length+'" style="--acc:'+m.acc+';--i:'+i+'">'+
    '<span class="catc__media" aria-hidden="true"><span class="catc__halo"></span>'+imgs+'</span>'+
    '<span class="catc__txt"><b class="catc__name">'+t("cat_"+c)+'</b><small class="catc__desc">'+t("catD_"+c)+'</small></span>'+
    '<span class="catc__count">'+nProducts(catCount(c))+'</span>'+
    '<span class="catc__tick" aria-hidden="true">'+ICO.check+'</span>'+
  '</button>';
}
function miniChipHTML(c){
  var m=CAT_META[c]||{acc:"#35452D",img:[]}, on=c===shopState.cat, k=m.img[c==="all"?1:0];
  return '<button type="button" class="mchip mchip--'+c+(on?' is-active':'')+'" data-filter="'+c+'" aria-pressed="'+on+'" style="--acc:'+m.acc+'">'+
    '<span class="mchip__dot" aria-hidden="true">'+(k?'<img data-img="'+k+'" alt="" draggable="false">':'')+'</span>'+
    '<span>'+t("cat_"+c)+'</span><i>'+catCount(c)+'</i></button>';
}
function renderCatStatus(n){
  var el=$("#catStatus"); if(!el) return;
  var c=shopState.cat, m=CAT_META[c]||{}, q=shopState.q.trim();
  el.style.setProperty("--acc",m.acc||"#35452D");
  el.innerHTML='<span class="tbar__dot" aria-hidden="true"></span>'+
    '<span class="tbar__txt"><b>'+t("cat_"+c)+'</b><small>'+nProducts(n)+(q?' · '+t("catFor")+' «'+catEsc(q)+'»':'')+'</small></span>'+
    (c!=="all"?'<button type="button" class="tbar__clear" data-filter="all" aria-label="'+t("catClear")+'">'+ICO_X+'<span>'+t("catClearS")+'</span></button>':'');
}
function renderFilters(){
  var f=$("#filters");
  f.innerHTML=CATS.map(catCardHTML).join("");
  lazy(f);
  var mini=$("#catMini"); if(mini){ mini.innerHTML=CATS.map(miniChipHTML).join(""); lazy(mini); }
  var s=$("#sort"); s.innerHTML=["featured","low","high"].map(function(k){ return '<option value="'+k+'"'+(k===shopState.sort?' selected':'')+'>'+t("sort_"+k)+'</option>'; }).join("");
}
function setCat(c,opts){
  opts=opts||{};
  if(CATS.indexOf(c)<0) c="all";
  var changed=c!==shopState.cat; shopState.cat=c;
  $$("#filters [data-filter],#catMini [data-filter]").forEach(function(x){
    var on=x.getAttribute("data-filter")===c; x.classList.toggle("is-active",on);
    if(x.classList.contains("catc")){ x.setAttribute("aria-selected",on); x.tabIndex=on?0:-1; }
    else x.setAttribute("aria-pressed",on);
  });
  renderGrid();
  if(changed && !reduced){ grid.classList.remove("is-swapping"); void grid.offsetWidth; grid.classList.add("is-swapping"); }
  var tb=$("#toolbar");
  // bring the results into view when they are below the fold (mostly on phones)
  if(opts.reveal){
    var r=grid.getBoundingClientRect(), off=(parseFloat(getComputedStyle(tb).top)||70)+tb.offsetHeight+14;
    if(r.top>window.innerHeight*0.6 || r.top<off-40) scrollToEl(grid,off);
  }
  if(tb.classList.contains("is-compact")) centerMiniChip(false);
}
// keep the active mini chip visible in the compact switcher (works in RTL and LTR)
function centerMiniChip(instant){
  var mc=$("#catMini .mchip.is-active"), mini=$("#catMini"); if(!mc||!mini) return;
  var mr=mini.getBoundingClientRect(), cr=mc.getBoundingClientRect();
  mini.scrollBy({left:(cr.left+cr.width/2)-(mr.left+mr.width/2),behavior:(instant||reduced)?"auto":"smooth"});
}
function onCatClick(e){ var b=e.target.closest("[data-filter]"); if(!b) return; setCat(b.getAttribute("data-filter"),{reveal:true}); }
$("#filters").addEventListener("click",onCatClick);
$("#catStatus").addEventListener("click",onCatClick);
$("#catMini").addEventListener("click",onCatClick);
// keyboard: arrows move between category tabs (RTL aware), Home/End jump
$("#filters").addEventListener("keydown",function(e){
  var keys=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"]; if(keys.indexOf(e.key)<0) return;
  var tabs=$$(".catc",this), i=tabs.indexOf(document.activeElement); if(i<0) return;
  var rtl=document.documentElement.dir==="rtl", n=tabs.length, d=0;
  if(e.key==="Home") i=0; else if(e.key==="End") i=n-1;
  else { d=(e.key==="ArrowRight"||e.key==="ArrowDown")?1:-1; if(rtl&&(e.key==="ArrowRight"||e.key==="ArrowLeft")) d=-d; i=(i+d+n)%n; }
  e.preventDefault(); tabs[i].focus(); setCat(tabs[i].getAttribute("data-filter"));
});
// compact switcher appears in the sticky toolbar once the big cards scroll away
(function(){
  var cards=$("#filters"), tb=$("#toolbar"); if(!cards||!tb||!("IntersectionObserver" in window)) return;
  new IntersectionObserver(function(es){ es.forEach(function(e){
    var on=!e.isIntersecting && e.boundingClientRect.top<0, was=tb.classList.contains("is-compact");
    tb.classList.toggle("is-compact", on);
    if(on&&!was) centerMiniChip(true);
  }); },{rootMargin:"-140px 0px 0px 0px",threshold:0}).observe(cards);
})();
$("#sort").addEventListener("change",function(e){ shopState.sort=e.target.value; renderGrid(); });
var qT; $("#q").addEventListener("input",function(e){ clearTimeout(qT); qT=setTimeout(function(){ shopState.q=e.target.value; renderGrid(); },140); });

/* card 3D tilt (desktop) */
function bindTilt(root){
  if(reduced || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  $$(".pcard__stage",root).forEach(function(st){
    var tl=st.querySelector(".pcard__tilt");
    st.addEventListener("pointermove",function(e){ var r=st.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; tl.style.transform="rotateY("+(x*14).toFixed(2)+"deg) rotateX("+(-y*10).toFixed(2)+"deg)"; });
    st.addEventListener("pointerleave",function(){ tl.style.transform=""; });
  });
}

/* catalogue spreads */
var spreadsEl=$("#spreads");
function spreadHTML(p){
  var s=p.spread, v=curVar(p), alt=p.name[LANG==="ar"?"en":"ar"];
  var b='<div class="spread__bottles'+(s.wide?' is-wide':'')+'">'+
    (s.b2?'<img class="b2" data-img="'+s.b2+'" alt="" style="'+(s.b2===s.b1?'height:62%':'')+'">':'')+
    '<img class="b1" data-img="'+s.b1+'" alt="'+L(p.name)+'">'+
    (s.deco?'<img class="deco" data-img="'+s.deco+'" alt="" style="'+(s.deco==="baby"?'height:46%;inset-inline-start:-34%;bottom:-2%':'height:62%;inset-inline-start:30%;bottom:-24%')+'">':'')+
  '</div>';
  return '<article class="spread" style="--acc:'+p.acc+'" data-pid="'+p.id+'">'+
   '<div class="spread__text">'+
     '<div class="spread__top"><div class="spread__line"><span class="olga-pill"><b>OLGA</b><span>Line</span></span><span class="sub">'+t("lPremium")+' <span style="opacity:.5">|</span> <span lang="'+(LANG==="ar"?"en":"ar")+'">'+T[LANG==="ar"?"en":"ar"].lPremium+'</span></span></div></div>'+
     '<div class="spread__mid">'+
       '<h3 class="spread__title">'+L(p.name)+' <span lang="'+(LANG==="ar"?"en":"ar")+'">'+alt+'</span></h3>'+
       '<p class="spread__desc">'+L(p.desc)+'</p>'+
       '<p class="spread__ing"><b>'+t("lIng")+':</b> '+L(p.ing)+'</p>'+
       '<ul class="spread__points">'+L(p.points).slice(0,3).map(function(x){return '<li>'+x+'</li>'}).join("")+'</ul>'+
       '<div class="spread__buy">'+sizesHTML(p,"spread")+'<span class="price" data-price="'+p.id+'">'+money(v.price)+'</span>'+qctlHTML(v,true)+
         '<button type="button" class="btn btn--ghost btn--sm" data-view3d="'+p.id+'" style="color:var(--ink)">3D</button></div>'+
     '</div>'+
     '<div class="spread__panel"><div class="spread__cal">'+s.cal+'<small>'+s.sub+'</small></div><div class="spread__facts">'+t("lExtract")+'<br><em>'+L(p.type)+'</em><b>'+s.sizes+'</b></div><span class="pagenum spread__num">'+s.page+'</span></div>'+
   '</div>'+
   '<div class="spread__visual"><img class="bg" data-img="'+s.bg+'" alt=""><span class="spine"></span><div class="vtext" aria-hidden="true"><b>NATURAL</b><span>PRODUCTS</span></div><span class="vcap" aria-hidden="true">Extracted From Natural Oils</span></div>'+
   b+(p.cat==="body"?'<span class="spread__drop" aria-hidden="true"></span>':'')+
   '<div class="spread__dim"></div></article>';
}
var SPREADS=[];
function renderSpreads(){
  spreadsEl.innerHTML=PRODUCTS.filter(function(p){return p.spread}).map(spreadHTML).join("");
  SPREADS=$$(".spread",spreadsEl).map(function(el){ return {el:el,dim:el.querySelector(".spread__dim"),bottles:el.querySelector(".spread__bottles"),bg:el.querySelector(".bg")}; });
  lazy(spreadsEl); syncSteppers();
}
function renderMarquee(){
  var item='<div class="marquee__item">'+t("marquee").map(function(x){ return '<span>'+x+'</span>'+ICO.leaf; }).join("")+'</div>';
  $("#marquee").innerHTML=item+item;
}
function renderMisc(){
  $("#ingrRow").innerHTML=t("ingr").map(function(x){ return '<span class="ingr">'+x+'</span>'; }).join("");
  $("#valList").innerHTML=t("vals").map(function(x){ return '<li><span><b>'+x[0]+':</b> '+x[1]+'</span></li>'; }).join("");
  $("#acc").innerHTML=t("faq").map(function(x,i){ return '<div class="acc__item'+(i===0?' is-open':'')+'"><button type="button" class="acc__q" aria-expanded="'+(i===0)+'">'+x[0]+'<i aria-hidden="true"></i></button><div class="acc__a"><div><p>'+x[1]+'</p></div></div></div>'; }).join("");
  $("#ftShop").innerHTML=PRODUCTS.filter(function(p){return p.cat!=="sets"}).map(function(p){ return '<li><a class="link-u" href="#shop" data-quick="'+p.id+'">'+L(p.name)+'</a></li>'; }).join("");
}
$("#acc").addEventListener("click",function(e){ var q=e.target.closest(".acc__q"); if(!q) return; var it=q.parentNode, open=!it.classList.contains("is-open"); $$(".acc__item",this).forEach(function(x){ x.classList.remove("is-open"); x.querySelector(".acc__q").setAttribute("aria-expanded","false"); }); if(open){ it.classList.add("is-open"); q.setAttribute("aria-expanded","true"); } setTimeout(remeasure,650); });

/* reels */
var track=$("#reelTrack"), reels=[];
function renderReels(){
  track.innerHTML=REELS.map(function(r){ return '<a class="reel" href="https://www.instagram.com/olga.jo11/" target="_blank" rel="noopener" aria-label="'+L(r.t)+'"><img data-img="'+r.img+'" alt="'+L(r.t)+'" draggable="false"><div class="reel__top"><span class="reel__avatar"><i>'+LOGO_SVG+'</i>olga.jo11</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg></div><span class="reel__play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5-13-7.5Z"/></svg></span><div class="reel__cap"><h4>'+L(r.t)+'</h4><p><span>'+L(r.s)+'</span><span>'+t("watch")+'</span></p></div></a>'; }).join("");
  reels=$$(".reel",track); lazy(track); updateReels();
}
function updateReels(){
  if(!reels.length) return;
  var tr=track.getBoundingClientRect(), mid=tr.left+tr.width/2;
  reels.forEach(function(el){ var r=el.getBoundingClientRect(), d=(r.left+r.width/2-mid)/tr.width; el.style.setProperty("--ry",clamp(-d*26,-22,22).toFixed(2)+"deg"); el.style.setProperty("--sc",(1-Math.min(Math.abs(d),0.6)*0.14).toFixed(3)); });
}
track.addEventListener("scroll",updateReels,{passive:true});
(function(){
  var dragging=false, sx=0, sl=0, moved=0;
  track.addEventListener("pointerdown",function(e){ if(e.pointerType!=="mouse") return; dragging=true; moved=0; sx=e.clientX; sl=track.scrollLeft; track.classList.add("is-drag"); });
  window.addEventListener("pointermove",function(e){ if(!dragging) return; var dx=e.clientX-sx; moved=Math.max(moved,Math.abs(dx)); track.scrollLeft=sl-dx; });
  window.addEventListener("pointerup",function(){ if(!dragging) return; dragging=false; track.classList.remove("is-drag"); });
  track.addEventListener("click",function(e){ if(moved>6){ e.preventDefault(); moved=0; } },true);
  var dir=function(){ return document.dir==="rtl"?-1:1; };
  $("#reelPrev").addEventListener("click",function(){ track.scrollBy({left:-track.clientWidth*0.6*dir(),behavior:"smooth"}); });
  $("#reelNext").addEventListener("click",function(){ track.scrollBy({left:track.clientWidth*0.6*dir(),behavior:"smooth"}); });
})();

/* story text (word light) */
var storyText=$("#storyText"), sWords=[], litN=-1;
function wrapStory(){ var words=storyText.textContent.trim().split(/\s+/); storyText.innerHTML=words.map(function(w){ return '<span class="w">'+w+'</span>'; }).join(" "); sWords=$$(".w",storyText); litN=-1; }

/* ======================= LANGUAGE ======================= */
var firstApply=true;
function applyLang(lang){
  LANG=lang; try{ localStorage.setItem("olga-lang",lang); }catch(e){}
  var h=document.documentElement; h.lang=lang; h.dir=lang==="ar"?"rtl":"ltr"; document.dir=h.dir;
  document.title=t("title"); var md=$('meta[name="description"]'); if(md) md.setAttribute("content",t("desc"));
  $$("[data-i]").forEach(function(el){
    var k=el.getAttribute("data-i"), v=t(k), wasIn=el.classList.contains("is-in");
    if(el.hasAttribute("data-html")) el.innerHTML=v; else el.textContent=v;
    if(el.hasAttribute("data-split")){ splitWords(el); if(wasIn||firstApply===false) { if(wasIn) el.classList.add("is-in"); } }
  });
  $$("[data-i-aria]").forEach(function(el){ el.setAttribute("aria-label",t(el.getAttribute("data-i-aria"))); });
  $$("[data-i-ph]").forEach(function(el){ el.setAttribute("placeholder",t(el.getAttribute("data-i-ph"))); });
  $("#langBtn").textContent=lang==="ar"?"EN":"عربي";
  $("#langBtn").setAttribute("aria-label",lang==="ar"?"Switch to English":"التبديل إلى العربية");
  var mlb=$("#menuLang"); if(mlb){ mlb.textContent=lang==="ar"?"EN":"عربي"; mlb.setAttribute("aria-label",$("#langBtn").getAttribute("aria-label")); }
  renderHero(); renderMarquee(); renderMisc(); renderFilters(); renderGrid(); renderSpreads(); renderReels(); wrapStory();
  if(typeof renderBag==="function"){ renderBag(); renderBadge(false); }
  if(typeof oCur!=="undefined" && oCur && o3d.classList.contains("is-open")) fill3DInfo();
  observeReveal(document);
  firstApply=false;
  if(typeof remeasure==="function") remeasure();
}
$("#langBtn").addEventListener("click",function(){
  if(window.OlgaLangFX && OlgaLangFX.busy()) return;
  var next=LANG==="ar"?"en":"ar", btn=this, y=window.scrollY;
  var swap=function(){
    applyLang(next);
    $$("[data-reveal],[data-split]").forEach(function(el){ var r=el.getBoundingClientRect(); if(r.top<window.innerHeight && r.bottom>0) el.classList.add("is-in"); });
    window.scrollTo(0,y);
  };
  /* OLGA signature transition: olive → golden drop → flag (JO / US) */
  if(window.OlgaLangFX) OlgaLangFX.play(next,swap,btn); else swap();
});

/* ======================= SCROLL HELPERS ======================= */
var LY={heroTop:0,heroH:1,essTop:0,essH:1,storyTop:0,storyH:1,contactTop:0,contactH:1,spTop:0,spH:1};
var vh=window.innerHeight, vw=window.innerWidth, sy=window.scrollY;
function scrollToEl(target,offset){
  var el=typeof target==="string"?$(target):target; if(!el) return;
  var top=el===document.body?0:el.getBoundingClientRect().top+window.scrollY-(offset===undefined?70:offset);
  window.scrollTo({top:Math.max(0,top),behavior:reduced?"auto":"smooth"});
}
function lockScroll(on){ document.body.classList.toggle("is-locked",on); setTimeout(function(){ updateBagFloat(false); },0); }
document.addEventListener("click",function(e){
  var a=e.target.closest("a[data-scroll],a[data-scroll-js]"); if(!a) return;
  var h=a.getAttribute("href"); if(!h||h.charAt(0)!=="#") return;
  e.preventDefault(); closeMenu(); closeBag();
  scrollToEl(h==="#top"?document.body:h, h==="#shop"?60:70);
});

/* ======================= HEADER ======================= */
var nav=$("#header"), lastY=window.scrollY, navSolid=null;
function updateNav(){
  var y=window.scrollY, heroEnd=LY.heroTop+LY.heroH-vh*0.6;
  var solid=y>heroEnd; if(solid!==navSolid){ navSolid=solid; nav.classList.toggle("is-solid",solid); }
  var hide=!fxHold && y>heroEnd+240 && y>lastY+2 && !document.body.classList.contains("is-locked");
  if(y<lastY-2||y<heroEnd) nav.classList.remove("is-hidden"); else if(hide) nav.classList.add("is-hidden");
  lastY=y; updateBagFloat(false);
}
(function(){ var msgs=$$(".bar__msg"), i=0; if(reduced||msgs.length<2) return; setInterval(function(){ if(document.hidden) return; var a=msgs[i]; a.classList.remove("is-on"); a.classList.add("is-out"); setTimeout(function(){ a.classList.remove("is-out"); },800); i=(i+1)%msgs.length; msgs[i].classList.add("is-on"); },4200); })();
var menu=$("#menu");
function openMenu(){ menu.classList.add("is-open"); menu.setAttribute("aria-hidden","false"); lockScroll(true); }
function closeMenu(){ if(!menu.classList.contains("is-open")) return; menu.classList.remove("is-open"); menu.setAttribute("aria-hidden","true"); lockScroll(false); }
$("#burger").addEventListener("click",openMenu);
$("#menuClose").addEventListener("click",closeMenu);
/* menu v9: language shortcut, featured photo, live "you are here" marker */
$("#menuLang").addEventListener("click",function(){ $("#langBtn").click(); });
(function(){
  var img=$("#menuFeatureImg"), I=window.OLGA&&OLGA.IMG; if(img&&I){ var s=I.ph_nabulsi||I.banner_olive; if(s) img.src=s; else img.parentNode.style.display="none"; }
  var links=$$(".menu__link[href^='#']"); if(!("IntersectionObserver" in window)||!links.length) return;
  var feat=$(".menu__feature"), map={}; links.concat(feat?[feat]:[]).forEach(function(a){ map[a.getAttribute("href")]=a; });
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; var k="#"+e.target.id; Object.keys(map).forEach(function(h){ map[h].classList.toggle("is-active",h===k); map[h].removeAttribute("aria-current"); }); if(map[k]) map[k].setAttribute("aria-current","location"); }); },{rootMargin:"-45% 0px -50% 0px"});
  Object.keys(map).forEach(function(h){ var s=document.querySelector(h); if(s) io.observe(s); });
})();
$("#searchBtn").addEventListener("click",function(){ scrollToEl("#shop",60); setTimeout(function(){ $("#q").focus({preventScroll:true}); },700); });

/* ---------------- HERO · animated advertising banner ----------------
   Each slide = full-bleed scene photo + the real product cut-out standing on the podium.
   The scene is a square laid out like object-fit:cover but steered so the podium lands
   where the layout wants it (side on desktop, centre stage on phones). */
var MOB=window.matchMedia("(max-width:900px)").matches;
var hero=$("#hero"), heroStage=$("#heroStage"), hbEl=$("#hb"), hbSlides=$("#hbSlides"), hbBars=$("#hbBars"), hbCount=$("#hbCount"), cue=$("#scrollCue");
var mqHeroMob=window.matchMedia("(max-width:760px), (max-aspect-ratio:4/5) and (max-width:1024px)");
var DIM={"nabulsi-900":[448,1000],"shea-900":[416,1000],"shea-300":[365,1000],"laurel-300":[400,1000],"laurel-900":[262,639],"moroccan":[535,264],"home-set":[900,794]};
var SLIDES=[
 {pid:"nabulsi",v:"nabulsi-900",bg:"banner_olive",p1:"nabulsi-900",p2:"nabulsi-900",x:.5,y:.79,w:.52,fx:"dust",acc:"#CFA866",k:"hb1k",t:"hb1t",d:"hb1d"},
 {pid:"shea",v:"shea-900",bg:"banner_shea",p1:"shea-900",p2:"shea-300",x:.534,y:.745,w:.58,fx:"dust",acc:"#C89C52",k:"hb2k",t:"hb2t",d:"hb2d"},
 {pid:"laurel",v:"laurel-300",bg:"banner_laurel",p1:"laurel-300",x:.497,y:.752,w:.55,fx:"bubble",acc:"#A3B278",k:"hb3k",t:"hb3t",d:"hb3d"},
 {pid:"moroccan",v:"moroccan-jar",bg:"banner_moroccan",p1:"moroccan",x:.5,y:.75,w:.47,fx:"ember",acc:"#C0394B",k:"hb4k",t:"hb4t",d:"hb4d",wide:true},
 {pid:"home-set",v:"home-set",bg:"banner_home",p1:"home-set",x:.503,y:.765,w:.84,fx:"dust",acc:"#CFA866",k:"hb5k",t:"hb5t",d:"hb5d",wide:true}
];
/* Autoplay every two seconds; arrows, bars and swipe still work manually. */
var HB_DUR=2000, hbI=0, hbEls=[], hbTimer=0, hbStart=0, hbLeft=HB_DUR, hbHold={}, hbBusy=false;
function fxDots(kind){
  var n=MOB?9:16, h="";
  for(var i=0;i<n;i++){ var d=kind==="bubble"?(8+Math.random()*22):(2+Math.random()*(kind==="ember"?4:6));
    h+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;--d:'+d.toFixed(1)+'px;--t:'+(7+Math.random()*9).toFixed(1)+'s;--dl:'+(-Math.random()*12).toFixed(1)+'s;--x:'+((Math.random()-.5)*120).toFixed(0)+'px;--o:'+(.35+Math.random()*.55).toFixed(2)+'"></i>'; }
  return h;
}
function slideHTML(s,i){
  var p=byId[s.pid], v=VAR[s.v]||curVar(p), sizes=p.variants.map(function(x){return L(x.size)}).join(" · ");
  var from=p.variants.length>1?'<small>'+t("hbFrom")+'</small>':'';
  return '<article class="hslide" data-k="'+i+'" data-fx="'+s.fx+'" data-pid="'+p.id+'" style="--acc:'+s.acc+'" aria-roledescription="slide" aria-label="'+(i+1)+' / '+SLIDES.length+'">'+
    '<div class="hslide__par"><div class="hslide__scene"><img class="hslide__bg" src="'+(IMG[s.bg]||"")+'" alt="" draggable="false" decoding="async">'+
      '<div class="hslide__prod"><div class="hslide__float"><span class="hslide__halo"></span><span class="hslide__glow"></span>'+
        (s.p2?'<img class="hslide__p2" src="'+CUT[s.p2]+'" alt="" draggable="false">':'')+
        '<img class="hslide__p1" src="'+CUT[s.p1]+'" alt="'+L(p.name)+'" draggable="false"></div></div></div></div>'+
    '<div class="hslide__veil"></div><div class="hslide__fx">'+fxDots(s.fx)+'</div>'+
    '<div class="hslide__copy">'+
      '<span class="hslide__badge"><i></i>'+t(s.k)+'</span>'+
      '<h2 class="hslide__title">'+t(s.t)+'</h2>'+
      '<p class="hslide__desc">'+t(s.d)+'</p>'+
      '<div class="hslide__meta"><span class="hslide__price">'+from+moneyTxt(p.variants[0].price).replace(t("cur"),'<span>'+t("cur")+'</span>')+'</span><span class="hslide__size">'+sizes+'</span></div>'+
      '<div class="hslide__cta">'+qctlHTML(v,true)+'<button type="button" class="btn btn--glass" data-quick="'+p.id+'"><span>'+t("hbMore")+'</span></button></div>'+
    '</div>'+
    '<div class="hslide__num">'+String(i+1).padStart(2,"0")+'</div>'+
  '</article>';
}
function renderHero(){
  hbSlides.innerHTML=SLIDES.map(slideHTML).join("");
  hbBars.innerHTML=SLIDES.map(function(s,i){ return '<button type="button" class="hb__bar" data-hb="'+i+'" aria-label="'+(i+1)+'"><span>'+L(byId[s.pid].name)+'</span><i></i></button>'; }).join("");
  hbEls=$$(".hslide",hbSlides);
  hbEls[hbI].classList.add("is-active");
  layoutHero(); hbBarsSet(); syncSteppers();
}
function layoutHero(){
  if(!hbEls.length) return;
  var W=hero.clientWidth||window.innerWidth, H=hero.clientHeight||window.innerHeight, mob=mqHeroMob.matches, rtl=document.dir==="rtl";
  var S=mob?Math.max(W,H*1.5):Math.max(W*1.25,H*1.25);
  var Tx=mob?.5:(rtl?.36:.64), Ty=mob?.62:.86, capH=mob?H*.4:H*.62, capW=mob?W*.86:W*.42;
  hbEls.forEach(function(el,i){
    var s=SLIDES[i];
    var sx=clamp(Tx*W-s.x*S,W-S,0), sy2=clamp(Ty*H-s.y*S,H-S,0);
    var sc=el.querySelector(".hslide__scene"); sc.style.setProperty("--S",S+"px"); sc.style.setProperty("--sx",sx.toFixed(1)+"px"); sc.style.setProperty("--sy",sy2.toFixed(1)+"px");
    var pr=el.querySelector(".hslide__prod"); pr.style.setProperty("--pX",(s.x*100)+"%"); pr.style.setProperty("--pY",(s.y*100)+"%");
    var d=DIM[s.p1], r=d[0]/d[1], podW=s.w*S, maxW=Math.min(capW,podW*(s.wide?.95:.5));
    var h1=Math.min(capH,maxW/r), w1=h1*r;
    var f=el.querySelector(".hslide__float"); f.style.setProperty("--h1",h1.toFixed(0)+"px");
    var p1=el.querySelector(".hslide__p1"); p1.style.height=h1.toFixed(0)+"px";
    var p2=el.querySelector(".hslide__p2");
    if(p2){ var d2=DIM[s.p2], h2=h1*(s.p2===s.p1?.7:.66), w2=h2*d2[0]/d2[1], off=(w1/2+w2/2)*.74*(mob||rtl?-1:-1);
      p2.style.height=h2.toFixed(0)+"px"; p2.style.left=off.toFixed(0)+"px"; }
    el.querySelector(".hslide__bg").style.setProperty("--px",(s.x*100)+"%");
  });
}
function hbBarsSet(){
  $$(".hb__bar",hbBars).forEach(function(b,i){ b.classList.remove("is-on"); b.classList.toggle("is-done",i<hbI); b.style.setProperty("--dur",HB_DUR+"ms"); });
  var cur=hbBars.children[hbI]; if(cur){ void cur.offsetWidth; cur.classList.add("is-on"); }
  hbCount.innerHTML="<b>"+String(hbI+1).padStart(2,"0")+"</b> / "+String(SLIDES.length).padStart(2,"0");
}
function hbGo(i,back){
  i=(i+SLIDES.length)%SLIDES.length; if(i===hbI||!hbEls.length) return;
  var prev=hbEls[hbI], next=hbEls[i];
  hbEls.forEach(function(el){ el.classList.remove("is-prev","is-enter","back"); });
  prev.classList.remove("is-active"); prev.classList.add("is-prev");
  next.classList.add("is-active");
  if(!reduced){ next.classList.add("is-enter"); if(back) next.classList.add("back"); }
  setTimeout(function(){ prev.classList.remove("is-prev"); next.classList.remove("is-enter","back"); },1400);
  hbI=i; hbLeft=HB_DUR; hbBarsSet(); hbSchedule();
}
function hbPausedNow(){ for(var k in hbHold) if(hbHold[k]) return true; return false; }
function hbSchedule(){
  clearTimeout(hbTimer); hbTimer=0;
  var p=hbPausedNow(); hbEl.classList.toggle("is-paused",p);
  if(p||reduced) return;
  hbStart=performance.now(); hbTimer=setTimeout(function(){ hbGo(hbI+1); },hbLeft);
}
function hbPause(k,on){
  if(!!hbHold[k]===on) return;
  if(on && hbTimer && !hbPausedNow()){ hbLeft=Math.max(400,hbLeft-(performance.now()-hbStart)); }
  hbHold[k]=on; hbSchedule();
}
hbBars.addEventListener("click",function(e){ var b=e.target.closest("[data-hb]"); if(b){ var i=+b.getAttribute("data-hb"); hbGo(i,i<hbI); } });
$("#hbNext").addEventListener("click",function(){ hbGo(hbI+1); });
$("#hbPrev").addEventListener("click",function(){ hbGo(hbI-1,true); });
/* Keep autoplay running under the mouse pointer; pause only for loading, swiping,
   an off-screen banner, a hidden tab, or the visitor's reduced-motion preference. */
document.addEventListener("visibilitychange",function(){ hbPause("tab",document.hidden); });
new IntersectionObserver(function(es){ hbPause("view",!es[0].isIntersecting); },{threshold:.2}).observe(hero);
(function(){ /* swipe */
  var x0=0,y0=0,on=false;
  hbEl.addEventListener("pointerdown",function(e){ if(e.target.closest("button,a")) return; on=true; x0=e.clientX; y0=e.clientY; hbPause("drag",true); },{passive:true});
  var end=function(e){ if(!on) return; on=false; hbPause("drag",false); var dx=e.clientX-x0, dy=e.clientY-y0;
    if(Math.abs(dx)>46 && Math.abs(dx)>Math.abs(dy)*1.2){ var fwd=document.dir==="rtl"?dx>0:dx<0; hbGo(hbI+(fwd?1:-1),!fwd); } };
  window.addEventListener("pointerup",end,{passive:true}); window.addEventListener("pointercancel",function(){ on=false; hbPause("drag",false); });
})();
mqHeroMob.addEventListener&&mqHeroMob.addEventListener("change",layoutHero);
function sizeHero(){ layoutHero(); }

/* ---------------- loader ---------------- */
var loader=$("#loader"), lBar=$("#loaderBar"), lPct=$("#loaderPct");
var shown=0, t0=performance.now(), loaderDone=false, heroReady=false;
(function(){ var im=new Image(); im.onload=im.onerror=function(){ heroReady=true; }; im.src=IMG.banner_olive||""; if(!IMG.banner_olive) heroReady=true; })();
function setLoader(v){ shown=v; lBar.style.setProperty("--s",v); lPct.textContent=String(Math.round(v*100)).padStart(3,"0"); }
function loaderTick(){
  if(loaderDone) return;
  var el=performance.now()-t0, target=heroReady?1:Math.min(.85,el/2400);
  setLoader(lerp(shown,target,0.12));
  if((heroReady && shown>0.97 && el>1700) || el>6000){
    loaderDone=true; setLoader(1);
    setTimeout(function(){ loader.classList.add("is-done"); document.body.classList.add("is-ready"); hbPause("load",false); },200);
    setTimeout(function(){ loader.style.display="none"; },1500);
    return;
  }
  requestAnimationFrame(loaderTick);
}
hbHold.load=true;
requestAnimationFrame(loaderTick);

/* scroll: the banner sinks and softens while the page rises over it */
var heroLastP=-1;
function updateHero(){
  var p=clamp(sy/Math.max(1,LY.heroH||vh),0,1);
  if(Math.abs(p-heroLastP)<0.0005) return false; heroLastP=p;
  if(p>=1){ heroStage.style.visibility="hidden"; return false; } heroStage.style.visibility="";
  if(!reduced) heroStage.style.transform="translate3d(0,"+(p*vh*0.42).toFixed(1)+"px,0) scale("+(1-p*0.08).toFixed(4)+")";
  heroStage.style.setProperty("--hp",p.toFixed(3));
  if(cue) cue.style.opacity=(1-clamp(p/0.08,0,1)).toFixed(3);
  return false;
}


/* ---------------- essence 3D soap ---------------- */
var ess=$("#essence"), essWord=$("#essWord"), ings=$$(".ingredient"), dots=$$(".essence__dots b"), essHalo=$("#essHalo");
var essP=0, essCur=0, essLast=-1, soap=null;
function updateEssence(){
  var total=LY.essH-vh;
  essP=clamp((sy-LY.essTop)/Math.max(1,total),0,1);
  if(!(sy < LY.essTop+LY.essH && sy+vh > LY.essTop)){ essCur=essP; return false; }
  essCur = reduced? essP : lerp(essCur,essP,ease(0.14));
  var moving=Math.abs(essCur-essP)>0.0005; if(!moving) essCur=essP;
  if(soap) soap.progress=essCur;
  if(Math.abs(essCur-essLast)<0.00005) return moving;
  essLast=essCur;
  var p=essCur, mobile=vw<=900||(vh<=640&&vw>vh);
  essWord.style.transform="translate3d(calc(-50% + "+((0.5-p)*40).toFixed(2)+"vw),-50%,0)";
  essHalo.style.opacity=(0.55+0.45*Math.sin(p*Math.PI)).toFixed(3);
  ings.forEach(function(el,i){
    var a=0.1+i*0.2, b=a+0.2, al;
    if(mobile){ al = Math.min(clamp((p-a)/0.05,0,1), i===3?1:clamp((b-p)/0.05,0,1)); }
    else { al = clamp((p-a)/0.06,0,1); }
    el.style.opacity=al.toFixed(3);
    var ty=((1-al)*30).toFixed(1);
    el.style.transform = mobile ? "translate3d(-50%,"+ty+"px,0)" : "translate3d(0,"+ty+"px,0)";
    dots[i].style.transform="scaleX("+clamp((p-a)/0.2,0,1).toFixed(3)+")";
  });
  return moving;
}
function initSoap(){
  var canvas=$("#soapCanvas");
  var fallback=function(){ canvas.style.display="none"; var fb=$("#soapFallback"); fb.src=IMG.ig_hero_still; fb.classList.add("is-loaded"); fb.style.display="block"; };
  if(!window.THREE){ fallback(); return; }
  var T=window.THREE, renderer;
  try{ renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,powerPreference:"high-performance"}); }catch(e){ fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MOB?1:1.5));
  if("outputEncoding" in renderer) renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=0.92;
  var scene=new T.Scene(), cam=new T.PerspectiveCamera(30,1,0.1,100); cam.position.set(0,0,10.5);

  // rounded bar geometry
  var W=3.2,H=2.1,R=0.42, shape=new T.Shape(), x=-W/2, y=-H/2;
  shape.moveTo(x+R,y); shape.lineTo(x+W-R,y); shape.quadraticCurveTo(x+W,y,x+W,y+R); shape.lineTo(x+W,y+H-R); shape.quadraticCurveTo(x+W,y+H,x+W-R,y+H);
  shape.lineTo(x+R,y+H); shape.quadraticCurveTo(x,y+H,x,y+H-R); shape.lineTo(x,y+R); shape.quadraticCurveTo(x,y,x+R,y);
  var geo=new T.ExtrudeGeometry(shape,{depth:0.95,bevelEnabled:true,bevelThickness:0.26,bevelSize:0.22,bevelSegments:10,curveSegments:28});
  geo.center(); geo.computeBoundingBox();
  var bb=geo.boundingBox, bw=bb.max.x-bb.min.x, bh=bb.max.y-bb.min.y, pos=geo.attributes.position, uv=geo.attributes.uv;
  var nrm=geo.attributes.normal; for(var i=0;i<pos.count;i++){ var u=(pos.getX(i)-bb.min.x)/bw; if(nrm && nrm.getZ(i)<-0.5) u=1-u; uv.setXY(i,u,(pos.getY(i)-bb.min.y)/bh); }
  uv.needsUpdate=true;

  // procedural stamped texture
  var TW=1400, TH=Math.round(TW*bh/bw);
  function makeTex(bump){
    var c=document.createElement("canvas"); c.width=TW; c.height=TH; var g=c.getContext("2d");
    if(bump){ g.fillStyle="#8A8A8A"; g.fillRect(0,0,TW,TH); }
    else{
      var gr=g.createLinearGradient(0,0,TW,TH); gr.addColorStop(0,"#F1E2C8"); gr.addColorStop(.5,"#E4CFAC"); gr.addColorStop(1,"#D5BB8E");
      g.fillStyle=gr; g.fillRect(0,0,TW,TH);
    }
    // natural speckle
    for(var k=0;k<9000;k++){
      var a=Math.random();
      g.fillStyle = bump ? "rgba("+(a>.5?160:110)+","+(a>.5?160:110)+","+(a>.5?160:110)+","+(Math.random()*.35)+")" : "rgba("+(a>.5?255:150)+","+(a>.5?248:120)+","+(a>.5?225:60)+","+(Math.random()*.10)+")";
      var r=Math.random()*2.2; g.beginPath(); g.arc(Math.random()*TW,Math.random()*TH,r,0,7); g.fill();
    }
    var stamp = bump ? "#222222" : "rgba(53,69,45,.72)", hi = bump? "#222222" : "rgba(251,241,224,.75)";
    var cx=TW/2, cy=TH/2;
    function drawStamp(col,dx,dy){
      g.save(); g.translate(dx,dy); g.strokeStyle=col; g.fillStyle=col;
      g.lineWidth=TW*0.006; var ix=TW*0.2, iy=TH*0.2;
      rr(g,ix,iy,TW-ix*2,TH-iy*2,TH*0.12); g.stroke();
      g.lineWidth=TW*0.0025; rr(g,ix+TW*0.018,iy+TW*0.018,TW-ix*2-TW*0.036,TH-iy*2-TW*0.036,TH*0.1); g.stroke();
      drawLogo(g,cx,cy-TH*0.03,TH*0.3); g.textAlign="center"; g.textBaseline="middle";
      g.font="600 "+Math.round(TH*0.04)+"px 'Readex Pro', sans-serif";
      if("letterSpacing" in g) g.letterSpacing=Math.round(TH*0.02)+"px";
      g.fillText("NABULSI · EXTRACTED FROM NATURAL OILS",cx,cy+TH*0.17);
      leaf(g,cx-TW*0.2,cy-TH*0.02,TH*0.12,-1); leaf(g,cx+TW*0.2,cy-TH*0.02,TH*0.12,1);
      g.restore();
    }
    if(!bump) drawStamp(hi,-2,-2);
    drawStamp(stamp,0,0);
    var t=new T.CanvasTexture(c);
    if(!bump && "encoding" in t) t.encoding=T.sRGBEncoding;
    t.anisotropy=renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function leaf(g,x,y,s,dir){
    g.save(); g.translate(x,y); g.scale(dir,1);
    g.lineWidth=s*0.06; g.beginPath(); g.moveTo(-s*0.9,s*0.2); g.quadraticCurveTo(0,-s*0.2,s*0.9,-s*0.1); g.stroke();
    for(var j=0;j<4;j++){ var lx=-s*0.6+j*s*0.42; g.beginPath(); g.ellipse(lx,-s*0.1,s*0.26,s*0.09,-0.6,0,7); g.fill(); g.beginPath(); g.ellipse(lx+s*0.12,s*0.12,s*0.24,s*0.08,0.6,0,7); g.fill(); }
    g.restore();
  }
  var mat=new T.MeshPhysicalMaterial({map:makeTex(false),bumpMap:makeTex(true),bumpScale:0.05,roughness:0.66,metalness:0,clearcoat:0.2,clearcoatRoughness:0.55,sheen:0.5,sheenRoughness:0.6,sheenColor:new T.Color("#F6E2C1")});
  var bar=new T.Mesh(geo,mat), group=new T.Group(); group.add(bar); scene.add(group);

  // ingredient orbs
  var orbCols=["#C89B4F","#4D713B","#E9D8BA","#8E2A35"], orbs=[];
  orbCols.forEach(function(col,i){
    var m=new T.Mesh(new T.SphereGeometry(0.2,40,40), new T.MeshPhysicalMaterial({color:col,roughness:0.12,metalness:0.05,clearcoat:1,clearcoatRoughness:0.05,transmission:i===0?0.45:0,thickness:0.5,emissive:new T.Color(col),emissiveIntensity:0.12}));
    m.scale.setScalar(0.001); scene.add(m); orbs.push(m);
  });
  // gold dust
  var pg=new T.BufferGeometry(), pc=520, arr=new Float32Array(pc*3);
  for(var q=0;q<pc;q++){ var rr2=3+Math.random()*5, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1); arr[q*3]=rr2*Math.sin(ph)*Math.cos(th); arr[q*3+1]=rr2*Math.sin(ph)*Math.sin(th)*0.7; arr[q*3+2]=rr2*Math.cos(ph)-2; }
  pg.setAttribute("position",new T.BufferAttribute(arr,3));
  var dust=new T.Points(pg,new T.PointsMaterial({color:"#DFC292",size:0.035,transparent:true,opacity:0.8,blending:T.AdditiveBlending,depthWrite:false}));
  scene.add(dust);

  scene.add(new T.HemisphereLight(0xfff0d0,0x4a3418,0.5));
  var key=new T.DirectionalLight(0xffdfa0,1.7); key.position.set(4,5,7); scene.add(key);
  var rim=new T.DirectionalLight(0xe6b955,3.2); rim.position.set(-6,2,-5); scene.add(rim);
  var fill=new T.PointLight(0xa7b37e,0.6,30); fill.position.set(-4,-3,4); scene.add(fill);

  var looping=false, visible=false, mouseX=0, mouseY=0, start=performance.now();
  soap={progress:0,visible:false};
  new IntersectionObserver(function(e){visible=e[0].isIntersecting; if(visible&&!looping){ looping=true; requestAnimationFrame(loop); }},{rootMargin:"100px"}).observe(ess);
  window.addEventListener("pointermove",function(e){mouseX=e.clientX/window.innerWidth-.5;mouseY=e.clientY/window.innerHeight-.5},{passive:true});
  function resize(){ var w=canvas.clientWidth,h=canvas.clientHeight; renderer.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); }
  window.addEventListener("resize",resize); resize();
  var sm=0;
  function loop(){
    if(!visible){ looping=false; return; }
    requestAnimationFrame(loop);
    var t=(performance.now()-start)/1000, p=soap.progress, mobile=canvas.clientWidth<=900;
    sm=lerp(sm,p,ease(0.1));
    var intro=clamp(sm/0.1,0,1), e=1-Math.pow(1-intro,3);
    var asp=canvas.clientWidth/Math.max(1,canvas.clientHeight); var sc=Math.min(0.92,asp*0.98)*(0.7+0.3*e);
    group.scale.setScalar(sc);
    group.position.y=(mobile?0.55:-0.1)+Math.sin(t*1.1)*0.06;
    group.rotation.y=-0.55+sm*Math.PI*2.2+mouseX*0.25;
    group.rotation.x=-0.5+Math.sin(sm*Math.PI)*0.45+mouseY*0.15;
    group.rotation.z=0.08*Math.sin(t*0.6);
    orbs.forEach(function(o,i){
      var a=0.1+i*0.2, on=clamp((sm-a)/0.08,0,1), ang=t*0.5+i*Math.PI/2, rad=(mobile?1.75:2.6)+Math.sin(t+i)*0.08;
      o.scale.setScalar(Math.max(0.001,on)*(mobile?0.8:1));
      o.position.set(Math.cos(ang)*rad,(mobile?0.55:-0.1)+Math.sin(ang*1.3)*0.55,Math.sin(ang)*rad*0.6);
    });
    dust.rotation.y=t*0.03; dust.rotation.x=Math.sin(t*0.1)*0.05;
    renderer.render(scene,cam);
  }
}


/* ================= Olga · Oil-to-Bag FX v25 — mobile-first rewrite =================
   The product is lifted into a glowing orb half-filled with olive oil, flies into the bag
   and drips oil on the way. v25 engine:
   - ONE shared rAF loop drives every flight and every particle (no competing loops)
   - orbs move with transform / opacity only: no layout, no repaint per frame
   - oil drops and sparks are pre-rendered sprites (one drawImage each), physics are
     time based (same speed at 30, 60 or 120 Hz), only the dirty area is cleared
   - particle budget scales with the device and with the frame rate it actually gets
   - the canvas is hidden while idle and never re-allocated while scrolling */
var fxHold=0;
var OFX=(function(){
  var mob=!!(window.OLGA_GOV&&OLGA_GOV.mob) || window.matchMedia("(max-width:760px)").matches;
  var lowEnd=(navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=3;
  var BUDGET=mob?(lowEnd?55:85):240, MAXFLY=mob?3:5, PUDMAX=mob?4:10;
  var OIL=["#A47A33","#B78B41","#C69A51","#4D8133","#CFA763","#A97E37"];
  var GLOW=["#FAEFDB","#DFC292","#E9CFA4","#C5D0A5","#FCF7ED"];
  var rnd=function(a,b){return a+Math.random()*(b-a)}, ri=function(n){return Math.random()*n|0};
  var easeIO=function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}, easeOut=function(t){return 1-Math.pow(1-t,3)};
  var cv=null,cx=null,DPR=1,W=0,H=0,parts=[],flights=[],running=false,lastT=0,ema=16.7,dirty=null,puddles=0;
  var SPR={d:[],s:[]};
  function mkC(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c}
  function rgba(hex,a){var n=parseInt(hex.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"}
  function sprites(){
    if(SPR.d.length) return;
    OIL.forEach(function(col){ /* teardrop: tail at the left, head (r=7) centred at 31,9 — drawn at 2x for crisp phones */
      var c=mkC(80,36),g=c.getContext("2d"); g.scale(2,2);
      g.fillStyle=col; g.beginPath(); g.moveTo(2,9); g.quadraticCurveTo(22,1.9,31,2); g.arc(31,9,7,-Math.PI/2,Math.PI/2); g.quadraticCurveTo(22,16.1,2,9); g.fill();
      g.globalAlpha=.35; g.fillStyle="#345B21"; g.beginPath(); g.arc(31.7,11.4,4.9,0,Math.PI); g.fill();
      g.globalAlpha=.85; g.fillStyle="#FBF3E4"; g.beginPath(); g.ellipse(32.8,6.2,2.7,1.5,0,0,6.283); g.fill();
      SPR.d.push(c); });
    GLOW.forEach(function(col){
      var c=mkC(32,32),g=c.getContext("2d"),gr=g.createRadialGradient(16,16,0,16,16,16);
      gr.addColorStop(0,col); gr.addColorStop(.3,col); gr.addColorStop(.38,rgba(col,.32)); gr.addColorStop(1,rgba(col,0));
      g.fillStyle=gr; g.fillRect(0,0,32,32); SPR.s.push(c); });
  }
  function size(){
    var w=window.innerWidth, h=Math.max(window.innerHeight, document.documentElement.clientHeight||0);
    if(cv && w===W && h<=H && h>H-140) return;             /* URL-bar show/hide never re-allocates the canvas */
    W=w; H=h+(mob?80:0); DPR=Math.min(window.devicePixelRatio||1, mob?1.5:2);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR); cv.style.width=W+"px"; cv.style.height=H+"px"; dirty=null;
  }
  function ensure(){
    if(!cv){ cv=document.createElement("canvas"); cv.className="ofx-cv"; cv.setAttribute("aria-hidden","true"); document.body.appendChild(cv); cx=cv.getContext("2d"); sprites(); }
    size();
  }
  /* quality: emission scales down when the phone is struggling */
  function q(){ return ema>34?.35:(ema>24?.65:1); }
  function drop(x,y,vx,vy,big,life){
    if(parts.length>=BUDGET) return;
    parts.push({k:0,x:x,y:y,vx:vx,vy:vy,r:big?rnd(2.8,5):rnd(1.4,3),s:ri(SPR.d.length),l:0,m:life||(mob?rnd(.8,1.25):rnd(1.1,1.7))});
  }
  function spark(x,y,sp){
    if(parts.length>=BUDGET || (mob&&Math.random()<.4)) return;
    var a=rnd(0,6.283),v=rnd(40,sp*60);
    parts.push({k:1,x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:rnd(1,2.5),s:ri(SPR.s.length),l:0,m:mob?rnd(.35,.7):rnd(.5,1)});
  }
  function puddle(x,y,r){ if(puddles>=PUDMAX) return; puddles++; parts.push({k:2,x:x,y:y,r:1.5,max:r,c:OIL[ri(OIL.length)],l:0,m:mob?.9:1.3}); }
  function burst(x,y,ns,nd,sp){ var f=q(); ns=Math.round(ns*f); nd=Math.round(nd*f);
    for(var i=0;i<ns;i++) spark(x,y,sp); for(i=0;i<nd;i++) drop(x+rnd(-14,14),y+rnd(-6,6),rnd(-220,220),rnd(-380,-80),false); }
  function ring(x,y,s,delay){ var el=document.createElement("div"); el.className="ofx-ring"; el.style.left=x+"px"; el.style.top=y+"px"; el.style.width=el.style.height=s+"px"; if(delay) el.style.animationDelay=delay+"ms"; document.body.appendChild(el); setTimeout(function(){el.remove()},1000+(delay||0)); }
  function pulse(el,cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function buzz(p){ if(navigator.vibrate) try{navigator.vibrate(p)}catch(_){} }

  /* ---------- the one loop ---------- */
  function kick(){ if(!running){ running=true; lastT=0; cv.style.display="block"; requestAnimationFrame(loop); } }
  function loop(now){
    var dt=lastT?Math.min(.05,(now-lastT)/1000):1/60; lastT=now; ema=ema*.9+dt*1000*.1;
    for(var f=flights.length-1;f>=0;f--){ if(flights[f].step(now,dt)===false) flights.splice(f,1); }
    /* clear only what was drawn last frame */
    cx.setTransform(1,0,0,1,0,0);
    if(dirty) cx.clearRect(Math.max(0,dirty[0]*DPR-2),Math.max(0,dirty[1]*DPR-2),(dirty[2]-dirty[0])*DPR+4,(dirty[3]-dirty[1])*DPR+4);
    else cx.clearRect(0,0,cv.width,cv.height);
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9, floor=window.innerHeight-3, g=1500*dt, dmp=Math.pow(.4,dt), dmp2=Math.pow(.55,dt);
    for(var i=parts.length-1;i>=0;i--){ var p=parts[i]; p.l+=dt; var k=p.l/p.m;
      if(k>=1){ if(p.k===2) puddles--; parts[i]=parts[parts.length-1]; parts.pop(); continue; }
      var a=Math.min(1,(1-k)*1.5), e;
      if(p.k===2){ p.r+=(p.max-p.r)*Math.min(1,dt*11);
        cx.setTransform(DPR,0,0,DPR,0,0); cx.globalAlpha=a*.55; cx.fillStyle=p.c; cx.beginPath(); cx.ellipse(p.x,p.y,p.r,p.r*.26,0,0,6.283); cx.fill();
        e=p.r+2;
      } else if(p.k===0){
        p.vy+=g; p.vx*=dmp; p.x+=p.vx*dt; p.y+=p.vy*dt;
        if(p.y>floor){ puddle(p.x,floor,rnd(8,17)*(p.r/3)); if(!mob&&parts.length<BUDGET){ parts.push({k:0,x:p.x,y:floor-3,vx:rnd(-90,90),vy:rnd(-200,-80),r:p.r*.4,s:p.s,l:0,m:.35}); } parts[i]=parts[parts.length-1]; parts.pop(); continue; }
        var sp=Math.sqrt(p.vx*p.vx+p.vy*p.vy), s=p.r/7*DPR*.5, st=Math.min(1.55,.55+sp/700), c=p.vx/(sp||1), sn=p.vy/(sp||1);
        if(!sp){c=0;sn=1}
        cx.setTransform(c*s*st,sn*s*st,-sn*s,c*s,p.x*DPR,p.y*DPR); cx.globalAlpha=a*.95; cx.drawImage(SPR.d[p.s],-62,-18);
        e=p.r*(2+st*3);
      } else {
        p.vy+=180*dt; p.vx*=dmp2; p.vy*=dmp2; p.x+=p.vx*dt; p.y+=p.vy*dt;
        var z=p.r*2.8/16*DPR; cx.setTransform(z,0,0,z,p.x*DPR,p.y*DPR); cx.globalAlpha=a; cx.drawImage(SPR.s[p.s],-16,-16);
        e=p.r*2.9;
      }
      if(p.x-e<x0)x0=p.x-e; if(p.y-e<y0)y0=p.y-e; if(p.x+e>x1)x1=p.x+e; if(p.y+e>y1)y1=p.y+e;
    }
    cx.globalAlpha=1;
    dirty=x1>x0?[x0,y0,x1,y1]:null;
    if(parts.length||flights.length) requestAnimationFrame(loop);
    else { running=false; cx.setTransform(1,0,0,1,0,0); cx.clearRect(0,0,cv.width,cv.height); dirty=null; cv.style.display="none"; }
  }
  function target(){
    var fb=document.querySelector(".bag-float.is-on"); if(fb){ var q2=fb.getBoundingClientRect(); return {x:q2.left+q2.width/2,y:q2.top+q2.height/2,el:fb}; }
    var b=$("#bagBtn"), r=b&&b.getBoundingClientRect();
    if(r&&r.width&&r.bottom>0) return {x:r.left+r.width/2,y:r.top+r.height/2,el:b};
    return {x:window.innerWidth-40,y:36,el:null};
  }
  function makeOrb(src,D,back){
    var orb=document.createElement("div"); orb.className="ofx-orb"+(back?" ofx-orb--back":"");
    orb.style.width=orb.style.height=D+"px";
    var im=document.createElement("img"); im.alt=""; im.decoding="sync"; im.src=src; orb.appendChild(im);
    var oil=document.createElement("i"); oil.className="ofx-oil"; orb.appendChild(oil);
    return orb;
  }
  function place(orb,x,y,D,rot,sc,op){ orb.style.transform="translate3d("+(x-D/2).toFixed(1)+"px,"+(y-D/2).toFixed(1)+"px,0) rotate("+rot.toFixed(1)+"deg) scale("+sc.toFixed(3)+")"; if(op!==undefined) orb.style.opacity=op.toFixed(3); }
  function begin(hold){ if(hold){ fxHold++; nav.classList.remove("is-hidden"); } if(window.OLGA_GOV) OLGA_GOV.busy(1); }
  function end(hold){ if(hold) fxHold=Math.max(0,fxHold-1); if(window.OLGA_GOV) OLGA_GOV.busy(-1); }

  /* product -> bag */
  function fly(rect,imgSrc,btn,done,to){
    if(btn) pulse(btn,"ofx-press");
    if(reduced||!imgSrc||flights.length>=MAXFLY){ pulse(bagCount,"ofx-pop"); buzz(10); done&&done(); return; }
    ensure(); var hold=!to; begin(hold);
    var r=rect&&rect.width?rect:{left:window.innerWidth/2-60,top:window.innerHeight*.35-75,width:120,height:150};
    var near=!!to, TG=to||target;
    var D=near?Math.max(54,Math.min(76,r.width*.7)):(mob?68:Math.max(76,Math.min(108,r.width*.42)));
    var sx=r.left+r.width/2, sy=r.top+r.height/2, s0=Math.max(.8,Math.min(2.1,Math.min(r.width,r.height)/D));
    var T1=near?260:(mob?300:420), T2=near?560:(mob?640:900), t0=performance.now(), lx=sx, ly=sy-16, acc=0, c1x=0, c1y=0, init=false;
    var orb=makeOrb(imgSrc,D,false); place(orb,sx,sy,D,0,s0,0); document.body.appendChild(orb);
    burst(sx,sy,mob?10:24,mob?6:14,7);
    buzz(8);
    flights.push({step:function(now,dt){
      var e=now-t0;
      if(e<T1){ var k=easeOut(e/T1); place(orb,sx,sy-k*16,D,0,s0+(1-s0)*k+Math.sin(k*Math.PI)*.1,Math.min(1,e/110)); return; }
      var tg=TG();
      if(!init){ init=true; c1x=sx+(tg.x-sx)*.15; c1y=Math.max(80,Math.min(sy,tg.y+200)-Math.max(150,window.innerHeight*.26)); }
      var k2=Math.min((e-T1)/T2,1), qq=easeIO(k2), u=1-qq;
      var ix=u*u*sx+2*u*qq*c1x+qq*qq*tg.x, iy=u*u*(sy-16)+2*u*qq*c1y+qq*qq*tg.y;
      var vx=(ix-lx)/Math.max(dt,.008), vy=(iy-ly)/Math.max(dt,.008); lx=ix; ly=iy;
      var sc=1-qq*.72, tilt=Math.max(-50,Math.min(50,vx*.035))+Math.sin(k2*9)*5;
      place(orb,ix,iy,D,tilt,sc,1);
      /* oil dripping from the orb's lower rim, trailing behind its motion */
      if(k2<.88){ acc+=dt*(mob?26:95)*q(); var rr=D*sc*.45;
        while(acc>=1){ acc--; drop(ix+rnd(-rr*.55,rr*.55),iy+rr*.78,-vx*.2+rnd(-50,50),-vy*.1+rnd(15,110),Math.random()<.22); } }
      if(Math.random()<(mob?.25:.6)) spark(ix+rnd(-8,8),iy+rnd(-8,8),2.2);
      if(k2<1) return;
      /* arrival */
      var a=orb.animate([{opacity:1,transform:orb.style.transform},{opacity:0,transform:"translate3d("+(tg.x-D/2).toFixed(1)+"px,"+(tg.y-D/2).toFixed(1)+"px,0) scale(0)"}],{duration:200,easing:"cubic-bezier(.6,0,.9,.3)",fill:"forwards"});
      a.onfinish=function(){ orb.remove(); }; setTimeout(function(){ orb.isConnected&&orb.remove(); },400);
      ring(tg.x,tg.y,near?70:90,0); if(!mob&&!near) ring(tg.x,tg.y,140,90);
      burst(tg.x,tg.y,mob?14:40,mob?4:12,8);
      if(tg.el) pulse(tg.el,tg.cls||"ofx-hit");
      pulse(bagCount,"ofx-pop"); buzz([12,40,18]);
      end(hold); done&&done();
      return false;
    }});
    kick();
  }
  /* bag -> back to its place on the card */
  function back(dest,imgSrc,btn,done,from){
    if(btn) pulse(btn,"ofx-press");
    if(reduced||!imgSrc||flights.length>=MAXFLY){ buzz(8); done&&done(); return; }
    ensure(); var hold=!from, SRC=from||target; begin(hold);
    var d0=dest(), r0=d0.r&&d0.r.width?d0.r:{left:window.innerWidth/2-60,top:window.innerHeight*.45-75,width:120,height:150};
    var near=!hold, D=near?Math.max(54,Math.min(76,r0.width*.7)):(mob?64:Math.max(72,Math.min(104,r0.width*.42)));
    var s=SRC(); if(s.el) pulse(s.el,s.cls||"ofx-out");
    ring(s.x,s.y,near?66:90,0);
    burst(s.x,s.y,near?10:(mob?10:22),0,5); buzz(10);
    var T0=near?160:200, T1=near?520:(mob?600:860), T2=near?300:(mob?300:420), t0=performance.now(), bx=s.x, by=s.y, lx=bx, ly=by, cxp=0, cyp=0, started=false, landed=false, acc=0;
    var orb=makeOrb(imgSrc,D,true); place(orb,bx,by,D,0,.05,1); document.body.appendChild(orb);
    function cur(){ var d=dest(); return d.r&&d.r.width?d:{r:r0,el:null}; }
    flights.push({step:function(now,dt){
      var e=now-t0;
      if(e<T0){ s=SRC(); bx=s.x; by=s.y; lx=bx; ly=by; place(orb,bx,by,D,0,.05+easeOut(e/T0)*.27,1); return; }
      var d=cur(), r=d.r, ex=r.left+r.width/2, ey=r.top+r.height/2;
      if(!started){ started=true; cxp=bx+(ex-bx)*.85; cyp=Math.max(60,Math.min(by,ey)-(near?70:Math.max(130,window.innerHeight*.2))); }
      var e1=e-T0;
      if(e1<T1){ var k2=e1/T1, qq=easeIO(k2), u=1-qq;
        var ix=u*u*bx+2*u*qq*cxp+qq*qq*ex, iy=u*u*by+2*u*qq*cyp+qq*qq*ey;
        var vx=(ix-lx)/Math.max(dt,.008), vy=(iy-ly)/Math.max(dt,.008); lx=ix; ly=iy;
        var sc=.32+qq*.68; place(orb,ix,iy,D,Math.max(-45,Math.min(45,vx*.035))+Math.sin(k2*8)*4,sc,1);
        if(k2<.9){ acc+=dt*(mob?16:60)*q(); var rr=D*sc*.45; while(acc>=1){ acc--; drop(ix+rnd(-rr*.5,rr*.5),iy+rr*.78,-vx*.18+rnd(-45,45),-vy*.1+rnd(15,95),Math.random()<.18); } }
        if(Math.random()<(mob?.2:.5)) spark(ix+rnd(-8,8),iy+rnd(-8,8),2);
        return;
      }
      var k3=Math.min((e1-T1)/T2,1), m=easeOut(k3), full=Math.max(1,Math.min(2.4,Math.min(r.width,r.height)/D));
      if(!landed){ landed=true; orb.classList.add("is-land");
        burst(ex,ey,near?12:(mob?12:28),0,5);
        var nd=Math.round((near?4:(mob?4:10))*q()); for(var g2=0;g2<nd;g2++) drop(ex+rnd(-r.width*.25,r.width*.25),r.top+r.height*.82,rnd(-180,180),rnd(-300,-60),false);
        if(!near&&!mob) puddle(ex,Math.min(window.innerHeight-4,r.top+r.height*.9),Math.min(70,r.width*.42));
      }
      place(orb,ex,ey,D,0,1+(full-1)*m,1-m*m);
      if(k3<1) return;
      orb.remove();
      if(d.el) pulse(d.el,"ofx-land");
      end(hold); done&&done();
      return false;
    }});
    kick();
  }
  return {fly:fly,back:back};
})();


/* ======================= BAG ======================= */
var bag={}; try{ bag=JSON.parse(localStorage.getItem("olga-bag2")||"{}")||{}; }catch(e){ bag={}; }
function cleanBag(){ Object.keys(bag).forEach(function(k){ if(!VAR[k]||!(bag[k]>0)) delete bag[k]; }); }
cleanBag();
var step="bag";
var drawer=$("#drawer"), overlay=$("#overlay"), dBody=$("#drawerBody"), dFoot=$("#drawerFoot"), bagCount=$("#bagCount");
function save(){ try{ localStorage.setItem("olga-bag2",JSON.stringify(bag)); }catch(e){} }
function countItems(){ return Object.keys(bag).reduce(function(s,k){ return s+bag[k]; },0); }
function subtotal(){ return Object.keys(bag).reduce(function(s,k){ return s+bag[k]*VAR[k].price; },0); }
function syncSteppers(changed){
  $$("[data-qctl]").forEach(function(box){
    var id=box.getAttribute("data-qctl"), q=bag[id]||0, on=q>0, n=box.querySelector(".qstep__n b"), was=box.classList.contains("in-bag");
    box.classList.toggle("in-bag",on);
    if(n && n.textContent!==String(q)){ n.textContent=q; if(on&&was&&changed===id){ n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick"); } }
    var card=box.closest(".pcard"); if(card) card.classList.toggle("is-in-bag",on);
  });
}
var bagFloat=document.createElement("button"); bagFloat.className="bag-float"; bagFloat.type="button"; bagFloat.setAttribute("aria-label","Bag");
bagFloat.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="bag-float__n">0</span>';
document.body.appendChild(bagFloat); var bagFloatN=bagFloat.querySelector(".bag-float__n");
bagFloat.addEventListener("click",function(){ openBag(); });
function updateBagFloat(bump){
  var show=countItems()>0 && nav.classList.contains("is-hidden") && !document.body.classList.contains("is-locked");
  bagFloat.classList.toggle("is-on",show);
  if(bump&&show){ bagFloat.classList.remove("ofx-hit"); void bagFloat.offsetWidth; bagFloat.classList.add("ofx-hit"); }
}
function renderBadge(bump,changed){
  var n=countItems(); bagCount.textContent=n; bagCount.classList.toggle("has",n>0);
  if(bump){ bagCount.classList.remove("bump"); void bagCount.offsetWidth; bagCount.classList.add("bump"); }
  $("#drawerCount").textContent=n?"("+n+" "+(n===1?t("item"):t("items"))+")":"";
  bagFloatN.textContent=n; updateBagFloat(bump); syncSteppers(changed);
}
function thumbOf(v){ return THUMBS[v.cut]||CUT[v.cut]||""; }
function totalsHTML(){ var fee=step==="checkout"?deliveryFee(CK.city):null; return '<div class="totals"><div><span>'+t("subtotal")+'</span><span>'+moneyTxt(subtotal())+'</span></div><div><span>'+t("delivery")+'</span><span>'+(fee===null?t("deliveryV"):moneyTxt(fee))+'</span></div><div class="grand"><span>'+t("total")+'</span><span>'+moneyTxt(subtotal()+(fee||0))+'</span></div></div>'; }
function updTotals(){ var tt=dFoot&&dFoot.querySelector(".totals"); if(tt) tt.outerHTML=totalsHTML(); }
function renderBag(){
  var ids=Object.keys(bag);
  if(!ids.length && step!=="done"){
    step="bag";
    dBody.innerHTML='<div class="empty">'+LOGO_SVG+'<strong>'+t("emptyT")+'</strong><p>'+t("emptyP")+'</p></div>';
    dFoot.innerHTML='<button class="btn btn--block" type="button" data-goto="#shop">'+t("explore")+'</button>'; return;
  }
  if(step==="done"){
    var lo=(typeof ORD!=="undefined")?ORD.last:null, oid=lo&&lo.id?'<b class="ord-no" dir="ltr">#'+ckEsc(String(lo.id))+'</b>':"";
    dBody.innerHTML='<div class="empty">'+LOGO_SVG+'<strong>'+t("thanksT")+'</strong><p>'+t("thanksP").replace("{id}",oid)+'</p>'+(lo&&lo.total!=null?'<p class="ord-sum">'+t("totalDel")+': <b>'+moneyTxt(+lo.total)+'</b></p>':'')+'</div>';
    dFoot.innerHTML='<button class="btn btn--block" type="button" id="doneBtn">'+t("contShop")+'</button>'; return;
  }
  if(step==="checkout"){
    dBody.innerHTML=checkoutHTML();
    dFoot.innerHTML=totalsHTML()+'<button class="btn btn--olive btn--block" type="button" id="sendOrder">'+t("sendOrder")+'</button><p class="note">'+t("feeNote")+'</p>'; return;
  }
  var h=ids.map(function(id){ var v=VAR[id], p=v.p; return '<div class="line-item"><div class="line-item__img"><img src="'+thumbOf(v)+'" alt=""></div><div><h4>'+L(p.name)+'</h4><div class="meta">'+L(v.size)+'</div><div class="qty"><button type="button" data-dec="'+id+'" aria-label="−">−</button><span>'+bag[id]+'</span><button type="button" data-inc="'+id+'" aria-label="+">+</button></div></div><div class="line-item__right"><b>'+moneyTxt(v.price*bag[id])+'</b><button type="button" class="remove" data-rm="'+id+'">'+t("remove")+'</button></div></div>'; }).join("");
  var inBagP={}; ids.forEach(function(id){ inBagP[VAR[id].p.id]=1; });
  var ups=PRODUCTS.filter(function(p){ return !inBagP[p.id]; }).slice(0,2);
  if(ups.length) h+='<div class="upsell"><h5>'+t("upsell")+'</h5><div class="upsell__row">'+ups.map(function(p){ var v=curVar(p); return '<button type="button" class="upsell__item" data-add="'+v.id+'"><img src="'+thumbOf(v)+'" alt=""><span>'+L(p.name)+'<small>+ '+moneyTxt(v.price)+'</small></span></button>'; }).join("")+'</div></div>';
  dBody.innerHTML=h;
  dFoot.innerHTML=totalsHTML()+'<button class="btn btn--block" type="button" id="toCheckout">'+t("checkout")+'</button><p class="note">'+t("secureNote")+'</p>';
}
function openBag(){ renderBag(); drawer.classList.add("is-open"); overlay.classList.add("is-open"); drawer.setAttribute("aria-hidden","false"); lockScroll(true); setTimeout(function(){ $("#drawerClose").focus({preventScroll:true}); },80); }
function closeBag(){ if(!drawer.classList.contains("is-open")) return; drawer.classList.remove("is-open"); overlay.classList.remove("is-open"); drawer.setAttribute("aria-hidden","true"); lockScroll(false); if(step!=="checkout") step="bag"; }
$("#bagBtn").addEventListener("click",openBag);
$("#drawerClose").addEventListener("click",closeBag);
overlay.addEventListener("click",closeBag);
function addToBag(id,qty,fromEl){
  if(!VAR[id]) return;
  if(step==="done") step="bag";
  bag[id]=Math.min(99,(bag[id]||0)+(qty||1)); save();
  renderBadge(false,id);
  try{ flyToBag(fromEl,id,function(){ renderBadge(false,id); }); }catch(err){ renderBadge(true,id); }
  toast(id);
  if(drawer.classList.contains("is-open")) renderBag();
}
window.addEventListener("storage",function(e){ if(e.key!=="olga-bag2") return; try{ bag=JSON.parse(e.newValue||"{}")||{}; }catch(_){ bag={}; } cleanBag(); renderBag(); renderBadge(false); });
function flyToBag(fromEl,id,done){
  var v=VAR[id], el=null;
  if(fromEl && fromEl.closest("#o3d")) el=oStage;
  else if(fromEl && fromEl.closest(".drawer")){ var li=fromEl.closest(".line-item"); el=(li&&li.querySelector(".line-item__img"))||fromEl; return OFX.fly(el.getBoundingClientRect(), thumbOf(v), fromEl, done, drawerTgt); }
  else { var c=fromEl&&fromEl.closest(".pcard,.spread,.modal__card,.hslide"); el=c&&(c.querySelector(".pcard__img,.spread__bottles .b1,.modal__gallery,.hslide__p1")); }
  OFX.fly(el?el.getBoundingClientRect():null, thumbOf(v), fromEl, done);
}
function drawerTgt(){
  var h=document.querySelector(".drawer__head h3"), sm=document.getElementById("drawerCount");
  var r=(sm&&sm.textContent?sm:h).getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,el:h,cls:"ofx-soft"};
}
/* where a product returns to when it leaves the bag (resolved live, the drawer re-renders) */
function backDest(btn,id){
  if(btn.closest(".drawer")){
    var li=btn.closest(".line-item"), im0=li&&li.querySelector(".line-item__img"), r0=im0&&im0.getBoundingClientRect();
    return function(){ var b=dBody.querySelector('[data-dec="'+id+'"]'), n=b&&b.closest(".line-item"), e=n&&n.querySelector(".line-item__img"); return e?{r:e.getBoundingClientRect(),el:e}:{r:r0,el:null}; };
  }
  var c=btn.closest(".pcard,.spread,.modal__card,.hslide"), e=c&&c.querySelector(".pcard__img,.spread__bottles .b1,.modal__gallery,.hslide__p1"), r1=e&&e.getBoundingClientRect();
  return function(){ return e&&e.isConnected?{r:e.getBoundingClientRect(),el:e.tagName==="IMG"?e:null}:{r:r1,el:null}; };
}
function returnFromBag(btn,id){
  try{ OFX.back(backDest(btn,id), thumbOf(VAR[id]), btn, null, btn.closest(".drawer")?drawerTgt:null); }catch(_){}
}
var toastEl=$("#toast"), toastT;
function toast(id){
  var v=VAR[id];
  toastEl.innerHTML='<span class="toast__img"><img src="'+thumbOf(v)+'" alt=""></span><span><b style="font-weight:500">'+L(v.p.name)+'</b> · '+L(v.size)+' — '+t("added")+'</span><button type="button" id="toastView">'+t("viewBag")+'</button>';
  toastEl.classList.add("is-on"); clearTimeout(toastT); toastT=setTimeout(function(){ toastEl.classList.remove("is-on"); },3400);
}
function setSize(pid,vi){
  var p=byId[pid]; if(!p||!p.variants[vi]) return; sel[pid]=vi; var v=p.variants[vi];
  $$('[data-size="'+pid+'"]').forEach(function(b){ var on=+b.getAttribute("data-vi")===vi; b.classList.toggle("is-on",on); b.setAttribute("aria-checked",on); });
  $$('[data-price="'+pid+'"]').forEach(function(el){ el.innerHTML=money(v.price); });
  $$('.pcard[data-pid="'+pid+'"],.spread[data-pid="'+pid+'"]').forEach(function(c){
    var box=c.querySelector("[data-qctl]"); if(box){ box.setAttribute("data-qctl",v.id); $$("[data-add],[data-inc],[data-dec]",box).forEach(function(b){ ["data-add","data-inc","data-dec"].forEach(function(a){ if(b.hasAttribute(a)) b.setAttribute(a,v.id); }); }); }
    var im=c.querySelector(".pcard__img");
    if(im){ im.classList.add("is-swap"); setTimeout(function(){ im.setAttribute("data-img",v.cut); im.src=pickCut(im,v.cut); im.style.setProperty("--sc",v.sc); im.style.setProperty("--h",imgH(v)); im.classList.remove("is-swap"); },220); }
  });
  syncSteppers();
}
document.addEventListener("click",function(e){
  var t2=e.target.closest("button,[data-goto],[data-quick],[data-view3d]"); if(!t2) return;
  var id;
  if((id=t2.getAttribute("data-size"))){ setSize(id,+t2.getAttribute("data-vi")); if(t2.getAttribute("data-scope")==="o3d") switch3D(); if(t2.getAttribute("data-scope")==="modal") refreshQuick(); return; }
  if((id=t2.getAttribute("data-add"))){ e.preventDefault(); addToBag(id,1,t2); return; }
  if((id=t2.getAttribute("data-view3d"))){ e.preventDefault(); e.stopPropagation(); open3D(id); if(window.OLH_explain&&t2.closest(".pcard")) OLH_explain(id); return; }
  if((id=t2.getAttribute("data-quick"))){ e.preventDefault(); openQuick(id); return; }
  if((id=t2.getAttribute("data-inc"))){ if(!VAR[id]) return; if((bag[id]||0)>=99){ renderBadge(true,id); return; }
    bag[id]=(bag[id]||0)+1; save(); if(step==="done") step="bag";
    try{ flyToBag(t2,id,function(){ renderBadge(false,id); }); }catch(err){}
    renderBag(); renderBadge(false,id); return; }
  if((id=t2.getAttribute("data-dec"))){ if(!VAR[id]||!bag[id]) return;
    returnFromBag(t2,id);
    bag[id]=bag[id]-1; if(bag[id]<1) delete bag[id]; save(); renderBag(); renderBadge(true,id); return; }
  if((id=t2.getAttribute("data-rm"))){ delete bag[id]; save(); renderBag(); renderBadge(false,id); return; }
  if(t2.id==="toastView"){ toastEl.classList.remove("is-on"); openBag(); return; }
  if(t2.id==="toCheckout"){ step="checkout"; renderBag(); setTimeout(function(){ var i=$("#oName"); i&&i.focus(); },300); return; }
  if(t2.id==="backBtn"){ step="bag"; renderBag(); return; }
  if(t2.id==="doneBtn"){ step="bag"; closeBag(); renderBag(); scrollToEl("#shop",60); return; }
  if(t2.id==="sendOrder"){ sendOrder(); return; }
  if(t2.id==="sendOrderWa"){ sendOrderWhatsApp(); return; }
  if(t2.getAttribute("data-goto")){ closeBag(); setTimeout(function(){ scrollToEl(t2.getAttribute("data-goto"),60); },350); }
});
document.addEventListener("keydown",function(e){ if((e.key==="Enter"||e.key===" ") && e.target.classList && e.target.classList.contains("pcard__stage")){ e.preventDefault(); var kid=e.target.getAttribute("data-view3d"); open3D(kid); if(window.OLH_explain) OLH_explain(kid); } });
/* ======================= CHECKOUT v3 (phone · map · payment) ======================= */
var CK={name:"",phone:"",city:"",notes:"",pay:"",loc:null};
/* JO_CITIES loaded from data/products.js */
var PAYS=["cod","cliq","wallet"];
var JO_BOX={s:29.18,w:34.88,n:33.38,e:39.31};
function ckEsc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function toLatinDigits(s){ return String(s||"").replace(/[\u0660-\u0669]/g,function(d){ return String(d.charCodeAt(0)-0x0660); }).replace(/[\u06F0-\u06F9]/g,function(d){ return String(d.charCodeAt(0)-0x06F0); }); }
/* Jordan mobile: 9 digits, starts with 7 (77 / 78 / 79) */
function cleanJoPhone(raw){
  var d=toLatinDigits(raw).replace(/\D+/g,"");
  if(d.indexOf("00962")===0) d=d.slice(5); else if(d.indexOf("962")===0 && d.length>9) d=d.slice(3);
  d=d.replace(/^0+/,"");
  while(d.length && d.charAt(0)!=="7") d=d.slice(1);
  return d.slice(0,9);
}
function isJoMobile(d){ return /^7[789]\d{7}$/.test(d); }
function fmtJoPhone(d){ return "+962 "+d.slice(0,2)+" "+d.slice(2,5)+" "+d.slice(5); }
function inJordan(lat,lng){ return lat>=JO_BOX.s && lat<=JO_BOX.n && lng>=JO_BOX.w && lng<=JO_BOX.e; }
var FLAG_JO=(function(){ var p=[],cx=4.6,cy=7,R=1.55,r=.68; for(var i=0;i<14;i++){ var a=-Math.PI/2+i*Math.PI/7,rr=i%2?r:R; p.push((cx+Math.cos(a)*rr).toFixed(2)+","+(cy+Math.sin(a)*rr).toFixed(2)); }
  return '<svg class="flag" viewBox="0 0 28 14" aria-hidden="true"><rect width="28" height="4.67" fill="#000000"/><rect y="4.67" width="28" height="4.67" fill="#FFFFFF"/><rect y="9.33" width="28" height="4.67" fill="#316218"/><path d="M0 0L14 7L0 14Z" fill="#CE1126"/><path d="M'+p.join("L")+'Z" fill="#FFFFFF"/></svg>'; })();
var CK_ICO={
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.2 5.5-2.2V4.2L15 6.4 9 4Z"/><path d="M9 4v13.6M15 6.4v13.4"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  pinS:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  me:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  cod:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/></svg>',
  cliq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M9.5 9.5h5M9.5 12.5h3"/></svg>'
};
function checkoutHTML(){
  var f=function(id,k,val,ac,err,extra){ return '<div class="field field--light" id="f-'+id+'"><input id="'+id+'" placeholder=" " value="'+ckEsc(val)+'"'+(ac?' autocomplete="'+ac+'"':'')+(extra||"")+'><label for="'+id+'">'+t(k)+'</label>'+(err?'<p class="ferr" role="alert">'+t(err)+'</p>':'')+'</div>'; };
  var lbDir=LANG==="ar"?"rtl":"ltr";
  var phone='<div class="field field--light field--tel'+(isJoMobile(CK.phone)?' ok':'')+'" id="f-oPhone">'+
    '<span class="tel__cc" aria-hidden="true">'+FLAG_JO+'<span>+962</span><span class="tick">'+CK_ICO.check+'</span></span>'+
    '<input id="oPhone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder=" " dir="ltr" value="'+ckEsc(CK.phone)+'" aria-describedby="oPhoneHint">'+
    '<label for="oPhone" dir="'+lbDir+'">'+t("oPhone")+'</label>'+
    '<p class="fhint" id="oPhoneHint"><span>'+t("phHint")+'</span><b id="oPhoneCnt">'+CK.phone.length+'/9</b></p>'+
    '<p class="ferr" role="alert">'+t("ePhone")+'</p></div>';
  var cities='<datalist id="joCities">'+JO_CITIES[LANG==="ar"?"ar":"en"].map(function(c){ return '<option value="'+ckEsc(c)+'">'; }).join("")+'</datalist>';
  var set=!!CK.loc;
  var loc='<div class="ckf'+(set?' is-set':'')+'" id="f-oLoc"><span class="ckf__lab">'+t("oLoc")+'</span>'+
    '<button type="button" class="locbtn" id="openMap" aria-haspopup="dialog">'+
      '<span class="locbtn__ico">'+(set?CK_ICO.pin:CK_ICO.map)+'<i>'+(set?CK_ICO.check:CK_ICO.pinS)+'</i></span>'+
      '<span class="locbtn__txt"><b>'+t(set?"locSet":"locBtn")+'</b><small>'+(set?ckEsc(CK.loc.addr||(CK.loc.lat.toFixed(5)+", "+CK.loc.lng.toFixed(5))):t("locBtnS"))+'</small></span>'+
      '<span class="locbtn__go"><span>'+t(set?"locChange":"locOpen")+'</span>'+CK_ICO.arrow+'</span>'+
    '</button><p class="ferr" role="alert">'+t("eLoc")+'</p></div>';
  var pay='<div class="ckf" id="f-oPay"><span class="ckf__lab" id="oPayLab">'+t("oPay")+'</span><div class="pay" role="radiogroup" aria-labelledby="oPayLab">'+
    PAYS.map(function(k){ return '<label class="pay__opt"><input type="radio" name="oPay" value="'+k+'"'+(CK.pay===k?' checked':'')+'><span class="pay__box"><span class="pay__ico">'+CK_ICO[k]+'</span><span class="pay__t"><b>'+t("pay_"+k)+'</b><small>'+t("pay_"+k+"S")+'</small></span><i class="pay__dot"></i></span></label>'; }).join("")+
    '</div><p class="ferr" role="alert">'+t("ePay")+'</p></div>';
  return '<form class="checkout" id="checkout" novalidate><button type="button" class="step-back" id="backBtn">'+t("back")+'</button><h4>'+t("delT")+'</h4><p>'+t("delP")+'</p>'+
    f("oName","oName",CK.name,"name","eName")+phone+f("oCity","oCity",CK.city,"address-level2","eCity",' list="joCities"')+cities+loc+
    '<div class="field field--light"><textarea id="oNotes" placeholder=" ">'+ckEsc(CK.notes)+'</textarea><label for="oNotes">'+t("oNotes")+'</label></div>'+pay+'</form>';
}
function ckValid(k){
  if(k==="oName") return CK.name.trim().split(/\s+/).filter(function(w){ return w.length>0; }).length>=2 && CK.name.trim().length>=4;
  if(k==="oPhone") return isJoMobile(CK.phone);
  if(k==="oLoc") return !!CK.loc;
  if(k==="oPay") return PAYS.indexOf(CK.pay)>-1;
  if(k==="oCity") return CK.city.trim().length>=2;
  return true;
}
function ckMark(k,on){ var el=$("#f-"+k); if(el) el.classList.toggle("bad",on); }
dBody.addEventListener("beforeinput",function(e){
  if(!e.target || e.target.id!=="oPhone") return;
  if(e.inputType==="insertText" || e.inputType==="insertCompositionText"){
    var d=toLatinDigits(e.data||"");
    if(/\D/.test(d)){ e.preventDefault(); return; }
    var cur=e.target.value, s=e.target.selectionStart, en=e.target.selectionEnd, next=cur.slice(0,s)+d+cur.slice(en);
    if(next.length>9 || (next.length && next.charAt(0)!=="7")) e.preventDefault();
  }
});
dBody.addEventListener("input",function(e){
  var el=e.target; if(!el || !el.id) return;
  if(el.id==="oPhone"){
    var c=cleanJoPhone(el.value); if(el.value!==c) el.value=c; CK.phone=c;
    var ok=isJoMobile(c), box=$("#f-oPhone"); box.classList.toggle("ok",ok); if(ok) box.classList.remove("bad");
    var cnt=$("#oPhoneCnt"); if(cnt) cnt.textContent=c.length+"/9"; return;
  }
  if(el.id==="oName"){ CK.name=el.value; if(ckValid("oName")) ckMark("oName",false); return; }
  if(el.id==="oCity"){ CK.city=el.value; if(ckValid("oCity")) ckMark("oCity",false); updTotals(); return; }
  if(el.id==="oNotes"){ CK.notes=el.value; return; }
});
dBody.addEventListener("change",function(e){ var el=e.target; if(el && el.name==="oPay"){ CK.pay=el.value; ckMark("oPay",false); } });
dBody.addEventListener("focusout",function(e){ var el=e.target; if(!el) return; if(el.id==="oPhone" && CK.phone.length) ckMark("oPhone",!isJoMobile(CK.phone)); if(el.id==="oName" && CK.name.trim()) ckMark("oName",!ckValid("oName")); });
dBody.addEventListener("click",function(e){ if(e.target.closest && e.target.closest("#openMap")){ e.preventDefault(); openMap(); } });

/* ---------- map picker ----------
   Engine 1: MapLibre GL + OpenFreeMap vector tiles (keyless, no Referer needed, Arabic labels).
   Engine 2 (automatic fallback, no WebGL / blocked worker / CDN issue): Leaflet + Esri raster tiles.
   OpenStreetMap's own tile servers are NOT used: they return 403 "Access blocked" whenever the page
   is opened from a file, a preview frame or any context that sends no Referer. */
var LM={el:null,map:null,marker:null,pend:null,geoT:null,geoN:0,hintT:null,engine:null,booting:false,cbs:[]};
var MAP_CFG={
  gl:{js:["https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.1/dist/maplibre-gl.js","https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.js"],
      css:["https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.1/dist/maplibre-gl.css","https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.css"],
      rtl:"https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js",
      style:"https://tiles.openfreemap.org/styles/liberty"},
  lf:{js:["https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js","https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"],
      css:["https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css","https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"],
      tiles:(CFG.mapTilesUrl||"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"),
      attr:'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> &middot; HERE, Garmin, &copy; OpenStreetMap contributors'},
  bounds:{s:28.4,w:33.9,n:34.2,e:40.3}, center:[31.9539,35.9106]
};
function loadCSS(urls){ urls.forEach(function(u,i){ if(i) return; if(document.querySelector('link[href="'+u+'"]')) return; var l=document.createElement("link"); l.rel="stylesheet"; l.href=u; l.onerror=function(){ if(urls[1]){ var l2=document.createElement("link"); l2.rel="stylesheet"; l2.href=urls[1]; document.head.appendChild(l2); } }; document.head.appendChild(l); }); }
function loadJS(urls,test,cb){
  if(test()) return cb(true);
  var i=0;(function next(){
    if(i>=urls.length) return cb(false);
    var s=document.createElement("script"); s.src=urls[i++]; s.async=true;
    var to=setTimeout(function(){ s.onload=s.onerror=null; next(); },15000);
    s.onload=function(){ clearTimeout(to); test()?cb(true):next(); };
    s.onerror=function(){ clearTimeout(to); s.remove(); next(); };
    document.head.appendChild(s);
  })();
}
function hasWebGL(){ try{ var c=document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2")||c.getContext("webgl"))); }catch(e){ return false; } }
function pinEl(){
  var d=document.createElement("div"); d.className="lpin drop";
  var lg=A.LOGO?'<g transform="translate(12.5 15.9) scale(.018254)"><g transform="translate(0,726) scale(.1,-.1)"><path d="'+A.LOGO+'" fill="#35452D"/></g></g>':'<circle cx="24" cy="22.5" r="5" fill="#87916B"/>';
  d.innerHTML='<svg viewBox="0 0 48 60" aria-hidden="true"><defs><linearGradient id="lpinG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#88985A"/><stop offset=".5" stop-color="#87916B"/><stop offset="1" stop-color="#35452D"/></linearGradient></defs><path d="M24 1.8C12.2 1.8 2.8 11.1 2.8 22.7 2.8 38 24 58.2 24 58.2S45.2 38 45.2 22.7C45.2 11.1 35.8 1.8 24 1.8Z" fill="url(#lpinG)" stroke="#FBF6EC" stroke-width="2.2"/><circle cx="24" cy="22.5" r="15.2" fill="#FBF6EC"/><circle cx="24" cy="22.5" r="13.6" fill="none" stroke="#C5A36A" stroke-width="1" stroke-opacity=".85"/>'+lg+'</svg>';
  return d;
}
function pinBounce(el){ if(!el) return; el.classList.remove("drop"); void el.offsetWidth; el.classList.add("drop"); }
/* Olga palette over the OpenFreeMap "liberty" style + language-aware labels */
function olgaTint(m){
  var st=m.getStyle(); if(!st||!st.layers) return;
  var nameExpr=LANG==="ar"?["coalesce",["get","name:ar"],["get","name"],["get","name_en"]]:["coalesce",["get","name_en"],["get","name:latin"],["get","name"]];
  st.layers.forEach(function(l){
    var id=l.id, set=function(p,v){ try{ m.setPaintProperty(id,p,v); }catch(e){} };
    try{
      if(l.type==="background") set("background-color","#F6EEE1");
      else if(l.type==="raster") set("raster-opacity",.35);
      else if(l.type==="fill"){
        if(/water/.test(id)) set("fill-color","#C9D7C2");
        else if(/park|grass|wood|wetland|pitch|cemetery/.test(id)) set("fill-color","#DCE1CF");
        else if(/residential/.test(id)) set("fill-color","#F1E6D3");
        else if(/sand/.test(id)) set("fill-color","#EEDFC5");
        else if(/building/.test(id)) set("fill-color","#EADCC5");
      }
      else if(l.type==="fill-extrusion"){ set("fill-extrusion-color","#E8D8BE"); set("fill-extrusion-opacity",.55); }
      else if(l.type==="line"){
        if(/waterway/.test(id)) set("line-color","#B7C9AE");
        else if(/casing/.test(id)){ if(/motorway|trunk|primary/.test(id)) set("line-color","#C7A265"); }
        else if(/motorway/.test(id)) set("line-color","#DAB981");
        else if(/trunk_primary/.test(id)) set("line-color","#ECD7B3");
      }
      else if(l.type==="symbol" && l.layout && l.layout["text-field"]!==undefined){
        if(JSON.stringify(l.layout["text-field"]).indexOf('"name')>-1 && !/shield|ref/.test(id)) m.setLayoutProperty(id,"text-field",nameExpr);
        set("text-halo-color","#FBF6EC");
      }
    }catch(e){}
  });
}
function engineGL(cb){
  if(!hasWebGL()) return cb(null);
  loadCSS(MAP_CFG.gl.css);
  loadJS(MAP_CFG.gl.js,function(){ return !!(window.maplibregl&&window.maplibregl.Map); },function(ok){
    if(!ok) return cb(null);
    var G=window.maplibregl, done=false, m;
    try{ if(G.getRTLTextPluginStatus && G.getRTLTextPluginStatus()==="unavailable"){ var pr=G.setRTLTextPlugin(MAP_CFG.gl.rtl,true); if(pr&&pr.catch) pr.catch(function(){}); } }catch(e){}
    var fail=function(){ if(done) return; done=true; try{ m&&m.remove(); }catch(e){} $("#lmapMap").innerHTML=""; cb(null); };
    var to=setTimeout(fail,16000);
    try{
      var c=LM.pend?[LM.pend.lng,LM.pend.lat]:[MAP_CFG.center[1],MAP_CFG.center[0]], B=MAP_CFG.bounds;
      m=new G.Map({container:"lmapMap",style:MAP_CFG.gl.style,center:c,zoom:LM.pend?16:12,minZoom:6,maxZoom:19,maxBounds:[[B.w,B.s],[B.e,B.n]],attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false,touchPitch:false,cooperativeGestures:false});
      m.touchZoomRotate.disableRotation();
      m.addControl(new G.NavigationControl({showCompass:false}),"top-left");
    }catch(e){ clearTimeout(to); return fail(); }
    m.on("error",function(){ /* tile hiccups are retried by MapLibre; style failure is caught by the timeout */ });
    m.once("load",function(){
      if(done) return; done=true; clearTimeout(to);
      olgaTint(m);
      var mk=null;
      m.on("click",function(e){ setPin(e.lngLat.lat,e.lngLat.lng,true); });
      cb({kind:"gl",
        resize:function(){ m.resize(); },
        view:function(lat,lng,z){ m.jumpTo({center:[lng,lat],zoom:z}); },
        fly:function(lat,lng,z){ m.flyTo({center:[lng,lat],zoom:z,speed:1.6,essential:true}); },
        zoom:function(){ return m.getZoom(); },
        pin:function(lat,lng,anim){
          if(!mk){ mk=new G.Marker({element:pinEl(),anchor:"bottom",offset:[0,2],draggable:true}).setLngLat([lng,lat]).addTo(m); mk.on("dragend",function(){ var p=mk.getLngLat(); setPin(p.lat,p.lng,false); }); }
          else { mk.setLngLat([lng,lat]); if(anim) pinBounce(mk.getElement().querySelector(".lpin")||mk.getElement()); }
        }});
    });
  });
}
function engineLF(cb){
  loadCSS(MAP_CFG.lf.css);
  loadJS(MAP_CFG.lf.js,function(){ return !!(window.L&&window.L.map&&window.L.tileLayer); },function(ok){
    if(!ok) return cb(null);
    var Lf=window.L, B=MAP_CFG.bounds, c=LM.pend?[LM.pend.lat,LM.pend.lng]:MAP_CFG.center, m, loaded=0, errs=0;
    try{
      m=Lf.map("lmapMap",{zoomControl:false,minZoom:6,maxBounds:[[B.s,B.w],[B.n,B.e]],maxBoundsViscosity:.9}).setView(c,LM.pend?16:12);
      Lf.control.zoom({position:"topleft"}).addTo(m);
      var tl=Lf.tileLayer(MAP_CFG.lf.tiles,{maxZoom:19,maxNativeZoom:19,attribution:MAP_CFG.lf.attr}).addTo(m);
      tl.on("tileload",function(){ loaded++; }); tl.on("tileerror",function(){ errs++; if(errs>=8&&!loaded) mapError(); });
      m.attributionControl.setPrefix(false);
    }catch(e){ return cb(null); }
    var icon=Lf.divIcon({className:"lpin-wrap",iconSize:[56,70],iconAnchor:[28,68],html:pinEl().outerHTML}), mk=null;
    m.on("click",function(e){ setPin(e.latlng.lat,e.latlng.lng,true); });
    cb({kind:"lf",
      resize:function(){ m.invalidateSize(); },
      view:function(lat,lng,z){ m.setView([lat,lng],z,{animate:false}); },
      fly:function(lat,lng,z){ m.flyTo([lat,lng],z,{duration:.9}); },
      zoom:function(){ return m.getZoom(); },
      pin:function(lat,lng,anim){
        if(!mk){ mk=Lf.marker([lat,lng],{icon:icon,draggable:true,keyboard:false,autoPan:true}).addTo(m); mk.on("dragend",function(){ var p=mk.getLatLng(); setPin(p.lat,p.lng,false); }); }
        else { mk.setLatLng([lat,lng]); if(anim){ var el=mk.getElement(); pinBounce(el&&el.querySelector(".lpin")); } }
      }});
  });
}
function mapError(){ var ld=$("#lmapLoad",LM.el); if(!ld) return; ld.classList.remove("is-off"); ld.classList.add("is-err"); $("span",ld).textContent=t("mapFail"); $("#lmapRetry",ld).hidden=false; }
function bootMap(cb){
  if(LM.map) return cb(true);
  LM.cbs.push(cb); if(LM.booting) return; LM.booting=true;
  var fin=function(api){ LM.booting=false; if(api){ LM.map=api; LM.engine=api.kind; LM.el.setAttribute("data-engine",api.kind); } var q=LM.cbs; LM.cbs=[]; q.forEach(function(f){ f(!!api); }); };
  engineGL(function(api){ if(api) return fin(api); $("#lmapMap").innerHTML=""; engineLF(fin); });
}

function buildMapDialog(){
  if(LM.el) return LM.el;
  var d=document.createElement("div"); d.className="lmap"; d.id="lmap"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-hidden","true"); d.setAttribute("aria-labelledby","lmapT");
  d.innerHTML='<div class="lmap__bg" data-lclose></div><div class="lmap__card">'+
    '<div class="lmap__head"><span class="lmap__ico">'+CK_ICO.pin+'</span><div><h4 id="lmapT"></h4><p id="lmapP"></p></div><button type="button" class="icon-btn lmap__x" data-lclose id="lmapX">'+CK_ICO.close+'</button></div>'+
    '<form class="lmap__search" id="lmapSearch">'+CK_ICO.search+'<input id="lmapQ" type="search" autocomplete="off" enterkeyhint="search"><button type="submit" class="btn btn--sm" id="lmapGo"></button></form>'+
    '<div class="lmap__stage"><div id="lmapMap"></div><div class="lmap__hint" id="lmapHint"></div><button type="button" class="lmap__me" id="lmapMe">'+CK_ICO.me+'<span></span></button><div class="lmap__load" id="lmapLoad"><i></i><span></span><button type="button" class="btn btn--sm" id="lmapRetry" hidden></button></div></div>'+
    '<div class="lmap__foot"><div class="lmap__addr">'+CK_ICO.pin+'<div><small id="lmapAL"></small><span id="lmapAddr">—</span></div></div><button type="button" class="btn btn--olive" id="lmapOk" disabled>'+CK_ICO.check+'<span></span></button></div>'+
  '</div>';
  document.body.appendChild(d); LM.el=d;
  d.addEventListener("click",function(e){
    if(e.target.closest("[data-lclose]")){ closeMap(); return; }
    if(e.target.closest("#lmapOk")){ confirmMap(); return; }
    if(e.target.closest("#lmapMe")){ locateMe(); return; }
    if(e.target.closest("#lmapRetry")){ startMap(); return; }
  });
  $("#lmapSearch",d).addEventListener("submit",function(e){ e.preventDefault(); searchPlace($("#lmapQ",d).value); });
  return d;
}
function mapTexts(){
  var d=LM.el; $("#lmapT",d).textContent=t("mapT"); $("#lmapP",d).textContent=t("mapP");
  $("#lmapQ",d).setAttribute("placeholder",t("mapSearch")); $("#lmapGo",d).textContent=t("mapGo");
  $("#lmapMe span",d).textContent=t("mapMe"); $("#lmapOk span",d).textContent=t("mapConfirm");
  $("#lmapRetry",d).textContent=t("mapRetry"); $("#lmapAL",d).textContent=t("oLoc").replace(/\s*\*$/,""); $("#lmapX",d).setAttribute("aria-label",t("aClose"));
}
function mapHint(k,warn,ms){
  var h=$("#lmapHint",LM.el); if(!h) return; clearTimeout(LM.hintT);
  if(!k){ h.classList.add("is-off"); return; }
  h.textContent=t(k); h.classList.toggle("is-warn",!!warn); h.classList.remove("is-off");
  if(ms) LM.hintT=setTimeout(function(){ if(LM.pend) h.classList.add("is-off"); else mapHint("mapPick"); },ms);
}
function openMap(){
  var d=buildMapDialog(); mapTexts();
  LM.pend=CK.loc?{lat:CK.loc.lat,lng:CK.loc.lng,addr:CK.loc.addr,city:CK.loc.city}:null;
  $("#lmapAddr",d).textContent=LM.pend?(LM.pend.addr||LM.pend.lat.toFixed(5)+", "+LM.pend.lng.toFixed(5)):"—";
  $("#lmapOk",d).disabled=!LM.pend;
  d.classList.add("is-open"); d.setAttribute("aria-hidden","false");
  startMap();
  setTimeout(function(){ var x=$("#lmapX",d); x&&x.focus({preventScroll:true}); },60);
}
function startMap(){
  var d=LM.el, ld=$("#lmapLoad",d);
  if(!LM.map){ ld.classList.remove("is-off","is-err"); $("span",ld).textContent=t("mapLoading"); $("#lmapRetry",ld).hidden=true; }
  bootMap(function(ok){
    if(!ok){ mapError(); return; }
    ld.classList.add("is-off");
    var sync=function(){ if(!LM.map) return; LM.map.resize(); if(LM.pend){ LM.map.view(LM.pend.lat,LM.pend.lng,Math.max(LM.map.zoom(),16)); setPin(LM.pend.lat,LM.pend.lng,false,true); } else mapHint("mapPick"); };
    sync(); setTimeout(sync,420);
  });
}

function closeMap(){ if(!LM.el||!LM.el.classList.contains("is-open")) return; LM.el.classList.remove("is-open"); LM.el.setAttribute("aria-hidden","true"); var b=$("#openMap"); b&&b.focus({preventScroll:true}); }
window.addEventListener("keydown",function(e){ if(e.key==="Escape" && LM.el && LM.el.classList.contains("is-open")){ e.stopImmediatePropagation(); e.preventDefault(); closeMap(); } },true);
function setPin(lat,lng,anim,keepAddr){
  if(!LM.map) return;
  if(!inJordan(lat,lng)){ mapHint("mapOut",true,2600); return; }
  LM.map.pin(lat,lng,anim);
  var keep=keepAddr&&LM.pend&&LM.pend.addr;
  LM.pend={lat:lat,lng:lng,addr:keep?LM.pend.addr:"",city:keep?LM.pend.city:""};
  $("#lmapOk",LM.el).disabled=false; mapHint(null);
  if(!keep){ $("#lmapAddr",LM.el).textContent=t("mapAddr"); reverseGeo(lat,lng); }
}

function reverseGeo(lat,lng){
  clearTimeout(LM.geoT); var n=++LM.geoN;
  LM.geoT=setTimeout(function(){
    fetch((CFG.geocodingBaseUrl||"https://nominatim.openstreetmap.org")+"/reverse?format=jsonv2&zoom=18&addressdetails=1&lat="+lat+"&lon="+lng+"&accept-language="+(LANG==="ar"?"ar,en":"en,ar"))
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(j){
      if(n!==LM.geoN||!LM.pend) return;
      var a=j.address||{}, city=a.city||a.town||a.village||a.municipality||a.county||a.state||"";
      var parts=[a.road||a.pedestrian||"",a.neighbourhood||a.suburb||a.quarter||a.city_district||"",city].filter(function(x,i,arr){ return x && arr.indexOf(x)===i; });
      LM.pend.addr=parts.length?parts.join("، "):(j.display_name||"").split(",").slice(0,3).join("،");
      LM.pend.city=city;
      $("#lmapAddr",LM.el).textContent=LM.pend.addr||(lat.toFixed(5)+", "+lng.toFixed(5));
    })
    .catch(function(){ if(n===LM.geoN&&LM.pend) $("#lmapAddr",LM.el).textContent=lat.toFixed(5)+", "+lng.toFixed(5); });
  },450);
}
function searchPlace(q){
  q=String(q||"").trim().slice(0,120); if(q.length<2||!LM.map) return;
  var go=$("#lmapGo",LM.el); go.disabled=true;
  fetch((CFG.geocodingBaseUrl||"https://nominatim.openstreetmap.org")+"/search?format=jsonv2&limit=1&countrycodes=jo&accept-language="+(LANG==="ar"?"ar,en":"en,ar")+"&q="+encodeURIComponent(q))
  .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(function(res){
    go.disabled=false;
    if(!res||!res.length){ mapHint("mapNoRes",true,2600); return; }
    var lat=+res[0].lat, lng=+res[0].lon; LM.map.fly(lat,lng,17); setPin(lat,lng,true);
  })
  .catch(function(){ go.disabled=false; mapHint("mapNoRes",true,2600); });
}
function locateMe(){
  var b=$("#lmapMe",LM.el);
  if(!navigator.geolocation||!LM.map){ mapHint("mapGeoFail",true,3200); return; }
  b.classList.add("is-busy");
  navigator.geolocation.getCurrentPosition(function(p){
    b.classList.remove("is-busy");
    var lat=p.coords.latitude, lng=p.coords.longitude;
    if(!inJordan(lat,lng)){ mapHint("mapOut",true,2600); return; }
    LM.map.fly(lat,lng,17); setPin(lat,lng,true);
  },function(){ b.classList.remove("is-busy"); mapHint("mapGeoFail",true,3400); },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
}
function confirmMap(){
  if(!LM.pend) return;
  CK.loc={lat:LM.pend.lat,lng:LM.pend.lng,addr:LM.pend.addr||"",city:LM.pend.city||""};
  if(!CK.city.trim() && CK.loc.city) CK.city=CK.loc.city;
  closeMap(); if(step==="checkout") renderBag();
}

/* ======================= ORDERS → OLGA CONTROL PANEL =======================
   Orders go straight into the Olga control panel database through the secure
   `place_order` function (prices and delivery fee are set by the database).
   If the panel can't be reached, the customer can still send the same order
   on WhatsApp so no order is lost. */
var OLGA_DB={
  url:(CFG.dbUrl||window.OLGA_DB_URL||"https://sktmniwsdipeaocxkykz.supabase.co").replace(/\/+$/,""),
  key:CFG.dbKey||window.OLGA_DB_KEY||"sb_publishable_z3nEmyXGA5H-fKXp1NdA-w_hSwYslK2"
};
var ORD={busy:false,last:null,set:null};
function dbHeaders(){ return {"apikey":OLGA_DB.key,"Content-Type":"application/json","Accept":"application/json"}; }
/* delivery fees as configured in the control panel (Settings → deliveryAmman / deliveryOther) */
(function loadStoreSettings(){
  try{
    fetch(OLGA_DB.url+"/rest/v1/app_settings?select=value&key=eq.store",{headers:dbHeaders()})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(rows){ if(rows&&rows[0]&&rows[0].value){ ORD.set=rows[0].value; if(step==="checkout") updTotals(); } })
      .catch(function(){});
  }catch(e){}
})();
function isAmman(c){ return /^(عم+ّ?ان|عمان|amman)$/i.test(String(c||"").trim()); }
function cityAr(c){ c=String(c||"").trim(); var i=JO_CITIES.en.map(function(x){ return x.toLowerCase(); }).indexOf(c.toLowerCase()); return i>-1?JO_CITIES.ar[i]:c; }
function deliveryFee(city){
  if(typeof ORD==="undefined"||!ORD.set||!String(city||"").trim()) return null;
  var v=isAmman(city)?ORD.set.deliveryAmman:ORD.set.deliveryOther; v=+v;
  return isFinite(v)&&v>=0?v:null;
}
function orderErr(code){ var k="e_"+String(code||"").split(":")[0]; var m=t(k); return (m&&m!==k)?m:t("ordErr"); }
function postOrder(payload){
  var ctl=window.AbortController?new AbortController():null, to=ctl?setTimeout(function(){ ctl.abort(); },20000):0;
  return fetch(OLGA_DB.url+"/rest/v1/rpc/place_order",{method:"POST",headers:dbHeaders(),body:JSON.stringify({payload:payload}),signal:ctl?ctl.signal:undefined})
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ clearTimeout(to); if(!r.ok||!j||!j.id){ var e=new Error((j&&j.message)||("http_"+r.status)); e.code=(j&&j.message)||""; throw e; } return j; }); },
          function(err){ clearTimeout(to); throw err; });
}
function ordBusy(on){
  ORD.busy=on; var b=$("#sendOrder"); if(!b) return;
  b.disabled=on; b.classList.toggle("is-busy",on); b.setAttribute("aria-busy",on?"true":"false");
  b.textContent=on?t("sending"):t("sendOrder");
}
function ordShowErr(err){
  var old=dFoot.querySelector(".ord-err"); if(old) old.remove();
  var box=document.createElement("div"); box.className="ord-err"; box.setAttribute("role","alert");
  box.innerHTML='<b>'+t("ordErrT")+'</b><p>'+ckEsc(orderErr(err&&err.code))+'</p><button type="button" class="ord-err__wa" id="sendOrderWa">'+t("ordWa")+'</button>';
  var b=$("#sendOrder"); if(b){ dFoot.insertBefore(box,b); b.textContent=t("ordRetry"); } else dFoot.appendChild(box);
}
function ckValidateAll(){
  var nm=$("#oName"); if(nm) CK.name=nm.value;
  var ci=$("#oCity"); if(ci) CK.city=ci.value;
  var bad=null;
  ["oName","oPhone","oCity","oLoc","oPay"].forEach(function(k){ var ok=ckValid(k); ckMark(k,!ok); if(!ok&&!bad) bad=k; });
  if(bad){
    var box=$("#f-"+bad), foc=bad==="oLoc"?$("#openMap"):bad==="oPay"?$('input[name="oPay"]'):$("#"+bad);
    if(box) box.scrollIntoView({block:"center",behavior:"smooth"});
    if(foc) setTimeout(function(){ foc.focus({preventScroll:true}); },250);
    return false;
  }
  return true;
}
function finishOrder(last){
  ORD.last=last||null;
  bag={}; save(); renderBadge(); CK.notes=""; CK.loc=null; CK.pay=""; step="done"; renderBag();
}
/* ===== ORDER → WhatsApp (962796738495) + Olga control panel =====
   On "Confirm order": the order is saved to the control panel AND the customer
   is taken to Olga's WhatsApp with the full order pre-filled. */
var ORDER_WA=CFG.whatsappOrders||"962796738495";
function buildOrderMsg(orderId,total){
  var lines=Object.keys(bag).filter(function(id){ return VAR[id]&&bag[id]>0; }).map(function(id){ var v=VAR[id]; return "• "+L(v.p.name)+" ("+L(v.size)+") × "+bag[id]+" — "+moneyTxt(v.price*bag[id]); });
  var maps="https://maps.google.com/?q="+CK.loc.lat.toFixed(6)+","+CK.loc.lng.toFixed(6);
  var fee=deliveryFee(CK.city);
  return t("waHello")+
    (orderId?"\n#"+orderId:"")+
    "\n\n"+lines.join("\n")+
    "\n\n"+t("subtotal")+": "+moneyTxt(subtotal())+
    (fee!=null?"\n"+t("delivery")+": "+moneyTxt(fee):"")+
    (total!=null?"\n"+t("total")+": "+moneyTxt(+total):(fee!=null?"\n"+t("total")+": "+moneyTxt(subtotal()+fee):""))+
    "\n\n"+t("waName")+": "+CK.name.trim()+
    "\n"+t("waPhone")+": "+fmtJoPhone(CK.phone)+
    (CK.city.trim()?"\n"+t("waCity")+": "+CK.city.trim():"")+
    "\n"+t("waLoc")+": "+(CK.loc.addr||(CK.loc.lat.toFixed(5)+", "+CK.loc.lng.toFixed(5)))+
    "\n"+t("waMap")+": "+maps+
    "\n"+t("waPay")+": "+t("pay_"+CK.pay)+
    (CK.notes.trim()?"\n"+t("waNotes")+": "+CK.notes.trim():"");
}
function waOrderUrl(msg){ return "https://wa.me/"+ORDER_WA+"?text="+encodeURIComponent(msg); }
function goWhatsApp(win,url){
  if(win&&!win.closed){ try{ win.location.href=url; return; }catch(e){} }
  window.location.href=url;
}
function sendOrder(){
  if(ORD.busy) return;
  if(!ckValidateAll()) return;
  var items=Object.keys(bag).filter(function(id){ return VAR[id]&&bag[id]>0; }).map(function(id){ return {sku:id,qty:bag[id]}; });
  if(!items.length) return;
  var payload={
    name:CK.name.trim(), phone:CK.phone, city:cityAr(CK.city),
    address:CK.loc.addr||(CK.loc.lat.toFixed(5)+", "+CK.loc.lng.toFixed(5)),
    lat:+CK.loc.lat.toFixed(6), lng:+CK.loc.lng.toFixed(6),
    payment:CK.pay, notes:CK.notes.trim(), items:items, lang:LANG
  };
  var old=dFoot.querySelector(".ord-err"); if(old) old.remove();
  /* open the tab now (inside the click) so pop-up blockers allow it */
  var win=null; try{ win=window.open("","_blank"); if(win) win.document.write('<p style="font:16px sans-serif;text-align:center;margin-top:40vh">…WhatsApp</p>'); }catch(e){}
  ordBusy(true);
  postOrder(payload).then(function(res){
    ordBusy(false);
    goWhatsApp(win,waOrderUrl(buildOrderMsg(res.id,res.total)));
    finishOrder({id:res.id,total:res.total});
  },function(err){
    ordBusy(false);
    if(window.console) console.warn("Olga order failed — sending on WhatsApp",err);
    /* panel unreachable: the order still reaches Olga on WhatsApp */
    goWhatsApp(win,waOrderUrl(buildOrderMsg(null,null)));
    finishOrder(null);
  });
}
function sendOrderWhatsApp(){
  if(!ckValidateAll()) return;
  window.open(waOrderUrl(buildOrderMsg(null,null)),"_blank","noopener");
  finishOrder(null);
}

/* ======================= QUICK VIEW ======================= */
var modal=$("#modal"), mCard=$("#modalCard"), mQty=1, mSrcs=[], mPid=null;
function quickHTML(p){
  var v=curVar(p);
  mSrcs=[{s:CUT[v.cut],c:1}].concat(p.gallery.map(function(k){ return {s:IMG[k],c:0}; }));
  if(p.spread) mSrcs.push({s:IMG[p.spread.bg],c:0});
  var thumbs='<div class="modal__thumbs">'+mSrcs.map(function(o,i){ return '<button type="button" class="'+(i?'':'is-on')+'" data-thumb="'+i+'" aria-label="'+(i+1)+'"><img class="'+(o.c?'contain':'')+'" src="'+o.s+'" alt=""></button>'; }).join("")+'</div>';
  return '<button class="icon-btn modal__close" type="button" data-close aria-label="'+t("aClose")+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
    '<div class="modal__gallery" style="background:radial-gradient(60% 50% at 50% 58%,color-mix(in oklab,'+p.acc+' 24%,white),transparent 70%),linear-gradient(180deg,var(--cream-soft),var(--cream))"><img id="mMain" class="contain" src="'+mSrcs[0].s+'" alt="'+L(p.name)+'">'+thumbs+'</div>'+
    '<div class="modal__info"><span class="eyebrow">'+L(p.badge)+' · '+L(p.type)+'</span><h3 id="mTitle">'+L(p.name)+'</h3><div class="alt">'+p.name[LANG==="ar"?"en":"ar"]+'</div>'+
    '<div class="price" data-price="'+p.id+'">'+money(v.price)+'</div>'+sizesHTML(p,"modal")+
    '<p class="desc">'+L(p.desc)+'</p><p class="ing"><b>'+t("lIng")+':</b> '+L(p.ing)+'</p>'+
    '<ul>'+L(p.points).map(function(x){ return '<li>'+ICO.check+x+'</li>'; }).join("")+'</ul>'+
    '<div class="modal__buy"><div class="qty"><button type="button" id="mDec" aria-label="−">−</button><span id="mQty">1</span><button type="button" id="mInc" aria-label="+">+</button></div><button class="btn btn--olive" type="button" id="mAdd">'+ICO.bag+'<span>'+t("addBag")+'</span></button></div>'+
    '<div class="o3d__more"><button type="button" class="btn btn--ghost btn--sm" data-view3d="'+p.id+'" style="color:var(--ink)">'+t("view3d")+'</button></div></div>';
}
function openQuick(id){ var p=byId[id]; if(!p) return; mPid=id; mQty=1; mCard.innerHTML=quickHTML(p); modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false"); lockScroll(true); setTimeout(function(){ var c=$(".modal__close",mCard); c&&c.focus({preventScroll:true}); },60); }
function refreshQuick(){ var p=byId[mPid]; if(!p) return; var v=curVar(p), m=$("#mMain"); mSrcs[0].s=CUT[v.cut]; m.style.opacity=0; setTimeout(function(){ m.src=CUT[v.cut]; m.className="contain"; m.style.opacity=1; },180); var t0=$('[data-thumb="0"] img',mCard); if(t0) t0.src=CUT[v.cut]; $$(".modal__thumbs button",mCard).forEach(function(b,i){ b.classList.toggle("is-on",i===0); }); }
function closeQuick(){ if(!modal.classList.contains("is-open")) return; modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true"); lockScroll(false); }
modal.addEventListener("click",function(e){
  var tg=e.target;
  if(tg.closest("[data-close]")){ closeQuick(); return; }
  if(tg.closest("[data-view3d]")){ closeQuick(); return; }
  if(tg.closest("#mMain") && mPid && $("#mMain").className==="contain"){ open3D(mPid); return; }
  var th=tg.closest("[data-thumb]");
  if(th){ var m=$("#mMain"), o=mSrcs[+th.getAttribute("data-thumb")]; m.style.opacity=0; setTimeout(function(){ m.src=o.s; m.className=o.c?"contain":""; m.style.opacity=1; },200); $$(".modal__thumbs button").forEach(function(b){ b.classList.toggle("is-on",b===th); }); return; }
  if(tg.closest("#mInc")){ mQty=Math.min(20,mQty+1); $("#mQty").textContent=mQty; return; }
  if(tg.closest("#mDec")){ mQty=Math.max(1,mQty-1); $("#mQty").textContent=mQty; return; }
  var add=tg.closest("#mAdd"); if(add){ addToBag(curVar(byId[mPid]).id,mQty,add); setTimeout(closeQuick,280); }
});

/* ======================= 3D VIEWER ======================= */
var P3D=(function(){
  var T=window.THREE; if(!T) return null;
  var gl=false; try{ var tc=document.createElement("canvas"); gl=!!(window.WebGLRenderingContext&&(tc.getContext("webgl2")||tc.getContext("webgl"))); }catch(e){ gl=false; }
  if(!gl) return null;

  var SPEC={
    "nabulsi-900":{cut:"nabulsi-900",h:3.0,depth:.64,name:"NABULSI · OLIVE OIL",lab:"#F2E4CD"},
    "nabulsi-300":{cut:"nabulsi-900",h:2.2,depth:.64,name:"NABULSI · OLIVE OIL",lab:"#F2E4CD"},
    "shea-300":{cut:"shea-300",h:2.2,depth:.6,name:"SHEA BUTTER",lab:"#F2E7D3"},
    "shea-900":{cut:"shea-900",h:3.0,depth:.62,name:"SHEA BUTTER",lab:"#F2E7D3"},
    "laurel-300":{cut:"laurel-300",h:2.2,depth:.6,name:"LAUREL OIL",lab:"#F1E5D2"},
    "laurel-900":{cut:"laurel-900",h:3.0,depth:.62,name:"LAUREL OIL",lab:"#F1E5D2"},
    "laundry-1800":{cut:"laundry",h:3.3,depth:.72,name:"NABULSI LAUNDRY",lab:"#F5EBDB"}
  };
  var SETS={
    "shea-duo":[{b:"shea-900",x:-.58,z:-.12,ry:.32},{b:"shea-300",x:.72,z:.42,ry:-.22}],
    "home-set":[{b:"shea-900",x:-.92,z:-.8,ry:.28},{b:"shea-900",x:.92,z:-.8,ry:-.28},
                {b:"shea-300",x:-1.95,z:.45,ry:.5},{b:"shea-300",x:-.66,z:.82,ry:.16},{b:"shea-300",x:.66,z:.82,ry:-.16},{b:"shea-300",x:1.95,z:.45,ry:-.5}]
  };
  var cache={}, shadowTex=null;

  function loadImg(src){ return new Promise(function(res,rej){ var im=new Image(); im.onload=function(){res(im)}; im.onerror=rej; im.src=src; }); }

  /* ---- read the real silhouette of the bottle from the cut-out ---- */
  function analyse(im){
    var W=im.naturalWidth,H=im.naturalHeight,c=document.createElement("canvas"); c.width=W; c.height=H;
    var g=c.getContext("2d"); g.drawImage(im,0,0);
    var d=g.getImageData(0,0,W,H).data, L=new Int16Array(H), R=new Int16Array(H), top=-1, bot=-1, maxW=0, x, y;
    for(y=0;y<H;y++){ var l=-1,r=-1; for(x=0;x<W;x++){ if(d[(y*W+x)*4+3]>120){ if(l<0) l=x; r=x; } } L[y]=l; R[y]=r; if(l>=0){ if(top<0) top=y; bot=y; maxW=Math.max(maxW,r-l); } }
    var cs=[]; for(y=top;y<=bot;y++){ if(L[y]>=0 && R[y]-L[y]>maxW*.72) cs.push((L[y]+R[y])/2); }
    cs.sort(function(a,b){return a-b}); var cx=cs.length?cs[cs.length>>1]:W/2;
    var raw=new Float32Array(H), ext=new Float32Array(H);
    for(y=0;y<H;y++){ if(L[y]<0) continue; var a=cx-L[y], b=R[y]-cx; raw[y]=Math.max(0,Math.min(a,b)); ext[y]=b>a?b:-a; }
    // median (kills oil drips / stray pixels) then gentle box smoothing
    var med=new Float32Array(H), sm=new Float32Array(H), w=Math.max(4,Math.round(H/110)), bw2=Math.max(2,Math.round(H/220)), buf=[];
    for(y=0;y<H;y++){ buf.length=0; for(var k=-w;k<=w;k++){ var yy=y+k; if(yy>=top&&yy<=bot) buf.push(raw[yy]); } buf.sort(function(a,b){return a-b}); med[y]=buf.length?buf[buf.length>>1]:0; }
    for(y=0;y<H;y++){ var s=0,n=0; for(k=-bw2;k<=bw2;k++){ yy=y+k; if(yy>=top&&yy<=bot){ s+=med[yy]; n++; } } sm[y]=n?s/n:0; }
    var maxR=0; for(y=top;y<=bot;y++) maxR=Math.max(maxR,sm[y]);
    while(top<bot && sm[top]<maxR*.08) top++;
    // pump spout: rows near the top that stick far out to one side
    var spRows=[], dirs=0, len=0, lim=top+(bot-top)*.24;
    for(y=top;y<lim;y++){ var e=Math.abs(ext[y]); if(e>sm[y]*1.8 && e>maxR*.32 && e-sm[y]>4){ spRows.push(y); dirs+=ext[y]>0?1:-1; len=Math.max(len,e); } }
    var spout=null;
    if(spRows.length>=2){ var my=0; spRows.forEach(function(v){my+=v}); my/=spRows.length; spout={y:my,dir:dirs>=0?1:-1,len:len,th:Math.max(4,Math.min(spRows.length,maxR*.4)),stem:sm[Math.round(my)]||maxR*.3}; }
    // average body colour (fills gaps) and front-label box (light, low-saturation area)
    var rs=0,gs=0,bs=0,n2=0, labRows=[];
    for(y=top;y<=bot;y++){ var rr=sm[y]; if(rr<maxR*.5) continue; var lit=0,tot=0;
      for(x=Math.round(cx-rr*.55);x<=Math.round(cx+rr*.55);x++){ var i=(y*W+x)*4; if(d[i+3]<200) continue; var R0=d[i],G0=d[i+1],B0=d[i+2]; tot++;
        var mx=Math.max(R0,G0,B0), mn=Math.min(R0,G0,B0); if(mx>165 && (mx-mn)<85) lit++; else { rs+=R0; gs+=G0; bs+=B0; n2++; } }
      if(tot && lit/tot>.55) labRows.push(y); }
    var avg=n2?"rgb("+Math.round(rs/n2)+","+Math.round(gs/n2)+","+Math.round(bs/n2)+")":"#653B26";
    var lab=null;
    if(labRows.length>(bot-top)*.15){ var lt=labRows[0], lb=labRows[labRows.length-1], lm=Math.round((lt+lb)/2); lab={t:lt,b:lb,hw:Math.min(sm[lt],sm[lb],sm[lm])*.86}; }
    else { lab={t:top+(bot-top)*.36,b:top+(bot-top)*.88,hw:maxR*.72}; }
    return {W:W,H:H,cx:cx,top:top,bot:bot,rad:sm,maxR:maxR,spout:spout,avg:avg,lab:lab};
  }

  function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function dilate(g,im,W,H,S){ for(var k=5;k>=1;k--){ for(var a=0;a<12;a++){ var t=a/12*Math.PI*2; g.drawImage(im,Math.cos(t)*k*S,Math.sin(t)*k*S,W,H); } } g.drawImage(im,0,0,W,H); }

  /* ---- textures: front = the real photo; back = liquid seen through + printed back label ---- */
  function makeTex(A,im,sp,back,maxAniso){
    var S=Math.max(1,Math.min(4,Math.round(1600/A.H))), W=A.W*S, H=A.H*S, c=document.createElement("canvas"); c.width=W; c.height=H;
    var g=c.getContext("2d"); g.imageSmoothingQuality="high"; g.fillStyle=A.avg; g.fillRect(0,0,W,H);
    if(!back){ dilate(g,im,W,H,S); }
    else {
      g.save(); g.translate(2*A.cx*S,0); g.scale(-1,1); dilate(g,im,W,H,S); g.restore();
      // the front label seen from behind through the liquid is hidden by the back label
      var L=A.lab, lx=(A.cx-L.hw)*S, ly=L.t*S, lw=L.hw*2*S, lh=(L.b-L.t)*S, cxp=A.cx*S;
      g.save(); g.shadowColor="rgba(0,0,0,.25)"; g.shadowBlur=4*S;
      var gr=g.createLinearGradient(lx,0,lx+lw,0); gr.addColorStop(0,"#DCCAAD"); gr.addColorStop(.18,sp.lab); gr.addColorStop(.82,sp.lab); gr.addColorStop(1,"#DCCAAD");
      g.fillStyle=gr; rrect(g,lx,ly,lw,lh,Math.min(lw,lh)*.18); g.fill(); g.restore();
      g.strokeStyle="rgba(131,73,45,.75)"; g.lineWidth=Math.max(1,lw*.012); rrect(g,lx+lw*.05,ly+lw*.05,lw*.9,lh-lw*.1,Math.min(lw,lh)*.14); g.stroke();
      g.textAlign="center"; g.textBaseline="middle"; g.fillStyle="#203416";
      g.fillStyle="#35452D"; drawLogo(g,cxp,ly+lh*.15,lw*.24);
      g.font="800 "+Math.round(Math.min(lw*.088,lw*1.3/Math.max(1,sp.name.length)))+"px 'Readex Pro', sans-serif"; g.fillStyle="#87916B"; g.fillText(sp.name,cxp,ly+lh*.29,lw*.84);
      g.fillStyle="#203416"; g.font="700 "+Math.round(lw*.07)+"px 'Readex Pro', sans-serif";
      ["HAND & SHOWER SOAP","100% NATURAL"].forEach(function(t,i){ g.fillText(t,cxp,ly+lh*(.42+i*.1)); });
      g.font="italic 500 "+Math.round(lw*.085)+"px 'Instrument Serif', serif"; g.fillText("from natural oils",cxp,ly+lh*.6);
      g.strokeStyle="rgba(131,73,45,.6)"; g.lineWidth=Math.max(1,lw*.008); g.beginPath(); g.moveTo(lx+lw*.25,ly+lh*.68); g.lineTo(lx+lw*.75,ly+lh*.68); g.stroke();
      g.fillStyle="rgba(32,52,22,.85)"; g.font="600 "+Math.round(lw*.06)+"px 'Readex Pro', sans-serif";
      g.fillText("Made with love in Jordan",cxp,ly+lh*.76); g.fillText("@olga.jo11",cxp,ly+lh*.84);
      // barcode
      var bw=lw*.34, bx=cxp-bw/2, by=ly+lh*.885, bh=lh*.05; g.fillStyle="#1B2317";
      for(var i=0,xx=bx;xx<bx+bw;i++){ var w2=(i*7%3+1)*lw*.0045; if(i%2===0) g.fillRect(xx,by,w2,bh); xx+=w2; }
    }
    var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; t.anisotropy=maxAniso||8; return t;
  }

  /* ---- one bottle: lathe solid from the silhouette, oval section, photo-projected UVs ---- */
  function bottle(key,maxAniso){
    if(cache[key]) return cache[key];
    var sp=SPEC[key];
    return cache[key]=loadImg(CUT[sp.cut||key]).then(function(im){
      var A=analyse(im), hpx=A.bot-A.top, u=sp.h/hpx, yc=(A.top+A.bot)/2, pts=[], step=Math.max(1,Math.round(hpx/240));
      pts.push(new T.Vector2(0.0005,(yc-A.bot)*u));
      for(var y=A.bot;y>=A.top;y-=step) pts.push(new T.Vector2(Math.max(A.rad[y]*u,0.0005),(yc-y)*u));
      pts.push(new T.Vector2(0.0005,(yc-A.top)*u));
      function half(front){
        var geo=new T.LatheGeometry(pts,56,front?-Math.PI/2:Math.PI/2,Math.PI);
        geo.scale(1,1,sp.depth);
        var p=geo.attributes.position, uv=geo.attributes.uv;
        for(var i=0;i<p.count;i++){ var px=A.cx+p.getX(i)/u*(front?1:-1), py=yc-p.getY(i)/u; uv.setXY(i,px/A.W,1-py/A.H); }
        uv.needsUpdate=true; return geo;
      }
      var tf=makeTex(A,im,sp,false,maxAniso), tb=makeTex(A,im,sp,true,maxAniso);
      var mat=function(t,front){ return new T.MeshPhysicalMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:front?.2:.12,roughness:.26,metalness:0,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.05}); };
      var grp=new T.Group();
      grp.add(new T.Mesh(half(true),mat(tf,true)));
      grp.add(new T.Mesh(half(false),mat(tb,false)));
      if(A.spout){
        var S=A.spout, r=S.th/2*u, x0=S.stem*u*.6, x1=S.len*u, L=Math.max(.02,x1-x0-r*2);
        var sg=new T.CapsuleGeometry(r,L,6,16); sg.rotateZ(Math.PI/2); sg.scale(1,1,1.15);
        var sm=new T.Mesh(sg,new T.MeshPhysicalMaterial({color:0x0c0c0b,roughness:.32,metalness:0,clearcoat:.9,clearcoatRoughness:.15}));
        sm.position.set(S.dir*(x0+r+L/2),(yc-S.y)*u,0); grp.add(sm);
      }
      grp.userData={h:sp.h,r:A.maxR*u};
      grp.position.y=sp.h/2; // bottom sits on y=0
      var wrap=new T.Group(); wrap.add(grp); wrap.userData={h:sp.h,r:A.maxR*u,d:sp.depth};
      return wrap;
    });
  }
  function shadowPlane(w,d){
    if(!shadowTex){ var c=document.createElement("canvas"); c.width=c.height=256; var g=c.getContext("2d"), gr=g.createRadialGradient(128,128,0,128,128,128);
      gr.addColorStop(0,"rgba(18,10,6,.62)"); gr.addColorStop(.45,"rgba(18,10,6,.3)"); gr.addColorStop(1,"rgba(18,10,6,0)"); g.fillStyle=gr; g.fillRect(0,0,256,256); shadowTex=new T.CanvasTexture(c); }
    var m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,toneMapped:false}));
    m.rotation.x=-Math.PI/2; m.position.y=.002; m.renderOrder=-1; return m;
  }
  /* ---- a product = one bottle, or a set assembled from bottles ---- */
  function product(id,maxAniso){
    var root=new T.Group(), spin=new T.Group(); root.add(spin);
    var parts=SETS[id]||(SPEC[id]?[{b:id,x:0,z:0,ry:0}]:null);
    if(!parts) return Promise.reject(new Error("no model"));
    return Promise.all(parts.map(function(pt){ return bottle(pt.b,maxAniso); })).then(function(tpls){
      var maxH=0, ext=0, xmin=1e9,xmax=-1e9,zmin=1e9,zmax=-1e9;
      tpls.forEach(function(tp,i){ var pt=parts[i], o=tp.clone(); o.position.set(pt.x,0,pt.z); o.rotation.y=pt.ry; spin.add(o);
        var r=tp.userData.r; maxH=Math.max(maxH,tp.userData.h); xmin=Math.min(xmin,pt.x-r); xmax=Math.max(xmax,pt.x+r); zmin=Math.min(zmin,pt.z-r*tp.userData.d); zmax=Math.max(zmax,pt.z+r*tp.userData.d);
        ext=Math.max(ext,Math.hypot(Math.abs(pt.x)+r,Math.abs(pt.z)+r*tp.userData.d)); });
      var sw=(xmax-xmin)*1.9+.6, sd=(zmax-zmin)*1.9+.9; spin.add(shadowPlane(Math.max(sw,sd*.8),Math.max(sd,sw*.45)));
      root.userData={h:maxH,ext:ext,set:!!SETS[id]};
      root.userData.spin=spin;
      return root;
    });
  }
  /* ---- studio lighting + reflections ---- */
  function studio(renderer,scene){
    var pm=new T.PMREMGenerator(renderer), s=new T.Scene(); s.background=new T.Color(0x16140f);
    function panel(w,h,x,y,z,col){ var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:col,side:T.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); s.add(m); }
    panel(5,12,-7,2,5,new T.Color(6,5.6,5));      // big key softbox
    panel(2.2,12,7.5,1,3,new T.Color(4,4,3.8));   // strip light → long vertical highlight
    panel(12,4,0,9,0,new T.Color(2.2,2.1,1.9));   // top
    panel(6,8,2,1,-9,new T.Color(2.4,1.8,.9));    // warm gold back
    panel(8,3,0,-6,4,new T.Color(.5,.6,.35));     // olive bounce
    scene.environment=pm.fromScene(s,.03).texture; pm.dispose();
    scene.add(new T.HemisphereLight(0xfff4e0,0x3a2a14,.45));
    var key=new T.DirectionalLight(0xffffff,1.25); key.position.set(3,5,6); scene.add(key);
    var rim=new T.DirectionalLight(0xffe2a8,1.5); rim.position.set(-5,3,-5); scene.add(rim);
    var fill=new T.DirectionalLight(0xd8f08a,.3); fill.position.set(-4,-1,4); scene.add(fill);
  }
  function makeRenderer(canvas,opts){
    var r=new T.WebGLRenderer(Object.assign({canvas:canvas,antialias:true,alpha:true,powerPreference:"high-performance"},opts||{}));
    r.setClearColor(0x000000,0); r.outputEncoding=T.sRGBEncoding; r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=1.05;
    return r;
  }
  function fit(cam,model,aspect,margin){
    var u=model.userData, t=Math.tan(cam.fov*Math.PI/360);
    var dh=(u.h*.5*margin)/t, dw=(u.ext*margin)/(t*aspect);
    return {dist:Math.max(dh,dw)+u.ext*.6, y:u.h*.5};
  }
  return {T:T,product:product,studio:studio,makeRenderer:makeRenderer,fit:fit,has:function(k){return !!(SETS[k]||SPEC[k]);}};
})();

var o3d=$("#o3d"), oStage=$("#o3dStage"), oCur=null, oQty=1, oSpin=true;
var V={ready:false};
function v3dInit(){
  if(V.ready||V.failed) return;
  var cv=document.createElement("canvas"); cv.className="o3d__cv"; oStage.insertBefore(cv,$("#o3dLoad"));
  V.cv=cv;
  if(!P3D){ V.failed=true; return; }
  try{ V.r=P3D.makeRenderer(cv); }catch(e){ V.failed=true; cv.remove(); return; }
  var T=P3D.T; V.T=T; V.scene=new T.Scene(); P3D.studio(V.r,V.scene); V.cam=new T.PerspectiveCamera(26,1,.1,100);
  V.aniso=V.r.capabilities.getMaxAnisotropy();
  V.models={}; V.model=null; V.ry=0; V.rx=.08; V.try=0; V.trx=.08; V.vel=0; V.zoom=1; V.tz=1; V.drag=false; V.idle=0; V.ready=true;
  var lx=0, ly=0, pinch=0, pts={};
  cv.addEventListener("pointerdown",function(e){ pts[e.pointerId]=[e.clientX,e.clientY]; V.drag=true; V.vel=0; lx=e.clientX; ly=e.clientY; try{cv.setPointerCapture(e.pointerId)}catch(_){} });
  cv.addEventListener("pointermove",function(e){
    if(!V.drag||!pts[e.pointerId]) return; pts[e.pointerId]=[e.clientX,e.clientY];
    var ids=Object.keys(pts);
    if(ids.length===2){ var a=pts[ids[0]],b=pts[ids[1]],d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pinch) V.tz=Math.max(.7,Math.min(2,V.tz*d/pinch)); pinch=d; return; }
    var dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
    V.try+=dx*.011; V.vel=dx*.011; V.trx=Math.max(-.35,Math.min(.55,V.trx+dy*.006)); V.idle=performance.now();
  });
  var up=function(e){ delete pts[e.pointerId]; if(Object.keys(pts).length<2) pinch=0; if(!Object.keys(pts).length){ V.drag=false; V.idle=performance.now(); } };
  cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",up);
  cv.addEventListener("wheel",function(e){ e.preventDefault(); V.tz=Math.max(.7,Math.min(2,V.tz-e.deltaY*.0015)); },{passive:false});
  cv.addEventListener("dblclick",function(){ V.tz=V.tz>1.15?1:1.6; });
  new ResizeObserver(v3dSize).observe(oStage);
}
function v3dSize(){
  if(!V.ready) return; var w=oStage.clientWidth, h=oStage.clientHeight; if(!w||!h) return;
  V.r.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); V.r.setSize(w,h,false); V.cam.aspect=w/h; V.cam.updateProjectionMatrix();
  if(V.model){ var f=P3D.fit(V.cam,V.model,w/h,V.model.userData.set?1.12:1.28); V.fd=f.dist; V.fy=f.y; }
}

function v3dShow(key,flatSrc){
  var load=$("#o3dLoad"), flat=$(".o3d__flat",oStage);
  var can=!V.failed && P3D && P3D.has(key);
  if(!can){
    if(V.cv) V.cv.style.display="none";
    if(V.models) Object.keys(V.models).forEach(function(k){ V.models[k].visible=false; }); V.model=null;
    if(!flat){ flat=document.createElement("img"); flat.className="o3d__flat"; flat.alt=""; oStage.insertBefore(flat,load); }
    flat.style.display=""; flat.src=flatSrc; load.style.display="none"; return;
  }
  if(flat) flat.style.display="none"; V.cv.style.display="";
  if(V.model) V.model.visible=false;
  V.ry=V.try=-.5; V.rx=V.trx=.08; V.vel=0; V.zoom=.82; V.tz=1; V.idle=0;
  var have=V.models[key];
  load.textContent=t("preparing"); load.style.display=have?"none":"grid";
  (have?Promise.resolve(have):P3D.product(key,V.aniso)).then(function(m){
    if(!V.models[key]){ V.models[key]=m; V.scene.add(m); }
    if(oKey!==key) return;
    Object.keys(V.models).forEach(function(k){ V.models[k].visible=(k===key); });
    V.model=m; v3dSize(); load.style.display="none";
  }).catch(function(){ load.textContent=t("no3d"); });
}
var oRaf=0, oLast=0;
function o3dLoop(now){
  oRaf=requestAnimationFrame(o3dLoop);
  if(!V.ready||!V.model) return;
  var dt=oLast?Math.min(.05,(now-oLast)/1000):1/60; oLast=now;
  if(!V.drag){ V.vel*=Math.pow(.93,dt*60); V.try+=V.vel; if(oSpin && !reduced && now-V.idle>2200) V.try+=dt*.5; }
  var k=1-Math.pow(1-.12,dt*60);
  V.ry+=(V.try-V.ry)*k; V.rx+=(V.trx-V.rx)*k; V.zoom+=(V.tz-V.zoom)*(1-Math.pow(.8,dt*60));
  var sp=V.model.userData.spin; sp.rotation.y=V.ry; V.model.rotation.x=V.rx*.35; sp.position.y=reduced?0:Math.sin(now/950)*.04;
  V.cam.position.set(0,V.fy*(1.1+V.rx*.9),V.fd/V.zoom); V.cam.lookAt(0,V.fy*.95,0);
  V.r.render(V.scene,V.cam);
}

var oKey=null;
function fill3DInfo(){
  var p=oCur, v=curVar(p);
  $("#o3dTag").textContent=L(p.badge)+" · "+L(v.size); $("#o3dName").textContent=L(p.name); $("#o3dPrice").innerHTML=money(v.price); $("#o3dPrice").setAttribute("data-price",p.id);
  $("#o3dSizes").outerHTML=sizesHTML(p,"o3d").replace('class="sizes"','class="sizes" id="o3dSizes"');
  $("#o3dDesc").textContent=L(p.desc); $("#o3dQty").textContent=oQty;
  $("#o3dPoints").innerHTML=L(p.points).map(function(x){ return '<li>'+ICO.check+x+'</li>'; }).join("");
  $("#o3dAdd").textContent=t("addBag"); $("#o3dSpin").textContent=oSpin?t("pauseRot"):t("autoRot"); $("#o3dDetails").textContent=t("fullDetails");
}
function switch3D(){ if(!oCur) return; var v=curVar(oCur); oKey=v.id; fill3DInfo(); v3dShow(v.id,CUT[v.cut]); }
function open3D(pid){
  var p=byId[pid]; if(!p) return; oCur=p; oQty=1; closeQuick();
  v3dInit(); fill3DInfo();
  o3d.classList.add("is-open"); o3d.setAttribute("aria-hidden","false"); lockScroll(true);
  var v=curVar(p); oKey=v.id; v3dShow(v.id,CUT[v.cut]); setTimeout(v3dSize,30);
  cancelAnimationFrame(oRaf); oLast=0; oRaf=requestAnimationFrame(o3dLoop);
  setTimeout(function(){ var c=$("#o3dClose"); c&&c.focus({preventScroll:true}); },60);
}
function close3D(){if(window.OLH_quiet)OLH_quiet();
  if(!o3d.classList.contains("is-open")) return;
  o3d.classList.remove("is-open"); o3d.setAttribute("aria-hidden","true"); lockScroll(false);
  setTimeout(function(){ if(!o3d.classList.contains("is-open")) cancelAnimationFrame(oRaf); },500);
}
$("#o3dClose").addEventListener("click",close3D);
o3d.addEventListener("click",function(e){ if(e.target===o3d) close3D(); });
$("#o3dInc").addEventListener("click",function(){ oQty=Math.min(20,oQty+1); $("#o3dQty").textContent=oQty; });
$("#o3dDec").addEventListener("click",function(){ oQty=Math.max(1,oQty-1); $("#o3dQty").textContent=oQty; });
$("#o3dAdd").addEventListener("click",function(e){ if(!oCur) return; addToBag(curVar(oCur).id,oQty,e.currentTarget); setTimeout(close3D,280); });
$("#o3dSpin").addEventListener("click",function(e){ oSpin=!oSpin; e.currentTarget.textContent=oSpin?t("pauseRot"):t("autoRot"); });
$("#o3dDetails").addEventListener("click",function(){ var id=oCur&&oCur.id; close3D(); if(id) setTimeout(function(){ openQuick(id); },320); });
window.addEventListener("keydown",function(e){ if(!o3d.classList.contains("is-open")||!V.ready) return; if(e.key==="ArrowLeft"){ V.try-=.6; V.idle=performance.now(); } if(e.key==="ArrowRight"){ V.try+=.6; V.idle=performance.now(); } });
document.addEventListener("keydown",function(e){ if(e.key==="Escape"){ close3D(); closeQuick(); closeBag(); closeMenu(); } });

/* ======================= CONTACT ======================= */
$("#contactForm").addEventListener("submit",function(e){
  e.preventDefault();
  var n=$("#cName"), m=$("#cMsg"), ok=true;
  [n,m].forEach(function(i){ var v=i.value.trim().length>1; i.parentNode.classList.toggle("bad",!v); if(!v) ok=false; });
  if(!ok){ (n.value.trim().length>1?m:n).focus(); return; }
  var msg=(LANG==="ar"?"مرحبًا أولغا 🌿":"Hello Olga 🌿")+"\n\n"+m.value.trim()+"\n\n— "+n.value.trim()+($("#cPhone").value.trim()?" ("+$("#cPhone").value.trim()+")":"");
  window.open("https://wa.me/"+WA+"?text="+encodeURIComponent(msg),"_blank","noopener");
  e.target.reset();
});

/* ======================= SCROLL-LINKED FX ======================= */
var parEls=[], contactBg=$("#contactBg");
function updateStory(){
  if(!sWords.length) return;
  if(!(sy+vh>LY.storyTop-200 && sy<LY.storyTop+LY.storyH+200)) return;
  var top=LY.storyTop-sy, p=clamp((vh*0.86-top)/(LY.storyH+vh*0.4),0,1), lit=Math.round(p*sWords.length);
  if(lit===litN) return;
  var a=litN<0?0:Math.min(lit,litN), b=litN<0?sWords.length:Math.max(lit,litN);
  for(var i=a;i<b;i++) sWords[i].classList.toggle("on",i<lit);
  litN=lit;
}
function updateParallax(){
  parEls.forEach(function(o){
    if(sy+vh>o.top && sy<o.top+o.h){ var c=((o.top+o.h/2)-(sy+vh/2))/vh; o.el.style.transform="translate3d(0,"+(c*o.k).toFixed(2)+"%,0)"; }
  });
  if(sy+vh>LY.contactTop && sy<LY.contactTop+LY.contactH) contactBg.style.transform="translate3d(0,"+(((LY.contactTop-sy)/vh)*-6).toFixed(2)+"%,0)";
}
var spreadTops=[];
function updateSpreads(){
  if(!SPREADS.length) return;
  if(!(sy+vh>LY.spTop && sy<LY.spTop+LY.spH)) return;
  var stack=!reduced && (vw>1000 ? vh>640 : (vh>=vw && vh>=520)); /* phones & tablets in portrait stack too */
  for(var i=0;i<SPREADS.length;i++){
    var s=SPREADS[i], r=s.el.getBoundingClientRect();
    // parallax of bottles & photo while the page arrives
    var enter=clamp(1-(r.top-80)/vh,0,1), e3=1-Math.pow(1-enter,3);
    if(s.bottles) s.bottles.style.transform="translate3d(0,"+((1-e3)*14).toFixed(2)+"%,0)";
    if(s.bg) s.bg.style.transform="translate3d(0,"+((1-enter)*-6).toFixed(2)+"%,0) scale("+(1.08-0.08*e3).toFixed(4)+")";
    if(!stack){ s.el.style.transform=""; s.dim.style.opacity=0; continue; }
    var nx=SPREADS[i+1];
    if(nx){
      var nr=nx.el.getBoundingClientRect(), H=r.height||1;
      var cover=clamp(1-(nr.top-r.top)/H,0,1);
      s.el.style.transform="scale("+(1-cover*0.06).toFixed(4)+") translate3d(0,"+(-cover*2).toFixed(2)+"%,0)";
      s.dim.style.opacity=(cover*0.45).toFixed(3);
    }
  }
}

/* ======================= CURSOR & MAGNETIC ======================= */
if(window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reduced){
  var cur=$(".cursor"), dot=$(".cursor__dot"), ring=$(".cursor__ring"), mx=-100,my=-100,rx=-100,ry=-100, crun=false, cHover=false;
  dot.style.transform=ring.style.transform="translate3d(-100px,-100px,0)";
  var rl=function(){ rx=lerp(rx,mx,0.24); ry=lerp(ry,my,0.24); ring.style.transform="translate3d("+rx.toFixed(1)+"px,"+ry.toFixed(1)+"px,0)"; if(Math.abs(rx-mx)+Math.abs(ry-my)>0.4) requestAnimationFrame(rl); else crun=false; };
  window.addEventListener("pointermove",function(e){ mx=e.clientX; my=e.clientY; dot.style.transform="translate3d("+mx+"px,"+my+"px,0)"; if(!crun){ crun=true; requestAnimationFrame(rl); } },{passive:true});
  document.addEventListener("pointerover",function(e){ var h=!!(e.target.closest&&e.target.closest("a,button,.pcard__stage,.reel,select,input")); if(h!==cHover){ cHover=h; cur.classList.toggle("is-hover",h); } });
  document.addEventListener("pointermove",function(e){
    var b=e.target.closest&&e.target.closest(".btn:not(.btn--block),.round-btn,.fab"); 
    $$(".is-mag").forEach(function(x){ if(x!==b){ x.style.transform=""; x.classList.remove("is-mag"); } });
    if(!b) return; var r=b.getBoundingClientRect(), x=e.clientX-(r.left+r.width/2), y=e.clientY-(r.top+r.height/2);
    b.classList.add("is-mag"); b.style.transform="translate3d("+(x*0.18).toFixed(1)+"px,"+(y*0.28).toFixed(1)+"px,0)";
  },{passive:true});
} else { var c0=$(".cursor"); c0&&c0.remove(); }

/* ======================= FRAME LOOP ======================= */
var lastT=0, ticking=false;
function kick(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } }
function frame(time){
  ticking=false;
  DT=lastT?clamp((time-lastT)/1000,0.001,0.05):1/60; lastT=time;
  sy=window.scrollY;
  var busy=updateHero();
  busy=updateEssence()||busy;
  updateStory(); updateParallax(); updateSpreads();
  if(busy) kick(); else lastT=0;
}
function measure(){
  vh=window.innerHeight; vw=window.innerWidth; sy=window.scrollY;
  var top=function(el){ return el.getBoundingClientRect().top+sy; };
  LY.heroTop=top(hero); LY.heroH=hero.offsetHeight;
  LY.essTop=top(ess); LY.essH=ess.offsetHeight;
  LY.storyTop=top(storyText); LY.storyH=storyText.offsetHeight;
  var ct=contactBg.parentNode; LY.contactTop=top(ct); LY.contactH=ct.offsetHeight;
  var spEl=$("#line"); LY.spTop=top(spEl); LY.spH=spEl.offsetHeight;
  parEls=$$("[data-par]").map(function(el){ var b=el.parentNode; return {el:el,k:+el.getAttribute("data-par"),top:top(b),h:b.offsetHeight}; });
  heroLastP=-1; essLast=-1; litN=-1;
  kick();
}
var mt=0; function remeasure(){ clearTimeout(mt); mt=setTimeout(measure,120); }
window.addEventListener("scroll",function(){ kick(); updateNav(); },{passive:true});
window.addEventListener("resize",function(){ sizeHero(); updateReels(); remeasure(); });
if(window.ResizeObserver) new ResizeObserver(remeasure).observe(document.querySelector("main"));
window.addEventListener("load",measure);
var offIO=new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle("is-off",!e.isIntersecting); }); },{rootMargin:"160px 0px"});
$$("[data-live]").forEach(function(s){ offIO.observe(s); });

/* ======================= INIT ======================= */
applyLang(LANG);
lazy(document);
observeReveal(document);
sizeHero(); measure(); renderBadge(); renderBag(); updateNav();
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(function(){ initSoap(); measure(); }); } else initSoap();
})();

