/* ============================================================
   FUJI SUSHI · Умань — логіка сайту
   Кошик у localStorage, замовлення йде в Telegram.
   Страви малюються кодом — фото немає.
   ============================================================ */

const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const uah = n => n.toLocaleString('uk-UA') + ' ₴';
const byId = id => ITEMS.find(i=>i.id===id);

/* Ціна, за якою рахуємо: якщо задана акційна і вона менша — беремо її.
   m.p лишається звичайною ціною, щоб було що перекреслити. */
const P    = m => (m && m.promo && m.promo < m.p) ? m.promo : (m ? m.p : 0);
const sale = m => !!(m && m.promo && m.promo < m.p);
const esc  = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Картинка страви: завантажене в адмінці фото, інакше — намальована.
   Фото зберігається повним посиланням на самій позиції, тому воно
   не залежить ні від порядку карток, ні від їх кількості. */
function pic(m,size){
  const u = m && m.img;
  if(u && /^https?:\/\//.test(u))
    return `<img class="pic" src="${esc(u)}" alt="${esc(m.n)}" loading="lazy" decoding="async">`;
  return art(m,size);
}

/* ---------- режим роботи ---------- */
const hm = s => { const m=/^(\d{1,2}):(\d{2})$/.exec(String(s||'').trim());
  return m ? (+m[1])*60 + (+m[2]) : null; };

/* null — години не задані; інакше кажемо, відчинено зараз чи ні */
function openState(){
  const f=hm(SHOP.openFrom), t=hm(SHOP.openTo);
  if(f==null||t==null||t<=f) return null;
  const d=new Date(), now=d.getHours()*60+d.getMinutes();
  return { open: now>=f && now<t, from:SHOP.openFrom, to:SHOP.openTo };
}
function renderHours(){
  const el=$('#hoursLine'); if(!el) return;
  const st=openState();
  el.className = 'hours' + (st ? (st.open?' hours--open':' hours--shut') : '');
  el.innerHTML = `<i></i><b>${esc(SHOP.hours)}</b>` +
    (st ? `<span class="hours__st">${st.open
            ? 'зараз відчинено, приймаємо до '+esc(st.to)
            : 'зараз зачинено, відкриємось о '+esc(st.from)}</span>` : '') +
    `<em>${esc(SHOP.dayOff)}</em>`;
}
/* межі поля «на конкретний час» в оформленні */
function applyTimeBounds(){
  const t=$('#fTime'); if(!t) return;
  if(hm(SHOP.openFrom)!=null) t.min=SHOP.openFrom;
  if(hm(SHOP.openTo)!=null)   t.max=SHOP.openTo;
}

/* ---------- сортування: одна кнопка-перемикач, без панелі ---------- */
const SORTS = [
  {id:'pop',   n:'Популярні', f:(a,b)=>(b.top?1:0)-(a.top?1:0)},
  {id:'cheap', n:'Дешевші',   f:(a,b)=>P(a)-P(b)},
  {id:'exp',   n:'Дорожчі',   f:(a,b)=>P(b)-P(a)}
];
let sortI = 0;
const applySort = list => [...list].sort(SORTS[sortI].f);

function sortBtnHTML(){
  return `<button class="filt-btn" id="sortBtn" aria-label="Змінити сортування">
    ${icon('slid')}<span id="sortLbl">${SORTS[0].n}</span></button>`;
}
function wireSort(onChange){
  const b=$('#sortBtn'); if(!b) return;
  b.onclick=()=>{
    sortI=(sortI+1)%SORTS.length;
    $('#sortLbl').textContent=SORTS[sortI].n;
    b.classList.toggle('on',sortI!==0);
    onChange();
  };
}

/* ---------- ІКОНКИ (без емодзі) ---------- */
const ICON = {
  phone:'<path d="M6.6 3.5h3l1.6 4-2 1.4a12 12 0 0 0 5.9 5.9l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7 2 2 0 0 1 6.6 3.5z"/>',
  cart:'<path d="M3.5 6.5h17l-1.6 12a1.6 1.6 0 0 1-1.6 1.4H6.7a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M8.6 9.6V6a3.4 3.4 0 0 1 6.8 0v3.6"/>',
  home:'<path d="M4 10.5 12 4l8 6.5V19a1.4 1.4 0 0 1-1.4 1.4h-3.2v-5.6H8.6v5.6H5.4A1.4 1.4 0 0 1 4 19z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h11"/>',
  truck:'<rect x="2.4" y="6.6" width="11" height="8.4" rx="1.6"/><path d="M13.4 9.8h3.5l2.7 3.3V15h-6.2z"/><circle cx="7.1" cy="17.4" r="1.9"/><circle cx="16.5" cy="17.4" r="1.9"/>',
  slid:'<path d="M4 8h11M18 8h2M4 16h3M10 16h10"/><circle cx="16.5" cy="8" r="2"/><circle cx="8.5" cy="16" r="2"/>',
  search:'<circle cx="11" cy="11" r="6.4"/><path d="m16 16 4 4"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  back:'<path d="M20 12H5M11 6l-6 6 6 6"/>',
  check:'<path d="M20 6.5 9.5 17 4 11.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.4l3.6 2.2"/>',
  card:'<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2"/><path d="M2.8 10h18.4"/>',
  tg:'<path d="M21 4.5 2.9 11.4c-.9.3-.9 1.5 0 1.8l4.5 1.5 1.7 5.2c.3.8 1.3 1 1.8.3l2.4-2.9 4.6 3.4c.7.5 1.7.1 1.9-.7L22.4 5.6c.2-.9-.6-1.5-1.4-1.1z"/>',
  ig:'<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" stroke="none"/>'
};
const icon = (n,cls='') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${cls?` class="${cls}"`:''} aria-hidden="true">${ICON[n]||''}</svg>`;

/* ============================================================
   МАЛЮНКИ СТРАВ
   ============================================================ */
function ringPos(k){
  const P={1:[[0,0,1]],2:[[-.3,0,.72],[.3,0,.72]],
    3:[[0,-.3,.62],[-.28,.22,.62],[.28,.22,.62]],
    4:[[-.27,-.27,.56],[.27,-.27,.56],[-.27,.27,.56],[.27,.27,.56]],
    5:[[0,0,.5],[0,-.34,.46],[.32,-.1,.46],[.2,.3,.46],[-.2,.3,.46]]};
  return P[Math.min(Math.max(k,1),5)];
}
function roll(cx,cy,R,ings,type){
  const col=k=>(ING[k]||{}).c||'#ddd';
  const dark=ings.includes('black');
  let o='';
  if(type==='tempura'){
    for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2,rr=R*(1+(i%3)*.02);
      o+=`<circle cx="${cx+Math.cos(a)*rr}" cy="${cy+Math.sin(a)*rr}" r="${R*.09}" fill="#E0B366"/>`;}
  }
  o+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${type==='tempura'?'#E9C07A':'#1E2A24'}"/>`;
  o+=`<circle cx="${cx}" cy="${cy}" r="${R*.86}" fill="${dark?'#2B2B33':'#F7F2E7'}"/>`;
  for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2+.3,rr=R*.74;
    o+=`<ellipse cx="${cx+Math.cos(a)*rr}" cy="${cy+Math.sin(a)*rr}" rx="${R*.08}" ry="${R*.055}" fill="${dark?'#3C3C46':'#EDE4CE'}" transform="rotate(${a*57.3} ${cx+Math.cos(a)*rr} ${cy+Math.sin(a)*rr})"/>`;}
  const fill=ings.filter(k=>k!=='black'), inner=R*.58, pos=ringPos(fill.length||1);
  fill.forEach((k,i)=>{ if(!pos[i])return; const[dx,dy,rf]=pos[i];
    o+=`<circle cx="${cx+dx*inner*1.5}" cy="${cy+dy*inner*1.5}" r="${inner*rf*.62}" fill="${col(k)}" stroke="#000" stroke-opacity=".18"/>`;});
  if(type==='baked'){
    o+=`<path d="M${cx-R*.9} ${cy} a ${R*.9} ${R*.9} 0 0 0 ${R*1.8} 0 a ${R*.9} ${R*.9} 0 0 0 ${-R*1.8} 0" fill="#E8A34A" opacity=".55"/>`;
    o+=`<circle cx="${cx}" cy="${cy}" r="${R*.86}" fill="#D98A3C" opacity=".22"/>`;
  }
  o+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#000" stroke-opacity=".22"/>`;
  return o;
}
function art(item,size){
  const s=size||160, c=s/2, t=item.t||'roll';
  const ings=(item.ing||['losos']).slice(0,5);
  const col=k=>(ING[k]||{}).c||'#ddd';
  let o=`<svg viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(item.n||'').replace(/"/g,'')}">`;

  if(t==='set'){
    // три роли купкою; типи чергуються за назвою, щоб сети не були однакові
    const h=[...(item.n||'')].reduce((a,ch)=>a+ch.charCodeAt(0),0);
    const T=['roll','baked','tempura'];
    o+=roll(c*.62,c*1.16,s*.26, ings.slice(0,3),                       T[h%3]);
    o+=roll(c*1.42,c*1.22,s*.23, ings.slice(1,4).length?ings.slice(1,4):ings, T[(h+1)%3]);
    o+=roll(c,c*.66,s*.29,       ings.slice(0,4),                      T[(h+2)%3]);
    return o+'</svg>';
  }
  if(t==='bowl'){
    o+=`<circle cx="${c}" cy="${c}" r="${c*.94}" fill="#14161A"/>`;
    o+=`<circle cx="${c}" cy="${c}" r="${c*.8}" fill="#F2ECDE"/>`;
    for(let i=0;i<7;i++){const y=c-c*.5+i*(c*.16);
      o+=`<path d="M${c-c*.62} ${y} q ${c*.31} ${-s*.055} ${c*.62} 0 q ${c*.31} ${s*.055} ${c*.62} 0" fill="none" stroke="#E7CE94" stroke-width="${s*.035}" stroke-linecap="round"/>`;}
    ings.forEach((k,i)=>{const a=(i/ings.length)*Math.PI*2-.6;
      o+=`<circle cx="${c+Math.cos(a)*c*.44}" cy="${c+Math.sin(a)*c*.44}" r="${s*.095}" fill="${col(k)}"/>`;});
    return o+'</svg>';
  }
  if(t==='shrimp'){
    o+=`<circle cx="${c}" cy="${c}" r="${c*.92}" fill="#F7F2E7"/>`;
    for(let i=0;i<3;i++){const a=-0.9+i*2.1,r=c*.42,x=c+Math.cos(a)*r*.5,y=c+Math.sin(a)*r*.5;
      o+=`<path d="M${x-s*.16} ${y+s*.05} q ${s*.1} ${-s*.2} ${s*.24} ${-s*.1} q ${s*.1} ${s*.07} ${s*.02} ${s*.16} q ${-s*.12} ${s*.09} ${-s*.26} ${-s*.06} z" fill="${col('krev')}"/>`;}
    for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2,rr=c*.72;
      o+=`<circle cx="${c+Math.cos(a)*rr}" cy="${c+Math.sin(a)*rr}" r="${s*.03}" fill="#E0B366"/>`;}
    o+=`<circle cx="${c}" cy="${c}" r="${c*.3}" fill="${col('perec')}" opacity=".3"/>`;
    return o+'</svg>';
  }
  if(t==='stick'){
    o+=`<rect x="${s*.30}" y="${s*.10}" width="${s*.09}" height="${s*.80}" rx="${s*.03}" fill="${col(ings[0])}" transform="rotate(-7 ${c} ${c})"/>`;
    o+=`<rect x="${s*.58}" y="${s*.10}" width="${s*.09}" height="${s*.80}" rx="${s*.03}" fill="${col(ings[0])}" transform="rotate(7 ${c} ${c})"/>`;
    o+=`<rect x="${s*.27}" y="${s*.10}" width="${s*.44}" height="${s*.16}" rx="${s*.04}" fill="#2A2A2E"/>`;
    return o+'</svg>';
  }
  if(t==='sauce'){
    o+=`<path d="M${s*.34} ${s*.26} h${s*.32} l${s*.06} ${s*.56} a${s*.05} ${s*.05} 0 0 1 -${s*.05} ${s*.05} h-${s*.34} a${s*.05} ${s*.05} 0 0 1 -${s*.05} -${s*.05} z" fill="${col(ings[0])}" opacity=".92"/>`;
    o+=`<rect x="${s*.40}" y="${s*.14}" width="${s*.20}" height="${s*.13}" rx="${s*.03}" fill="#2A2A2E"/>`;
    o+=`<rect x="${s*.37}" y="${s*.46}" width="${s*.26}" height="${s*.22}" rx="2" fill="#F7F2E7" opacity=".88"/>`;
    return o+'</svg>';
  }
  if(t==='drink'){
    o+=`<rect x="${c-s*.22}" y="${s*.15}" width="${s*.44}" height="${s*.72}" rx="${s*.07}" fill="${col(ings[0])}" opacity=".92"/>`;
    o+=`<rect x="${c-s*.1}" y="${s*.06}" width="${s*.2}" height="${s*.11}" rx="${s*.03}" fill="#2A2A2E"/>`;
    o+=`<rect x="${c-s*.15}" y="${s*.4}" width="${s*.3}" height="${s*.25}" rx="2" fill="#F7F2E7" opacity=".9"/>`;
    return o+'</svg>';
  }
  if(t==='nigiri'){
    o+=`<ellipse cx="${c}" cy="${c+s*.1}" rx="${s*.4}" ry="${s*.24}" fill="#F7F2E7"/>`;
    o+=`<path d="M${c-s*.42} ${c-s*.02} q ${s*.42} ${-s*.3} ${s*.84} 0 q ${-s*.1} ${s*.14} ${-s*.42} ${s*.14} q ${-s*.32} 0 ${-s*.42} ${-s*.14}z" fill="${col(ings[0])}"/>`;
    o+=`<path d="M${c-s*.4} ${c-s*.05} q ${s*.4} ${-s*.24} ${s*.8} 0" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="${s*.03}"/>`;
    o+=`<rect x="${c-s*.07}" y="${c-s*.14}" width="${s*.14}" height="${s*.4}" rx="1" fill="#1E2A24" opacity=".85"/>`;
    return o+'</svg>';
  }
  o+=roll(c,c,c*.94,ings,t);
  return o+'</svg>';
}

