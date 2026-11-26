
(function(){
"use strict";
/* ===== SHAMS · Olga AI assistant =====
   Live AI + natural voice come from OLH_API (Lovable Cloud). If it is unreachable, Shams answers
   from the store facts below and speaks with the browser's own voice. */
var CFG=window.OLGA_CONFIG||{};
var OLH_API=(CFG.shamsApi||window.OLGA_HALA_API||"https://checkout-chat-bridge.lovable.app/api/public/").replace(/\/?$/,"/");
var K=window.OLH_KNOWLEDGE||{products:[],face:{}};
var IMG=window.OLH_IMG||{};
var $=function(i){return document.getElementById(i)};
var root=$("olh-root"),log=$("olh-log"),inp=$("olh-in"),typing=$("olh-typing"),bubble=$("olh-bubble"),cv=$("olh-canvas");
var WA=K.whatsapp, reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var _DLG=window.OLH_DIALOGUE||{};
var T=_DLG.T||{ar:{},en:{}}, TOUR=_DLG.TOUR||{}, LINES=_DLG.LINES||{}, ORDER=_DLG.ORDER||[], OLH_GUIDE=_DLG.GUIDE||{};
function curLang(){return (document.documentElement.lang||"ar").indexOf("en")===0?"en":"ar"}
var lang=curLang(), hist=[], busy=false, voiceOn=true, interacted=false, tourOff=false;
try{voiceOn=sessionStorage.getItem("olh-voice")!=="0";tourOff=sessionStorage.getItem("olh-tour")==="0";}catch(e){}

/* ---------- helpers ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function md(t){var links=[];var raw=String(t).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,function(m,l,u){links.push([u,l]);return "\u0001"+(links.length-1)+"\u0002"})
 .replace(/https?:\/\/[^\s<>()]+/g,function(u){links.push([u,u.replace(/^https?:\/\//,"")]);return "\u0001"+(links.length-1)+"\u0002"});
 var h=esc(raw).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/^#{1,4}\s*/gm,"").replace(/^\s*[-*]\s+/gm,"• ");
 return h.replace(/\u0001(\d+)\u0002/g,function(m,i){var x=links[+i];var ok=/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(x[0])||/^mailto:/.test(x[0]);
  return ok?'<a href="'+esc(x[0])+'" target="_blank" rel="noopener noreferrer">'+esc(x[1])+'</a>':esc(x[1])})}
function detect(s){var a=(s.match(/[\u0600-\u06FF]/g)||[]).length,l=(s.match(/[A-Za-z]/g)||[]).length;return a>l?"ar":(l>0?"en":lang)}
function money(n){return n.toFixed(2)+(lang==="ar"?" د.أ":" JOD")}
function findProducts(text){var s=String(text).toLowerCase(),out=[];K.products.forEach(function(p){if(p.keys.some(function(k){return s.indexOf(k)>-1}))out.push(p)});return out}
function hasQuick(id){return !!document.querySelector('[data-quick="'+id+'"]')}
function openProduct(id){var el=document.querySelector('[data-quick="'+id+'"]');if(!el)return;if(window.matchMedia("(max-width:640px)").matches)setOpen(false);el.click()}

/* ---------- SHAMS BRAIN v2 · built-in understanding engine (works with no connection) ----------
   Normalises Arabic (hamza, taa marbuta, diacritics, stretched letters, Arabic digits), Arabizi and English,
   strips Arabic prefixes/suffixes, tolerates typos, scores every topic in the message, remembers the last
   product and answers several questions at once. WhatsApp is only offered when the visitor asks for contact,
   has a complaint/return, a wholesale request, or after repeated misunderstandings. */
