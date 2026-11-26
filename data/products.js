/* =========================================================================
   OLGA Store — Product Catalog, Categories, Reels & Delivery Cities
   ========================================================================= */
(function () {
  'use strict';
/* ======================= DATA =======================
   Product content comes from the official OLGA Line catalogue.
   PRICES ARE PLACEHOLDERS — replace with Olga's real prices (JOD). */
var ML={en:" ml",ar:" مل"};
function ml(n){return {en:n+" ml",ar:n+" مل"}}
var PRODUCTS=[
 {id:"nabulsi",cat:"body",acc:"#87916B",badge:{en:"Signature",ar:"الأصلي"},
  name:{en:"Nabulsi Liquid Soap",ar:"صابون نابلسي سائل"},
  type:{en:"Hand wash & shower soap",ar:"غسول للأيدي وصابون استحمام"},
  desc:{en:"A rich formula infused with natural oils that provides deep hydration and exceptional softness for your hands.",ar:"تركيبة غنية بالزيوت الطبيعية، توفّر ترطيبًا فائقًا ونعومة لليدين."},
  ing:{en:"Olive oil, natural oil extracts, potassium hydroxide, purified water",ar:"زيت الزيتون، خلاصة زيوت طبيعية، هيدروكسيد البوتاسيوم، ماء نقي"},
  points:{en:["Extracted from olive oil","Deep hydration & softness","Hand wash & shower soap","100% natural"],ar:["مستخلص من زيت الزيتون","ترطيب فائق ونعومة","غسول للأيدي وصابون استحمام","طبيعي 100%"]},
  variants:[{id:"nabulsi-300",size:ml(300),price:3.50,cut:"nabulsi-900",sc:.8},{id:"nabulsi-900",size:ml(900),price:6.50,cut:"nabulsi-900",sc:1}],def:1,
  gallery:["ph_nabulsi","gift_red","ig_nabulsi","ig_hero_still"],
  spread:{bg:"grove",cal:"نابلسي",sub:"Nabulsi Liquid Soap",page:"06",b1:"nabulsi-900",b2:"nabulsi-900",sizes:"300ml | 900ml"}},
 {id:"shea",cat:"body",acc:"#896832",badge:{en:"Deep moisture",ar:"ترطيب عميق"},
  name:{en:"Shea Butter Liquid Soap",ar:"صابون سائل بزبدة الشيا"},
  type:{en:"Hand wash & shower soap",ar:"غسول للأيدي وصابون استحمام"},
  desc:{en:"A gentle formula enriched with natural shea butter that deeply moisturizes the skin, protects it from dryness, and leaves it soft and refreshed all day long.",ar:"تركيبة لطيفة وغنية بزبدة الشيا الطبيعية، ترطّب البشرة بفعالية وتحميها من الجفاف، وتمنحها نعومة وانتعاشًا يدوم."},
  ing:{en:"Shea butter, natural oil extracts, potassium hydroxide, purified water",ar:"زبدة الشيا، خلاصة زيوت طبيعية، هيدروكسيد البوتاسيوم، ماء نقي"},
  points:{en:["Shea butter for deep moisture","Protects from dryness","Soft, refreshed skin all day","100% natural"],ar:["زبدة الشيا لترطيب عميق","تحمي البشرة من الجفاف","نعومة وانتعاش يدوم","طبيعي 100%"]},
  variants:[{id:"shea-300",size:ml(300),price:3.50,cut:"shea-300",sc:.84},{id:"shea-900",size:ml(900),price:6.50,cut:"shea-900",sc:1}],def:1,
  gallery:["ph_shea","gift_spot","ig_shea300","ig_shea_anatomy","ig_woman"],
  spread:{bg:"shea_seeds",cal:"الشيا",sub:"Shea Butter Liquid Soap",page:"07",b1:"shea-900",sizes:"300ml | 900ml"}},
 {id:"laurel",cat:"body",acc:"#4D713B",badge:{en:"Purifying",ar:"منقٍّ ومهدّئ"},
  name:{en:"Liquid Laurel Soap",ar:"صابون غار سائل"},
  type:{en:"Hand wash & shower soap",ar:"غسول للأيدي وصابون استحمام"},
  desc:{en:"A natural formula made with laurel oil, known for its purifying and soothing properties. Suitable for all skin types.",ar:"تركيبة طبيعية بزيت الغار المعروف بخصائصه المطهّرة، مناسب لجميع أنواع البشرة."},
  ing:{en:"Laurel oil, natural oils, potassium hydroxide, purified water",ar:"زيت الغار، زيوت طبيعية، هيدروكسيد البوتاسيوم، ماء نقي"},
  points:{en:["Laurel oil as the key ingredient","Purifying & soothing","Suitable for all skin types","100% natural"],ar:["زيت الغار مكوّن أساسي","مطهّر ومهدّئ","مناسب لجميع أنواع البشرة","طبيعي 100%"]},
  variants:[{id:"laurel-300",size:ml(300),price:3.50,cut:"laurel-300",sc:.84},{id:"laurel-900",size:ml(900),price:6.50,cut:"laurel-900",sc:1}],def:0,
  gallery:["ph_laurel","gift_hand","ig_laurel","ig_handwash"],
  spread:{bg:"laurel_leaf",cal:"الغار",sub:"Liquid Laurel Soap",page:"08",b1:"laurel-300",sizes:"300ml | 900ml"}},
 {id:"laundry",cat:"laundry",acc:"#5B8C42",badge:{en:"Sensitive skin",ar:"للبشرة الحساسة"},
  name:{en:"Nabulsi Laundry Soap",ar:"صابون نابلسي لغسيل الملابس"},
  type:{en:"For children & adults",ar:"للأطفال والكبار"},
  desc:{en:"A gentle formula that cleans deeply and removes tough stains while keeping fabrics soft. Ideal for children’s clothing, safe for sensitive skin and suitable for the whole family’s laundry.",ar:"تركيبة لطيفة تنظّف بعمق وتزيل البقع الصعبة، مع الحفاظ على نعومة الأقمشة. مثالي لملابس الأطفال الصغار ولا يسبب تهيّجًا للبشرة الحساسة، وآمن لملابس جميع أفراد العائلة."},
  ing:{en:"Purified water, fragrance, natural oils, potassium hydroxide",ar:"ماء نقي، عطر، زيوت طبيعية، هيدروكسيد البوتاسيوم"},
  points:{en:["Removes tough stains","Keeps fabrics soft","Ideal for children’s clothes","Extracted from olive oil"],ar:["يزيل البقع الصعبة","يحافظ على نعومة الأقمشة","مثالي لملابس الأطفال","مستخلص من زيت الزيتون"]},
  variants:[{id:"laundry-1800",size:{en:"1800 g",ar:"1800 غ"},price:4.50,cut:"laundry",sc:1}],def:0,
  gallery:["ph_laundry"],
  spread:{bg:"bubbles",cal:"نابلسي",sub:"Nabulsi Laundry Soap",page:"09",b1:"laundry",deco:"baby",sizes:"1.800g"}},
 {id:"moroccan",cat:"hammam",acc:"#7C1D2B",badge:{en:"Detox & exfoliation",ar:"تقشير وديتوكس"},
  name:{en:"Moroccan Hammam Soap",ar:"صابون الحمّام المغربي"},
  type:{en:"Deep cleansing ritual",ar:"طقس تنظيف عميق"},
  desc:{en:"A traditional soap enriched with natural Moroccan oils that enhance the skin’s radiance and softness — a luxurious formula inspired by authentic Moroccan beauty rituals.",ar:"صابون تقليدي غني بزيوت مغربية طبيعية يعزّز إشراقة ونعومة البشرة — تركيبة فاخرة مستوحاة من طقوس الجمال المغربي."},
  ing:{en:"Natural Moroccan oils",ar:"زيوت مغربية طبيعية"},
  points:{en:["100% natural","Deep cleansing","Detox & exfoliation","Radiance & softness"],ar:["طبيعي 100%","تنظيف عميق","ديتوكس وتقشير","إشراقة ونعومة"]},
  variants:[{id:"moroccan-jar",size:{en:"Jar · gift box",ar:"علبة · صندوق هدية"},price:5.00,cut:"moroccan",sc:1,wide:true}],def:0,
  gallery:[],
  spread:{bg:"face_moroccan",cal:"المغربي",sub:"Moroccan Hammam Soap",page:"10",b1:"moroccan",deco:"stones",wide:true,sizes:"100% Natural"}},
 {id:"shea-duo",cat:"sets",acc:"#9E7A3C",badge:{en:"Gift set",ar:"مجموعة هدية"},
  name:{en:"Shea Ritual Duo",ar:"ثنائي الشيا"},
  type:{en:"300 ml + 900 ml",ar:"300 مل + 900 مل"},
  desc:{en:"One for the sink, one for the shower — the complete shea butter ritual. A thoughtful gift, or a treat for yourself.",ar:"واحدة للمغسلة وأخرى للاستحمام — طقس زبدة الشيا الكامل. هدية مميزة أو دلال لنفسك."},
  ing:{en:"Shea butter, natural oil extracts, potassium hydroxide, purified water",ar:"زبدة الشيا، خلاصة زيوت طبيعية، هيدروكسيد البوتاسيوم، ماء نقي"},
  points:{en:["Shea Butter Liquid Soap 300 ml","Shea Butter Liquid Soap 900 ml","Beautiful as a gift"],ar:["صابون الشيا السائل 300 مل","صابون الشيا السائل 900 مل","مثالية كهدية"]},
  variants:[{id:"shea-duo",size:{en:"2 bottles",ar:"عبوتان"},price:9.50,cut:"shea-duo",sc:1}],def:0,
  gallery:["ph_shea","gift_spot","gift_red","ig_shea_anatomy"]},
 {id:"home-set",cat:"sets",acc:"#9E7A3C",badge:{en:"Best value",ar:"الأوفر"},
  name:{en:"The Olga Home Set",ar:"مجموعة أولغا للمنزل"},
  type:{en:"6 bottles",ar:"6 عبوات"},
  desc:{en:"Six bottles of natural care to fill your home — Olga shea butter liquid soaps for every sink and shower.",ar:"ست عبوات من العناية الطبيعية لكل مغسلة وحمّام في منزلك — صابون أولغا السائل بزبدة الشيا."},
  ing:{en:"Shea butter, natural oil extracts, potassium hydroxide, purified water",ar:"زبدة الشيا، خلاصة زيوت طبيعية، هيدروكسيد البوتاسيوم، ماء نقي"},
  points:{en:["6 × Olga liquid soap","Natural care for every room","Best value for families"],ar:["6 × صابون أولغا السائل","عناية طبيعية لكل غرفة","الخيار الأوفر للعائلات"]},
  variants:[{id:"home-set",size:{en:"6 bottles",ar:"6 عبوات"},price:19.00,cut:"home-set",sc:1,wide:true}],def:0,
  gallery:["gift_spot","gift_hand","gift_red","ig_family_bottles","ig_family_sofa"]}
];
var CATS=["all","body","laundry","hammam","sets"];window.OLGA_PRODUCTS=PRODUCTS;
var byId={}, VAR={};
PRODUCTS.forEach(function(p,i){ p.order=i; byId[p.id]=p; p.variants.forEach(function(v){ v.p=p; VAR[v.id]=v; }); });
var sel={}; PRODUCTS.forEach(function(p){ sel[p.id]=p.def; });
var REELS=[
 {img:"ig_oil_swirl",t:{en:"Liquid gold",ar:"ذهب سائل"},s:{en:"The pour",ar:"السكب"}},
 {img:"ig_nabulsi",t:{en:"Held by nature",ar:"من الطبيعة إلى يديك"},s:{en:"Nabulsi",ar:"نابلسي"}},
 {img:"ig_family_sofa",t:{en:"Everyday moments",ar:"لحظات كل يوم"},s:{en:"At home",ar:"في البيت"}},
 {img:"ig_woman",t:{en:"After a long day",ar:"بعد يوم طويل"},s:{en:"Shea butter",ar:"زبدة الشيا"}},
 {img:"ig_handwash",t:{en:"A softer wash",ar:"غسلة أنعم"},s:{en:"Laurel",ar:"الغار"}},
 {img:"ig_family_bottles",t:{en:"Shared at the table",ar:"على مائدة العائلة"},s:{en:"Family",ar:"العائلة"}},
 {img:"ig_shea_anatomy",t:{en:"Inside the bottle",ar:"ما بداخل العبوة"},s:{en:"Ingredients",ar:"المكونات"}}
];
var JO_CITIES={ar:["عمّان","الزرقاء","إربد","العقبة","السلط","مادبا","جرش","عجلون","المفرق","الكرك","الطفيلة","معان","الرصيفة"],en:["Amman","Zarqa","Irbid","Aqaba","Salt","Madaba","Jerash","Ajloun","Mafraq","Karak","Tafilah","Ma'an","Russeifa"]};
  window.OLGA_DATA = {
    ML: ML,
    PRODUCTS: PRODUCTS,
    CATS: CATS,
    REELS: REELS,
    JO_CITIES: JO_CITIES
  };
  window.OLGA_PRODUCTS = PRODUCTS;
})();