/* ============================================================
   КОШИК
   ============================================================ */
let cart={};
try{ cart=JSON.parse(localStorage.getItem('fuji_cart')||'{}'); }catch(e){ cart={}; }
const save  = ()=>localStorage.setItem('fuji_cart',JSON.stringify(cart));
const count = ()=>Object.values(cart).reduce((a,b)=>a+b,0);
const total = ()=>Object.entries(cart).reduce((a,[id,q])=>a+P(byId(id))*q,0);
const discount = ()=>{
  if(!promo) return 0;
  const t=total();
  return promo.type==='%' ? Math.round(t*promo.off/100) : Math.min(promo.off,t);
};
const payable = ()=>total()-discount();

/* ---------- кроки кошика: cart (+умови) → addons → оформлення ---------- */
let mode=null;          // поки не обрано — умови згорнуті
let step='cart';
let promo=null;

function setStep(s){
  if(!$('#stCart')) return;
  step=s;
  const map={cart:'#stCart',add:'#stAdd'};
  Object.entries(map).forEach(([k,sel])=>{
    const el=$(sel); el.hidden = k!==s;
    if(k===s){ el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
  });
  $('#foot1').hidden      = s!=='cart';
  $('#toCheckout').hidden = s!=='add';
  $('#cartBack').hidden   = s==='cart';
  if(s==='add') renderAddons();
}

/* вибір способу: підсвітити й плавно висунути умови */
function pickMode(m){
  mode=m;
  $$('#foot1 [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  renderCond();
  const w=$('#condWrap');
  w.style.maxHeight = w.firstElementChild.scrollHeight + 'px';
  w.classList.add('open');
  $('#toAdd').hidden=false;
}
function resetMode(){
  mode=null;
  $$('#foot1 [data-mode]').forEach(b=>b.classList.remove('on'));
  const w=$('#condWrap'); if(w){ w.classList.remove('open'); w.style.maxHeight='0px'; }
  const t=$('#toAdd'); if(t) t.hidden=true;
}

/* умови доставки — «вилазять» після вибору способу */
function renderCond(){
  const t=total(), free=t>=SHOP.freeFrom;
  $('#stCond').innerHTML = mode==='Самовиніс'
    ? `<div class="cond">
         <div class="cond__r"><span>Спосіб</span><b>Самовиніс</b></div>
         <div class="cond__r"><span>Мінімальна сума</span><b>${SHOP.minOrder} ₴</b></div>
         <div class="cond__r"><span>Готовність</span><b>${SHOP.pickupTime}</b></div>
         <div class="cond__r"><span>Графік</span><b>${SHOP.hours}</b></div>
         <p class="cond__n">Адресу самовинесення підтвердимо дзвінком.</p>
       </div>`
    : `<div class="cond">
         <div class="cond__r"><span>Мінімальна сума</span><b>${SHOP.minOrder} ₴</b></div>
         <div class="cond__r ${free?'ok':''}"><span>Безкоштовно від</span><b>${SHOP.freeFrom} ₴</b></div>
         <div class="cond__r"><span>По місту</span><b>${free?'безкоштовно':'за тарифом'}</b></div>
         <div class="cond__r"><span>Понад ${SHOP.farKm} км</span><b>+${SHOP.farFee} ₴ за км</b></div>
         <p class="cond__n">${free
            ? 'Доставка по Умані безкоштовна — сума вже достатня.'
            : `Додайте ще ${uah(SHOP.freeFrom-t)}, щоб доставка стала безкоштовною.`}</p>
       </div>`;
}

/* додатки перед оформленням */
function renderAddons(){
  const list=ITEMS.filter(i=>i.add);
  $('#stAdd').innerHTML =
    `<div class="freebie">${icon('check')}<span><b>Набір соусів уже входить</b>Соєвий соус, імбир і васабі — один набір до кожного ролу, безкоштовно.</span></div>` +
    `<p class="st__h">Додати до замовлення</p>` +
    list.map(m=>{
      const q=cart[m.id]||0;
      return `<div class="ad">
        <div class="ad__a">${pic(m,42)}</div>
        <div class="ad__t"><b>${m.n}</b><span>${m.w||''} · ${sale(m)?`<s>${m.p}</s> `:''}${P(m)} ₴</span></div>
        ${q ? `<div class="qty"><button data-dec="${m.id}">−</button><i>${q}</i><button data-inc="${m.id}">+</button></div>`
            : `<button class="add add--sm" data-add="${m.id}" aria-label="Додати ${m.n}">${icon('plus')}</button>`}
      </div>`;
    }).join('');
}

function renderCart(){
  const n=count(), t=total();
  $$('.cart-btn i').forEach(e=>{ e.textContent=n; e.classList.toggle('on',n>0); });

  const body=$('#stCart'); if(!body) return;
  if(!n){
    body.innerHTML=`<div class="cart__empty">${art({t:'roll',ing:['ohir'],n:'порожньо'},110)}<div>Кошик порожній</div></div>`;
    $('#cartFoot').hidden=true; promo=null; resetMode(); setStep('cart'); return;
  }
  $('#cartFoot').hidden=false;
  body.innerHTML=Object.entries(cart).map(([id,q])=>{
    const m=byId(id); if(!m) return '';
    return `<div class="ci">
      <div class="ci__a">${pic(m,52)}</div>
      <div class="ci__t"><b>${m.n}</b><span>${uah(P(m)*q)}${sale(m)?' <s>'+uah(m.p*q)+'</s>':''}</span></div>
      <div class="qty"><button data-dec="${id}" aria-label="Менше">−</button><i>${q}</i><button data-inc="${id}" aria-label="Більше">+</button></div>
      <button class="ci__x" data-del="${id}" aria-label="Прибрати ${m.n}">${icon('close')}</button>
    </div>`;
  }).join('');

  const free=t>=SHOP.freeFrom;
  $('#sumT').textContent=uah(payable());
  if(mode){
    renderCond();
    const w=$('#condWrap');
    if(w.classList.contains('open')) w.style.maxHeight = w.firstElementChild.scrollHeight+'px';
  }
  if(step==='add') renderAddons();
  if($('#coBody') && !$('#checkout').hidden) renderCheckout();
  $('#progBar').style.width=Math.min(100,t/SHOP.freeFrom*100)+'%';
  $('#progBar').classList.toggle('done',free);
  if(t<SHOP.minOrder){
    $('#progTxt').textContent='Мінімальне замовлення '+SHOP.minOrder+' ₴';
    $('#progLeft').textContent='ще '+uah(SHOP.minOrder-t);
  }else if(!free){
    $('#progTxt').textContent='До безкоштовної доставки';
    $('#progLeft').textContent='ще '+uah(SHOP.freeFrom-t);
  }else{
    $('#progTxt').textContent='Доставка по Умані';
    $('#progLeft').textContent='безкоштовна';
  }
}
function addTo(id,src){
  const m=byId(id); if(!m) return;
  cart[id]=(cart[id]||0)+1; save(); renderCart(); toast(m.n+' — у кошику');
  if(src) fly(src,m);
}
function fly(from,m){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r=from.getBoundingClientRect();
  const tgt=($('.navbar .cart-btn')||$('.head-right .cart-btn')).getBoundingClientRect();
  const el=document.createElement('div');
  el.className='fly'; el.innerHTML=pic(m,62);
  el.style.left=r.left+r.width/2-31+'px'; el.style.top=r.top+r.height/2-31+'px';
  document.body.appendChild(el);
  requestAnimationFrame(()=>{
    el.style.left=tgt.left+tgt.width/2-18+'px';
    el.style.top=tgt.top+tgt.height/2-18+'px';
    el.style.transform='scale(.2) rotate(300deg)'; el.style.opacity='0';
  });
  setTimeout(()=>el.remove(),800);
}
let tTimer;
function toast(msg){
  const el=$('#toast'); if(!el) return;
  el.textContent=msg; el.classList.add('on');
  clearTimeout(tTimer); tTimer=setTimeout(()=>el.classList.remove('on'),2100);
}

/* ---------- плашки: акція йде першою, далі за важливістю ---------- */
function badges(m){
  const b=[];
  if(sale(m)) b.push('<span class="tag tag--sale">акція</span>');
  if(m.neu)   b.push('<span class="tag">новинка</span>');
  if(m.week)  b.push('<span class="tag tag--w">сет тижня</span>');
  if(m.top)   b.push('<span class="tag tag--hit">хіт</span>');
  if(m.hot)   b.push('<span class="tag tag--hot">гостре</span>');
  if(m.veg)   b.push('<span class="tag tag--v">без риби</span>');
  return b;
}

/* ---------- картка страви ---------- */
function cardHTML(m){
  // плашок максимум дві, інакше картка перетворюється на ялинку
  const tags = badges(m).slice(0,2);
  const d = m.d ? m.d
          : m.list ? m.list.slice(0,3).join(' · ')+(m.list.length>3?` · +${m.list.length-3}`:'')
          : (m.ing||[]).map(k=>(ING[k]||{}).n).filter(Boolean).join(', ');
  return `<article class="card" data-open="${m.id}" role="button" tabindex="0">
    <div class="card__img">${tags.length?`<div class="card__tags">${tags.join('')}</div>`:''}${pic(m,190)}</div>
    <div class="card__in">
      <h3 class="card__n">${m.n}</h3>
      <p class="card__d">${d}</p>
      <div class="card__b">
        <span>
          <span class="card__w">${m.w||''}</span>
          <span class="card__p${sale(m)?' sale':''}">${sale(m)?`<s>${m.p}</s>`:''}${P(m)}<em> ₴</em></span>
        </span>
        <button class="add" data-add="${m.id}" aria-label="Додати ${m.n}">${icon('plus')}</button>
      </div>
    </div>
  </article>`;
}

/* ---------- спільні обробники ---------- */
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-add]');
  if(a){ e.preventDefault(); addTo(a.dataset.add, a.closest('.card')?.querySelector('.card__img')||a); return; }
  const inc=e.target.closest('[data-inc]');
  if(inc){ cart[inc.dataset.inc]++; save(); renderCart(); return; }
  const dec=e.target.closest('[data-dec]');
  if(dec){ const id=dec.dataset.dec; cart[id]--; if(cart[id]<=0) delete cart[id]; save(); renderCart(); return; }
  const del=e.target.closest('[data-del]');
  if(del){ delete cart[del.dataset.del]; save(); renderCart(); return; }
  const ps=e.target.closest('[data-pers]');
  if(ps){
    const el=$('#fPers');
    el.value = Math.max(0, Math.min(20, (parseInt(el.value,10)||0) + (+ps.dataset.pers)));
    return;
  }
  const op=e.target.closest('[data-open]');
  if(op){ openProduct(op.dataset.open); return; }
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter' && e.key!==' ') return;
  const c=e.target.closest('.card[data-open]');
  if(c){ e.preventDefault(); openProduct(c.dataset.open); }
});
/* одна панель могла зняти блокування прокрутки, поки інша ще відкрита */
function syncLock(){
  const on = $('#cart').classList.contains('on')
          || ($('#checkout') && !$('#checkout').hidden)
          || ($('#prod')     && !$('#prod').hidden);
  document.body.classList.toggle('locked', on);
}
function openCart(v){
  $('#cart').classList.toggle('on',v);
  $('#veil').classList.toggle('on',v);
  syncLock();
}