var SHB=(function(){
 function norm(s){s=String(s||"").toLowerCase()
  .replace(/[\u0660-\u0669]/g,function(d){return String(d.charCodeAt(0)-1632)}).replace(/[\u06F0-\u06F9]/g,function(d){return String(d.charCodeAt(0)-1776)})
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
  .replace(/گ/g,"ك").replace(/پ/g,"ب").replace(/ڤ/g,"ف").replace(/چ/g,"ج").replace(/ک/g,"ك").replace(/ی/g,"ي")
  .replace(/[’'`´]/g,"").replace(/(\d)[.,](\d)/g,"$1d$2").replace(/[^\u0621-\u064Aa-z0-9\s]/g," ").replace(/(\d)d(\d)/g,"$1.$2")
  .replace(/([\u0621-\u064Aa-z])\1{2,}/g,"$1").replace(/(\d)([\u0621-\u064A])/g,"$1 $2").replace(/([\u0621-\u064A])(\d)/g,"$1 $2").replace(/(\d)(ml|gm|g|l|jd|jod)\b/g,"$1 $2");
  return s.replace(/\s+/g," ").trim()}
 var PRE=["وبال","وال","بال","كال","فال","لل","ال","وب","ول","وف","وت","وي","ب","و","ف","ل","ك"];
 var SUF=["كما","هما","تين","تكم","ات","ين","ون","يه","ها","هم","كم","كن","نا","ني","ته","تي","ك","ه","ي","ا"];
 function stems(w){var out=[w];if(/[a-z]/.test(w)){if(/ies$/.test(w))out.push(w.slice(0,-3)+"y");if(/es$/.test(w))out.push(w.slice(0,-2));if(/s$/.test(w)&&w.length>3)out.push(w.slice(0,-1));return out}
  var b=w;for(var i=0;i<PRE.length;i++){if(b.indexOf(PRE[i])===0&&b.length-PRE[i].length>=2){b=b.slice(PRE[i].length);out.push(b);break}}
  out.slice().forEach(function(x){for(var j=0;j<SUF.length;j++){var f=SUF[j];if(x.length-f.length>=2&&x.slice(-f.length)===f){out.push(x.slice(0,-f.length));break}}});return out}
 function dl(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;var d=[],i,j;for(i=0;i<=a.length;i++){d[i]=[i]}for(j=0;j<=b.length;j++)d[0][j]=j;
  for(i=1;i<=a.length;i++){var lo=1e9;for(j=1;j<=b.length;j++){var c=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);if(d[i][j]<lo)lo=d[i][j]}if(lo>max)return max+1}return d[a.length][b.length]}

 /* ---- lexicon: topic -> words / phrases (written naturally, normalised at start-up). "*" = prefix ---- */
 var RAW={
  p_nabulsi:"نابلسي|نابلسيه|نابلس|نابلسي سائل|زيت زيتون|زيت الزيتون|زيتون|nabulsi|nablusi|nablus|nabulsy|olive",
  p_shea:"شيا|شيه|الشيا|زبده الشيا|زبده|شي باتر|shea|butter|shia",
  p_laurel:"غار|زيت الغار|غاري|حلبي|صابون حلبي|laurel|aleppo|ghar|bay leaf",
  p_laundry:"غسيل|الغسيل|غسيل الملابس|ملابس|اواعي|هدوم|تياب|ثياب|غساله|بقع|بقعه|منظف ملابس|laundry|clothes|clothing|stain*|washing machine|ghaseel",
  p_moroccan:"مغربي|مغربيه|المغرب|حمام مغربي|الحمام المغربي|صابون اسود|صابون بلدي|كيس مغربي|ليفه|تقشير|مقشر|سكراب|morocc*|hammam|black soap|scrub|exfoliat*|kessa|maghribi",
  p_duo:"ثنائي|ثنائي الشيا|duo|ritual|ريتشوال|عبوتين",
  p_home:"مجموعه المنزل|مجموعه اولغا|مجموعه اولغا للمنزل|سيت|ست عبوات|6 عبوات|بكج|باكج|بكيج|عائلي|عائليه|home set|set|bundle|package|family pack|6 bottles",
  greet:"مرحبا|مرحبتين|مرحب*|اهلا|اهلين|هلا|هلو|سلام|السلام عليكم|سلام عليكم|صباح الخير|صباح النور|مسا الخير|مساء الخير|مسا النور|صباحو|مساكم|هالو|hi|hello|hey|hola|hii|marhaba|mar7aba|ahlan|salam|salaam|good morning|good evening|good afternoon|yo",
  thanks:"شكرا|شكران|مشكوره|مشكور|يسلمو|يسلموا|يسلم*|تسلمي|تسلم|تسلميلي|يعطيكي العافيه|يعطيك العافيه|الله يعطيكي العافيه|ممنونه|ممنون|ميرسي|مرسي|جزاكي الله خير|thank*|thx|thanx|ty|merci|shukran|yslmo|appreciate*",
  bye:"باي|مع السلامه|بخاطرك|يلا باي|تصبحي على خير|تصبحو على خير|سلام عليكي|bye|goodbye|good night|see you|cya",
  howru:"كيفك|كيفيك|كيف حالك|كيف الحال|شلونك|شو اخبارك|شخبارك|كيفك اليوم|انتي منيحه|عامله ايه|ازيك|how are you|how r u|hru|whats up|how is it going|kifik|keefik|kifek",
  who:"مين انتي|مين انت|شو اسمك|ما اسمك|اسمك|انتي روبوت|روبوت|بوت|ذكاء اصطناعي|انتي انسانه|انسانه|حقيقيه|مين حكيت|who are you|your name|are you a bot|robot|chatbot|ai|are you human|are you real",
  price:"سعر|اسعار|السعر|الاسعار|سعره|سعرها|اسعاركم|بكم|بكام|بقديش|قديش|قداش|قد ايش|قدي|كم حق|حقه|حقها|حق|ثمن|ثمنه|تكلفه|كلفه|دينار|دنانير|ليره|price*|cost*|how much|jod|jd|dinar*|bkam|b2adesh|2adesh|adesh|ad2esh|se3r|si3r|sa3r",
  size:"حجم|احجام|الحجم|الاحجام|مل|ملي|ميلي|لتر|غرام|غم|كيلو|كبير|الكبير|كبيره|الكبيره|كبار|صغير|الصغير|صغيره|الصغيره|زغير|زغيره|وسط|عبوه|عبوات|قنينه|قزازه|size*|ml|liter|litre|gram*|big|small|large|bottle*|kbeer|zgheer",
  order:"اطلب|بطلب|نطلب|اطلبي|طلب|الطلب|طلبيه|اوردر|اشتري|شراء|اشتريت|اشتراء|سله|السله|سلتي|اتمام الطلب|اضيف للسله|اضافه للسله|كيف بطلب|كيف اطلب|طريقه الطلب|order*|buy|purchase|checkout|cart|add to bag|how to order|atlob",
  want:"بدي|ابغى|ابي|اريد|بدنا|حابه|حاب|بحب اخد|اعطيني|عطيني|بدّي|want|need|id like|would like|give me|baddi|bde|bdi",
  delivery:"توصيل|التوصيل|توصيله|يوصل|توصلو|بتوصلو|بتوصلوا|بيوصل|بيوصلني|يوصلني|توصلي|شحن|الشحن|مندوب|دليفري|ديلفري|ارسال|بتبعتو|delivery|deliver*|ship*|courier|tawseel",
  dtime:"متى|امتى|ايمتى|امتا|ايمتا|كم يوم|كم ساعه|قديش بياخد|بياخد|مده|المده|وقت|بسرعه|سريع|اليوم|بكره|بكرا|نفس اليوم|when|how long|how many days|how soon|fast|today|tomorrow|same day",
  fee:"رسوم|اجره|اجور|كلفه التوصيل|سعر التوصيل|حق التوصيل|اجره التوصيل|مجاني|ببلاش|مجانا|فري|fee*|free|charge*|shipping cost|delivery cost",
  abroad:"خارج الاردن|برا الاردن|السعوديه|فلسطين|الضفه|رام الله|القدس|الامارات|دبي|الكويت|قطر|البحرين|عمان السلطنه|سوريا|لبنان|العراق|مصر|امريكا|اوروبا|بريطانيا|المانيا|تركيا|دولي|abroad|international|outside jordan|saudi|uae|dubai|kuwait|qatar|palestine|usa|uk|europe|worldwide",
  pay:"دفع|ادفع|بدفع|الدفع|طريقه الدفع|كاش|نقدي|نقدا|نقد|عند الاستلام|كليك|cliq|click|محفظه|محافظ|زين كاش|اورنج موني|امنيه|فيزا|visa|ماستر|master*|بطاقه|كريدت|credit|card|تحويل|حواله|pay*|cash|wallet|apple pay|zain cash|orange money",
  returns:"ارجاع|ارجع|ارجعه|استرجاع|استرداد|ترجيع|رجع|رجعه|مرتجع|تبديل|ابدل|بدل|استبدال|سياسه الارجاع|ضمان|return*|refund*|exchange|replace*|warranty|guarantee",
  complaint:"شكوى|اشتكي|مشكله|مشكلتي|مشاكل|خربان|خربانه|مكسور|مكسوره|انكسر|انكسرت|تالف|تالفه|فاسد|متاخر|تاخر|تاخرتو|ما وصل|ماوصل|ما وصلني|ماوصلني|غلط|خطا|زعلانه|مش راضيه|سيء|سيئ|complain*|problem|broken|damaged|leak*|late|wrong|issue|bad|angry|disappointed",
  status:"وين طلبي|حاله الطلب|طلبي|رقم الطلب|تتبع|تتبع الطلب|order status|track*|my order|where is my order",
  contact:"واتس|واتساب|واتس اب|وتساب|واتسب|whatsapp|whats app|رقم|رقمكم|نمره|تلفون|تليفون|هاتف|موبايل|جوال|اتصل|بتصل|اتواصل|تواصل|التواصل|ايميل|بريد|email|e mail|mail|phone|call|contact*|number|انستغرام|انستا|انستجرام|فيسبوك|فيس|تيك توك|instagram|insta|facebook|tiktok|social",
  where:"وين|فين|مكان|مكانكم|محل|محلكم|محلات|فرع|فروع|عنوان|عنوانكم|موقعكم|معرض|صيدليه|صيدليات|سوبرماركت|مول|متوفر في|بلاقيه|القاه|location|address|store|shop|branch|where are you|pharmacy|supermarket|mall",
  hours:"دوام|الدوام|ساعات|مفتوح|مفتوحين|مسكر|مسكرين|فاتحين|بتفتحو|بتسكرو|اوقات|العطله|عطله|الجمعه|hours|open|closed|opening|working hours",
  ingr:"حافظه|مواد حافظه|ماده حافظه|preservative*|مكونات|مكوناته|المكونات|مكون|تركيبه|التركيبه|تركيبته|مواد|المواد|كيماويات|كيماوي|كيميائي|كيميكال|طبيعي|طبيعيه|طبيعيين|عضوي|اورجانيك|سلفات|بارابين|صوديوم|ingredient*|natural|organic|chemical*|sulfate*|sulphate*|paraben*|sls|composition|what is in|made of",
  smell:"ريحه|ريحته|ريحتها|رائحه|رايحه|عطر|معطر|فواح|ريحه حلوه|smell*|scent*|fragrance|perfume*",
  dry:"جاف|جافه|جفاف|ناشف|ناشفه|نشفان|نشفانه|بتنشف|تنشف|تشقق|تشققات|مشقق|مشققه|قشور|تقشر|ترطيب|مرطب|يرطب|رطوبه|خشن|خشونه|dry*|crack*|moistur*|hydrat*|flaky|rough",
  oily:"دهني|دهنيه|دهون|زيتي|زيتيه|حبوب|حب الشباب|حبوب الوجه|رؤوس سوداء|روس سودا|مسام|بثور|oily|acne|pimple*|blackhead*|pores|breakout*|greasy",
  sensitive:"حساس|حساسه|حساسيه|تهيج|تهيّج|احمرار|حكه|تحسس|بتحسس|بتهيج|sensitive|allerg*|irritat*|redness|itch*|rash",
  eczema:"اكزيما|اكزيمه|صدفيه|التهاب جلد|eczema|psoriasis|dermatitis",
  normal:"عاديه|عادي|مختلطه|مختلط|normal|combination",
  skin:"بشره|بشرتي|البشره|بشرتك|جلد|جلدي|الجلد|skin",
  face:"وجه|وجهي|الوجه|للوجه|face|facial",
  body:"جسم|جسمي|الجسم|استحمام|دوش|شاور|بانيو|body|shower|bath*",
  hands:"ايدين|يدين|ايدي|اليدين|يد|ايد|غسل اليدين|مغسله|المغسله|hand*|sink|hand wash",
  hair:"شعر|شعري|الشعر|فروه|فروه الراس|قشره|تساقط|شامبو|hair|scalp|dandruff|shampoo",
  baby:"طفل|اطفال|الاطفال|ولاد|ولادي|صغار|بيبي|رضيع|رضع|مولود|ابني|بنتي|طفلي|اولادي|عيالي|baby|babies|kid*|child*|infant|newborn|toddler",
  pregnant:"حامل|حمل|مرضع|رضاعه|pregnan*|breastfeed*|nursing",
  men:"رجال|رجالي|زوجي|جوزي|رجل|للرجال|شباب|لحيه|حلاقه|men|man|male|husband|beard|shav*",
  usage:"كيف استعمل|كيف استخدم|كيف بستعمل|كيف بستخدم|طريقه الاستخدام|طريقه الاستعمال|طريقه استخدام|استعمال|استخدام|استعمله|استخدمه|بستعمله|بستعمل|بستخدم|بحطه|كيف بحط|use|usage|how to use|apply|directions|instructions for use",
  often:"كل يوم|يوميا|يومي|مره|مرات|كم مره|اسبوع|اسبوعيا|how often|daily|every day|weekly|times a week",
  last:"بيطول|بتطول|بيكفي|بتكفي|بكفي|يكفي|بيقعد|بيدوم|مده الاستخدام|كميه|last|lasts|how long does|quantity",
  expiry:"صلاحيه|الصلاحيه|انتهاء|تاريخ|ينتهي|بيخرب|بتخرب|تخزين|احفظ|حفظ|بيفسد|expiry|expire*|expiration|shelf life|storage|store it",
  compare:"فرق|الفرق|مقارنه|قارن|قارني|احسن|افضل|اقوى|ولا|vs|versus|difference|differ*|compare|better|best|which one|or",
  rec:"انصح|بتنصح|تنصحي|تنصحيني|نصيحه|نصيحتك|نصحيني|اقترح|اقتراح|اقترحي|بناسب|بيناسب|يناسب|يناسبني|مناسب|مناسبه|بيزبط|ساعديني|اختار|اختاري|شو اخد|شو بتنصحي|recommend*|suggest*|advice|advise|suit*|good for|help me choose|what should|which is good",
  gift:"هديه|هدايا|هديتي|مناسبه|مناسبات|عيد|عيد ميلاد|عيد الام|فالنتاين|توزيعات|عرس|عروس|جهاز|تهنئه|gift*|present|birthday|occasion|mothers day|eid|wedding|bride|valentine",
  offer:"خصم|خصومات|عرض|عروض|تخفيض|تخفيضات|تنزيلات|كوبون|كود|برومو|اوفر|توفير|ارخص|رخيص|غالي|غاليه|discount*|offer*|sale|coupon|promo*|deal*|cheap*|expensive|save|value",
  wholesale:"جمله|بالجمله|تاجر|تجار|تجاري|موزع|موزعين|توزيع|وكيل|وكاله|كميات|كميه كبيره|للمحل|صيدليتي|فندق|فنادق|مطعم|مطاعم|شركات|wholesale|bulk|distribut*|reseller|retailer|hotel*|b2b|partnership|trade",
  about:"مين انتم|مين انتو|مين حضرتكم|شو هي اولغا|اولغا|olga|الشركه|شركه|شركتكم|باتل|battel|براند|ماركه|قصتكم|رؤيتكم|about you|about olga|company|brand|who are you guys|story",
  origin:"صنع|صناعه|مصنوع|منشا|المنشا|بلد المنشا|وين بتنعمل|اردني|اردنيه|محلي|محليه|الاردن|مصنع|made in|origin|jordan*|local|factory|manufactur*",
  quality:"ترخيص|مرخص|شهاده|شهادات|معتمد|معتمده|وزاره|غذاء ودواء|مفحوص|مجرب|امن|امان|سليم|جوده|الجوده|فعال|فعاليه|مفعول|نتيجه|نتايج|نتائج|بيجيب نتيجه|certif*|licens*|approved|tested|safe|safety|quality|effective|results|works",
  vegan:"نباتي|نباتيه|حلال|حيوانات|تجارب على الحيوانات|دهون حيوانيه|vegan|halal|cruelty|animal*",
  stock:"متوفر|متوفره|موجود|موجوده|خلصان|نفذ|available|in stock|out of stock|do you have|have you got",
  catalog:"منتجات|منتجاتكم|المنتجات|شو عندكم|شو بتبيعو|شو في عندكم|كل المنتجات|التشكيله|انواع|الانواع|اصناف|products|catalog*|what do you sell|range|menu|options|types",
  yes:"اه|ايوه|ايوا|اكيد|نعم|تمام|اوكي|اوك|طيب|ماشي|يب|ok|okay|yes|yeah|yep|sure|alright",
  no:"لا|لاء|لأ|مش هلا|ما بدي|لا شكرا|no|nope|not now|no thanks",
  insult:"غبي|غبيه|حمار|تافه|سخيف|سخيفه|زفت|stupid|idiot|dumb|useless",
  love:"بحبك|حبيبتي|حلوه|جميله|عسل|قمر|ثوب|الثوب|ثوبك|تطريز|لبسك|love you|beautiful|cute|pretty|dress",
  foam:"رغوه|رغوته|بيرغي|برغي|فوم|foam*|lather*|bubbl*",
  site:"الموقع|موقعكم|الصفحه|المتجر|التطبيق|الويب|website|site|app|page",
  joke:"نكته|نكت|ضحكيني|احكيلي|سولفي|joke|funny|tell me something",
  jail:"ignore previous|system prompt|instruction*|api key|secret|password|تجاهلي|تجاهل التعليمات|التعليمات|مفتاح|كلمه السر|developer mode"
 };
 var LEX={},PH={};Object.keys(RAW).forEach(function(k){LEX[k]=[];PH[k]=[];RAW[k].split("|").forEach(function(w){var n=norm(w.replace("*",""));if(!n)return;var pre=/\*$/.test(w);
  if(n.indexOf(" ")>-1)PH[k].push(n);else LEX[k].push({w:n,pre:pre})})});
 var FUZ={p_nabulsi:1,p_shea:1,p_laurel:1,p_laundry:1,p_moroccan:1,p_duo:1,p_home:1,delivery:1,dry:1,oily:1,sensitive:1,eczema:1,ingr:1,gift:1,wholesale:1,price:1,baby:1};
 var KNOWN={};Object.keys(LEX).forEach(function(k){LEX[k].forEach(function(e){KNOWN[e.w]=1})});
 var NUMW={"واحد":1,"وحده":1,"وحد":1,"حبه":1,"اثنين":2,"اتنين":2,"تنين":2,"ثنتين":2,"تنتين":2,"زوج":2,"ثلاث":3,"ثلاثه":3,"تلات":3,"تلاته":3,"اربع":4,"اربعه":4,"خمس":5,"خمسه":5,"ست":6,"سته":6,"سبع":7,"سبعه":7,"ثمان":8,"ثمانيه":8,"تمن":8,"تمنيه":8,"تسع":9,"تسعه":9,"عشر":10,"عشره":10,
  "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,"a couple":2,"dozen":12,"درزن":12};
 var AMMAN="عمان|amman|خلدا|الجبيهه|جبيهه|صويلح|طبربور|ماركا|الهاشمي|وادي السير|دابوق|عبدون|الشميساني|شميساني|تلاع العلي|اليادوده|القويسمه|البيادر|الصويفيه|الرابيه|الجاردنز|جبل عمان|اللويبده|المقابلين|ابو نصير|شفا بدران|الدوار السابع|ام اذينه|مرج الحمام|ناعور|سحاب|الجويده|ابو علندا|طريق المطار|خريبه السوق|المدينه الرياضيه|الشونه".split("|").map(norm);
 var OTHER="الزرقاء|زرقاء|الزرقا|زرقا|اربد|العقبه|عقبه|السلط|سلط|مادبا|جرش|عجلون|المفرق|مفرق|الكرك|كرك|الطفيله|طفيله|معان|الرصيفه|رصيفه|الرمثا|رمثا|الفحيص|ماحص|الاغوار|البقعه|عين الباشا|الهاشميه|الضليل|الازرق|الشوبك|البتراء|وادي موسى|ديرعلا|دير علا|الشونه الجنوبيه|ذيبان|zarqa|irbid|aqaba|salt|madaba|jerash|ajloun|mafraq|karak|tafilah|tafila|maan|russeifa|ramtha|fuheis".split("|").map(norm);
 var CITY={};AMMAN.concat(OTHER).forEach(function(c){CITY[c]=1});
 var ARABIZI=/\b(shu|sho|kam|bkam|b2adesh|2adesh|adesh|baddi|bde|bdi|3nd?kom|3ndkm|marhaba|mar7aba|kifik|keefik|kifek|ahlan|yslmo|shukran|mnee7|mni7a|7abibti|wen|wein|fe|fi|mesh|msh|ana|enti|inti|se3r|si3r|sa3r|ghaseel|tawseel|atlob|bshrti|bashra|zgheer|kbeer|el|al)\b|[a-z]+[2379][a-z]+/i;

 function analyse(q){var n=norm(q),toks=n.split(" ").filter(Boolean),pad=" "+n+" ",hit={},tokSt=toks.map(stems);
  Object.keys(LEX).forEach(function(k){var sc=0;PH[k].forEach(function(p){if(pad.indexOf(" "+p+" ")>-1||(p.length>5&&n.indexOf(p)>-1))sc+=2});
   LEX[k].forEach(function(e){var w=e.w;for(var i=0;i<toks.length;i++){var st=tokSt[i],m=false;
    for(var j=0;j<(w.length<=2?1:st.length)&&!m;j++){var s=st[j];if(s===w)m=true;else if(e.pre&&s.indexOf(w)===0)m=true;else if(w.length>=3&&s.length>=w.length&&s.length<=w.length+4&&s.indexOf(w)===0&&/[\u0621-\u064A]/.test(w)&&w.length>=4)m=true}
    if(!m&&FUZ[k]&&w.length>=5&&!/^\d+$/.test(w)&&!st.some(function(x){return KNOWN[x]||CITY[x]})){var mx=w.length>=8?2:1;for(j=0;j<st.length&&!m;j++){if(st[j].length>=4&&dl(st[j],w,mx)<=mx)m=true}}
    if(m){sc+=w.length<=2?0.6:1;break}}});
   if(sc>0)hit[k]=sc});
  if(/^(هاي|هاي شمس|هاي يا شمس|هاي حبيبتي)$/.test(n))hit.greet=1;
  // numbers, quantities and sizes
  var nums=[],size=null;toks.forEach(function(t,i){var v=null;if(/^\d+(\.\d+)?$/.test(t))v=+t;else if(NUMW[t]!=null)v=NUMW[t];else{var st=stems(t);for(var j=0;j<st.length;j++)if(NUMW[st[j]]!=null){v=NUMW[st[j]];break}}
   if(v!=null&&toks[i+1]&&/^(عبوات|عبوه|bottles)$/.test(toks[i+1])&&/(مجموعه|سيت|set|بكج|home)/.test(n))v=null;
   if(v!=null){if(v===300||v===900||v===1800||v===1.8||v===0.9){size=size||(v===300?"s":(v===1800||v===1.8?"xl":"l"))}else if(v>0&&v<=200&&!(toks[i+1]&&/^(مل|ml|ملي|غ|غم|غرام|g)$/.test(toks[i+1])))nums.push({v:v,i:i})}});
  if(!size){if(/(^| )(ال)?(كبير|كبيره|كبار|big|large|kbeer)( |$)/.test(n))size="l";else if(/(^| )(ال)?(صغير|صغيره|صغار|زغير|زغيره|small|zgheer)( |$)/.test(n))size="s"}
  var city=null,inC=function(c){if(pad.indexOf(" "+c+" ")>-1)return true;if(c.indexOf(" ")>-1)return false;for(var i=0;i<tokSt.length;i++)if(tokSt[i].indexOf(c)>-1)return true;return false};
  AMMAN.forEach(function(c){if(!city&&inC(c))city="amman"});OTHER.forEach(function(c){if(!city&&inC(c))city="other"});
  var sizes=[];toks.forEach(function(t,i){var s2=null;if(t==="300")s2="s";else if(t==="900")s2="l";else{var st=stems(t);if(st.some(function(x){return /^(كبير|كبيره|كبار|big|large|kbeer)$/.test(x)}))s2="l";else if(st.some(function(x){return /^(صغير|صغيره|صغار|زغير|زغيره|small|zgheer)$/.test(x)}))s2="s"}if(s2)sizes.push({s:s2,i:i})});
  // products (laundry beats plain "nabulsi" when clothes words are present)
  var P=[];["p_nabulsi","p_shea","p_laurel","p_laundry","p_moroccan","p_duo","p_home"].forEach(function(k){if(hit[k])P.push({k:k,i:firstIdx(toks,tokSt,k)})});
  if(hit.p_laundry&&hit.p_nabulsi&&!/سائل|liquid|يدين|ايدين|استحمام|hand|shower|جسم/.test(n))P=P.filter(function(x){return x.k!=="p_nabulsi"});
  if(hit.p_duo&&hit.p_shea&&!/(شيا|شيه|shea)/.test(n.replace(/(ثناي?ي|duo) ?(ال)?(شيا|شيه|shea)|(شيا|شيه|shea) ?(ritual )?duo/g,"")))P=P.filter(function(x){return x.k!=="p_shea"});
  if(hit.p_home&&hit.p_shea&&!/(شيا|شيه|shea)/.test(n.replace(/(مجموعه|سيت|set|بكج)[^ ]* ?(اولغا )?(للمنزل )?(ال)?(شيا|شيه|shea)?/g,"")))P=P.filter(function(x){return x.k!=="p_shea"});
  if(hit.p_shea&&!/شيا|شيه|shea|shia/.test(n)&&hit.p_shea<1.5)P=P.filter(function(x){return x.k!=="p_shea"}); // "زبده" alone is weak
  P.sort(function(a,b){return a.i-b.i});
  var ids=P.map(function(x){return {p_nabulsi:"nabulsi",p_shea:"shea",p_laurel:"laurel",p_laundry:"laundry",p_moroccan:"moroccan",p_duo:"shea-duo",p_home:"home-set"}[x.k]});
  if(!size&&sizes.length)size=sizes[0].s;
  return {n:n,toks:toks,hit:hit,ids:ids,pos:P.map(function(x){return x.i}),nums:nums,size:size,sizes:sizes,city:city,arabizi:ARABIZI.test(n)&&!/[\u0621-\u064A]/.test(n)}}
 function firstIdx(toks,tokSt,k){for(var i=0;i<toks.length;i++){for(var j=0;j<tokSt[i].length;j++){var s=tokSt[i][j];for(var e=0;e<LEX[k].length;e++){var w=LEX[k][e].w;if(s===w||(LEX[k][e].pre&&s.indexOf(w)===0)||(w.length>=5&&s.length>=4&&dl(s,w,1)<=1))return i}}}return 99}
 return {norm:norm,analyse:analyse};
})();

/* live delivery fees from the Olga control panel (same source as the checkout) */
var FEES={amman:null,other:null};
(function(){try{var u=(CFG.dbUrl||"https://sktmniwsdipeaocxkykz.supabase.co").replace(/\/+$/,""),k=CFG.dbKey||"sb_publishable_z3nEmyXGA5H-fKXp1NdA-w_hSwYslK2";fetch(u+"/rest/v1/app_settings?select=value&key=eq.store",{headers:{apikey:k,Accept:"application/json"}})
 .then(function(r){return r.ok?r.json():null}).then(function(rows){var v=rows&&rows[0]&&rows[0].value;if(!v)return;var a=+v.deliveryAmman,o=+v.deliveryOther;if(isFinite(a))FEES.amman=a;if(isFinite(o))FEES.other=o}).catch(function(){})}catch(e){}})();

var CTX={p:[],topic:"",miss:0,ask:"",age:9,size:null};
function pLine(p,L){return "• <b>"+esc(p.name[L])+"</b> — "+p.variants.map(function(v){return esc(v.size[L])+": "+v.price.toFixed(2)+(L==="ar"?" د.أ":" JOD")}).join(" · ")}
function chips(list,L){return '<div class="olh-acts">'+list.map(function(x){return '<button type="button" class="olh-btn olh-btn--ol" data-olh-q="'+esc(x)+'">'+esc(x)+'</button>'}).join("")+'</div>'}
function waLink(L){return '<a href="'+esc(WA)+'" target="_blank" rel="noopener noreferrer">'+(L==="ar"?"واتساب أولغا":"Olga on WhatsApp")+'</a>'}
function feeText(L,city){var A=FEES.amman,O=FEES.other,m=function(v){return v.toFixed(2)+(L==="ar"?" د.أ":" JOD")};
 if(A==null||O==null)return L==="ar"?"رسوم التوصيل لمدينتك بتظهر بالسلة قبل ما تأكدي الطلب.":"The delivery fee for your city appears in the bag before you confirm.";
 if(city==="amman")return L==="ar"?"التوصيل داخل عمّان: <b>"+m(A)+"</b>.":"Delivery within Amman: <b>"+m(A)+"</b>.";
 if(city==="other")return L==="ar"?"التوصيل لمدينتك: <b>"+m(O)+"</b>.":"Delivery to your city: <b>"+m(O)+"</b>.";
 return L==="ar"?"رسوم التوصيل: عمّان <b>"+m(A)+"</b>، وباقي المحافظات <b>"+m(O)+"</b>.":"Delivery fee: Amman <b>"+m(A)+"</b>, other governorates <b>"+m(O)+"</b>."}
function feeVal(city){return city==="amman"?FEES.amman:(city==="other"?FEES.other:null)}
function guide(id,L){return (OLH_GUIDE[id]||{})[L]||null}

function localReply(q,L){CTX.age++;var A=SHB.analyse(q),H=A.hit,t=T[L],P=K.products,by=function(id){return P.filter(function(p){return p.id===id})[0]};
 if(A.arabizi)L="ar";
 if(A.size)CTX.size=A.size;else if(CTX.age<=2&&CTX.size&&(A.nums.length||H.order||H.want)&&!A.ids.length)A.size=CTX.size;
 var ar=L==="ar",S=[],ids=[],key=null,sug=null,m=function(v){return v.toFixed(2)+(ar?" د.أ":" JOD")};
 var has=function(k){return !!H[k]};
 if(H.abroad&&!(H.delivery||H.order||H.fee||H.want||/(بتوصل|توصل|ship|send|deliver)/.test(A.n)))delete H.abroad;
 if(H.price&&(H.last||H.expiry||H.dtime||H.often)&&!/(سعر|بكم|بكام|ثمن|price|cost|دينار)/.test(A.n))delete H.price;
 var topics=Object.keys(H).filter(function(k){return k.indexOf("p_")!==0});
 var prods=A.ids.slice();
 var refer=/(^| )(هاد|هذا|هذه|هاي|هيدا|هو|هي|اياه|منه|منها|عنه|عنها|it|this|that|its|one|the same)( |$)/.test(A.n)||A.toks.some(function(x){return /^[\u0621-\u064A]{3,}(ه|ها)$/.test(x)&&!/^(كميه|مده|طريقه|بشره|صلاحيه|ريحه|رائحه|تكلفه|كلفه|قنينه|عبوه|هديه|مناسبه|اولغا|شيه)$/.test(x)})||!!A.size||A.nums.length>0||(A.toks.length<=3&&/^و/.test(A.toks[0]||""))||(A.toks.length<=2&&CTX.age<=1&&!/(اسعار|الاسعار|احجام|الاحجام|منتجات|المنتجات|prices|sizes|products)/.test(A.n));
 var scoped=has("price")||has("size")||has("usage")||has("ingr")||has("last")||has("often")||has("smell")||A.nums.length||A.size;
 var fromCtx=false;if(!prods.length&&CTX.p.length&&CTX.age<=3&&scoped&&refer&&!H.pregnant&&!H.baby&&!H.dry&&!H.oily&&!H.sensitive&&!H.eczema&&!H.hair){prods=CTX.p.slice(0,2);fromCtx=true;if(A.size&&prods.every(function(id){var p=by(id);return p&&p.variants.length===1})){prods=[];fromCtx=false}}
 if(!prods.length&&!topics.length&&CTX.p.length&&CTX.age<=2&&/(^| )(هاد|هذا|هاي|هيدا|هو|this|that|it)( |$)/.test(A.n))prods=CTX.p.slice(0,1);
 if(H.no&&H.want&&A.toks.length<=3){delete H.want;topics=Object.keys(H).filter(function(k){return k.indexOf("p_")!==0})}
 var empty=!A.n.replace(/[\s\d]/g,"").length;

 if(empty&&!A.nums.length)return {h:esc(ar?"أنا هون 🌿 اكتبيلي سؤالك بأي طريقة، وأنا بفهم عليكِ.":"I'm here 🌿 type your question any way you like and I'll understand."),ids:[],a:null};
 if(has("jail"))return {h:esc(ar?"أنا شمس، ومهمتي أساعدك تختاري منتجات أولغا الطبيعية 🌿 شو حابة تعرفي عن الصابون؟":"I'm Shams and I'm here to help you with Olga's natural products 🌿 What would you like to know?"),ids:[],a:null};

 var social=["greet","thanks","bye","howru","who","yes","no","insult","love","joke","dtime"],only=topics.every(function(k){return social.indexOf(k)>-1})&&!prods.length&&!A.nums.length;
 // ---- pure social messages ----
 if(only&&topics.length){
  if(has("thanks")){CTX.miss=0;var tx=(LINES["x.thanks"]||{})[L];return {h:esc((tx||(ar?"العفو يا قلبي، أنا هون إذا احتجتيني.":"You're very welcome. I'm here if you need me."))+" 🤍"),ids:[],a:tx?"x.thanks":null}}
  if(has("bye"))return {h:esc(ar?"مع السلامة يا قمر 🌿 نوّرتي متجر أولغا، وأنا هون أي وقت بتحتاجيني.":"Take care 🌿 it was lovely having you at Olga — I'm here anytime."),ids:[],a:null};
  if(has("insult"))return {h:esc(ar?"حقك عليّ إذا ما فهمت عليكِ منيح 🙏 جربي تحكيلي بكلمات تانية وأنا رح أعطيكِ جواب واضح.":"Sorry if I missed what you meant 🙏 try saying it another way and I'll give you a clear answer."),ids:[],a:null};
  if(has("who"))return {h:esc(ar?"أنا شمس 🌿 المساعدة الذكية بمتجر أولغا، لابسة ثوب بلادي ومعي كل معلومات المنتجات والأسعار والتوصيل. اسأليني أي إشي!":"I'm Shams 🌿 Olga's smart assistant, in my Palestinian thobe, with everything about our products, prices and delivery. Ask me anything!"),ids:[],a:null};
  if(has("howru"))return {h:esc(ar?"الحمدلله بخير، وأحلى لما إجيتي 🌿 كيف بقدر أساعدك اليوم؟":"I'm great, thank you — even better now you're here 🌿 How can I help today?")+chips(t.q.slice(0,3),L),ids:[],a:null};
  if(has("love"))return {h:esc(ar?"تسلميلي يا عسل 🤍 هاد ثوب بلادي وبعتز فيه. خليني رجّعلك الحب بنصيحة حلوة: شو نوع بشرتك؟":"Aww, thank you 🤍 this is my Palestinian thobe and I'm proud of it. Let me return the kindness — what's your skin type?")+chips(ar?["بشرتي جافة","بشرتي دهنية","بشرتي حساسة"]:["Dry skin","Oily skin","Sensitive skin"],L),ids:[],a:null};
  if(has("joke"))return {h:esc(ar?"مرة صابونة نابلسية قالت لصاحبتها: ليش زعلانة؟ قالتلها: كل ما حدا يستعملني بخلص! 😄 بس صابون أولغا 900 مل بيطوّل معك كتير 😉":"A bar of soap walks into a bathroom… and slips away 😄 Luckily Olga's 900 ml bottles last a long time 😉"),ids:[],a:null};
  if(has("no")&&!has("greet"))return {h:esc(ar?"ولا يهمك 🤍 أنا هون إذا احتجتي أي إشي.":"No problem 🤍 I'm here if you need anything."),ids:[],a:null};
  if(has("yes")&&!has("greet")){if(CTX.ask==="skin")return {h:esc(ar?"تمام! شو نوع بشرتك؟":"Great! What's your skin type?")+chips(ar?["بشرتي جافة","بشرتي دهنية","بشرتي حساسة","بشرتي عادية"]:["Dry skin","Oily skin","Sensitive skin","Normal skin"],L),ids:[],a:null};
   return {h:esc(ar?"تمام 🌿 شو حابة نحكي فيه؟":"Great 🌿 what would you like to know?")+chips(t.q,L),ids:[],a:null}}
  if(has("greet"))return {h:esc(t.hi),ids:[],a:"r.hi"};
 }
 var pre=has("greet")?(ar?"أهلين فيكِ 🌿 ":"Hi there 🌿 "):(has("thanks")?(ar?"العفو يا قلبي 🤍 ":"You're welcome 🤍 "):"");

 // ---- support cases where the team is genuinely needed ----
 if(has("complaint")&&(has("order")||has("status")||has("delivery")||/(وصل|وصلني|ما اجا|طلبي|order|arrived|received)/.test(A.n)||has("returns"))){CTX.miss=0;
  return {h:esc(ar?"بعتذر منك كتير 🙏 هاد مش الإشي اللي بنحبه إلك. عشان نحلّها فوراً، ابعتي لفريق أولغا رقم طلبك أو اسمك على ":"I'm so sorry 🙏 that's not the experience we want for you. To fix it right away, send your order number or name to ")+waLink(L)+esc(ar?" أو اتصلي على ‎+962 79 200 0155‎ — وأكيد رح يرتّبوها معك.":" or call +962 79 200 0155 — they'll sort it out with you."),ids:[],a:null}}
 if(has("status")&&!has("pay")){return {h:esc(ar?"حالة طلبك بيتابعها فريق أولغا مباشرة؛ بعد التأكيد بيتواصلوا معك لتحديد موعد التوصيل. إذا حابة تستعجلي أو تسألي عن طلب معيّن، ابعتيلهم رقم الطلب على ":"Your order is handled directly by the Olga team, who contact you after confirming to set the delivery time. To ask about a specific order, send its number on ")+waLink(L)+".",ids:[],a:null}}
 if(has("returns")){return {h:esc(ar?"رضاكِ عنا أهم إشي 🤍 إذا وصلك منتج فيه أي مشكلة أو حابة تبدّلي، فريق أولغا بيرتّب معك الحل حسب حالة الطلب — تواصلي معهم على ":"Your happiness comes first 🤍 if a product arrives with any issue or you'd like an exchange, the Olga team will arrange it with you — reach them on ")+waLink(L)+".",ids:[],a:null}}
 if(has("wholesale")){return {h:esc(K.wholesale[L]),ids:[],a:"r.wholesale"}}
 if(has("contact")&&!has("pay")&&!prods.length&&!has("order")){return {h:esc(ar?"أكيد! هاي طرق التواصل مع أولغا 🌿":"Of course! Here's how to reach Olga 🌿")+"\n• "+waLink(L)+" — ‎+962 79 200 0155‎\n• "+esc(ar?"الجملة (باتل): ‎+962 79 673 8495‎":"Wholesale (BatteL): +962 79 673 8495")+"\n• "+esc("batte.jor9@gmail.com")+"\n• Instagram · Facebook: <b>olga.jo11</b>\n"+esc(ar?"وأنا كمان هون أجاوبك عن أي سؤال 💛":"And I'm right here for any question 💛"),ids:[],a:null}}

 // ---- order calculation: quantities x products (+ delivery) ----
 var wantBuy=has("order")||has("want")||A.nums.length>0;
 if(prods.length&&A.nums.length&&wantBuy){var lines=[],sum=0,amb=false;
  prods.forEach(function(id,pi){var p=by(id);if(!p)return;var pos=A.pos[pi]!=null?A.pos[pi]:99,q=1,best=99;A.nums.forEach(function(x){var d=Math.abs(x.i-pos)+(x.i>pos?0.5:0);if(d<best&&d<=2.5){best=d;q=x.v}});
   if(prods.length===1&&A.nums.length)q=A.nums[0].v;
   var sz=A.size;if(prods.length>1&&A.sizes.length>1){var bd=99;A.sizes.forEach(function(x){var d=Math.abs(x.i-pos);if(d<bd&&d<=3){bd=d;sz=x.s}})}
   var v=p.variants.length===1?p.variants[0]:(sz==="l"?p.variants[1]:(sz==="s"?p.variants[0]:null));
   if(v){lines.push("• "+q+" × <b>"+esc(p.name[L])+"</b> ("+esc(v.size[L])+") = <b>"+m(q*v.price)+"</b>");sum+=q*v.price}
   else{amb=true;lines.push("• "+q+" × <b>"+esc(p.name[L])+"</b>: "+p.variants.map(function(vv){return esc(vv.size[L])+" = <b>"+m(q*vv.price)+"</b>"}).join(ar?" أو ":" or "))}});
  if(lines.length){var fee=feeVal(A.city),out=esc(ar?"حسبتلك الطلب 🧮":"Here's your order total 🧮")+"\n"+lines.join("\n");
   if(!amb){out+="\n"+esc(ar?"مجموع المنتجات: ":"Products: ")+"<b>"+m(sum)+"</b>";if(fee!=null)out+="\n"+esc(ar?"التوصيل: ":"Delivery: ")+m(fee)+"\n"+esc(ar?"الإجمالي: ":"Total: ")+"<b>"+m(sum+fee)+"</b>";else out+="\n"+feeText(L,A.city)}
   else out+="\n"+esc(ar?"خبريني أي حجم بدك (300 مل ولا 900 مل) وبحسبلك الإجمالي بالضبط.":"Tell me which size (300 ml or 900 ml) and I'll give you the exact total.");
   out+="\n"+esc(ar?"للطلب: افتحي المنتج، اختاري الحجم والكمية واضغطي «أضف للسلة» ثم «إتمام الطلب» 🛍️":"To order: open the product, choose size and quantity, tap Add to bag, then Checkout 🛍️");
   CTX.p=prods;CTX.age=0;CTX.miss=0;return {h:pre+out,ids:prods,a:null}}}

 // ---- answer every topic found, most important first ----
 var add=function(x){if(x&&S.indexOf(x)<0)S.push(x)};
 if(H.compare&&!/(فرق|مقارن|قارن|vs|versus|differ|compare)/.test(A.n)&&prods.length<2){delete H.compare;H.rec=(H.rec||0)+1;topics=Object.keys(H).filter(function(k){return k.indexOf("p_")!==0})}
 var skinType=has("eczema")?"eczema":has("dry")?"dry":has("oily")?"oily":has("sensitive")?"sensitive":(has("normal")&&(has("skin")||has("rec")))?"normal":null;

 // skin / needs based recommendation
 if(skinType||has("face")&&!prods.length||has("hair")||has("baby")||has("pregnant")||has("men")||(has("rec")&&!prods.length&&!A.size)||(has("skin")&&!prods.length&&!has("ingr"))){
  if(skinType==="dry"){add(esc(ar?"للبشرة الجافة بنصحك بصابون الشيا السائل 💛 زبدة الشيا بترطّب بعمق وبتحمي من الجفاف والتشقق، والنعومة بتدوم طول اليوم.":"For dry skin I recommend the Shea Butter Liquid Soap 💛 shea butter moisturises deeply and protects against dryness and cracking.")+"\n"+pLine(by("shea"),L));ids.push("shea","shea-duo");if(!S.length||S.length===1)key=null}
  if(skinType==="oily"){add(esc(ar?"للبشرة الدهنية أو المعرّضة للحبوب، صابون الغار السائل هو الأنسب 🌿 زيت الغار مطهّر ومهدّئ وبيحافظ على توازن البشرة بدون ما ينشّفها.":"For oily or blemish-prone skin, the Liquid Laurel Soap is the best fit 🌿 laurel oil purifies and soothes while keeping the skin balanced.")+"\n"+pLine(by("laurel"),L));ids.push("laurel")}
  if(skinType==="sensitive"){add(esc(ar?"للبشرة الحساسة كل منتجات أولغا بدون سلفات أو بارابين وتركيبتها طبيعية 99% 🤍 بنصحك بصابون الغار السائل المهدّئ، أو النابلسي بزيت الزيتون اللطيف جداً. جربي أول مرة على مساحة صغيرة.":"For sensitive skin, every Olga product is sulfate- and paraben-free and 99% natural 🤍 I suggest the soothing Liquid Laurel Soap or the very gentle olive-oil Nabulsi. Try a small area first.")+"\n"+pLine(by("laurel"),L)+"\n"+pLine(by("nabulsi"),L));ids.push("laurel","nabulsi")}
  if(skinType==="normal"){add(esc(ar?"للبشرة العادية أو المختلطة، الصابون النابلسي السائل بزيت الزيتون خيار يومي رائع للعيلة كلها، ومع الوقت بتقدري تجربي الغار للتنقية.":"For normal or combination skin, the olive-oil Nabulsi Liquid Soap is a wonderful everyday choice for the whole family; laurel is great for extra purifying.")+"\n"+pLine(by("nabulsi"),L));ids.push("nabulsi","laurel")}
  if(skinType==="eczema"){add(esc(ar?"بحالات الأكزيما أو الصدفية بنصحك تستشيري طبيبك أول 🤍 وبشكل عام كتير بيرتاحوا مع صابون الشيا السائل لأنه مرطّب جداً وبدون سلفات أو بارابين. جربيه على مساحة صغيرة.":"With eczema or psoriasis please check with your doctor first 🤍 generally people find the Shea Butter Liquid Soap comfortable as it's very moisturising and sulfate/paraben-free. Patch-test first.")+"\n"+pLine(by("shea"),L));ids.push("shea")}
  if(has("face")&&!skinType&&!prods.length)add(esc(ar?"للوجه: إذا بشرتك دهنية أو فيها حبوب اختاري الغار، وإذا جافة اختاري الشيا، ولتنظيف عميق وإشراقة مرة أو مرتين بالأسبوع جربي صابون الحمّام المغربي ✨":"For the face: laurel for oily or blemish-prone skin, shea for dry skin, and the Moroccan Hammam Soap once or twice a week for deep cleansing and glow ✨"));
  if(has("hair"))add(esc(ar?"منتجات أولغا مصمّمة لليدين والجسم، وما عنا شامبو مخصّص حالياً. بس صابون الغار معروف من زمان بتنقية فروة الراس، وإذا حابة تجربيه للشعر ابدئي بكمية صغيرة 🌿":"Olga's products are made for hands and body — we don't have a dedicated shampoo yet. Laurel soap is traditionally used to purify the scalp; if you'd like to try it on hair, start with a small amount 🌿"));
  if(has("baby")){add(esc(ar?"للأطفال 👶 صابون الغسيل النابلسي مثالي لملابسهم، بيشيل البقع وما بيهيّج البشرة الحساسة. ولبشرتهم، الصابون النابلسي السائل لطيف ومناسب للعيلة كلها كبار وصغار.":"For little ones 👶 the Nabulsi Laundry Soap is ideal for their clothes — it lifts stains without irritating sensitive skin. For their skin, the gentle Nabulsi Liquid Soap suits the whole family.")+"\n"+pLine(by("laundry"),L)+"\n"+pLine(by("nabulsi"),L));ids.push("laundry","nabulsi")}
  if(has("pregnant"))add(esc(ar?"تركيبات أولغا طبيعية 99% وبدون سلفات أو بارابين، وكتير أمهات بيختاروا الشيا للترطيب أو النابلسي اللطيف 🤍 وإذا عندك أي حساسية خاصة خلال الحمل استشيري طبيبتك.":"Olga formulas are 99% natural and free from sulfates and parabens; many mums choose shea for moisture or the gentle Nabulsi 🤍 if you have specific sensitivities during pregnancy, check with your doctor."));
  if(has("men"))add(esc(ar?"للرجال كمان 💪 الغار ممتاز للبشرة الدهنية والتعرّق، والنابلسي بزيت الزيتون للاستحمام اليومي، والحمّام المغربي لتنظيف عميق.":"For men too 💪 laurel is great for oily skin, the olive-oil Nabulsi for daily showers, and the Moroccan hammam for deep cleansing."));
  if(!S.length&&!A.size&&(has("rec")||has("skin"))){CTX.ask="skin";add(esc(ar?"أكيد بساعدك 🌿 خبريني شو نوع بشرتك عشان أعطيكِ الأنسب بالضبط. وبشكل عام هاي اختياراتي:":"Of course 🌿 tell me your skin type so I can pick the perfect one. Meanwhile, my picks:")+"\n"+pLine(by("nabulsi"),L)+"\n"+pLine(by("shea"),L)+"\n"+pLine(by("laurel"),L)+chips(ar?["بشرتي جافة","بشرتي دهنية","بشرتي حساسة","بشرتي عادية"]:["Dry skin","Oily skin","Sensitive skin","Normal skin"],L));ids.push("nabulsi","shea","laurel")}
 }

 // product specific topics
 if(prods.length){var many=prods.length>1;
  if(has("compare")&&many){add(prods.slice(0,3).map(function(id){var p=by(id),g=guide(id,L);return "<b>"+esc(p.name[L])+"</b>: "+esc(p.desc[L])+(g&&g.why?"\n"+esc((ar?"الأنسب لـ: ":"Best for: ")+g.why.slice(0,2).join(ar?"، ":", ")):"")+"\n"+pLine(p,L).replace(/^• <b>[^<]*<\/b> — /,"💰 ")}).join("\n\n")+"\n"+esc(ar?"كلهم طبيعيين وبدون سلفات أو بارابين — والاختيار بيعتمد على بشرتك 🌿":"All are natural and sulfate/paraben-free — the choice depends on your skin 🌿"))}
  if(has("face")&&!skinType)prods.slice(0,2).forEach(function(id){add(id==="moroccan"?esc(ar?"أيوه للوجه كمان ✨ بس الحمّام المغربي مرة أو مرتين بالأسبوع بس، مش يومي.":"Yes, for the face too ✨ but the Moroccan hammam only once or twice a week, not daily."):(id==="laundry"?esc(ar?"صابون الغسيل مخصّص للملابس، وللوجه بنصحك بالغار أو النابلسي السائل.":"The laundry soap is for clothes; for the face I'd suggest laurel or Nabulsi liquid soap."):esc(ar?"أيوه بتقدري 🌿 "+by(id).name[L]+" لطيف وبدون سلفات أو بارابين، وبتقدري تستعمليه للوجه يومياً صبح ومسا. إذا بشرتك حساسة ابدئي مرة باليوم.":"Yes 🌿 "+by(id).name[L]+" is gentle and sulfate/paraben-free, fine for the face morning and evening. With sensitive skin, start once a day.")))});
  if(has("usage")||has("often"))prods.slice(0,2).forEach(function(id){var g=guide(id,L),p=by(id);if(g)add("<b>"+esc(p.name[L])+"</b> — "+esc(ar?"طريقة الاستعمال: ":"How to use: ")+esc(g.tip))});
  if(has("ingr"))prods.slice(0,2).forEach(function(id){var g=guide(id,L),p=by(id);add("<b>"+esc(p.name[L])+"</b>: "+esc(g?g.what:p.desc[L])+(g&&g.ing?"\n"+esc((ar?"المكونات: ":"Ingredients: ")+(g.ing.join?g.ing.join(ar?"، ":", "):g.ing)):"")+"\n"+esc(ar?"تركيبة طبيعية 99%، بدون سلفات أو بارابين 🌿":"99% natural, no sulfates or parabens 🌿"))});
  if(has("price")||has("size")||(has("want")&&!S.length)||(A.size&&!has("last")&&!has("usage"))){prods.slice(0,3).forEach(function(id){var p=by(id),v=null;if(A.size&&p.variants.length>1)v=A.size==="l"?p.variants[1]:p.variants[0];
   add(v?("<b>"+esc(p.name[L])+"</b> ("+esc(v.size[L])+"): <b>"+m(v.price)+"</b>"):pLine(p,L))})}
  if(has("last"))add(esc(ar?"حجم 900 مل هو الأوفر وبيطوّل كتير للاستعمال اليومي بالحمّام، و300 مل مثالي جنب المغسلة. وبما إنه سائل ومركّز، كمية صغيرة بتكفي وبتعمل رغوة حلوة.":"The 900 ml is the best value and lasts a long time for daily showers; 300 ml is perfect by the sink. A small amount is enough for a rich lather."));
  if(has("smell"))add(esc(ar?"ريحة منتجات أولغا هادية وطبيعية، نابعة من مكوّناتها (زيت الزيتون، زبدة الشيا، زيت الغار والزيوت المغربية) ومش مزعجة أبداً 🌿":"Olga's scents are soft and natural, coming from their ingredients — olive oil, shea butter, laurel and Moroccan oils — never overpowering 🌿"));
  if(has("gift")&&!S.length)add(esc(ar?"اختيار حلو للهدية 🎁":"A lovely gift choice 🎁"));
  if(!fromCtx&&(!S.length||(S.length&&prods.some(function(id){return S.join("").indexOf(esc(by(id).name[L]))<0})&&!has("delivery")&&!has("pay")&&!skinType&&!has("baby")&&!has("compare")))){
   prods.slice(0,3).forEach(function(id){var p=by(id),g=guide(id,L);if(S.join("").indexOf(esc(p.name[L]))>-1)return;
    add("<b>"+esc(p.name[L])+"</b>\n"+esc(g?g.what:p.desc[L])+(g&&g.ben?"\n✨ "+esc(g.ben.slice(0,2).join(ar?"، ":", ")):"")+"\n"+pLine(p,L).replace(/^• <b>[^<]*<\/b> — /,"💰 "))});if(prods.length===1&&!key)key=null}
  ids=ids.concat(prods)}
 else if(has("usage")&&!S.length&&!has("site"))add(esc(ar?"طريقة الاستعمال سهلة 🌿\n• النابلسي والشيا والغار السائل: كمية صغيرة على يدين مبللتين، دلّكي للرغوة واشطفي\n• الحمّام المغربي: على بشرة رطبة بعد البخار، 5 دقائق، ثم قشّري بالكيس واشطفي\n• صابون الغسيل: افركيه على البقعة واتركيه دقائق قبل الغسيل\nعن أي منتج حابة تفاصيل أكتر؟":"Easy to use 🌿\n• Nabulsi, shea and laurel liquids: a little on wet hands, lather and rinse\n• Moroccan hammam: on damp skin after steam, 5 minutes, then exfoliate and rinse\n• Laundry soap: rub on the stain, wait a few minutes, then wash\nWhich product would you like more detail on?"));

 if(!prods.length&&(A.sizes.length>1||(A.size&&(has("compare")||has("rec"))))){add(esc(ar?"الفرق بين الحجمين 🌿\n• 300 مل بـ 3.50 د.أ — عملي جنب المغسلة أو للتجربة\n• 900 مل بـ 6.50 د.أ — 3 أضعاف الكمية بأقل من ضعف السعر، الأوفر للحمّام والعيلة\nإذا بتستعمليه يومياً بنصحك بالـ900 مل 💚":"The two sizes 🌿\n• 300 ml for 3.50 JOD — handy by the sink or to try\n• 900 ml for 6.50 JOD — 3× the amount for less than double the price, best for the shower and family\nFor daily use I'd go with 900 ml 💚"))}
 if(has("site")&&!prods.length)add(esc(ar?"المتجر سهل 🌿 مرّري لتحت لتشوفي المنتجات، واضغطي على أي منتج لتشوفيه عن قرب وأنا بحكيلك عنه. وإذا عندك أي سؤال، اكتبيلي هون.":"The store is easy 🌿 scroll down to see the products and tap any product to view it up close while I tell you about it. Any question, just type it here."));
 if(has("foam"))add(esc(ar?"أيوه 🫧 بيعمل رغوة ناعمة وغنية، وكمية صغيرة بتكفي لأنه مركّز، وبينشطف بسهولة بدون ما يترك البشرة ناشفة.":"Yes 🫧 it gives a soft, rich lather — a small amount is enough as it's concentrated, and it rinses off easily without drying the skin."));
 if(!prods.length&&(has("price")||has("size"))&&!(A.sizes.length>1)&&!has("offer")&&!has("delivery")&&!has("fee")&&!A.city){add(esc(ar?"هاي أسعار منتجات أولغا 💰":"Here are Olga's prices 💰")+"\n"+P.map(function(p){return pLine(p,L)}).join("\n"));if(S.length===1&&!pre)key=null}
 if(has("compare")&&!prods.length&&!S.length)add(esc(ar?"الفرق باختصار 🌿\n• <b>النابلسي</b>: زيت زيتون، لطيف ويومي للعيلة كلها\n• <b>الشيا</b>: ترطيب عميق للبشرة الجافة\n• <b>الغار</b>: مطهّر ومهدّئ للبشرة الدهنية والحبوب\n• <b>الحمّام المغربي</b>: تقشير وتنظيف عميق أسبوعي\nوكلهم بنفس السعر بحجم 300 مل (3.50 د.أ) و900 مل (6.50 د.أ) ما عدا المغربي 5.00 د.أ.":"In short 🌿\n• Nabulsi: olive oil, gentle, everyday for the whole family\n• Shea: deep moisture for dry skin\n• Laurel: purifying and soothing for oily, blemish-prone skin\n• Moroccan hammam: weekly deep cleanse and exfoliation").replace(/&lt;(\/?)b&gt;/g,"<$1b>"));
 if(has("gift")&&!prods.length){add(esc(ar?"للهدايا عنا خيارات حلوة كتير 🎁":"We have lovely gift options 🎁")+"\n"+pLine(by("shea-duo"),L)+"\n"+pLine(by("moroccan"),L)+"\n"+pLine(by("home-set"),L));ids.push("shea-duo","moroccan","home-set")}
 if(has("offer")){if(/(غالي|غاليه|expensive|pricey)/.test(A.n))add(esc(ar?"بفهم عليكِ 🤍 أسعارنا مدروسة لمنتج طبيعي 99% بزيوت أصلية، وفي خيارات بتوفّر عليكِ كتير:":"I understand 🤍 our prices reflect 99% natural products with genuine oils, and there are options that save you a lot:"));add(esc(ar?"الأسعار المعروضة بالمتجر هي الأسعار الحالية، وأوفر الخيارات 💚\n":"Prices in the store are the current prices; the best-value picks 💚\n")+pLine(by("shea-duo"),L)+esc(ar?" (بدل 10.00 د.أ إذا انشروا لحال)":" (instead of 10.00 JOD separately)")+"\n"+pLine(by("home-set"),L)+esc(ar?" — الخيار الأوفر للعائلات":" — best value for families")+"\n"+esc(ar?"وحجم 900 مل دايماً أوفر من 300 مل.":"And the 900 ml is always better value than 300 ml."));ids.push("shea-duo","home-set")}
 if((has("catalog")&&!S.length&&!has("where")&&!has("quality")&&!has("pay"))||(has("stock")&&!prods.length&&!S.length)){add(esc(ar?(has("stock")&&!has("catalog")?"كل المنتجات المعروضة متوفرة للطلب مباشرة من المتجر ✅\n":"هاي تشكيلة أولغا الطبيعية 🌿\n"):(has("stock")&&!has("catalog")?"Everything shown is available to order right now ✅\n":"Here's Olga's natural range 🌿\n"))+P.map(function(p){return pLine(p,L)}).join("\n"))}
 else if(has("stock")&&prods.length)add(esc(ar?"أيوه متوفر ✅ وبتقدري تطلبيه هلّق مباشرة من المتجر.":"Yes, it's available ✅ you can order it right now from the store."));
 if(has("ingr")&&!prods.length)add(esc(K.about[L])+"\n"+esc(ar?"المكوّن الأساسي بكل منتج: زيت الزيتون بالنابلسي، زبدة الشيا بالشيا، زيت الغار بالغار، وزيوت مغربية بالحمّام المغربي.":"The hero ingredient: olive oil in Nabulsi, shea butter in Shea, laurel oil in Laurel and Moroccan oils in the hammam soap."));
 if(has("smell")&&!prods.length)add(esc(ar?"ريحة منتجات أولغا هادية وطبيعية من زيوتها، مش عطور قوية ولا مزعجة 🌿":"Olga's scents are soft and natural from their oils — never strong or overpowering 🌿"));
 if(has("expiry"))add(esc(ar?"تاريخ الصلاحية مطبوع على كل عبوة. وللحفاظ عليها: سكّري العبوة منيح واحفظيها بمكان بارد وجاف بعيد عن الشمس المباشرة 🌿":"The expiry date is printed on each bottle. Keep it closed in a cool, dry place away from direct sunlight 🌿"));
 if(has("about")||has("origin"))add(esc(K.about[L]));
 if(has("quality")&&!has("about"))add(esc(ar?"جودة أولغا من شركة باتل للصناعات الطبيعية بالأردن: تركيبات طبيعية 99%، بدون سلفات أو بارابين، وآمنة للبشرة الحساسة، ومستوحاة من وصفات الصابون النابلسي الأصيلة 🤍":"Olga quality comes from BatteL Natural Industries in Jordan: 99% natural formulas, no sulfates or parabens, safe for sensitive skin, inspired by authentic Nabulsi soap-making 🤍"));
 if(has("vegan"))add(esc(ar?"منتجات أولغا مبنية على زيوت نباتية طبيعية (زيت الزيتون، زبدة الشيا، زيت الغار) بدون سلفات أو بارابين 🌿":"Olga products are built on natural plant oils — olive oil, shea butter and laurel oil — with no sulfates or parabens 🌿"));
 if(has("where")&&!has("delivery")&&!S.length)add(esc(ar?"أولغا متجر أونلاين 🛍️ أسهل طريقة إنك تطلبي من هون مباشرة وبنوصّلك لباب البيت بكل مناطق الأردن. ومنتجاتنا من إنتاج شركة باتل للصناعات الطبيعية بالأردن"+(/(صيدل|سوبرماركت|مول|محلات|pharmac|supermarket|mall)/.test(A.n)?"، ولنقاط البيع والتوزيع بتقدري تسألي شركة باتل على ‎+962 79 673 8495‎.":"."):"Olga is an online store 🛍️ the easiest way is to order right here — we deliver to your door anywhere in Jordan. Our products are made by BatteL Natural Industries in Jordan"+(/(pharmac|supermarket|mall|shops)/.test(A.n)?"; for retail points, ask BatteL on +962 79 673 8495.":".")));
 if(has("hours"))add(esc(ar?"المتجر الأونلاين مفتوح 24 ساعة 🌙 اطلبي بأي وقت، وفريقنا بيرد عادةً بنفس اليوم.":"The online store is open 24/7 🌙 order anytime — our team usually replies the same day."));
 if(has("abroad")&&(has("delivery")||has("order")||has("fee")||has("want")||A.toks.length<=5))add(esc(ar?"حالياً التوصيل متاح داخل الأردن فقط 🇯🇴 لكل المحافظات. إذا عندك حدا بالأردن، بتقدري تطلبي على عنوانه بكل سهولة.":"Right now we deliver within Jordan only 🇯🇴 — all governorates. If you have someone in Jordan, you can order to their address easily."));
 else if(has("delivery")||has("fee")||(has("price")&&A.city)){var dl=esc(ar?"بنوصّل لكل مناطق الأردن 🚚 ":"We deliver across all of Jordan 🚚 ")+feeText(L,A.city);
  if(has("dtime"))dl+="\n"+esc(ar?"بعد ما تأكدي الطلب بيوصل فوراً لفريق أولغا، وبيتواصلوا معك بنفس اليوم عادةً لتحديد موعد التوصيل المناسب إلك.":"Once you confirm, your order reaches the Olga team instantly and they usually contact you the same day to set a delivery time that suits you.");
  else dl+="\n"+esc(ar?"وبعد التأكيد فريقنا بيتواصل معك لترتيب موعد التوصيل.":"After you confirm, our team contacts you to arrange the delivery time.");add(dl)}
 else if(has("dtime")&&(has("order")||has("want")))add(esc(ar?"بعد تأكيد الطلب بيوصل فوراً لفريق أولغا، وبيتواصلوا معك عادةً بنفس اليوم لتحديد موعد التوصيل 🚚":"Once confirmed, your order reaches the team instantly and they usually contact you the same day to set the delivery time 🚚"));

 if(has("pay")){var pay=ar?"طرق الدفع المتاحة 💳\n• الدفع نقداً عند الاستلام\n• تحويل كليك CliQ\n• محفظة إلكترونية (زين كاش، أورنج موني وغيرها)":"Payment options 💳\n• Cash on delivery\n• CliQ transfer\n• E-wallet (Zain Cash, Orange Money and others)";
  if(/(فيزا|visa|ماستر|master|بطاقه|card|credit|كريدت)/.test(A.n))pay=(ar?"حالياً ما في دفع بالبطاقة، بس عنا خيارات سهلة:\n":"Card payment isn't available yet, but there are easy options:\n")+pay.split("\n").slice(1).join("\n");add(esc(pay))}

 if((has("order")&&!prods.length&&!S.length)||((has("order")||has("want")||has("site"))&&/(كيف|طريقه|how|steps|خطوات|فاهم)/.test(A.n))){
  add(esc(ar?"الطلب من المتجر سهل كتير 🛍️\n1. افتحي المنتج واختاري الحجم واضغطي «أضف للسلة»\n2. من السلة اضغطي «إتمام الطلب»\n3. عبّي اسمك ورقمك ومدينتك وحدّدي موقعك على الخريطة\n4. اختاري طريقة الدفع واضغطي «تأكيد الطلب»\nوطلبك بيوصل فوراً لفريق أولغا وبيتواصلوا معك لتأكيد التوصيل.":"Ordering is easy 🛍️\n1. Open a product, choose the size and tap Add to bag\n2. In the bag, tap Checkout\n3. Fill in your name, phone and city and pin your location on the map\n4. Pick a payment method and tap Confirm order\nYour order reaches the Olga team instantly and they contact you to confirm delivery."))}

 if(has("contact")&&S.length)add(esc(ar?"وللتواصل المباشر: ":"For direct contact: ")+waLink(L));

 if(S.length){CTX.miss=0;if(prods.length){if(!fromCtx&&!A.size)CTX.size=null;CTX.p=prods;CTX.age=0}else if(ids.length&&!has("gift")&&!has("offer")){CTX.p=skinType==="sensitive"?ids.slice(0,2):ids.slice(0,1);CTX.age=0}CTX.topic=topics[0]||"";
  if(!has("rec")||skinType)CTX.ask="";
  return {h:pre+S.join("\n\n"),ids:ids.filter(function(x,i){return ids.indexOf(x)===i}),a:(S.length===1&&!pre&&!prods.length&&skinType==="dry"&&!has("baby"))?"r.dry":key,l:L}}

 // ---- not understood: ask, suggest, never push away ----
 CTX.miss++;var h=ar?(CTX.miss===1?"ما فهمت عليكِ تماماً 🙈 ممكن توضحيلي أكتر؟ بقدر أساعدك بـ:":"خليني أفهم عليكِ أحسن 🌿 جربي تسأليني مثلاً عن:"):(CTX.miss===1?"I didn't quite catch that 🙈 could you tell me a bit more? I can help with:":"Let me understand you better 🌿 try asking me about:");
 h=esc(h)+"\n"+esc(ar?"• اختيار الصابون حسب نوع بشرتك\n• الأسعار والأحجام وحساب طلبك\n• طريقة الطلب والتوصيل والدفع\n• طريقة الاستعمال والمكونات\n• الهدايا والعروض":"• Choosing a soap for your skin type\n• Prices, sizes and your order total\n• Ordering, delivery and payment\n• How to use and ingredients\n• Gifts and best-value offers");
 if(CTX.miss>=3)h+="\n"+esc(ar?"وإذا بتحبي تحكي مع حدا من الفريق، هم موجودين على ":"And if you'd like to talk to the team, they're on ")+waLink(L)+" 🤍";
 return {h:h+chips(t.q.slice(0,4),L),ids:[],a:null,l:L}}

/* ---------- chat UI ---------- */
function actsHtml(ids,L){ids=ids.filter(function(id,i){return ids.indexOf(id)===i&&hasQuick(id)}).slice(0,3);
 if(!ids.length)return "";var byId={};K.products.forEach(function(p){byId[p.id]=p});
 return '<div class="olh-acts">'+ids.map(function(id){return '<button type="button" class="olh-btn olh-btn--ol" data-olh-p="'+esc(id)+'">'+esc(T[L].view+": "+byId[id].name[L])+'</button>'}).join("")+'</div>'}
function add(role,html,L,ids){var d=document.createElement("div");d.className="olh-m "+(role==="u"?"olh-u":"olh-b");d.dir=L==="ar"?"rtl":"ltr";d.lang=L;d.innerHTML=html+(ids?actsHtml(ids,L):"");log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
log.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-olh-p]");if(b)openProduct(b.getAttribute("data-olh-p"))});
log.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-olh-q]");if(b&&!busy)send(b.getAttribute("data-olh-q"))});
function render(){log.innerHTML="";add("b",esc(T[lang].hi),lang);hist.forEach(function(h){add(h.r,h.r==="u"?esc(h.t):(h.local?h.t:md(h.t)),h.l,h.ids)})}
function ui(){var t=T[lang];root.dir=lang==="ar"?"rtl":"ltr";$("olh-name").textContent=t.name;$("olh-sub").textContent=t.sub;inp.placeholder=t.ph;inp.dir=root.dir;$("olh-inl").textContent=t.in;
 $("olh-lang").textContent=t.lang;$("olh-lang").setAttribute("aria-label",lang==="ar"?"English":"العربية");
 $("olh-voice").textContent=voiceOn?"🔊":"🔇";$("olh-voice").setAttribute("aria-pressed",voiceOn?"true":"false");$("olh-voice").setAttribute("aria-label",voiceOn?t.voiceOff:t.voiceOn);
 $("olh-clear").setAttribute("aria-label",t.clr);$("olh-min").setAttribute("aria-label",t.min);$("olh-mic").setAttribute("aria-label",t.mic);$("olh-send").setAttribute("aria-label",t.send);
 $("olh-launch").setAttribute("aria-label",t.open);cv.setAttribute("aria-label",t.open);
 $("olh-bask").textContent=t.ask;$("olh-bthx").textContent=t.thx;
 var qb=$("olh-quick");qb.innerHTML="";t.q.forEach(function(x){var b=document.createElement("button");b.type="button";b.className="olh-btn";b.textContent=x;b.onclick=function(){send(x)};qb.appendChild(b)})}
function setOpen(o){if(o)cancelBye();root.classList.toggle("is-open",o);if(o){root.classList.remove("is-hidden");chatOpened();setTimeout(function(){if(!matchMedia("(max-width:640px)").matches)inp.focus()},250)}else stopSpeak()}
function busyUi(b){busy=b;typing.classList.toggle("is-on",b);$("olh-send").disabled=b;HB.think=b}
function rename(t){return String(t).replace(/(^|[^\u0621-\u064A\u0671-\u06D3])([وف]?[بل]?)حلا(?![\u0621-\u064A\u0671-\u06D3])/g,"$1$2شمس").replace(/\bHala\b/g,"Shams")}

/* ===== SHAMS · speaks about a product while its 3D view is open ===== */
/* OLH_GUIDE loaded from data/shams-dialogue.js */
function xClear(){XG++;XT.forEach(clearTimeout);XT=[]}
var XV=null;function xvox(){if(!XV){try{XV=window.OLH_XVOX||{}}catch(e){XV={}}}return XV}
function playX(key,p,L){var src=xvox()[key];if(!src||!voiceOn)return speakText(p,L);stopAudio();var g=spkGen;
 var isPath=/\.(mp3|wav|ogg|m4a|webp)(\?|$)/i.test(src)||src.indexOf("/")>-1;
 if(AC){
  var getAb=isPath?fetch(src).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}):Promise.resolve(b64buf(src));
  return getAb.then(function(ab){if(g!==spkGen)return false;return decode(ab).then(function(buf){if(g!==spkGen)return false;var s=AC.createBufferSource();s.buffer=buf;s.connect(analyser);
   SPK={kind:"live",src:s,q:false};root.classList.add("is-talking");talkUi(true);s.onended=function(){if(g===spkGen){SPK=null;root.classList.remove("is-talking");talkUi(false)}resDone&&resDone(g===spkGen)};
   var resDone=null;return new Promise(function(res){resDone=res;try{s.start()}catch(e){SPK=null;res(false)}})})}).catch(function(){return speakText(p,L)});
 }
 return new Promise(function(res){var a=new Audio(isPath?src:"data:audio/mpeg;base64,"+src);a.onended=function(){res(true)};a.onerror=function(){res(false)};a.play().catch(function(){res(false)})})}
