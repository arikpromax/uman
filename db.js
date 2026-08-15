/* ============================================================
   FUJI SUSHI — звʼязок з адмінкою arawebsite (Supabase)
   ------------------------------------------------------------
   Меню, сети, ціни, акції та режим роботи власник міняє в адмінці.
   Сайт тягне їх звідти і перемальовується.

   Якщо база недоступна — нічого страшного: усе вбудоване в data.js
   вже на екрані, сайт працює далі. Тому цей файл підключається
   ОСТАННІМ і нічого не ламає, якщо не завантажиться.
   ============================================================ */
(function(){
'use strict';

const DB_URL  = 'https://ortiatyxntdikaldepbp.supabase.co/rest/v1';
const DB_KEY  = 'sb_publishable_UW1Z8ukEU1XWVCdQxIGkDw_firK4hpO'; // публічний ключ лише на читання
const SITE_ID = 5;                                                // Fuji Sushi у базі платформи

const num = v => { const n = parseFloat(String(v).replace(',','.')); return isFinite(n) ? n : 0; };
const str = v => (v == null ? '' : String(v).trim());
const list = v => str(v).split('\n').map(s=>s.trim()).filter(Boolean);
/* коди начинки власник пише через кому; приймаємо і переноси рядка */
const csv  = v => str(v).split(/[,\n;]/).map(s=>s.trim()).filter(Boolean);

Promise.all([
  fetch(DB_URL+'/items?site_id=eq.'+SITE_ID+
        '&collection=in.(menu,sets,settings,cats)&order=sort_order'+
        '&select=id,collection,title,price,image_url,extra',{headers:{apikey:DB_KEY}}),
  fetch(DB_URL+'/texts?site_id=eq.'+SITE_ID+'&select=key,value',{headers:{apikey:DB_KEY}})
])
.then(rs=>{ if(rs.some(r=>!r.ok)) throw 0; return Promise.all(rs.map(r=>r.json())); })
.then(([rows, texts])=>{
  const by = {};
  rows.forEach(r=>{ (by[r.collection] = by[r.collection] || []).push(r); });

  /* ---------- 1. Тексти (телефон, графік, умови доставки) ---------- */
  const T = {};
  (texts||[]).forEach(t=>{ if(str(t.value)) T[t.key] = str(t.value); });
  if(T.phone){
    SHOP.phone = T.phone.replace(/[^\d+]/g,'');
    if(!SHOP.phone.startsWith('+')) SHOP.phone = '+38' + SHOP.phone.replace(/^38/,'');
  }
  if(T.phone_view) SHOP.phoneView = T.phone_view;
  if(T.hours)      SHOP.hours     = T.hours;
  if(T.dayoff_note)SHOP.dayOff    = T.dayoff_note;
  if(T.free_from)  SHOP.freeFrom  = num(T.free_from) || SHOP.freeFrom;
  if(T.min_order)  SHOP.minOrder  = num(T.min_order) || SHOP.minOrder;
  if(T.far_km)     SHOP.farKm     = num(T.far_km)    || SHOP.farKm;
  if(T.far_fee)    SHOP.farFee    = num(T.far_fee)   || SHOP.farFee;
  if(T.pickup_time)SHOP.pickupTime= T.pickup_time;
  try{ renderHours(); }catch(e){}
  /* токен Telegram свідомо НЕ беремо з бази: тексти читаються публічно,
     тож в адмінці йому не місце — він лишається в data.js */

  /* ---------- 2. Розділи меню: назва і власна іконка ---------- */
  (by.cats || []).forEach(r=>{
    const k = str((r.extra||{}).catkey); if(!k) return;
    if(r.image_url) CATIMG[k] = r.image_url;
    const c = CATS.find(x => x.id === k);
    if(c && str(r.title)) c.n = str(r.title);
  });

  /* ---------- 3. Меню і сети з бази ---------- */
  const menu = by.menu || [], sets = by.sets || [];
  if(menu.length || sets.length){
    const fresh = [];

    menu.forEach(r=>{
      const x = r.extra || {};
      const cat = str(x.cat) || 'fila';
      // немає фото і не заданий малюнок — беремо типовий для розділу,
      // щоб нова позиція не виглядала безликою сірою плямою
      const d = CAT_ART[cat] || {t:'roll', ing:['losos','syr','ohir']};
      const it = {
        id:'db'+r.id, c:cat, n:r.title,
        p:num(r.price), w:str(x.w),
        t:str(x.t) || d.t,
        ing:csv(x.ing).length ? csv(x.ing) : d.ing.slice()
      };
      if(str(x.d))    it.d = x.d;
      if(num(x.promo))it.promo = num(x.promo);
      if(x.top) it.top = 1;
      if(x.neu) it.neu = 1;
      if(x.hot) it.hot = 1;
      if(x.veg) it.veg = 1;
      if(x.add) it.add = 1;
      if(x.ban) it.ban = 1;
      if(str(x.bs)) it.bs = str(x.bs);
      if(r.image_url) it.img = r.image_url;
      fresh.push(it);
    });

    sets.forEach(r=>{
      const x = r.extra || {};
      const it = {
        id:'db'+r.id, c:'set', n:'Сет «'+r.title+'»', p:num(r.price),
        w:[str(x.pcs),str(x.w)].filter(Boolean).join(' · '),
        t:'set',
        ing:csv(x.ing).length ? csv(x.ing) : CAT_ART.set.ing.slice(),
        list:list(x.list)
      };
      if(num(x.promo)) it.promo = num(x.promo);
      if(x.week) it.week = 1;
      if(x.top)  it.top  = 1;
      if(x.ban)  it.ban  = 1;
      if(str(x.bs)) it.bs = str(x.bs);
      if(r.image_url) it.img = r.image_url;
      fresh.push(it);
    });

    // підміняємо каталог цілком, зберігаючи посилання на масив
    ITEMS.length = 0;
    Array.prototype.push.apply(ITEMS, fresh);

    // кошик міг посилатися на позиції, яких у базі вже немає
    try{
      let changed = false;
      Object.keys(cart).forEach(id=>{ if(!byId(id)){ delete cart[id]; changed = true; } });
      if(changed) save();
    }catch(e){}

  }

  try{ if(window.rerender) window.rerender(); renderCart(); }catch(e){}

  /* ---------- 5. Режим роботи ---------- */
  const st = (by.settings || [])[0], xs = (st && st.extra) || {};

  const okTime = v => /^\d{1,2}:\d{2}$/.test(str(v));
  if(okTime(xs.open_from)) SHOP.openFrom = str(xs.open_from);
  if(okTime(xs.open_to))   SHOP.openTo   = str(xs.open_to);
  try{ applyTimeBounds(); renderHours(); }catch(e){}

  if(xs.dayoff) dayOffScreen(str(xs.msg) || 'Сьогодні санітарний день', str(xs.msg2) || SHOP.dayOff);
})
.catch(()=>{ /* немає звʼязку — сайт живе на вбудованому меню */ });

/* Прибиральник з мітлою — щоб екран не був голим текстом.
   Малюємо самі, у кольорах сайту: готової картинки під це немає. */
const BROOM =
  '<svg class="dayoff__art" viewBox="0 0 120 120" width="128" height="128" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="56" fill="rgba(180,54,55,.13)"/>' +
    '<circle cx="60" cy="60" r="56" fill="none" stroke="rgba(180,54,55,.45)" stroke-width="1.5"/>' +
    '<path d="M22 104h76" stroke="rgba(255,255,255,.14)" stroke-width="2.5" stroke-linecap="round"/>' +
    /* мітла */
    '<g transform="rotate(-20 62 88)">' +
      '<rect x="59" y="30" width="6" height="56" rx="3" fill="#A98A6B"/>' +
      '<rect x="59" y="30" width="2.4" height="56" fill="rgba(255,255,255,.18)"/>' +
      '<path d="M50 86h24l5 20H45z" fill="#E8C79A"/>' +
      '<path d="M55 90v14M62 90v15M69 90v14" stroke="rgba(140,74,60,.45)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<rect x="48" y="82" width="28" height="8" rx="4" fill="#8C4A3C"/>' +
    '</g>' +
    /* прибиральник */
    '<path d="M36 100l3-22M52 100l-2-22" stroke="#2B2B33" stroke-width="7" stroke-linecap="round"/>' +
    '<rect x="31" y="48" width="26" height="34" rx="11" fill="#B43637"/>' +
    '<path d="M38 58h12v18a6 6 0 0 1-12 0z" fill="rgba(255,255,255,.20)"/>' +
    '<path d="M53 60l16-8" stroke="#F0D3B4" stroke-width="6.5" stroke-linecap="round"/>' +
    '<path d="M53 72l10 8" stroke="#F0D3B4" stroke-width="6.5" stroke-linecap="round"/>' +
    '<circle cx="44" cy="36" r="12" fill="#F0D3B4"/>' +
    '<path d="M32 34a12 12 0 0 1 24 0z" fill="#2B2B33"/>' +
    '<circle cx="49" cy="37" r="1.7" fill="#2B2B33"/>' +
    '<path d="M46 43q3 2 6 0" stroke="#2B2B33" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    /* пилинки */
    '<circle cx="90" cy="96" r="3" fill="rgba(255,255,255,.28)"/>' +
    '<circle cx="99" cy="88" r="2" fill="rgba(255,255,255,.20)"/>' +
    '<circle cx="86" cy="82" r="1.6" fill="rgba(255,255,255,.16)"/>' +
  '</svg>';

/* Санітарний день: попереджаємо один раз, далі меню можна дивитися,
   але замовити не можна — кнопки додавання глухі. */
function dayOffScreen(title, note){
  const e = s => String(s).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  document.body.classList.add('dayoff-on');

  const ov = document.createElement('div');
  ov.id = 'dayoff';
  ov.innerHTML =
    '<div class="dayoff__in">' +
      BROOM +
      '<h2>' + e(title) + '</h2>' +
      (note ? '<p>' + e(note) + '</p>' : '') +
      '<button class="btn" id="dayoffOk"><span>Зрозуміло</span></button>' +
      '<a class="dayoff__tel" href="tel:' + e(SHOP.phone) + '">' + e(SHOP.phoneView) + '</a>' +
    '</div>';
  document.body.appendChild(ov);
  document.body.classList.add('locked');

  const close = ()=>{
    ov.remove();
    document.body.classList.remove('locked');
    // тонка смужка вгорі, щоб причина не забулася під час перегляду
    const bar = document.createElement('div');
    bar.className = 'dayoff-bar';
    bar.textContent = title + (note ? ' · ' + note : '');
    document.body.appendChild(bar);
  };
  ov.querySelector('#dayoffOk').onclick = close;
  ov.addEventListener('click', ev=>{ if(ev.target===ov) close(); });
}

/* Поки санітарний день — жодного додавання в кошик і жодного оформлення */
document.addEventListener('click', ev=>{
  if(!document.body.classList.contains('dayoff-on')) return;
  if(!ev.target.closest('[data-add],[data-inc],#toCond,#toAdd,#toCheckout,#send')) return;
  ev.preventDefault();
  ev.stopImmediatePropagation();
  try{ toast('Сьогодні санітарний день — замовлення не приймаємо'); }catch(e){}
}, true);
})();