/* ---------- повноекранне оформлення ---------- */
function openCheckout(){
  if(total()<SHOP.minOrder){ toast('Мінімальне замовлення '+SHOP.minOrder+' ₴'); return; }
  $('#addrBox').hidden = mode==='Самовиніс';
  renderCheckout();
  const co=$('#checkout'); co.hidden=false;
  requestAnimationFrame(()=>co.classList.add('on'));
  syncLock();
}
function closeCheckout(){
  const co=$('#checkout');
  co.classList.remove('on');
  setTimeout(()=>{ co.hidden=true; syncLock(); },320);
}
function renderCheckout(){
  $('#coBody').innerHTML=Object.entries(cart).map(([id,q])=>{
    const m=byId(id); if(!m) return '';
    return `<div class="co__l"><span>${m.n} <em>× ${q}</em></span><b>${uah(P(m)*q)}</b></div>`;
  }).join('');
  const d=discount();
  $('#coSum').innerHTML =
    `<div class="co__l"><span>Сума</span><b>${uah(total())}</b></div>` +
    (d?`<div class="co__l co__l--off"><span>Промокод ${promo.n||''}</span><b>−${uah(d)}</b></div>`:'') +
    `<div class="co__l"><span>${mode}</span><b>${mode==='Доставка'?(total()>=SHOP.freeFrom?'безкоштовно':'за тарифом'):SHOP.pickupTime}</b></div>` +
    `<div class="co__l co__l--big"><span>До сплати</span><b>${uah(payable())}</b></div>`;
}
function applyPromo(){
  const code=($('#fPromo').value||'').trim().toUpperCase();
  const msg=$('#promoMsg');
  if(!code){ msg.textContent=''; return; }
  const p=PROMO[code];
  if(p){ promo={...p,code}; msg.className='promo__m ok'; msg.textContent='Промокод застосовано: '+(p.n||code); }
  else  { promo=null;       msg.className='promo__m';    msg.textContent='Такого промокоду немає'; }
  renderCheckout(); renderCart();
}

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if($('#checkout') && !$('#checkout').hidden) closeCheckout();
  else if($('#cart').classList.contains('on')) openCart(false);
  else if($('#prod') && !$('#prod').hidden)    closeProduct();
});