function explainProduct(id){var P=(window.OLGA_PRODUCTS||[]).filter(function(p){return p.id===id})[0],g=OLH_GUIDE[id];if(!P||!g)return;
 var L=lang==="en"?"en":"ar",G=g[L],B=OLH_LBL[L],nm=P.name[L],sep=L==="ar"?"، ":", ";
 var parts=[B.intro.replace("{n}",nm).replace(/ ?🌿.*$/,"")+". "+G.what,B.why+" "+G.why.join(sep)+".",B.ben+" "+G.ben.join(sep)+".",B.tip+": "+G.tip];
 xClear();var my=XG;interacted=true;try{cancelBye()}catch(e){}var gone=root.classList.contains("is-hidden")||root.classList.contains("is-leaving")||!!LEAVING||mode==="out";setOpen(false);root.classList.add("olh-over3d");
 var go=function(){if(my!==XG)return;stopNarration();var i=0;
  var next=function(){if(my!==XG)return;if(i>=parts.length){XT.push(setTimeout(function(){if(my===XG){hideBubble();try{gesture("rest")}catch(e){}}},2500));return}
   var p=parts[i],t0=Date.now(),ms=Math.max(3500,p.length*(L==="ar"?80:65));showBubble(p,0,parts.length,i);i++;try{gesture(i===1?"present":(i%2?"open":"talk"),p)}catch(e){}
   playX(id+"."+L+"."+(i-1),p,L).then(function(ok){if(my!==XG)return;var left=ok?400:Math.max(300,ms-(Date.now()-t0));XT.push(setTimeout(next,left))})};
  next()};
 try{unlockAudio();if(AC&&AC.state==="suspended")AC.resume()}catch(e){}
 if(gone){root.classList.remove("is-hidden");seen={};enter();XT.push(setTimeout(go,reduced?50:1500))}else go()}
window.OLH_explain=explainProduct;
window.OLH_quiet=function(){if(!root.classList.contains("olh-over3d"))return;xClear();root.classList.remove("olh-over3d");stopNarration();stopSpeak();hideBubble()};
function send(text){text=String(text||"").trim().slice(0,1000);if(!text||busy)return;interacted=true;var L=detect(text);
 hist.push({r:"u",t:text,l:L});add("u",esc(text),L);inp.value="";grow();busyUi(true);
 var msgs=hist.slice(-16).map(function(h){return {role:h.r==="u"?"user":"assistant",content:h.r==="u"?h.t:(h.plain||h.t)}});
 var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){ctl&&ctl.abort()},30000);
 fetch(OLH_API+"olga-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:msgs,lang:L}),signal:ctl?ctl.signal:undefined})
 .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
 .then(function(d){if(!d||!d.reply)throw 0;d.reply=rename(d.reply);var ids=findProducts(d.reply).map(function(p){return p.id});
   hist.push({r:"b",t:d.reply,l:L,ids:ids});add("b",md(d.reply),L,ids);speakReply(d.reply,L,null)})
 .catch(function(){var a;try{a=localReply(text,L)}catch(err){a={h:esc(L==="ar"?"ممكن تعيدي سؤالك بطريقة تانية؟ 🌿":"Could you ask that another way? 🌿"),ids:[],a:null}}var L2=a.l||L;var plain=a.h.replace(/<div class="olh-acts">[\s\S]*?<\/div>/g,"").replace(/<[^>]+>/g,"").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");hist.push({r:"b",t:a.h,plain:plain,l:L2,ids:a.ids,local:true});add("b",a.h,L2,a.ids);speakReply(plain,L2,a.a)})
 .then(function(){clearTimeout(tm);busyUi(false);hist=hist.slice(-30)})}
function grow(){inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,110)+"px"}
$("olh-form").addEventListener("submit",function(e){e.preventDefault();send(inp.value)});
inp.addEventListener("input",function(){grow();HB.listen=1;HB.typeT=now()});
inp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(inp.value)}});
$("olh-min").onclick=function(){setOpen(false)};
$("olh-clear").onclick=function(){stopSpeak();hist=[];render()};
$("olh-lang").onclick=function(){lang=lang==="ar"?"en":"ar";ui();render()};
$("olh-voice").onclick=function(){voiceOn=!voiceOn;if(!voiceOn)stopSpeak();try{sessionStorage.setItem("olh-voice",voiceOn?"1":"0")}catch(e){}ui()};
$("olh-launch").onclick=function(){root.classList.remove("is-hidden");seen={};enter();setTimeout(function(){setOpen(true)},reduced?50:4000)};
/* "thank you": Shams says her goodbye, holds it for a breath, then leaves through the olive trees.
   Opening the chat while she is still talking means the visitor changed her mind, so she stays. */
var BYE=null,BYE_HOLD=450;
function byeLeave(tok){if(BYE!==tok)return;clearTimeout(tok.safety);clearTimeout(tok.hold);clearInterval(tok.wait);BYE=null;
 leave(function(){root.classList.add("is-hidden");bubble.classList.remove("is-bye")})}
function cancelBye(){if(!BYE)return;clearTimeout(BYE.safety);clearTimeout(BYE.hold);clearInterval(BYE.wait);BYE=null;bubble.classList.remove("is-bye")}
function farewell(){if(BYE||LEAVING||mode==="out"||root.classList.contains("is-hidden"))return;
 tourOff=true;try{sessionStorage.setItem("olh-tour","0")}catch(e){}
 interacted=true;unlockAudio();if(root.classList.contains("is-open"))setOpen(false);
 var tok={};BYE=tok;bubble.classList.add("is-bye");
 if(mode==="in"){tok.wait=setInterval(function(){if(BYE!==tok||mode!=="in"){clearInterval(tok.wait);sayBye(tok)}},60);return}
 sayBye(tok)}
function sayBye(tok){if(BYE!==tok)return;
 if(mode!=="on"||!LINES["x.thanks"]){byeLeave(tok);return}
 var d=clipDur("x.thanks",lang)||3.4;tok.safety=setTimeout(function(){byeLeave(tok)},(d+6)*1000);
 narrate([{id:"x.thanks",g:LINES["x.thanks"].g||"wave"}],null,function(){tok.hold=setTimeout(function(){byeLeave(tok)},BYE_HOLD)})}
function toggleFromGuide(){if(LEAVING||mode==="out")return;interacted=true;setOpen(!root.classList.contains("is-open"))}
/* Shams now stands over the banner from the first second, so a tap on the empty space around her
   reaches whatever is underneath (banner buttons, arrows, links) instead of being swallowed */
function passThrough(ev){var g=$("olh-guide"),pr=root.style.pointerEvents,pg=g.style.pointerEvents,pc=cv.style.pointerEvents;
 root.style.pointerEvents=g.style.pointerEvents=cv.style.pointerEvents="none";
 var t=document.elementFromPoint(ev.clientX,ev.clientY);
 root.style.pointerEvents=pr;g.style.pointerEvents=pg;cv.style.pointerEvents=pc;
 if(!t||root.contains(t))return;var a=t.closest("a,button,label,input,select,textarea,[role=button],[tabindex]")||t;
 if(a.focus&&a!==t)try{a.focus({preventScroll:true})}catch(_){}
 if(a.click)a.click()}
cv.addEventListener("click",function(ev){if(hitHala(ev))toggleFromGuide();else passThrough(ev)});
cv.addEventListener("pointermove",function(ev){if(ev.pointerType==="mouse")cv.style.cursor=hitHala(ev)?"pointer":"default"});
cv.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleFromGuide()}});
$("olh-bask").onclick=function(){interacted=true;setOpen(true)};
$("olh-bthx").onclick=function(e){e.stopPropagation();farewell()};
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&root.classList.contains("is-open"))setOpen(false)});