/* ============================================================
   ЗАМОВЛЕННЯ В TELEGRAM
   ============================================================ */
function orderText(){
  const lines=Object.entries(cart).map(([id,q],i)=>{
    const m=byId(id);
    return `${i+1}. ${m.n} — ${q} × ${P(m)} = ${P(m)*q} ₴` + (sale(m) ? ' (акція, було '+m.p+')' : '');
  });
  const t=total(), d=discount(), free=t>=SHOP.freeFrom;
  const v=s=>($('#'+s)?.value||'').trim();
  const pay=$('input[name=pay]:checked')?.value||'—';
  const addr=[v('fStreet'),v('fHouse')&&'буд. '+v('fHouse'),v('fFlat')&&'кв. '+v('fFlat'),
              v('fEnt')&&'підʼїзд '+v('fEnt'),v('fCode')&&'код '+v('fCode')].filter(Boolean).join(', ');
  const when=v('fWhen')==='На конкретний час' ? 'на '+(v('fTime')||'—') : v('fWhen');
  return [
    'НОВЕ ЗАМОВЛЕННЯ · FUJI SUSHI',
    '——————————————',
    ...lines,
    '——————————————',
    `Сума: ${t} ₴`,
    ...(d ? [`Промокод ${promo.code}: −${d} ₴`] : []),
    `До сплати: ${payable()} ₴`,
    `Спосіб: ${mode}` + (mode==='Доставка' ? ` (${free?'безкоштовно':'за тарифом'})` : ''),
    `Оплата: ${pay}`,
    `Коли: ${when}`,
    `Приборів: ${v('fPers')||'—'}`,
    '',
    `Імʼя: ${v('fName')||'—'}`,
    `Телефон: ${v('fTel')||'—'}`,
    ...(mode==='Доставка' ? [`Адреса: ${addr||'—'}`] : []),
    `Коментар: ${v('fNote')||'—'}`
  ].join('\n');
}
function validate(){
  if(!count()){ toast('Кошик порожній'); return false; }
  if(total()<SHOP.minOrder){ toast('Мінімальне замовлення '+SHOP.minOrder+' ₴'); return false; }
  let ok=true;
  const need=[['fName',2],['fTel',9]];
  if(mode==='Доставка') need.push(['fStreet',3],['fHouse',1]);
  need.forEach(([id,min])=>{
    const el=$('#'+id); if(!el) return;
    const bad=el.value.trim().length<min;
    el.classList.toggle('bad',bad); if(bad) ok=false;
  });
  if(!ok) toast(mode==='Доставка' ? 'Заповніть імʼя, телефон, вулицю і будинок' : 'Заповніть імʼя і телефон');
  return ok;
}
async function sendOrder(){
  if(!validate()) return;
  const btn=$('#send'), txt=orderText();
  btn.disabled=true; btn.textContent='Надсилаємо…';

  if(SHOP.tg.token && SHOP.tg.chat){
    try{
      const r=await fetch(`https://api.telegram.org/bot${SHOP.tg.token}/sendMessage`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:SHOP.tg.chat,text:txt})
      });
      const j=await r.json();
      if(j.ok){
        cart={}; promo=null; save(); renderCart(); setStep('cart');
        toast('Замовлення надіслано — ми передзвонимо');
        setTimeout(()=>{ closeCheckout(); openCart(false); },1200);
      }else toast('Telegram не прийняв: '+(j.description||'помилка'));
    }catch(err){ toast('Немає звʼязку з Telegram — подзвоніть, будь ласка'); }
  }else{
    // бот ще не підключений: копіюємо і відкриваємо чат
    try{ await navigator.clipboard.writeText(txt); toast('Замовлення скопійовано — вставте в чат'); }
    catch(e){ toast('Скопіюйте замовлення вручну'); }
    if(SHOP.tg.user) setTimeout(()=>window.open('https://t.me/'+SHOP.tg.user,'_blank','noopener'),700);
  }
  btn.disabled=false; btn.innerHTML=icon('tg')+'<span>Надіслати в Telegram</span>';
}