/* follow the store's language switch */
new MutationObserver(function(){var l=curLang();if(l!==lang){lang=l;ui();render();spkUi();if(NQ.active){var it=NQ.items,i=NQ.i,s=NQ.sec;stopNarration();NQ.items=it;NQ.i=i;NQ.sec=s;NQ.active=true;nextLine()}}}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

/* microphone (speech recognition) */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,rec=null;
if(!SR)$("olh-mic").style.display="none";
$("olh-mic").onclick=function(){if(!SR)return;interacted=true;if(rec){rec.stop();return}stopSpeak();
 rec=new SR();rec.lang=lang==="ar"?"ar-JO":"en-US";rec.interimResults=true;rec.maxAlternatives=1;var fin="";
 rec.onresult=function(e){var s="";for(var i=0;i<e.results.length;i++){s+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=s}inp.value=s;grow()};
 rec.onend=function(){$("olh-mic").classList.remove("is-on");rec=null;if(fin.trim())send(fin)};
 rec.onerror=function(){$("olh-mic").classList.remove("is-on");rec=null};
 $("olh-mic").classList.add("is-on");HB.listen=1;try{rec.start()}catch(e){rec=null;$("olh-mic").classList.remove("is-on")}};

/* =====================================================================================
   SHAMS LIVE · guided tour + voice + lip-sync engine
   - Every section has its own spoken explanation (recorded voice, Arabic & English).
   - Lips follow the real sound: each recording carries a per-frame mouth track
     (jaw opening + lip spreading/rounding) measured from the audio itself.
   - Gestures (wave, open arms, present, count, talk) are timed to the speech beats,
     the head nods on stressed syllables, eyebrows lift on questions, eyes blink.
   - Browsers only allow sound after the visitor's first tap: until then Shams shows
     the words and gestures silently, then replays the current sentence aloud.
   ===================================================================================== */
var VOX=null;
function vox(){if(VOX===null){try{VOX=window.OLH_VOX||{};window.OLH_VOX=null}catch(e){VOX={}}}return VOX}
function hasClip(id,L){return !!vox()[id+"."+L]}
function clipDur(id,L){var v=vox()[id+"."+L];return v?v.d:0}
var B36="0123456789abcdefghijklmnopqrstuvwxyz",TRK={};
function trk(s){if(TRK[s])return TRK[s];var a=new Float32Array(s.length);for(var i=0;i<s.length;i++)a[i]=B36.indexOf(s.charAt(i))/35;TRK[s]=a;return a}
function now(){return performance.now()/1000}

/* ---------- audio ---------- */
var AC=null,master=null,analyser=null,abuf=null,fbuf=null,unlocked=false,BUF={},ttsFail=0;
function unlockAudio(){var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 if(!AC){try{AC=new C();master=AC.createGain();analyser=AC.createAnalyser();analyser.fftSize=1024;analyser.connect(master);master.connect(AC.destination)}catch(e){AC=null;return}}
 if(AC.state==="suspended"){try{AC.resume()}catch(e){}}
 if(!unlocked){unlocked=true;try{var b=AC.createBuffer(1,1,22050),s=AC.createBufferSource();s.buffer=b;s.connect(AC.destination);s.start(0)}catch(e){}}}
function b64buf(b){var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
function decode(ab){return new Promise(function(res,rej){try{var p=AC.decodeAudioData(ab,res,rej);if(p&&p.then)p.then(res,rej)}catch(e){rej(e)}})}
function getBuf(key){if(BUF[key])return BUF[key];var v=vox()[key];BUF[key]=(v&&v.src?fetch(v.src).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(decode):decode(b64buf(v.a)));BUF[key].catch(function(){delete BUF[key]});return BUF[key]}
function preload(id,L){if(AC&&hasClip(id,L))getBuf(id+"."+L)}

/* SPK = what Shams is saying right now (drives lips, beats, head and gestures) */
var SPK=null,spkGen=0;
function audioLag(){return AC?((AC.outputLatency||0)+(AC.baseLatency||0)*.5):0}
function stopAudio(){spkGen++;if(SPK&&SPK.src){try{SPK.src.onended=null;SPK.src.stop()}catch(e){}}
 try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}SPK=null;root.classList.remove("is-talking");talkUi(false)}
/* play one recorded line; resolves true when finished, false if interrupted/failed */
function playClip(id,L){var key=id+"."+L,v=vox()[key];if(!v||!AC)return Promise.resolve(false);stopAudio();var g=spkGen;
 if(AC.state==="suspended"){try{AC.resume()}catch(e){}}
 return getBuf(key).then(function(buf){if(g!==spkGen)return false;
  return new Promise(function(res){var src=AC.createBufferSource();src.buffer=buf;src.connect(analyser);var t0=AC.currentTime+.06;
   SPK={kind:"clip",src:src,t0:t0,dur:buf.duration,O:trk(v.o),W:trk(v.w),B:v.b||[],bi:0,q:/[?؟]/.test((LINES[id]||{})[L]||"")};
   root.classList.add("is-talking");talkUi(true);
   src.onended=function(){if(g===spkGen){SPK=null;root.classList.remove("is-talking");talkUi(false)}res(g===spkGen)};
   try{src.start(t0)}catch(e){SPK=null;res(false)}})},function(){return false})}

/* ---------- mouth shape for the current moment: {o: jaw 0..1, w: 0 round … .5 … 1 wide} ---------- */
var VIS_AR={"ا":[.85,.5],"آ":[.9,.5],"ى":[.8,.5],"أ":[.7,.5],"إ":[.55,.65],"ع":[.7,.5],"ه":[.55,.5],"ح":[.6,.5],"ة":[.5,.55],"ء":[.4,.5],
 "و":[.45,.12],"ؤ":[.45,.15],"ي":[.35,.85],"ئ":[.35,.8],"م":[0,.45],"ب":[0,.45],"ف":[.12,.6],
 "س":[.22,.78],"ص":[.25,.72],"ش":[.25,.62],"ز":[.22,.78],"ث":[.2,.7],"ذ":[.2,.7],"ت":[.3,.7],"د":[.32,.62],"ط":[.35,.55],"ظ":[.3,.55],"ن":[.3,.6],"ل":[.38,.6],"ر":[.4,.55],
 "ك":[.45,.55],"ق":[.45,.5],"غ":[.5,.5],"خ":[.5,.5],"ج":[.35,.55]};
var VIS_EN={a:[.85,.55],e:[.55,.78],i:[.4,.85],o:[.62,.18],u:[.45,.12],y:[.4,.8],w:[.3,.1],m:[0,.45],b:[0,.45],p:[0,.45],f:[.12,.62],v:[.12,.62],
 s:[.22,.8],z:[.22,.8],t:[.3,.7],d:[.32,.65],n:[.3,.62],l:[.38,.6],r:[.4,.4],k:[.45,.55],g:[.45,.55],c:[.3,.7],j:[.35,.5],h:[.5,.5],q:[.4,.3],x:[.3,.7]};
function visOf(ch,L){if(!ch)return [0,.5];var v=(L==="ar"?VIS_AR[ch]:VIS_EN[ch.toLowerCase()])||(L==="ar"?VIS_EN[ch.toLowerCase()]:VIS_AR[ch]);return v||(/\s|[.,،!?؟:;]/.test(ch)?[0,.5]:[.3,.55])}
function mouthNow(){var S=SPK;if(!S)return null;
 if(S.kind==="clip"){var t=AC.currentTime-S.t0-audioLag()+.035;if(t<0)return {o:0,w:.5};var x=t*50,i=Math.floor(x),fr=x-i,O=S.O,W=S.W;
  if(i>=O.length-1)return {o:0,w:.5};
  while(S.bi<S.B.length&&S.B[S.bi]<=i){beat(.8+.2*(O[S.B[S.bi]]||0));S.bi++}
  return {o:O[i]+(O[i+1]-O[i])*fr,w:W[i]+(W[i+1]-W[i])*fr}}
 if(S.kind==="live"){if(!abuf)abuf=new Uint8Array(analyser.fftSize);if(!fbuf)fbuf=new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(abuf);var s=0;for(var k=0;k<abuf.length;k++){var v=(abuf[k]-128)/128;s+=v*v}var o=Math.min(1,Math.sqrt(s/abuf.length)*5.5);
  analyser.getByteFrequencyData(fbuf);var bw=AC.sampleRate/analyser.fftSize,num=0,den=0;for(var j=2;j<fbuf.length&&j*bw<6000;j++){num+=j*bw*fbuf[j];den+=fbuf[j]}
  var c=den?num/den:1500,w=.5+.45*cl((c-1500)/1800,0,1)-.4*cl((1100-c)/600,0,1);
  if(o-(S.po||0)>.22&&now()-(S.pb||0)>.28){beat(.8);S.pb=now()}S.po=o;return {o:o,w:o>.08?w:.5}}
 if(S.kind==="syn"){if(!S.on)return {o:0,w:.5};var tt=now(),dt=tt-(S.lt||tt);S.lt=tt;S.cp+=dt*S.cps;var ch=S.text.charAt(Math.floor(S.cp));
  var vv=visOf(ch,S.L),syl=.62+.38*Math.abs(Math.sin(S.cp*Math.PI*.9));return {o:vv[0]*syl,w:vv[1]}}
 return null}

/* browser voice (used for live chat answers that have no recording) */
/* v34 · female-only device voice. Shams must never speak with a male voice:
   known male voices are blocked, and if no female voice exists on the device she stays silent (text only). */
var OLH_MALE=/\b(male|man|maged|majed|tarik|tariq|naayf|hamed|shakir|fahed|omar|bassel|moaz|hamdan|rami|taim|saleh|daniel|david|mark|george|guy|james|ryan|thomas|oliver|fred|alex|aaron|arthur|gordon|reed|rocko|ralph|albert|bruce|junior|eddy|grandpa|ravi|rishi|liam|brian|eric|christopher|roger|steffan|andrew|davis|jason|tony|guy)\b/i;
var OLH_FEMALE=/female|woman|zira|hoda|salma|laila|layla|mariam|maryam|amira|zariyah|fatima|amany|amina|iman|reem|rana|sana|noura|mouna|salwa|sabah|samantha|serena|karen|moira|tessa|fiona|victoria|kate|susan|hazel|libby|sonia|maisie|emma|aria|jenny|ava|allison|catherine|natasha|clara|sara|nicky|martha|shelley|sandy|flo|kathy|ar-xa-standard-a|ar-xa-wavenet-a|ar-xa-standard-d|ar-xa-wavenet-d/i;
function pickVoice(L){if(!window.speechSynthesis)return null;var vs=speechSynthesis.getVoices().filter(function(v){return v.lang&&v.lang.toLowerCase().indexOf(L)===0&&!OLH_MALE.test(v.name)});
 var f=vs.filter(function(v){return OLH_FEMALE.test(v.name)});
 if(f.length)return f.filter(function(v){return /natural|neural|enhanced|premium|online/i.test(v.name)})[0]||f[0];
 /* Google's built-in Arabic / English (UK female) voices are female; anything else unknown is refused */
 return vs.filter(function(v){return /^Google (العربية|UK English Female|US English)$/i.test(v.name)})[0]||null}
try{window.speechSynthesis&&speechSynthesis.getVoices();window.speechSynthesis&&speechSynthesis.addEventListener&&speechSynthesis.addEventListener("voiceschanged",function(){})}catch(e){}
function browserSpeak(s,L,g){return new Promise(function(res){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance||!pickVoice(L))return res(false);
 var u=new SpeechSynthesisUtterance(s);u.lang=L==="ar"?"ar-SA":"en-GB";u.rate=L==="ar"?.95:1;u.pitch=1.12;u.voice=pickVoice(L);if(!u.voice)return res(false);
 var S={kind:"syn",text:s,L:L,cp:0,cps:L==="ar"?12.5:14.5,on:false,q:/[?؟]/.test(s)};
 u.onstart=function(){if(g!==spkGen)return;S.on=true;S.lt=now();SPK=S;root.classList.add("is-talking");talkUi(true)};
 u.onboundary=function(e){if(g!==spkGen)return;if(typeof e.charIndex==="number"){S.cp=e.charIndex}beat(.75)};
 u.onend=u.onerror=function(){if(g===spkGen&&SPK===S){SPK=null;root.classList.remove("is-talking");talkUi(false)}res(g===spkGen)};
 try{speechSynthesis.speak(u)}catch(e){res(false)}})}
/* natural cloud voice (OLH_API) with live acoustic lip-sync; browser voice as fallback */
function speakText(text,L){var s=speakable(text);if(!s||!voiceOn||!interacted)return Promise.resolve(false);stopAudio();var g=spkGen;unlockAudio();
 if(AC&&ttsFail<4){
  return fetch(OLH_API+"olga-tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:s,lang:L})})
  .then(function(r){if(!r.ok)throw r.status;return r.arrayBuffer()}).then(decode)
  .then(function(buf){if(g!==spkGen)return false;ttsFail=0;return new Promise(function(res){var src=AC.createBufferSource();src.buffer=buf;src.connect(analyser);
    SPK={kind:"live",src:src,q:/[?؟]/.test(s)};root.classList.add("is-talking");talkUi(true);
    src.onended=function(){if(g===spkGen){SPK=null;root.classList.remove("is-talking");talkUi(false)}res(g===spkGen)};src.start()})})
  .catch(function(){ttsFail++;return g===spkGen?browserSpeak(s,L,g):false})}
 return browserSpeak(s,L,g)}
function speakable(t){return String(t).replace(/<[^>]+>/g," ").replace(/https?:\/\/\S+/g,"").replace(/[•*#_]/g," ").replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu,"").replace(/\s+/g," ").trim().slice(0,560)}
function canVoice(){return voiceOn&&interacted&&!!AC}

/* ---------- bubble ---------- */
var bT=0,dots=$("olh-dots"),spk=$("olh-bspk");
function hilite(t){return esc(t).replace(/(^|[^\u0621-\u064A\u0671-\u06D3])(شمس|Shams)(?![\u0621-\u064A\u0671-\u06D3A-Za-z])/,"$1<b>$2</b>")}
function showBubble(text,ms,n,i){if(!guideReady){pendingB=[text,ms,n,i];return}var bt=$("olh-btext");bt.innerHTML=hilite(text);bt.dir=lang==="ar"?"rtl":"ltr";
 dots.innerHTML="";if(n>1){for(var k=0;k<n;k++){var d=document.createElement("i");if(k<i)d.className="is-done";if(k===i)d.className="is-on";dots.appendChild(d)}}
 bubble.classList.remove("is-pop");void bubble.offsetWidth;bubble.classList.add("is-on","is-pop");spkUi();clearTimeout(bT);if(ms)bT=setTimeout(hideBubble,ms)}
function hideBubble(){pendingB=null;clearTimeout(bT);bubble.classList.remove("is-on")}
function spkUi(){var t=T[lang];spk.classList.toggle("is-locked",!interacted);spk.classList.toggle("is-muted",interacted&&!voiceOn);
 spk.innerHTML=!interacted?'<span class="olh-ico">🔊</span><span>'+esc(t.hear)+'</span>':(voiceOn?'<span class="olh-ico">🔊</span><span class="olh-eq"><i></i><i></i><i></i><i></i><i></i></span>':'<span class="olh-ico">🔇</span>');
 spk.setAttribute("aria-label",!interacted?t.hear:(voiceOn?t.voiceOff:t.voiceOn))}
function talkUi(on){bubble.classList.toggle("is-talking",!!on)}
spk.onclick=function(e){e.stopPropagation();if(!interacted){interacted=true;unlockAudio();spkUi();restartLine();return}
 voiceOn=!voiceOn;try{sessionStorage.setItem("olh-voice",voiceOn?"1":"0")}catch(err){}ui();spkUi();if(!voiceOn)stopAudio();else restartLine()};

/* ---------- narration queue (one section = a few sentences) ---------- */
var NQ={items:[],i:0,gen:0,timer:0,sec:null,active:false,silent:false};
function lineText(it){return it.text||((LINES[it.id]||{})[lang])||""}
function narrate(items,sec,done){stopNarration();NQ.items=items;NQ.i=0;NQ.sec=sec||null;NQ.done=done||null;NQ.active=true;nextLine()}
function stopNarration(){NQ.gen++;clearTimeout(NQ.timer);NQ.active=false;NQ.sec=null;stopAudio()}
function restartLine(){if(!NQ.active)return;NQ.gen++;clearTimeout(NQ.timer);nextLine()}
function nextLine(){var g=++NQ.gen;clearTimeout(NQ.timer);
 if(NQ.i>=NQ.items.length){var dn=NQ.done;NQ.done=null;NQ.active=false;NQ.sec=null;if(dn){dn();return}gesture("rest");bT=setTimeout(hideBubble,4200);return}
 var it=NQ.items[NQ.i],L=lang,txt=lineText(it),info=LINES[it.id]||{};
 showBubble(txt,0,NQ.items.length,NQ.i);gesture(info.g||it.g||"open",txt);
 if(Math.random()<.5)blinkNow();
 var nx=NQ.items[NQ.i+1];if(nx)preload(nx.id,L);
 var done=function(){if(g!==NQ.gen)return;NQ.i++;NQ.timer=setTimeout(nextLine,420)};
 if(canVoice()&&hasClip(it.id,L)){NQ.silent=false;playClip(it.id,L).then(function(ok){if(g!==NQ.gen)return;if(ok)done();else silentLine(g,it,L,txt)})}
 else silentLine(g,it,L,txt)}
function silentLine(g,it,L,txt){NQ.silent=true;var d=clipDur(it.id,L)||Math.max(2.4,txt.length/(L==="ar"?13:15));
 NQ.timer=setTimeout(function(){if(g!==NQ.gen)return;NQ.i++;nextLine()},(d+1.1)*1000)}
function say(id,g){if(!LINES[id])return;narrate([{id:id,g:g}],null)}

/* ---------- section tour ---------- */
var seen={},secRatio={},curSec=null,secT=0,visits=0;
try{visits=+localStorage.getItem("olh-visits")||0;localStorage.setItem("olh-visits",String(visits+1))}catch(e){}
function tourItems(id){var arr=(TOUR[id]||[]).map(function(x,i){return {id:"t."+id+"."+i,g:x.g}});
 if(id==="hero"&&visits>0&&arr.length)arr[0]={id:"x.back",g:"wave"};return arr}
function guideFree(){return mode==="on"&&!root.classList.contains("olh-over3d")&&!tourOff&&!root.classList.contains("is-open")&&!root.classList.contains("is-hidden")}
function pickSection(){var best=null,bv=.18;ORDER.forEach(function(id){var r=secRatio[id]||0;if(r>bv){bv=r;best=id}});return best}
function onSectionChange(){var id=pickSection();if(!id||id===curSec)return;curSec=id;clearTimeout(secT);
 secT=setTimeout(function(){if(curSec!==id||seen[id]||!guideFree()||!TOUR[id])return;seen[id]=1;narrate(tourItems(id),id)},650)}
if(window.IntersectionObserver){var sio=new IntersectionObserver(function(es){es.forEach(function(e){
   var vh=window.innerHeight||800,r=e.intersectionRect.height/Math.min(vh,e.boundingClientRect.height||vh);secRatio[e.target.id]=e.isIntersecting?r:0});onSectionChange()},
  {threshold:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1]});
 ORDER.forEach(function(id){var el=document.getElementById(id);if(el)sio.observe(el)})}
function tourKick(){if(!guideFree())return;curSec=null;onSectionChange()}

/* interaction unlocks the voice; the sentence on screen is then replayed aloud */
function firstTouch(e){if(!interacted&&e&&e.target&&e.target.closest&&e.target.closest("#olh-bspk"))return;var was=interacted;interacted=true;unlockAudio();if(was)return;
 var f=function(){spkUi();if(!BYE&&NQ.active&&NQ.silent&&voiceOn)restartLine()};
 var inRow=e&&e.type!=="keydown"&&e.target&&e.target.closest&&e.target.closest("#olh-bubble .olh-row");
 if(!inRow){f();return}var ran=false,once=function(){if(ran)return;ran=true;window.removeEventListener("click",once);clearTimeout(tm);f()},tm=setTimeout(once,900);window.addEventListener("click",once)}
["pointerdown","keydown","touchend"].forEach(function(ev){window.addEventListener(ev,firstTouch,{passive:true})});

/* reactions: adding to the bag, opening a product */
var addN=0;
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-add]");if(!t||root.contains(t))return;
 if(mode!=="on"||root.classList.contains("is-hidden"))return;HB.joy=1;beat(1);
 if(!NQ.active&&!root.classList.contains("is-open")){var id=(addN++%2)?"x.add2":"x.add1";say(id,LINES[id].g)}},true);
/* glances: she follows the visitor's pointer for a moment */
var PTR={x:0,y:0,t:-9};
window.addEventListener("pointermove",function(e){PTR.x=e.clientX;PTR.y=e.clientY;PTR.t=now()},{passive:true});
window.addEventListener("scroll",function(){HB.scrollT=now()},{passive:true});

/* ---------- gestures ---------- */
var HB={look:0,lookV:0,nod:0,nodV:0,tilt:0,tiltV:0,think:false,listen:0,joy:0,brow:0,scrollT:-9,typeT:-9};
var BEAT={v:0,n:0};
function beat(s){var tn=now();BEAT.v=Math.max(BEAT.v,s*.85);BEAT.n++;if((SPK||HB.listen)&&tn-(BEAT.lt||0)>.26){BEAT.lt=tn;HB.nodV+=1.15*s}}
var GS={name:"rest",t0:0,q:false},RIG={w:0};
/* NEU = the "hands low" pose; Shams only swaps between her rest photo and the rig while her hands are here */
var NEU={phi:.5,lift:-.62,ht:.12},LIFT_MIN=-.74,LIFT_MAX=.34;
function armState(){return {phi:NEU.phi,lift:NEU.lift,ht:NEU.ht,vp:0,vl:0,vh:0,o:0}}
var AR={L:armState(),R:armState()},TV={k:0,t:0};
function gesture(name,txt){GS.name=name;GS.t0=now();GS.q=/[?؟]/.test(txt||"");if(GS.q)HB.brow=1;PS.q=planFor(name);PS.until=0}
/* which hand points toward the page content: the one nearest the screen centre */
function contentSide(){var r=cv.getBoundingClientRect();return (r.left+r.width/2)>(window.innerWidth||1000)/2?"L":"R"}
function lookToContent(){return contentSide()==="L"?-1:1}
function P(l,phi,ht){return {lift:l,phi:phi,ht:ht,o:0}}
/* ---------- natural gestures ----------
   Shams moves between real hand poses the way a person explains something: palms open, a hand on her heart,
   presenting toward the page, a raised finger, fingertips together, hands at rest. One pose is held for
   1.5-3 s, strong words in her voice move her on a little sooner, and she never repeats the last two poses. */
var PS={prev:"clasp",cur:"clasp",k:1,w:1,tk:1,D:{L:0,R:0},pk:{L:1,R:1},lo:.3,hi:.7,sp:1,rel:1,then:null,amp:.12,until:0,q:[],last:[],bob:0,wa:0,ws:"R",ts:0,idleT:0,C:null};
function OS(c){return c==="L"?"R":"L"}
function planFor(n){var C=contentSide(),O=OS(C);
 switch(n){
  case "wave":return [["wave"+C,2.2],["heart"+C,1.6]];
  case "present":return [["present"+C,2.4],["explain"+C,1.7]];
  case "count":return [["point"+C,1.8],["palmsup",1.5]];
  case "open":return [["palmsup",1.9],["explain"+O,1.6]];
  case "joy":return [["heart"+C,1.7],["palmsup",1.4]];
  case "talk":return [];
  default:return [["clasp",.6]]}}
var TALK=[["palmsup",3],["steeple",2],["explainL",2.4],["explainR",2.4],["heart*",1.1],["heart#",.7],["present*",1.6],["point*",.9],["down",.7]];
function pickTalk(){var C=contentSide(),O=OS(C),tot=0,c=[];
 /* nearby poses are preferred, so one gesture flows into the next instead of jumping across the body */
 TALK.forEach(function(p){var n=p[0].replace("*",C).replace("#",O);if(n===PS.cur||PS.last.indexOf(n)>-1||!PI[n])return;var w=p[1]*Math.exp(-poseDist(PS.cur,n)/1.7);c.push([n,w]);tot+=w});
 var r=Math.random()*tot;for(var i=0;i<c.length;i++){r-=c[i][1];if(r<=0)return c[i][0]}return c.length?c[0][0]:"palmsup"}
/* ===================== skeletal arm motion =====================
   Between two gestures the arms really move: the shoulder, elbow and wrist angles of the old and the new pose are
   interpolated (minimum-jerk timing, the forearm and hand follow a beat later), and both photos are bent onto that
   same moving skeleton on the GPU. Because both images sit on the same arm at every instant, the hand-over between
   them reads as one arm in motion, not as two pictures fading. While a pose is held the arms keep breathing,
   follow the stress of her voice, and the waving hand turns at the wrist. */
var TAU=Math.PI*2;
function nrm(a,lo){while(a<=lo)a+=TAU;while(a>lo+TAU)a-=TAU;return a}
function toPar(sk,s){var m=s==="L"?1:-1,S=sk[0],E=sk[1],W=sk[2],T=sk[3];
 var a1=Math.atan2(E[1]-S[1],(E[0]-S[0])*m),a2=Math.atan2(W[1]-E[1],(W[0]-E[0])*m),a3=Math.atan2(T[1]-W[1],(T[0]-W[0])*m);
 return {a1:nrm(a1,-1.05),r2:nrm(a2-a1,-4.19),r3:nrm(a3-a2,-Math.PI),l1:Math.hypot(E[0]-S[0],E[1]-S[1]),l2:Math.hypot(W[0]-E[0],W[1]-E[1]),l3:Math.hypot(T[0]-W[0],T[1]-W[1]),S:S}}
function fromPar(p,s){var m=s==="L"?1:-1,S=p.S,A=p.a1,B=A+p.r2,C=B+p.r3;
 var E=[S[0]+Math.cos(A)*p.l1*m,S[1]+Math.sin(A)*p.l1],W=[E[0]+Math.cos(B)*p.l2*m,E[1]+Math.sin(B)*p.l2],T=[W[0]+Math.cos(C)*p.l3*m,W[1]+Math.sin(C)*p.l3];return [S,E,W,T]}
var PAR={};function initPar(){Object.keys(PI).forEach(function(n){PAR[n]={L:toPar(PI[n].sk.L,"L"),R:toPar(PI[n].sk.R,"R")}})}
function mj(x){x=cl(x,0,1);return x*x*x*(10+x*(6*x-15))}
function mixPar(A,B,k){var k1=mj(k),k2=mj((k-.07)/.93),k3=mj((k-.15)/.85);
 return {a1:A.a1+(B.a1-A.a1)*k1,r2:A.r2+(B.r2-A.r2)*k2,r3:A.r3+(B.r3-A.r3)*k3,l1:A.l1+(B.l1-A.l1)*k1,l2:A.l2+(B.l2-A.l2)*k2,l3:A.l3+(B.l3-A.l3)*k3,S:B.S}}
/* how alive each pose is while held (joined hands stay together) */
var AMP={clasp:.12,steeple:.18,down:.45};
function livePar(base,s,t,n){var p={a1:base.a1,r2:base.r2,r3:base.r3,l1:base.l1,l2:base.l2,l3:base.l3,S:base.S};if(reduced)return p;
 var A=PS.amp,ph=s==="L"?0:2.1,act=.25+.75*sstep(.3,.7,Math.abs(base.r2)),sp=PS.spk||0;
 p.a1+=A*.011*Math.sin(t*1.13+ph);
 p.r2+=A*(.026*Math.sin(t*.87+ph*1.3)+.012*Math.sin(t*2.3+ph))-A*act*sp*.075*BS.x;
 p.r3+=A*(.05*Math.sin(t*1.41+ph*.7))+A*act*sp*.09*BS.x;
 if(PS.wa>.001&&PS.ws===s)p.r3+=PS.wa*.25*Math.sin(t*12.2);
 return p}
function isUp(n){return /^(wave|point)/.test(n)}
/* ===================== motion core v3 =====================
   The arms are a real physical system: every joint (shoulder, elbow, wrist and the bone lengths) follows its
   target with a critically damped spring fed by a lightly smoothed target. So a gesture starts the moment it is
   asked for, accelerates and settles like a living arm, never overshoots, and a new gesture can take over in the
   middle of a movement with no jump in position or speed. The photo hand-over is driven by how far the arm has
   actually travelled (not by a clock), so it always happens while both photos sit on the same moving arm. */
var JK=["a1","r2","r3","l1","l2","l3"],JW={a1:8.6,r2:7.6,r3:6.4,l1:8.6,l2:7.6,l3:6.4},SKS=null;
var JOIN={clasp:1,steeple:1};
var BS={x:0,v:0};
var BODYP=null;function bodyPar(){if(BODYP)return BODYP;var o={};["L","R"].forEach(function(s){var k=PI.clasp.sk[s],q=[k[0].slice(),[k[1][0],k[1][1]+10],[k[2][0],k[2][1]+46],[k[3][0],k[3][1]+46]];o[s]=toPar(q,s)});return BODYP=o}
function skFrom(par){var o={};["L","R"].forEach(function(s){var p=par[s],q={S:p.S,v:{},y:{}};JK.forEach(function(k){q[k]=p[k];q.v[k]=0;q.y[k]=p[k]});o[s]=q});return o}
function pDist(A,B){return Math.abs(B.a1-A.a1)+Math.abs(B.r2-A.r2)*.9+Math.abs(B.r3-A.r3)*.5+(Math.abs(B.l1-A.l1)+Math.abs(B.l2-A.l2))/120}
function poseDist(a,b){if(!PAR[a]||!PAR[b])return 3;return Math.max(pDist(PAR[a].L,PAR[b].L),pDist(PAR[a].R,PAR[b].R))}
function goPose(n,via){if(!PI[n]||!PAR[n]||n===PS.cur)return;if(!SKS)SKS=skFrom(PAR[PS.cur]||PAR[n]);if(!via)PS.then=null;
 /* hands only join at the very end of a movement: from far away she flows through open palms (without stopping)
    and the clasp / steeple closes from there, so joined fingers are never pulled apart on screen */
 if(!via&&JOIN[n]&&!JOIN[PS.cur]&&PS.cur!=="palmsup"&&PI.palmsup&&PS.prev!=="body"&&Math.max(pDist(SKS.L,PAR[n].L),pDist(SKS.R,PAR[n].R))>1.1){goPose("palmsup",1);PS.then=n;return}
 /* the photo swap has not begun yet: simply steer the moving arm toward the new pose */
 var steer=PS.prev!=="body"&&PS.w<.02&&PS.k<1;
 if(!steer){PS.prev=PS.cur;PS.w=0}
 PS.cur=n;PS.ts=now();
 var B=PAR[n],tot=0;PS.D={};["L","R"].forEach(function(s){PS.D[s]=pDist(SKS[s],B[s]);tot+=PS.D[s]});PS.pk={L:0,R:0};PS.k=tot<.03?1:0;
 if(PS.prev===n){PS.w=1}
 /* joined hands (clasped / fingertips together) let go first and join last, so they never tear apart */
 var lo=.34,hi=.66;PS.rel=1;if(JOIN[PS.prev]&&!JOIN[n]){lo=0;hi=.2;if(!steer)PS.rel=0}else if(JOIN[n]&&!JOIN[PS.prev]){lo=.8;hi=1}PS.lo=lo;PS.hi=hi;
 /* a long sweep takes a little longer than a small one, like a real arm */
 PS.sp=(reduced?.8:1)*(1-.2*cl(Math.max(PS.D.L,PS.D.R)/3.4,0,1));
 PS.last.unshift(n);if(PS.last.length>2)PS.last.length=2}
function stepSkel(dt){if(!SKS)SKS=skFrom(PAR[PS.cur]);var B=PAR[PS.cur],sub=4,h=dt/sub,tf=1-Math.exp(-dt/.05),tot=0,acc=0;
 /* letting go of joined hands: the fingers unlock in place for a few frames, then the arms move off */
 var hold=false;if(PS.rel<1){PS.rel=Math.min(1,PS.rel+dt/.11);hold=PS.rel<.55}if(PS.frz&&now()<PS.frz)hold=true;
 ["L","R"].forEach(function(s){var q=SKS[s],b=B[s];q.S=b.S;
  JK.forEach(function(k){if(!hold)q.y[k]+=(b[k]-q.y[k])*tf;var w=JW[k]*PS.sp;for(var i=0;i<sub;i++){var a=w*w*(q.y[k]-q[k])-2*w*q.v[k];q.v[k]+=a*h;q[k]+=q.v[k]*h}});
  var D=PS.D[s]||0;if(D>.03){PS.pk[s]=Math.max(PS.pk[s],cl(1-pDist(q,b)/D,0,1));tot+=D;acc+=D*PS.pk[s]}});
 if(PS.k<1){PS.k=tot>0?acc/tot:1;if(PS.k>.975)PS.k=1}
 if(PS.prev==="body"){PS.tk=Math.min(1,(PS.tk||0)+dt/.28);PS.w=mj(PS.tk)}
 else PS.w=Math.max(PS.w,PS.k>=1?1:sstep(PS.lo,PS.hi,PS.k),PS.rel<1?sstep(0,1,PS.rel):0)}
function stepPose(dt,t){var sp=!!SPK||NQ.active,tn=now();PS.spk=(PS.spk||0)+((sp?1:0)-(PS.spk||0))*Math.min(1,dt*4);
 stepSkel(dt);
 if(PS.then&&PS.w>=1&&PS.k>=.4){var fin=PS.then;PS.then=null;goPose(fin,1)}
 var ready=PS.w>=1&&PS.k>=.8,steer=PS.w<.02&&PS.rel>=1&&PS.k<1&&PS.prev!=="body"&&PS.until===0&&PS.q.length>0;
 var big=cl(Math.max(PS.D.L||0,PS.D.R||0)/2,0,1);PS.bob=PS.k<1?Math.sin(Math.PI*PS.k)*big:0;
 /* a strong word while talking moves her on a little early (never before the pose has been seen) */
 if(sp&&ready&&!PS.q.length&&BEAT.v>.72&&tn>PS.until-.9&&tn-PS.ts>2)PS.until=tn;
 if(LEAVING){if((PS.cur===LEAVE_P&&!PS.then&&PS.w>=1&&PS.k>=.92)||tn-LEAVING.t>1.8){var lc=LEAVING.cb;LEAVING=null;leaveNow(lc)}}
 else if((ready||steer)&&tn>=PS.until){var nx=null,h=1;
  if(PS.q.length){var it=PS.q.shift();nx=it[0];h=it[1]}
  else if(sp){nx=pickTalk();h=2+Math.random()*1.4}
  else if(HB.think){nx="steeple";h=1.4}
  else if(PS.cur!=="clasp"&&PS.cur!=="down"){nx="clasp";h=1;PS.idleT=tn+14+Math.random()*10}
  else if(tn>PS.idleT){if(PS.idleT)nx=PS.cur==="clasp"?"down":"clasp";PS.idleT=tn+(PS.cur==="down"?5:14+Math.random()*10);h=1}
  if(nx&&nx!==PS.cur)goPose(nx);PS.until=tn+h+(PS.k<1?.45:0)}
 /* how alive the held pose is: joined hands calm down at once, open poses wake up gently */
 var at=AMP[PS.cur]!=null?AMP[PS.cur]:1;PS.amp+=(at-PS.amp)*Math.min(1,dt*(at<PS.amp?7:1.6));
 /* waving: the hand turns at the wrist, easing in and out */
 var wv=/^wave/.test(PS.cur)&&PS.k>.85;if(wv)PS.ws=PS.cur.slice(4);
 PS.wa+=((wv?1:0)-PS.wa)*Math.min(1,dt*(wv?5:7))}
/* ---------- GPU arm warping (falls back to a plain cross-fade if WebGL is unavailable) ----------
   Only the band where the arms live (y GY0..GY0+GH) is rendered on the GPU, in one pass per frame:
   sleeves behind -> torso -> hands in front, and during a hand-over both poses are mixed on the GPU too. */
var GLR=null,GY0=40,GH=520;
function initGL(){try{var c=mk(HW,GH),gl=c.getContext("webgl",{premultipliedAlpha:true,preserveDrawingBuffer:true,alpha:true,antialias:false,depth:false,stencil:false});if(!gl)return null;
 /* hand-over: both poses keep their full body while they swap, so nothing ever turns see-through */
 var fm="precision mediump float;uniform sampler2D ta;uniform sampler2D tb;uniform float w;varying vec2 v;void main(){vec4 A=texture2D(ta,v),B=texture2D(tb,v);"+
  "float aa=A.a*min(1.0,3.0-3.0*w),ba=B.a*min(1.0,3.0*w),al=1.0-(1.0-aa)*(1.0-ba),wa=aa*(1.0-w),wb=ba*w,s=wa+wb;"+
  "vec3 ca=A.rgb/max(A.a,0.0001),cb=B.rgb/max(B.a,0.0001);vec3 col=s>0.0001?(ca*wa+cb*wb)/s:vec3(0.0);gl_FragColor=vec4(col*al,al);}";
 var vs="attribute vec2 p;attribute vec2 u;uniform vec2 r;uniform float oy;varying vec2 v;void main(){v=u;gl_Position=vec4(p.x/r.x*2.0-1.0,1.0-(p.y-oy)/r.y*2.0,0.0,1.0);}";
 var fs="precision mediump float;uniform sampler2D t;uniform float a;varying vec2 v;void main(){gl_FragColor=texture2D(t,v)*a;}";
 function sh(ty,s){var o=gl.createShader(ty);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error("sh");return o}
 function prog(f){var o=gl.createProgram();gl.attachShader(o,sh(gl.VERTEX_SHADER,vs));gl.attachShader(o,sh(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(o,0,"p");gl.bindAttribLocation(o,1,"u");gl.linkProgram(o);if(!gl.getProgramParameter(o,gl.LINK_STATUS))throw new Error("ln");return o}
 var pr=prog(fs),pm=prog(fm);
 gl.useProgram(pm);gl.uniform2f(gl.getUniformLocation(pm,"r"),HW,GH);gl.uniform1f(gl.getUniformLocation(pm,"oy"),GY0);gl.uniform1i(gl.getUniformLocation(pm,"ta"),0);gl.uniform1i(gl.getUniformLocation(pm,"tb"),1);
 gl.useProgram(pr);
 var R={c:c,gl:gl,pr:pr,pm:pm,uw:gl.getUniformLocation(pm,"w"),pp:0,pu:1,ua:gl.getUniformLocation(pr,"a"),bp:gl.createBuffer(),bu:gl.createBuffer(),bi:gl.createBuffer(),qp:gl.createBuffer(),qu:gl.createBuffer(),qf:gl.createBuffer()};
 gl.uniform2f(gl.getUniformLocation(pr,"r"),HW,GH);gl.uniform1f(gl.getUniformLocation(pr,"oy"),GY0);gl.uniform1i(gl.getUniformLocation(pr,"t"),0);gl.uniform1f(R.ua,1);gl.viewport(0,0,HW,GH);
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 gl.enableVertexAttribArray(R.pp);gl.enableVertexAttribArray(R.pu);
 function tex(){var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
 R.tex=tex;
 /* two off-screen targets for the hand-over mix */
 R.fb=[0,1].map(function(){var t=tex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,HW,GH,0,gl.RGBA,gl.UNSIGNED_BYTE,null);var f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return {t:t,f:f}});
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("fb");gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 /* the torso band as a texture */
 var tc=mk(HW,GH);tc.getContext("2d").drawImage(TORSO,0,GY0,HW,GH,0,0,HW,GH);R.tt=tex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tc);
 var q=new Float32Array([0,GY0,HW,GY0,0,GY0+GH,HW,GY0,HW,GY0+GH,0,GY0+GH]);gl.bindBuffer(gl.ARRAY_BUFFER,R.qp);gl.bufferData(gl.ARRAY_BUFFER,q,gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER,R.qu);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,0,1,1,0,1]),gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER,R.qf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,1,1,1,0,0,1,1,1,0,0,0]),gl.STATIC_DRAW);
 c.addEventListener("webglcontextlost",function(e){e.preventDefault();GLR=null},false);
 return R}catch(e){return null}}
function segD(px,py,A,B){var dx=B[0]-A[0],dy=B[1]-A[1],L=dx*dx+dy*dy||1,t=cl(((px-A[0])*dx+(py-A[1])*dy)/L,0,1),x=A[0]+t*dx-px,y=A[1]+t*dy-py;return Math.sqrt(x*x+y*y)}
function mkMesh(o,sk,w0k){w0k=w0k||1;var gl=GLR.gl,w=o.i.naturalWidth||o.i.width,h=o.i.naturalHeight||o.i.height,CS=11,nx=Math.max(2,Math.ceil(w/CS)+1),ny=Math.max(2,Math.ceil(h/CS)+1),n=nx*ny;
 var src=new Float32Array(n*2),uv=new Float32Array(n*2),wt=new Float32Array(n*3),idx=new Uint16Array((nx-1)*(ny-1)*6),q=0;
 for(var j=0;j<ny;j++)for(var i=0;i<nx;i++){var v=j*nx+i,px=o.x+w*i/(nx-1),py=o.y+h*j/(ny-1);src[v*2]=px;src[v*2+1]=py;uv[v*2]=i/(nx-1);uv[v*2+1]=j/(ny-1);
  var s=0,ww=[0,0,0];for(var b=0;b<3;b++){var d=segD(px,py,sk[b],sk[b+1]);ww[b]=(b?1:w0k)/Math.pow(d+8,4);s+=ww[b]}for(b=0;b<3;b++)wt[v*3+b]=ww[b]/s}
 for(j=0;j<ny-1;j++)for(i=0;i<nx-1;i++){var a=j*nx+i;idx[q++]=a;idx[q++]=a+1;idx[q++]=a+nx;idx[q++]=a+1;idx[q++]=a+nx+1;idx[q++]=a+nx}
 var tx=GLR.tex();
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,o.i);
 var ub=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ub);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);var ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
 return {tx:tx,n:n,src:src,uv:uv,ub:ub,ib:ib,wt:wt,idx:idx,dst:new Float32Array(n*2)}}
function prepArms(){initPar();GLR=initGL();if(!GLR)return;try{Object.keys(PI).forEach(function(n){var p=PI[n];["L","R"].forEach(function(s){["b","f"].forEach(function(l){var o=p[s+l];if(o&&o.i.width)o.m=mkMesh(o,p.sk[s],l==="f"&&Math.abs(PAR[n][s].r2)>2.3?.03:1)})})})}catch(e){GLR=null}}
/* bone transform: rest bone (P0->P1) onto moving bone (Q0->Q1): rotate, and stretch only along the bone */
function boneM(P0,P1,Q0,Q1){var px=P1[0]-P0[0],py=P1[1]-P0[1],qx=Q1[0]-Q0[0],qy=Q1[1]-Q0[1],lp=Math.hypot(px,py)||1,lq=Math.hypot(qx,qy);
 var s=lp>14?cl(lq/lp,.6,1.7):1,ux=px/lp,uy=py/lp,an=Math.atan2(qy,qx)-Math.atan2(py,px),c=Math.cos(an),sn=Math.sin(an);
 var s00=s*ux*ux+uy*uy,s01=(s-1)*ux*uy,s11=s*uy*uy+ux*ux;
 var a=c*s00-sn*s01,b=c*s01-sn*s11,d=sn*s00+c*s01,e=sn*s01+c*s11;
 return [a,b,Q0[0]-a*P0[0]-b*P0[1],d,e,Q0[1]-d*P0[0]-e*P0[1]]}
function glQuad(tx,uvb,al){var R=GLR,gl=R.gl;gl.uniform1f(R.ua,al);gl.bindBuffer(gl.ARRAY_BUFFER,R.qp);gl.vertexAttribPointer(R.pp,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,uvb);gl.vertexAttribPointer(R.pu,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx);gl.drawArrays(gl.TRIANGLES,0,6);gl.uniform1f(R.ua,1)}
function glLayers(n,C,kind){var R=GLR,gl=R.gl,p=PI[n];
 ["L","R"].forEach(function(s){var o=p[s+kind];if(!o||!o.m)return;var m=o.m,rest=p.sk[s],Q=fromPar(C[s],s),M=[boneM(rest[0],rest[1],Q[0],Q[1]),boneM(rest[1],rest[2],Q[1],Q[2]),boneM(rest[2],rest[3],Q[2],Q[3])];
  /* near a joint the skin turns around that joint (by exactly the joint's own rotation) instead of being averaged,
     so elbows and wrists keep their thickness through big bends */
  var P0=PAR[n][s],mm=s==="L"?1:-1,d01=mm*(C[s].r2-P0.r2),d12=mm*(C[s].r3-P0.r3),E=Q[1],Wj=Q[2],src=m.src,wt=m.wt,dst=m.dst;
  for(var v=0;v<m.n;v++){var x=src[v*2],y=src[v*2+1],w0=wt[v*3],w1=wt[v*3+1],w2=wt[v*3+2],T=M[0],ax=T[0]*x+T[1]*y+T[2],ay=T[3]*x+T[4]*y+T[5],bx,by;
   var t1=w0+w1>1e-6?w1/(w0+w1):1;
   if(t1>.002){T=M[1];bx=T[0]*x+T[1]*y+T[2];by=T[3]*x+T[4]*y+T[5];if(t1>.998){ax=bx;ay=by}else{arc(ax,ay,bx,by,t1,E,d01);ax=AX;ay=AY}}
   if(w2>.002){T=M[2];bx=T[0]*x+T[1]*y+T[2];by=T[3]*x+T[4]*y+T[5];if(w2>.998){ax=bx;ay=by}else{arc(ax,ay,bx,by,w2,Wj,d12);ax=AX;ay=AY}}
   dst[v*2]=ax;dst[v*2+1]=ay}
  gl.bindBuffer(gl.ARRAY_BUFFER,R.bp);gl.bufferData(gl.ARRAY_BUFFER,m.dst,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(R.pp,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,m.ub);gl.vertexAttribPointer(R.pu,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.tx);gl.drawElements(gl.TRIANGLES,m.idx.length,gl.UNSIGNED_SHORT,0)})}
var AX=0,AY=0;
function arc(ax,ay,bx,by,t,J,ref){var ux=ax-J[0],uy=ay-J[1],vx=bx-J[0],vy=by-J[1],ra=Math.sqrt(ux*ux+uy*uy),rb=Math.sqrt(vx*vx+vy*vy);
 if(ra<.6||rb<.6){AX=ax+(bx-ax)*t;AY=ay+(by-ay)*t;return}
 var a=Math.atan2(uy,ux),d=Math.atan2(vy,vx)-a;d+=TAU*Math.round((ref-d)/TAU);var an=a+d*t,r=ra+(rb-ra)*t;AX=J[0]+Math.cos(an)*r;AY=J[1]+Math.sin(an)*r}
/* one complete upper figure on the GPU: pose n bent onto skeleton C (sleeves behind, torso, hands in front) */
function glFigure(n,C){var gl=GLR.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);glLayers(n,C,"b");glQuad(GLR.tt,GLR.qu,1);glLayers(n,C,"f")}
function drawStatic(x,n){if(n==="body"||!PI[n]){x.drawImage(IM.body,0,0,HW,HH);return}var p=PI[n];
 ["Lb","Rb"].forEach(function(k){var o=p[k];if(o)x.drawImage(o.i,o.x,o.y)});x.drawImage(TORSO,0,0);["Lf","Rf"].forEach(function(k){var o=p[k];if(o)x.drawImage(o.i,o.x,o.y)})}
function glOK(){return GLR&&!GLR.gl.isContextLost()}
/* any full-figure picture -> the arm band as a texture (same orientation as the off-screen targets) */
function bandTex(key,src,keep){var R=GLR,gl=R.gl;if(keep&&R[key+"s"]===src)return R[key];
 var c=R.bc||(R.bc=mk(HW,GH)),x=c.getContext("2d");x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation="source-over";x.clearRect(0,0,HW,GH);x.drawImage(src,0,-GY0,HW,HH);
 var t=R[key]||(R[key]=R.tex());gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 R[key+"s"]=keep?src:null;return t}
/* mix two band textures with the coverage-preserving shader straight onto the GL canvas */
function glMixTex(ta,tb,w){var R=GLR,gl=R.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 gl.disable(gl.BLEND);gl.useProgram(R.pm);gl.uniform1f(R.uw,w);
 gl.bindBuffer(gl.ARRAY_BUFFER,R.qp);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,R.qf);gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tb);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,ta);gl.drawArrays(gl.TRIANGLES,0,6);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);gl.useProgram(R.pr);gl.enable(gl.BLEND)}
/* two whole pictures of her swap without ever turning see-through (the arm band is mixed on the GPU) */
function mixPhotos(f,A,B,w,keepA){f.globalAlpha=1;f.globalCompositeOperation="source-over";
 if(w<=0){f.drawImage(A,0,0,HW,HH);return}if(w>=1){f.drawImage(B,0,0,HW,HH);return}
 f.globalAlpha=1-w;f.drawImage(A,0,0,HW,HH);f.globalCompositeOperation="lighter";f.globalAlpha=w;f.drawImage(B,0,0,HW,HH);f.globalCompositeOperation="source-over";f.globalAlpha=1;
 if(glOK()){try{var ta=bandTex("ma",A,keepA),tb=bandTex("mb",B,false);glMixTex(ta,tb,w);f.clearRect(0,GY0,HW,GH);f.drawImage(GLR.c,0,GY0)}catch(e){}}}
/* the whole figure while she is on stage: a = previous pose, b = current pose, kk = hand-over (0..1) */
function drawFigOn(x,a,b,C,kk){
 if(!glOK()||!PI[b]||(kk<1&&!PI[a]&&a!=="body")){if(kk>=1){drawStatic(x,b);return}
  [pa,pb].forEach(function(y){y.setTransform(1,0,0,1,0,0);y.globalAlpha=1;y.globalCompositeOperation="source-over";y.clearRect(0,0,HW,HH)});
  drawStatic(pa,a);drawStatic(pb,b);x.globalAlpha=1-kk;x.drawImage(PA,0,0);x.globalCompositeOperation="lighter";x.globalAlpha=kk;x.drawImage(PB,0,0);x.globalCompositeOperation="source-over";x.globalAlpha=1;return}
 var gl=GLR.gl;
 if(kk<1&&a==="body"){x.save();x.beginPath();x.rect(0,0,HW,GY0);x.rect(0,GY0+GH,HW,HH-GY0-GH);x.clip();
  x.globalAlpha=1-kk;x.drawImage(IM.body,0,0,HW,HH);x.globalCompositeOperation="lighter";x.globalAlpha=kk;x.drawImage(TORSO,0,0);x.restore()}
 else{x.drawImage(TORSO,0,0,HW,GY0,0,0,HW,GY0);x.drawImage(TORSO,0,GY0+GH,HW,HH-GY0-GH,0,GY0+GH,HW,HH-GY0-GH)}
 if(kk>=1){gl.bindFramebuffer(gl.FRAMEBUFFER,null);glFigure(b,C)}
 else if(a==="body"){gl.bindFramebuffer(gl.FRAMEBUFFER,GLR.fb[1].f);glFigure(b,C);glMixTex(bandTex("bt",IM.body,true),GLR.fb[1].t,kk)}
 else{gl.bindFramebuffer(gl.FRAMEBUFFER,GLR.fb[0].f);glFigure(a,C);gl.bindFramebuffer(gl.FRAMEBUFFER,GLR.fb[1].f);glFigure(b,C);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  /* hand-over of the two poses, both already sitting on the same moving arm; coverage is kept solid */
  gl.disable(gl.BLEND);gl.useProgram(GLR.pm);gl.uniform1f(GLR.uw,kk);
  gl.bindBuffer(gl.ARRAY_BUFFER,GLR.qp);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,GLR.qf);gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,GLR.fb[1].t);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,GLR.fb[0].t);gl.drawArrays(gl.TRIANGLES,0,6);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);gl.useProgram(GLR.pr);gl.enable(gl.BLEND)}
 x.drawImage(GLR.c,0,GY0)}