/* ============================================================
   РОЗМІТКА, СПІЛЬНА ДЛЯ ОБОХ СТОРІНОК
   ============================================================ */
function mountShell(page){
  $('#hdr').innerHTML=`
    <a class="logo" href="index.html" aria-label="${SHOP.name}">
      <img src="logo.jpg" alt="" width="46" height="46">
      <span><b>FUJI</b><span>суші · ${SHOP.city}</span></span>
    </a>
    <nav class="nav-desk">
      <a href="index.html" class="${page==='home'?'on':''}">Головна</a>
      <a href="menu.html" class="${page==='menu'?'on':''}">Меню</a>
    </nav>
    <div class="head-right">
      <a class="phone-pill" href="tel:${SHOP.phone}">${icon('phone')}<span>${SHOP.phoneView}</span></a>
      <button class="cart-btn" id="cartOpen" aria-label="Кошик">${icon('cart')}<i>0</i></button>
    </div>`;

  $('#nav').innerHTML=`
    <a href="index.html" class="${page==='home'?'on':''}">${icon('home')}Головна</a>
    <a href="menu.html" class="${page==='menu'?'on':''}">${icon('menu')}Меню</a>
    <span class="nb-cart"><button class="cart-btn" aria-label="Кошик">${icon('cart')}<i>0</i></button></span>
    <a href="index.html#delivery">${icon('truck')}Доставка</a>
    <a href="tel:${SHOP.phone}">${icon('phone')}Телефон</a>`;

  $('#cartWrap').innerHTML=`
    <div class="veil" id="veil"></div>
    <aside class="cart" id="cart" aria-label="Кошик">
      <div class="cart__h">
        <button class="icn" id="cartBack" aria-label="Назад" hidden>${icon('back')}</button>
        <h3>Кошик</h3>
        <button class="icn" id="cartClose" aria-label="Закрити">${icon('close')}</button>
      </div>
      <div class="cart__b">
        <div class="st" id="stCart"></div>
        <div class="st" id="stAdd" hidden></div>
      </div>
      <div class="cart__f" id="cartFoot" hidden>
        <div class="prog">
          <div class="prog__t"><span id="progTxt"></span><b id="progLeft"></b></div>
          <div class="prog__b"><i id="progBar"></i></div>
        </div>
        <div class="sum"><span>До сплати</span><b id="sumT">0 ₴</b></div>
        <div id="foot1">
          <div class="mode">
            <button class="mbtn" data-mode="Доставка">${icon('truck')}<span>Доставка</span></button>
            <button class="mbtn" data-mode="Самовиніс"><span>Самовиніс</span></button>
          </div>
          <div class="condwrap" id="condWrap"><div id="stCond"></div></div>
          <button class="btn btn--full" id="toAdd" hidden><span>Далі</span></button>
        </div>
        <button class="btn btn--full" id="toCheckout" hidden><span>Оформити</span></button>
      </div>
    </aside>

    <section class="co" id="checkout" hidden aria-label="Оформлення">
      <div class="co__bar">
        <button class="icn" id="coBack" aria-label="Назад">${icon('back')}</button>
        <h2>Оформлення</h2>
        <button class="icn" id="coClose" aria-label="Закрити">${icon('close')}</button>
      </div>
      <div class="co__in">
        <div class="co__side">
          <h3>Ваше замовлення</h3>
          <div id="coBody"></div>
          <div class="co__sum" id="coSum"></div>
          <div class="promo">
            <button class="promo__b" id="promoOpen">+ Додати промокод</button>
            <div class="promo__f" id="promoF" hidden>
              <input id="fPromo" type="text" placeholder="Промокод" autocomplete="off" spellcheck="false">
              <button class="btn btn--sm" id="promoApply"><span>Застосувати</span></button>
            </div>
            <p class="promo__m" id="promoMsg"></p>
          </div>
        </div>

        <div class="co__form">
          <div class="fld two">
            <label>Імʼя<input id="fName" type="text" placeholder="Оксана" autocomplete="name"></label>
            <label>Телефон<input id="fTel" type="tel" placeholder="0XX XXX XX XX" autocomplete="tel"></label>
          </div>
          <div class="fld" id="addrBox">
            <label>Адреса доставки<input id="fStreet" type="text" placeholder="Вулиця"></label>
            <div class="addr">
              <input id="fHouse" type="text" placeholder="Будинок">
              <input id="fFlat"  type="text" placeholder="Квартира">
              <input id="fEnt"   type="text" placeholder="Підʼїзд">
              <input id="fCode"  type="text" placeholder="Код домофона">
            </div>
          </div>
          <div class="fld two">
            <label>Коли<select id="fWhen"><option>Якнайшвидше</option><option>Через 1 годину</option><option>Через 2 години</option><option>На конкретний час</option></select></label>
            <div>
              <span class="fld__l">Приборів</span>
              <div class="stp">
                <button type="button" data-pers="-1" aria-label="Менше">−</button>
                <input id="fPers" type="text" inputmode="numeric" value="2" aria-label="Кількість приборів">
                <button type="button" data-pers="1" aria-label="Більше">+</button>
              </div>
            </div>
          </div>
          <div class="fld" id="timeBox" hidden>
            <label>Час<input id="fTime" type="time" min="10:00" max="21:30" step="900"></label>
          </div>
          <div class="fld">
            <span class="fld__l">Оплата</span>
            <div class="pay">
              <label><input type="radio" name="pay" value="Готівкою" checked><span>Готівкою</span></label>
              <label><input type="radio" name="pay" value="Карткою"><span>Карткою</span></label>
            </div>
          </div>
          <div class="fld"><label>Коментар<textarea id="fNote" rows="2" placeholder="Наприклад: без імбиру, дзвонити за 10 хв"></textarea></label></div>
          <button class="btn btn--full" id="send"><span>Надіслати замовлення</span></button>
          <p class="co__note">Ми передзвонимо, щоб підтвердити замовлення.</p>
        </div>
      </div>
    </section>

    <section class="pv" id="prod" hidden aria-label="Позиція">
      <div class="co__bar">
        <button class="icn" id="pvBack" aria-label="Назад">${icon('back')}</button>
        <h2 id="pvTitle"></h2>
        <button class="cart-btn" aria-label="Кошик">${icon('cart')}<i>0</i></button>
      </div>
      <div class="pv__in" id="pvIn"></div>
      <div class="pv__also" id="pvAlso"></div>
    </section>`;

  // тост живе поза обгорткою кошика, щоб його не обрізало
  const t=document.createElement('div'); t.className='toast'; t.id='toast';
  document.body.appendChild(t);

  $$('.cart-btn').forEach(b=>{ if(b.id!=='cartClose') b.onclick=()=>openCart(true); });
  $('#cartClose').onclick=()=>openCart(false);
  $('#veil').onclick=()=>openCart(false);
  $('#cartBack').onclick=()=>setStep('cart');
  $$('#foot1 [data-mode]').forEach(b=>b.onclick=()=>pickMode(b.dataset.mode));
  $('#toAdd').onclick=()=>setStep('add');
  $('#toCheckout').onclick=openCheckout;
  $('#coBack').onclick=closeCheckout;
  $('#coClose').onclick=()=>{ closeCheckout(); openCart(false); };
  $('#send').onclick=sendOrder;
  $('#promoOpen').onclick=()=>{ $('#promoF').hidden=false; $('#promoOpen').hidden=true; $('#fPromo').focus(); };
  $('#promoApply').onclick=applyPromo;
  $('#fPromo').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); applyPromo(); }});
  $('#fWhen').onchange=e=>{ $('#timeBox').hidden = e.target.value!=='На конкретний час'; };
  $('#pvBack').onclick=closeProduct;
  applyTimeBounds();
  renderHours();
  renderCart();
}