function curSkel(t){if(!SKS)SKS=skFrom(PAR[PS.cur]);var C={};["L","R"].forEach(function(s){C[s]=livePar(SKS[s],s,t,PS.cur)});return C}
var PA,pa,PB,pb,SNAP,sn,SNAPON=0;

/* ---------- head, brows, blinks ---------- */
var blinkV=0,nextBlink=2;
function blinkNow(){if(blinkV<=0)blinkV=1}
function stepHead(dt,t){var H=HB,lt=0,tt=0,ny=0,sp=!!SPK||NQ.active;
 if(H.think){lt=.35*lookToContent()*-1;ny=-.9;tt=-.35}
 else if(H.listen>0){lt=panelSide()*.35;tt=.55;H.listen=Math.max(0,H.listen-dt*.25)}
 else if(sp){var n=GS.name,e=t-GS.t0;lt=(n==="present"&&e<3.4)?lookToContent()*.65:(n==="count"?lookToContent()*.25:0);lt+=Math.sin(t*.9)*.08;tt=Math.sin(t*.53)*.25+(GS.q?.35:0)}
 else if(t-PTR.t<1.8&&PTR.t>0){var r=cv.getBoundingClientRect();lt=cl((PTR.x-(r.left+r.width/2))/((window.innerWidth||1000)*.45),-1,1)*.75;ny=cl((PTR.y-(r.top+r.height*.2))/600,-1,1)*.4}
 else{if(t>idle.next){idle.next=t+5+Math.random()*6;idle.tg=(Math.random()<.5?-1:1)*(.45+Math.random()*.45);idle.until=t+1.3+Math.random()}
  if(t<idle.until)lt=idle.tg;if(t-H.scrollT<.8)ny=.35}
 H.lookV+=(38*(lt-H.look)-10*H.lookV)*dt;H.look+=H.lookV*dt;
 H.nodV+=(-90*H.nod-11*H.nodV)*dt;H.nod+=H.nodV*dt;H.nodBase=(H.nodBase||0)+(ny-(H.nodBase||0))*Math.min(1,dt*3);
 H.tiltV+=(30*(tt-H.tilt)-9*H.tiltV)*dt;H.tilt+=H.tiltV*dt;
 H.brow=Math.max(0,H.brow-dt*(SPK&&SPK.q?.25:.9));H.joy=Math.max(0,H.joy-dt*.8);BEAT.v=Math.max(0,BEAT.v-dt*3.2);
 if(t>nextBlink){blinkNow();nextBlink=t+2+Math.random()*3.6;if(Math.random()<.18)setTimeout(blinkNow,260)}
 blinkV=Math.max(0,blinkV-dt*7.5)}
var idle={next:4,tg:0,until:0};
function panelSide(){var p=$("olh-panel").getBoundingClientRect(),r=cv.getBoundingClientRect();if(!p.width)return 0;return (p.left+p.width/2)<(r.left+r.width/2)?-1:1}

function stopSpeak(){stopNarration()}
/* chat answers: recorded voice when the answer is one of Shams's own lines, otherwise live voice */
function speakReply(text,L,key){stopNarration();var g0=GS;
 if(key&&hasClip(key,L)&&canVoice()){gesture((LINES[key]||{}).g||"open",text);playClip(key,L).then(function(ok){if(ok)gesture("rest")});return}
 gesture(/\d/.test(text)?"count":"open",text);
 if(!canVoice()){setTimeout(function(){if(!SPK&&!NQ.active)gesture("rest")},3200);return}
 var arr=["present","talk","open","count","talk"],k=0,gi=setInterval(function(){if(SPK)gesture(arr[k++%arr.length],text)},3600);
 speakText(text,L).then(function(ok){clearInterval(gi);if(ok!==false||!SPK)gesture("rest")})}
function chatOpened(){stopNarration();hideBubble();HB.listen=1;
 if(mode==="on"&&canVoice()&&hasClip("x.chat",lang)){gesture("open");playClip("x.chat",lang).then(function(ok){if(ok)gesture("rest")})}}

/* ---------- living guide: Shams appears from between the olive trees (canvas scene) ---------- */
var FACE=K.face,g=cv.getContext("2d"),vis=true,skinC="#D7BC8E",lidC="#5A3A30";
var CW=cv.width,CH=cv.height,HX=142,HY=52,HW=476,HH=900;
var IM={body:new Image(),push:new Image(),branch:new Image()},left=3;
/* ---- Shams's gesture library: every pose has, per arm, the sleeve behind the shawl (b), the hand/forearm in front
   of it (f) and a skeleton (shoulder, elbow, wrist, fingertips). Her torso, shawl and face are never redrawn. ---- */
var PZ=window.OLH_POSES||{},PI={};
Object.keys(PZ).forEach(function(n){var r=PZ[n],o={sk:r.sk};["Lb","Lf","Rb","Rf"].forEach(function(k){if(!r[k])return;var i=new Image();left++;i.onload=onImg;i.onerror=onImg;i.src=r[k].d;o[k]={i:i,x:r[k].x,y:r[k].y}});PI[n]=o});
function onImg(){if(--left===0)start()}
IM.body.onload=IM.push.onload=IM.branch.onload=onImg;IM.body.src=IMG.body;IM.push.src=IMG.push;IM.branch.src=IMG.branch;
$("olh-fimg").src=IMG.face;$("olh-limg").src=IMG.face;
if(window.IntersectionObserver)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(cv);
/* ===================================================================================
   OLIVE GROVE REVEAL ENGINE
   Shams waits hidden behind a living hedge of olive branches. She steps up, her hands slip
   between the twigs and sweep them aside (each branch is a damped spring that bends along
   its length and follows her hands by contact), she steps through into the light, the
   branches recoil, react to her glances, then gracefully withdraw shedding a few leaves.
   Leaving plays the same story in reverse.
   =================================================================================== */