/* ============================================================
   ПОВНОЕКРАННА СТОРІНКА ПОЗИЦІЇ
   ============================================================ */
/* що вже показували в цьому заході — щоб добірка не крутила одне й те саме */
const seenPv = new Set();

function alsoFor(m){
  // соуси й напої в «спробуйте також» не пропонуємо — там мають бути роли
  const pool = ITEMS.filter(i=>i.id!==m.id && i.c!=='add');
  const rank = i => (i.c===m.c ? 0 : 1);          // спершу з того ж розділу
  let fresh = pool.filter(i=>!seenPv.has(i.id));
  if(fresh.length < 6){                            // обійшли майже все — починаємо коло заново
    seenPv.clear(); seenPv.add(m.id);
    fresh = pool.filter(i=>!seenPv.has(i.id));
  }
  const res = [...fresh].sort((a,b)=>rank(a)-rank(b)).slice(0,8);
  res.forEach(i=>seenPv.add(i.id));   // показане теж вважаємо переглянутим,
  return res;                          // інакше наступна добірка повторить майже все
}
function openProduct(id){
  const m=byId(id); if(!m) return;
  seenPv.add(id);
  const pv=$('#prod');
  const ing=(m.ing||[]).map(k=>(ING[k]||{}).n).filter(Boolean).join(', ');
  $('#pvTitle').textContent=m.n;
  $('#pvIn').innerHTML=`
    <div class="pv__art">${pic(m,420)}</div>
    <div class="pv__info">
      ${badges(m).length?`<div class="pv__tags">${badges(m).join('')}</div>`:''}
      <h1>${m.n}</h1>
      ${m.d?`<p class="pv__d">${m.d}</p>`:''}
      ${m.list?`<ul class="pv__list">${m.list.map(x=>`<li>${x}</li>`).join('')}</ul>`
              :ing?`<p class="pv__d">${ing}</p>`:''}
      <div class="pv__meta">${m.w||''}</div>
      <div class="pv__b">
        <span class="pv__p${sale(m)?' sale':''}">${sale(m)?`<s>${m.p}</s>`:''}${P(m)}<em> ₴</em></span>
        <button class="btn" data-add="${m.id}"><span>Додати в кошик</span></button>
      </div>
    </div>`;
  const also=alsoFor(m);
  $('#pvAlso').innerHTML = also.length
    ? `<h3>Спробуйте також</h3><div class="row-slider">${also.map(cardHTML).join('')}</div>` : '';
  if(pv.hidden){ pv.hidden=false; requestAnimationFrame(()=>pv.classList.add('on')); }
  syncLock();
  pv.scrollTop=0;
}
function closeProduct(){
  const pv=$('#prod'); if(!pv) return;
  pv.classList.remove('on');
  seenPv.clear();                       // наступний захід починається з чистого аркуша
  setTimeout(()=>{ pv.hidden=true; syncLock(); },300);
}

function footerHTML(){
  return `<div class="footer__in">
    <div>
      <h4>Контакти</h4>
      <ul>
        <li><a class="footer__big" href="tel:${SHOP.phone}">${SHOP.phoneView}</a></li>
        <li>м. ${SHOP.city}, Черкаська обл.</li>
      </ul>
    </div>
    <div>
      <h4>Графік</h4>
      <ul><li>${SHOP.hours}</li><li>${SHOP.dayOff}</li></ul>
    </div>
    <div>
      <h4>Ще</h4>
      <ul>
        <li><a href="menu.html">Меню</a></li>
        <li><a href="index.html#delivery">Доставка та оплата</a></li>
        <li><a href="${SHOP.ig}" target="_blank" rel="noopener">Instagram</a></li>
      </ul>
    </div>
  </div>
  <div class="copy"><span>© ${new Date().getFullYear()} ${SHOP.name} · ${SHOP.city}</span><span>Ціни уточнюйте при замовленні</span></div>`;
}