function mk(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c}
function cl(x,a,b){return x<a?a:x>b?b:x}
function ease(x){x=cl(x,0,1);return 1-Math.pow(1-x,3)}
function inout(x){x=cl(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
function sstep(a,b,x){x=cl((x-a)/(b-a),0,1);return x*x*(3-2*x)}
var FILTER=(function(){try{var c=mk(2,2).getContext("2d");c.filter="blur(2px)";return c.filter==="blur(2px)"}catch(e){return false}})();
var headC=null;
function makeHead(){headC=mk(130,160);var x=headC.getContext("2d");
 x.drawImage(IM.body,FACE.head[0],FACE.head[1],130,160,0,0,130,160);x.globalCompositeOperation="destination-in";
 var gr=x.createRadialGradient(65,70,30,65,70,78);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(.72,"rgba(0,0,0,1)");gr.addColorStop(1,"rgba(0,0,0,0)");
 x.save();x.scale(1,1.12);x.fillStyle=gr;x.fillRect(0,0,130,160);x.restore();
 try{var c=mk(4,4);var y=c.getContext("2d");y.drawImage(IM.body,FACE.eyeL[0]-2,FACE.eyeL[1]-9,4,4,0,0,4,4);var p=y.getImageData(1,1,1,1).data;skinC="rgb("+p[0]+","+p[1]+","+p[2]+")"}catch(e){}}
/* ---- rig: Shams's arms are cut from the "push" pose so they can swing from the shoulder ---- */
/* ---- rig v2: two bones per arm. Shoulder joint (rotation + light foreshortening) and a wrist joint, so the
   palm stays natural while the arm moves, waves come from the wrist and nothing is ever squashed into a stub. ---- */
var ARMDEF={L:{s:-1,pv:[141,182],hand:[-119,-7],wr:[30,222],hp:[[-6,116],[46,116],[46,206],[44,208],[16,234],[-6,236]],hx:[[-6,116],[48,116],[52,212],[24,248],[-6,248]],poly:[[0,96],[125,96],[148,146],[145,153],[144,160],[145,166],[140,172],[139,178],[138,184],[137,196],[137,214],[138,226],[140,232],[142,238],[144,244],[140,248],[128,262],[100,294],[70,312],[0,312]]},
            R:{s:1,pv:[343,184],hand:[111,-9],wr:[449,229],hp:[[430,116],[482,116],[482,248],[463,243],[434,213],[430,209]],hx:[[426,116],[482,116],[482,260],[458,260],[424,220]],poly:[[476,96],[356,96],[320,146],[328,154],[335,160],[338,166],[343,172],[347,178],[351,184],[354,190],[355,196],[351,202],[348,208],[346,214],[344,220],[342,226],[340,232],[337,238],[335,244],[333,248],[345,262],[396,298],[412,312],[476,312]]}};
var PHI0=2.14; /* ~123deg: hands together in front of her chest */
var TORSO,ARM={},ARMF={},HAND={},BR={},FIG=mk(HW,HH),f=FIG.getContext("2d"),RIGC=mk(HW,HH),rg=RIGC.getContext("2d");
PA=mk(HW,HH);pa=PA.getContext("2d");PB=mk(HW,HH);pb=PB.getContext("2d");SNAP=mk(HW,HH);sn=SNAP.getContext("2d");
function poly(x,pts){x.beginPath();pts.forEach(function(p,i){i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath()}
function prepRig(){
 TORSO=mk(HW,HH);var t=TORSO.getContext("2d");t.drawImage(IM.push,0,0,HW,HH);t.globalCompositeOperation="destination-out";
 [[0,158,HW,HH],[0,0,120,158],[360,0,HW-360,158]].forEach(function(r){t.save();t.beginPath();t.rect(r[0],r[1],r[2],r[3]);t.clip();poly(t,ARMDEF.L.poly);t.fill();poly(t,ARMDEF.R.poly);t.fill();t.restore()});
 ["L","R"].forEach(function(k){var A=ARMDEF[k];
  var c=mk(HW,HH),x=c.getContext("2d");x.save();poly(x,A.poly);x.clip();x.drawImage(IM.push,0,0,HW,HH);x.restore();x.globalCompositeOperation="destination-out";var sg=x.createLinearGradient(0,132,0,170);sg.addColorStop(0,"rgba(0,0,0,1)");sg.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=sg;x.fillRect(0,0,HW,170);x.fillStyle="#000000";poly(x,A.hp);x.fill();x.globalCompositeOperation="source-over";ARM[k]=c;
  var hc=mk(HW,HH),hx=hc.getContext("2d");hx.save();poly(hx,A.hx);hx.clip();hx.drawImage(IM.push,0,0,HW,HH);hx.restore();HAND[k]=hc;
  /* feathered copy for when the arm crosses in front of her chest */
  var c2=mk(HW,HH),y=c2.getContext("2d");y.drawImage(c,0,0);y.globalCompositeOperation="destination-out";
  var x0=A.s<0?140:338,x1=A.s<0?112:368,gr=y.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(1,"rgba(0,0,0,0)");
  y.fillStyle=gr;y.fillRect(Math.min(x0,x1)-30,0,Math.abs(x1-x0)+60,HH);ARMF[k]=c2});
 /* branch looks: mid = crisp, near = soft focus foreground, back = shaded + out of focus */
 var bw=IM.branch.width,bh=IM.branch.height;
 function variant(pad,flt,tint){var c=mk(bw+pad*2,bh+pad*2),x=c.getContext("2d");if(FILTER&&flt)x.filter=flt;x.drawImage(IM.branch,pad,pad);x.filter="none";
  if(tint){x.globalCompositeOperation="source-atop";x.fillStyle=tint;x.fillRect(0,0,c.width,c.height)}return {c:c,p:pad}}
 BR.mid={c:IM.branch,p:0};
 BR.near=variant(6,"blur(1.6px) brightness(1.04) saturate(1.05)",null);
 BR.back=variant(8,"blur(2.4px) brightness(.62) saturate(.8)",FILTER?"rgba(30,42,24,.18)":"rgba(25,36,20,.5)");
}
/* ---- branches: [side, pivotY, restRotation, scale, tier(0 back · 1 mid · 2 near)] ---- */
var BDEF=[[-1,70,.26,.70,0],[1,96,-.22,.72,0],[-1,410,-.14,.66,0],[1,440,.18,.64,0],[-1,700,.10,.62,0],[1,730,-.12,.62,0],
 [-1,34,.16,.74,1],[1,58,-.12,.76,1],[-1,120,.10,.80,1],[1,150,-.06,.78,1],[-1,214,-.02,.92,1],[1,236,.04,.90,1],[-1,340,.08,.86,1],[1,362,-.08,.88,1],
 [-1,480,-.05,.84,1],[1,502,.06,.82,1],[-1,640,.07,.80,1],[1,662,-.04,.80,1],[-1,800,-.03,.74,1],[1,818,.05,.74,1],
 [1,282,.03,1.02,2],[-1,566,-.04,1.0,2]];
var SLIDE=215,ROT=.5,NS=12,TIP=[480,84];
var BRS=[];
function tipOut(b,o){var k=b.tier===0?.55:1,oo=Math.min(o,1.25),gx=o*SLIDE*k,r=b.r0+b.dir*oo*ROT*k;
 return CW/2-(-gx+b.sc*(Math.cos(r)*TIP[0]-Math.sin(r)*TIP[1]))}
function initBranches(){var fr=0,bk=0;BRS=BDEF.map(function(d,i){var b={s:d[0],py:d[1],r0:d[2],sc:d[3],tier:d[4],dir:d[1]<300?-1:1,ph:Math.random()*6.283,
  o:1.7,v:0,b:0,bv:0,a:0,away:0,act:0,awayT:0,latch:0,touched:0,shed:0,rank:d[4]===0?bk++:fr++};
  b.t0=tipOut(b,0);b.D=Math.max(60,tipOut(b,1)-b.t0);b.by=b.py+40*b.sc;return b});
 BRS.sort(function(a,c){return a.tier-c.tier})}
function resetBranches(open){BRS.forEach(function(b){b.o=1.7;b.v=0;b.b=0;b.bv=0;b.a=0;b.away=0;b.latch=0;b.touched=open?1:0;b.shed=0})}
/* ---- falling olive leaves: flutter, tumble (silver underside), drift ---- */
var LEAVES=[];
function leafAt(x,y,dir){LEAVES.push({x:x,y:y,vx:dir*(30+Math.random()*70),vy:-40-Math.random()*60,r:Math.random()*6.283,fl:Math.random()*6.283,vf:(Math.random()<.5?-1:1)*(4+Math.random()*5),
 sw:Math.random()*6.283,vs:2+Math.random()*1.6,s:.95+Math.random()*.5,a:1,life:2.4+Math.random()*1.4,age:0})}
function stepLeaves(dt){LEAVES=LEAVES.filter(function(l){l.age+=dt;if(l.age>l.life)return false;l.sw+=l.vs*dt;
 l.vy+=(120-l.vy)*Math.min(1,dt*1.8);l.vx+=(Math.sin(l.sw)*60-l.vx)*Math.min(1,dt*1.5);l.x+=l.vx*dt;l.y+=l.vy*dt;
 l.fl+=l.vf*dt;l.r+=Math.cos(l.sw)*dt*1.4;l.a=1-sstep(l.life-.7,l.life,l.age);return true})}
function drawLeaves(){LEAVES.forEach(function(l){var fy=Math.cos(l.fl),top=fy>0;g.save();g.globalAlpha=l.a;g.translate(l.x,l.y);g.rotate(l.r);g.scale(l.s,l.s*Math.max(.1,Math.abs(fy)));
 var lg=g.createLinearGradient(0,-8,0,8);if(top){lg.addColorStop(0,"#5A7F47");lg.addColorStop(1,"#365029")}else{lg.addColorStop(0,"#C4CAB2");lg.addColorStop(1,"#949D79")}
 g.fillStyle=lg;g.beginPath();g.moveTo(-24,0);g.bezierCurveTo(-12,-8.5,10,-7,25,0);g.bezierCurveTo(10,7,-12,8.5,-24,0);g.fill();
 g.strokeStyle=top?"rgba(195,204,168,.55)":"rgba(85,110,72,.55)";g.lineWidth=1;g.beginPath();g.moveTo(-27,0);g.lineTo(21,0);g.stroke();g.restore()})}
function tipWorld(b){var k=b.tier===0?.55:1,oo=Math.min(Math.max(b.o,0),1.25),gx=b.o*SLIDE*k+b.away*230,gy=b.dir*oo*22*k+b.away*50,r=b.r0+b.dir*oo*ROT*k+b.b*.6,
 lx=-gx+b.sc*(Math.cos(r)*(TIP[0]-60)-Math.sin(r)*TIP[1]),ly=b.py+gy+b.sc*(Math.sin(r)*(TIP[0]-60)+Math.cos(r)*TIP[1]);return [b.s<0?lx:CW-lx,ly]}
function shed(b,n){var p=tipWorld(b);for(var i=0;i<n;i++)leafAt(p[0]+(Math.random()-.5)*60,p[1]+(Math.random()-.5)*50,b.s)}
/* ---- draw one branch, bent along its length (sliced skeleton) ---- */
function drawBranch(b,t,trem,g){var alpha=b.a*(1-b.away);if(alpha<=.01)return;
 var k=b.tier===0?.55:1,oo=Math.min(Math.max(b.o,0),1.25);
 var gx=b.o*SLIDE*k+b.away*230,gy=b.dir*oo*22*k+b.away*50;
 var wind=(Math.sin(t*1.1+b.ph)*.016+Math.sin(t*.47+b.ph*2)*.011)*(b.tier===0?.7:1);
 var r=b.r0+b.dir*oo*ROT*k+wind+trem*(Math.sin(t*29+b.ph)*.045+Math.sin(t*17+b.ph*3)*.025)+b.away*b.dir*.2;
 var bend=b.b+Math.sin(t*1.7+b.ph)*.022+trem*Math.sin(t*23+b.ph)*.05;
 var src=b.tier===0?BR.back:(b.tier===2?BR.near:BR.mid),P=src.p,bw=IM.branch.width,bh=IM.branch.height,sw=bw/NS,st=bend/NS,sc=b.sc*(1-b.away*.14);
 g.save();g.globalAlpha=alpha*(b.tier===0?.92:1);
 if(b.s<0)g.translate(-gx,b.py+gy);else{g.translate(CW+gx,b.py+gy);g.scale(-1,1)}
 g.rotate(r);g.scale(sc,sc);g.translate(-40,0);
 var yo=-bh*.32-P,H=bh+P*2;
 for(var j=0;j<NS;j++){var sx=j===0?0:P+j*sw,dx=j===0?-P:0,w=j===0?sw+P+3:(j===NS-1?sw+P:sw+3);
  if(sx+w>src.c.width)w=src.c.width-sx;g.drawImage(src.c,sx,0,w,H,dx,yo,w,H);g.translate(sw,0);g.rotate(st)}
 g.restore()}
/* foliage is drawn on its own layer whose borders melt away, so no branch ever shows a hard canvas edge */
var FOL=mk(CW,CH),fo=FOL.getContext("2d"),FADE=null;
function makeFade(){FADE=mk(CW,CH);var x=FADE.getContext("2d");function band(x0,y0,x1,y1,rx,ry,rw,rh){var gr=x.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(.55,"rgba(0,0,0,.45)");gr.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=gr;x.fillRect(rx,ry,rw,rh)}
 band(0,0,130,0,0,0,130,CH);band(CW,0,CW-130,0,CW-130,0,130,CH);band(0,0,0,90,0,0,CW,90);band(0,CH,0,CH-80,0,CH-80,CW,80)}
function foliage(tiers,t,trem){fo.globalCompositeOperation="source-over";fo.clearRect(0,0,CW,CH);
 BRS.forEach(function(b){if(tiers.indexOf(b.tier)>-1)drawBranch(b,t,b.tier===0?trem*.5:trem,fo)});
 fo.globalAlpha=1;fo.globalCompositeOperation="destination-out";fo.drawImage(FADE,0,0);fo.globalCompositeOperation="source-over";g.drawImage(FOL,0,0)}
/* ---- timeline state ---- */
var mode="off",mT=0,doneCb=null,guideReady=false,pendingB=null,revealedAt=0;
var t0=0,scripted={};
var ST={pose:1,phi:PHI0,lift:.16,d:1,pres:0,trem:0};
var ENTER_END=6.9,LEAVE_END=2.8;
function start(){makeHead();sampleSkin();prepRig();prepArms();makeFade();initBranches();requestAnimationFrame(loop);
 if(reduced){mode="on";ST.pose=0;ST.d=0;ST.pres=1;guideReady=true;setTimeout(tourKick,600);return}
 var waited=0;(function w(){if(document.body.classList.contains("is-ready")||waited>9000)setTimeout(enter,750);else{waited+=150;setTimeout(w,150)}})()}
function enter(){LEAVING=null;root.classList.remove("is-leaving");if(reduced){mode="on";ST.pose=0;ST.d=0;ST.pres=1;flushBubble();setTimeout(tourKick,400);return}
 mode="in";mT=now();LEAVES=[];scripted={};HB.look=0;resetBranches(false);RIG.w=0;
 var fo=0;BRS.forEach(function(b){if(b.tier===0)b.act=.05+b.rank*.07;else b.act=b.tier===2?.42+b.rank*.0:.08+(fo++)*.045;b.awayT=b.tier===0?5.05+b.rank*.06:5.2+b.rank*.05});
 ST.pose=1;ST.phi=PHI0;ST.lift=.16;ST.d=1;ST.pres=0;guideReady=false}
var LEAVING=null,LEAVE_P="palmsup";
function leave(cb){if(mode==="out"||LEAVING)return;
 if(mode==="on"&&!reduced&&glOK()&&PAR[LEAVE_P]&&!(PS.cur===LEAVE_P&&!PS.then&&PS.w>=1&&PS.k>=.92)){
  LEAVING={cb:cb,t:now()};stopNarration();hideBubble();PS.q=[];PS.until=0;goPose(LEAVE_P);return}
 leaveNow(cb)}
function leaveNow(cb){if(mode==="out")return;LEAVING=null;SNAPON=0;if(mode==="on"&&SNAP){sn.setTransform(1,0,0,1,0,0);sn.globalAlpha=1;sn.globalCompositeOperation="source-over";sn.clearRect(0,0,HW,HH);drawFigOn(sn,PS.cur,PS.cur,PS.C,1);SNAPON=1}doneCb=cb||null;stopNarration();hideBubble();root.classList.add("is-leaving");
 if(reduced){finishLeave();return}
 mode="out";mT=now();scripted={};resetBranches(true);guideReady=false;
 /* start the exit from whatever she is doing now */
 ST.pose=0;
 BRS.forEach(function(b){b.act=b.tier===0?.12+b.rank*.05:.0+b.rank*.03;b.awayT=b.tier===0?1.36+b.rank*.025:1.4+b.rank*.025});
 setTimeout(function(){if(mode==="out"&&now()-mT>LEAVE_END)finishLeave()},(LEAVE_END+.6)*1000)}
function finishLeave(){mode="off";ST.pres=0;root.classList.remove("is-leaving");var c=doneCb;doneCb=null;if(c)c()}
function flushBubble(){guideReady=true;if(pendingB){var p=pendingB;pendingB=null;showBubble(p[0],p[1],p[2],p[3])}}
window.__olhEnter=enter;window.__olhLeave=leave;
/* choreography of the entrance / exit (the olive-grove reveal) */
function choreo(e){var S=ST;
 if(mode==="in"){
  e-=.15;S.pres=ease((e-.85)/.75);
  S.d=e<1.45?1-.38*inout((e-.85)/.6):.62*(1-inout((e-1.7)/1.1));
  S.trem=sstep(1.05,1.25,e)*(1-sstep(1.5,1.75,e))*.9;
  var sweep=inout((e-1.45)/1.05);
  S.phi=PHI0*(1-sweep)+Math.sin(e*8)*.05*S.trem;
  S.lift=.16-.1*sweep+.05*Math.sin(Math.PI*sweep)-.72*inout((e-3.05)/.5);
  S.pose=1-inout((e-3.28)/.42);
  if(e>3.5&&!guideReady){revealedAt=e;flushBubble()}
 }else if(mode==="out"){
  var p0=Math.max(ST.pose,0);if(SNAPON){S.pose=inout(e/.26);S.lift=NEU.lift+.68*inout((e-.2)/.55)}else{S.pose=Math.max(p0,inout(e/.36));S.lift=NEU.lift+.68*inout((e-.12)/.55)}
  S.phi=PHI0*inout((e-.62)/.85);
  S.d=inout((e-.75)/.9);
  S.pres=1-inout((e-1.25)/.45);
  S.trem=sstep(1.5,1.65,e)*(1-sstep(1.85,2.05,e))*.8;
 }else if(mode==="on"){S.d=0;S.pres=1;S.trem=0}
 else{S.pres=0}}
function figToWorld(x,y,S){var ds=1-.075*S.d,lift=34*S.d;return [HX+HW/2+ds*(x-HW/2),HY+HH-lift+ds*(y-HH)]}
function armXf(k){var A=ARMDEF[k],a=AR[k],c0=Math.cos(a.phi),c=(c0<0?-1:1)*Math.max(.2,Math.abs(c0)),l=a.lift,rot=A.s<0?l:-l;var hx=A.hand[0]*c,hy=A.hand[1];
 /* wrist: counter-rotates the palm so it stays upright, plus the gesture's own tilt (and the wave) */
 var wr=(c>0?-rot*.8:0)+(mode==="on"?A.s*((a.ht||0)+(a.o||0)):0);
 return {c:c,rot:rot,wr:wr,hand:[A.pv[0]+Math.cos(rot)*hx-Math.sin(rot)*hy,A.pv[1]+Math.sin(rot)*hx+Math.cos(rot)*hy]}}

/* ===================================================================================
   FACE: lips (jaw drop + lip spread/round + teeth + tongue), eyelids, eyebrows, head motion.
   All of it works on the figure canvas in photo coordinates, so it follows every pose.
   =================================================================================== */
var MO={x:235.6,y:93.8},MS=mk(64,48),ms=MS.getContext("2d"),HDC=mk(130,160),hd=HDC.getContext("2d"),HMASK=null,BRW=mk(64,14),bw=BRW.getContext("2d");
function makeHeadMask(){HMASK=mk(130,160);var x=HMASK.getContext("2d");x.save();x.translate(65,74);x.scale(1,1.18);
 var gr=x.createRadialGradient(0,0,40,0,0,62);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=gr;x.fillRect(-65,-74,130,160);x.restore()}
function sampleSkin(){try{var c=mk(24,8),y=c.getContext("2d"),q=FACE.eyeL;y.drawImage(IM.body,q[0]-6,q[1]+6,12,4,0,0,12,4);q=FACE.eyeR;y.drawImage(IM.body,q[0]-6,q[1]+6,12,4,12,0,12,4);
 var p=y.getImageData(0,0,24,4).data,r=0,gg=0,bb=0,n=0;for(var i=0;i<p.length;i+=4){if(p[i+3]<200)continue;r+=p[i];gg+=p[i+1];bb+=p[i+2];n++}
 if(n){r/=n;gg/=n;bb/=n;skinC="rgb("+Math.round(r*.93)+","+Math.round(gg*.88)+","+Math.round(bb*.86)+")";lidC="rgba("+Math.round(r*.35)+","+Math.round(gg*.25)+","+Math.round(bb*.22)+",.9)"}}catch(e){}}
function lens(dx,hw){var u=dx/hw;return u*u>=1?0:Math.pow(1-u*u,.55)}
function drawMouth(o,w){if(o<.03&&Math.abs(w-.5)<.04)return;
 var X0=Math.round(MO.x)-32,Y0=Math.round(MO.y)-14,y0=MO.y-Y0;ms.clearRect(0,0,64,48);ms.drawImage(FIG,X0,Y0,64,48,0,0,64,48);
 var open=o*5.6,sx=1+(w-.5)*.3,hwL=15.5*sx,cx=MO.x-X0,dx,i;
 f.save();
 /* chin + jaw (drops a little less than the lower lip) */
 for(i=-26;i<=26;i++){var sC=open*.55*Math.pow(Math.cos(Math.PI/2*Math.min(1,Math.abs(i)/27)),2);if(sC<.05)continue;
  f.drawImage(MS,cx+i,y0+6,1,24,X0+cx+i,Y0+y0+6+sC,1,24)}
 /* mouth interior */
 if(open>.35){var hwI=hwL*.86;for(i=-Math.ceil(hwI);i<=Math.ceil(hwI);i++){var h=open*lens(i,hwI);if(h<.3)continue;var x=X0+cx+i,y=Y0+y0-.4;
   f.fillStyle="#2A0C0E";f.fillRect(x,y,1,h+.6);
   if(open>1.3&&Math.abs(i)<hwI*.72){f.fillStyle="rgba(245,238,227,.92)";f.fillRect(x,y,1,Math.min(1.7,h*.34))}
   if(open>3&&Math.abs(i)<hwI*.55){f.fillStyle="rgba(170,74,78,.75)";var th=h*.3;f.fillRect(x,y+h+.6-th,1,th)}}}
 /* lips: lower lip rides on the jaw, both lips stretch (wide) or pucker (round) */
 for(i=-21;i<=21;i++){var tap=1-sstep(13,21,Math.abs(i)),sxx=1+(sx-1)*tap,src=cx+i/sxx,sL=open*lens(i,hwL);
  f.drawImage(MS,src,y0,1,7,X0+cx+i,Y0+y0+sL,1,7);
  f.drawImage(MS,src,y0-7,1,7,X0+cx+i,Y0+y0-7,1,7)}
 f.restore()}
function drawLids(lid){if(lid<=.05)return;[FACE.eyeL,FACE.eyeR].forEach(function(q){var rx=FACE.ew/2+1.7,top=q[1]-FACE.eh*.62-1.2,bot=top+(FACE.eh*1.24+1.4)*lid;
 f.save();f.fillStyle=skinC;f.shadowColor=skinC;f.shadowBlur=2.2;f.beginPath();f.moveTo(q[0]-rx,q[1]-1);
 f.quadraticCurveTo(q[0]-rx*.2,top-2.2,q[0]+rx,q[1]-1.2);f.lineTo(q[0]+rx,Math.min(bot,q[1]+FACE.eh*.6));
 f.quadraticCurveTo(q[0],bot+FACE.eh*.38*lid,q[0]-rx,Math.min(bot,q[1]+FACE.eh*.6));f.closePath();f.fill();f.shadowBlur=0;
 if(lid>.45){f.globalAlpha=Math.min(1,(lid-.45)*2.2);f.strokeStyle=lidC;f.lineWidth=1.05;f.lineCap="round";f.beginPath();var yb=Math.min(bot,q[1]+FACE.eh*.6);
  f.moveTo(q[0]-rx+1.2,yb-.3);f.quadraticCurveTo(q[0],yb+FACE.eh*.38*lid-.2,q[0]+rx-1.2,yb-.3);f.stroke()}f.restore()})}
function drawBrows(b){if(b<.05)return;var up=b*1.4;bw.clearRect(0,0,64,14);bw.drawImage(FIG,203,49,64,14,0,0,64,14);f.drawImage(BRW,0,0,64,14,203,49-up,64,14)}
function headMove(hx,hy,hr){if(Math.abs(hx)<.05&&Math.abs(hy)<.05&&Math.abs(hr)<.002)return;var H=FACE.head,N=FACE.neck;
 hd.globalCompositeOperation="source-over";hd.clearRect(0,0,130,160);hd.drawImage(FIG,H[0],H[1],130,160,0,0,130,160);
 hd.globalCompositeOperation="destination-in";hd.drawImage(HMASK,0,0);
 f.save();f.translate(N[0]+hx,N[1]+hy);f.rotate(hr);f.translate(-N[0],-N[1]);f.drawImage(HDC,H[0],H[1]);f.restore()}
/* live faces: chat header + launcher show her talking face */
var FC=[$("olh-fcv"),$("olh-lcv")].filter(Boolean),fcT=0;
function liveFaces(t){if(t-fcT<.033)return;fcT=t;FC.forEach(function(c){if(!c.offsetParent)return;var x=c.getContext("2d"),s=c.width;x.clearRect(0,0,s,s);x.drawImage(FIG,190,18,92,92,0,0,s,s)});root.classList.add("has-live")}

var mouth={o:0,w:.5};
function loop(ts){requestAnimationFrame(loop);if(!vis||document.hidden){t0=0;return}if(window.OLGA_GOV&&!OLGA_GOV.allow(ts))return;var t=ts/1000,dt=Math.min(.05,t0?t-t0:.016);t0=t;var m0=mode;
 var e=mode==="in"||mode==="out"?now()-mT:99;
 if(mode==="in"&&e>ENTER_END){mode="on";RIG.w=0;AR.L=armState();AR.R=armState();PS.prev="body";PS.cur="clasp";PS.k=1;PS.w=0;PS.tk=0;PS.D={L:0,R:0};PS.pk={L:1,R:1};PS.amp=AMP.clasp;SKS=skFrom(bodyPar());PS.frz=now()+.3;PS.q=[];PS.until=now()+1.2;PS.idleT=now()+12;guideReady||flushBubble();setTimeout(tourKick,300)}
 if(mode==="out"&&e>LEAVE_END){finishLeave()}
 choreo(e);var S=ST;
 if(mode==="in"){if(e>4&&!scripted.a){scripted.a=1;idle.tg=1;idle.until=t+.85;idle.next=t+30}if(e>4.9&&!scripted.b){scripted.b=1;idle.tg=-1;idle.until=t+.8}}
 /* arms: entrance/exit choreography, or the live gesture engine */
 if(mode==="on"){stepPose(dt,t);S.pose=0}
 if(mode!==m0&&(mode==="in"||mode==="out")){e=now()-mT;choreo(e);S=ST;["L","R"].forEach(function(k){var a=AR[k];a.phi=S.phi;a.lift=S.lift;a.o=0;a.ht=0;a.vp=a.vl=a.vh=0})}
 else{["L","R"].forEach(function(k){var a=AR[k];a.phi=S.phi;a.lift=S.lift;a.o=0;a.ht=0;a.vp=a.vl=a.vh=0})}
 var pl=HB.look;stepHead(dt,t);
 /* the voice accent reaches arms and body through a spring, so syllables never make her twitch */
 for(var bsN=Math.max(1,Math.ceil(dt/.012)),bsH=dt/bsN,bsI=0;bsI<bsN;bsI++){BS.v+=(324*((BEAT.v||0)-BS.x)-36*BS.v)*bsH;BS.x+=BS.v*bsH}if(!isFinite(BS.x)||!isFinite(BS.v)||Math.abs(BS.x)>8){BS.x=0;BS.v=0}
 var m=(mode==="on"&&canVoice())?mouthNow():null,tgO=m?m.o:0,tgW=m?m.w:.5;
 mouth.o+=(tgO-mouth.o)*(1-Math.exp(-dt*(tgO>mouth.o?34:20)));mouth.w+=(tgW-mouth.w)*(1-Math.exp(-dt*18));
 var lid=blinkV>0?Math.sin(blinkV*Math.PI):0;
 g.clearRect(0,0,CW,CH);
 if(S.pres<=0&&mode!=="in"&&mode!=="out"){LEAVES.length&&(stepLeaves(dt),drawLeaves());return}
 /* hands in world space -> drive the branches */
 var aL=armXf("L"),aR=armXf("R"),hL=figToWorld(aL.hand[0],aL.hand[1],S),hR=figToWorld(aR.hand[0],aR.hand[1],S);
 var gain=S.pose*cl((.8-S.d)/.2,0,1),bodyP=ease(cl((.62-S.d)/.62,0,1));
 var branchesOn=mode==="in"||mode==="out";
 if(branchesOn){
  if(mode==="in"&&e>1.35&&!scripted.r1){scripted.r1=1;BRS.forEach(function(b){if(b.tier&&b.by<420){b.v+=(Math.random()-.3)*.9;b.bv+=(Math.random()-.5)*1.2}})}
  if(mode==="in"&&e>1.57&&!scripted.r2){scripted.r2=1;BRS.forEach(function(b){if(b.tier&&b.by<460){b.v+=Math.random()*.7;b.bv+=(Math.random()-.5)*1}if(b.tier&&Math.random()<.25)shed(b,1)})}
  if(mode==="out"&&e>1.6&&!scripted.r3){scripted.r3=1;BRS.forEach(function(b){if(b.tier){b.v-=Math.random()*.6;b.bv+=(Math.random()-.5)*1.3}})}
  var dLook=HB.look-pl;
  BRS.forEach(function(b){var le=e-b.act;if(le<0){b.o=1.7;b.a=0;return}
   b.a=Math.min(1,b.a+dt/.38);
   var tgt=0;
   if(b.tier>0){var H=b.s<0?hL:hR,hx=b.s<0?H[0]:CW-H[0],out=CW/2-hx,req=cl((out+18-b.t0)/b.D,0,1.12),w=1-sstep(110,260,Math.abs(H[1]-b.by));
    var hand=gain*w*req,body=bodyP*(.62+.4*sstep(260,480,b.by));tgt=Math.max(hand,body);
    if(hand>.15&&!b.touched){b.touched=1;b.v+=.6;b.bv+=b.dir*.8;if(Math.random()<.6)shed(b,1+(Math.random()*2|0))}
    if(mode==="in"&&e>1.65)b.latch=Math.max(b.latch,.9*Math.min(tgt,1));if(mode==="in")tgt=Math.max(tgt,b.latch);
    if(Math.abs(dLook)>.002&&(dLook>0?b.s>0:b.s<0)){b.bv+=dLook*b.dir*-6;b.v+=Math.abs(dLook)*1.5}}
   else tgt=.45*bodyP;
   var pushing=tgt>b.o+.02&&b.tier>0&&le>.6,k=pushing?190:(b.tier===2?55:80),c=pushing?22:(b.tier===2?6.5:8.5);
   var n=3,h=dt/n;for(var j=0;j<n;j++){var acc=-k*(b.o-tgt)-c*b.v;b.v+=acc*h;b.o+=b.v*h;
    var bt=cl(-.085*b.dir*b.v,-.4,.4)+(pushing?-.1*b.dir:0);b.bv+=(-150*(b.b-bt)-8*b.bv)*h;b.b+=b.bv*h}
   var ae=e-b.awayT;if(ae>0&&ae<.6&&!b.shed){b.shed=1;if(b.tier&&Math.random()<.7)shed(b,1+(Math.random()*2|0))}b.away=ae>0?inout(ae/.95):0});
 }
 /* ground shadow */
 var sha=S.pres*(1-S.d*.55);if(sha>.01){g.save();g.globalAlpha=sha;var gr=g.createRadialGradient(CW/2,CH-14,4,CW/2,CH-14,200);gr.addColorStop(0,"rgba(31,46,24,.38)");gr.addColorStop(1,"rgba(31,46,24,0)");g.fillStyle=gr;g.scale(1,.18);g.fillRect(0,(CH-14)/.18-220,CW,440);g.restore()}
 if(branchesOn)foliage([0],t,S.trem);
 /* ---- Shams ---- */
 if(S.pres>0){
  f.setTransform(1,0,0,1,0,0);f.globalCompositeOperation="source-over";f.globalAlpha=1;f.clearRect(0,0,HW,HH);
  var arms=[["L",aL],["R",aR]],pw=S.pose<=.001?0:(S.pose>=.999?1:S.pose*S.pose*(3-2*S.pose));
  function drawArm(k,a,front){var A=ARMDEF[k],px=A.pv[0],py=A.pv[1],wx=A.wr[0]-px,wy=A.wr[1]-py;
   rg.save();rg.translate(px,py);rg.rotate(a.rot);rg.scale(a.c,1);
   rg.save();rg.translate(wx,wy);rg.scale(1/a.c,1);rg.rotate(a.wr);rg.scale(a.c,1);rg.translate(-wx,-wy);rg.drawImage(HAND[k],-px,-py);rg.restore();
   rg.drawImage(front?ARMF[k]:ARM[k],-px,-py);rg.restore()}
  if(pw>0){rg.setTransform(1,0,0,1,0,0);rg.globalCompositeOperation="source-over";rg.globalAlpha=1;rg.clearRect(0,0,HW,HH);
   arms.forEach(function(x){if(x[1].c>=0)drawArm(x[0],x[1],false)});rg.drawImage(TORSO,0,0);
   arms.forEach(function(x){if(x[1].c<0)drawArm(x[0],x[1],true)})}
  /* body*(1-w) + rig*w: an exact dissolve, so no ghost hands or double sleeves */
  if(mode==="on"){var C=curSkel(t),kk=PS.w>=1?1:PS.w;PS.C=C;
   /* both photos sit on the same moving arm, so the hand-over reads as motion, not as a fade */
   drawFigOn(f,PS.prev,PS.cur,C,kk);
  }else{var fromP=(mode==="out"&&SNAPON)?SNAP:IM.body;mixPhotos(f,fromP,RIGC,pw,fromP===IM.body)}
  f.globalAlpha=1;
  /* face: lips, eyelids, brows -> then the whole head moves (turn, nod, tilt) */
  if(S.d<.5){drawMouth(mouth.o,mouth.w);drawLids(lid);HB.bv=(HB.bv||0)+((HB.brow*.9+HB.joy*.4)-(HB.bv||0))*Math.min(1,dt*9);drawBrows(HB.bv)}
  var hx=HB.look*2.8,hy=HB.nod*1.6+(HB.nodBase||0)*1.4,hr=cl(HB.look*.028+HB.tilt*.032,-.04,.04);
  if(!reduced)headMove(hx,hy,hr);
  /* depth: in the shade behind the hedge she is darker, softer and a touch smaller */
  if(S.d>.01){f.globalCompositeOperation="source-atop";f.fillStyle="rgba(20,29,16,"+(.74*S.d).toFixed(3)+")";f.fillRect(0,0,HW,HH);f.globalCompositeOperation="source-over"}
  if(mode==="on")liveFaces(t);
  /* body: breathing, weight shifts, lean into the conversation */
  var talk=SPK?1:0;HB.lean=(HB.lean||0)+((talk?1:0)-(HB.lean||0))*Math.min(1,dt*2);
  /* every extra sway eases in and out, so a reaction never kicks the body */
  HB.ps=(HB.ps||0)+(((GS.name==="present"&&NQ.active)?lookToContent()*.006:0)-(HB.ps||0))*Math.min(1,dt*3);
  HB.je=(HB.je||0)+(HB.joy-(HB.je||0))*Math.min(1,dt*(HB.joy>(HB.je||0)?6:3));
  PS.bs=(PS.bs||0)+((mode==="on"?PS.bob:0)-(PS.bs||0))*Math.min(1,dt*8);
  var sway=reduced?0:Math.sin(t*.9)*.008+Math.sin(t*.37)*.006+HB.look*.007+HB.ps+HB.je*Math.sin(t*9)*.01;
  var br=reduced?1:1+Math.sin(t*1.6)*.0045,bob=reduced?0:Math.sin(t*1.6)*1.4-BS.x*1.2-4*pw*(1-pw)*2.4-PS.bs*.9,ds=(1-.075*S.d)*(1+HB.lean*.012),lift=34*S.d;
  g.save();g.globalAlpha=S.pres;g.translate(HX+HW/2,HY+HH-lift);g.rotate(sway);g.scale(ds*(1+(br-1)*.4),ds*br);g.translate(-HW/2,-HH+bob);
  if(FILTER&&S.d>.03)g.filter="blur("+(S.d*2.4).toFixed(2)+"px)";
  g.drawImage(FIG,0,0);g.restore()}
 if(branchesOn)foliage([1,2],t,S.trem);
 stepLeaves(dt);drawLeaves();
}
function hitHala(ev){var r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*CW;return (mode==="on"||(mode==="in"&&guideReady))&&x>HX+90&&x<HX+HW-90}
/* debug / QA hooks (harmless in production) */
window.__olhDebug={blink:function(){blinkV=1},gesture:gesture,say:say,narrate:function(id){seen[id]=1;narrate(tourItems(id),id)},state:function(){return {mode:mode,ps:PS.cur,pk:PS.k,gl:!!GLR,rig:RIG.w,pose:ST.pose,g:GS.name,spk:SPK?SPK.kind:null,o:mouth.o,w:mouth.w,AR:AR,HB:HB,NQ:{active:NQ.active,i:NQ.i,sec:NQ.sec,silent:NQ.silent}}},unlock:firstTouch};
makeHeadMask();
ui();render();spkUi();
})();

