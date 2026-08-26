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
        '&collection=in.(menu,sets,settings,cats,promos)&order=sort_order'+
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
  try{ renderHours(); renderDelivery(); }catch(e){}
  /* токен Telegram свідомо НЕ беремо з бази: тексти читаються публічно,
     тож в адмінці йому не місце — він лишається в data.js */

  /* ---------- 2. Розділи меню ----------
     Список будується з адмінки цілком, а не лише перейменовує вбудований:
     інакше доданий там розділ ніде б не зʼявився. Порядок теж звідти. */
  /* Порядок розділів. Сортуємо ще раз самі, з номером рядка як
     запасною ознакою: якщо в двох розділів збігся номер порядку, база
     вільна віддати їх у будь-якій послідовності — і на сайті вони
     стрибали з місця на місце між завантаженнями. */
  const catRows = (by.cats || []).slice()
    .sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
  if(catRows.length){
    const fresh = [];
    catRows.forEach(r=>{
      const k = str((r.extra||{}).catkey); if(!k) return;
      if(r.image_url) CATIMG[k] = r.image_url;
      // «Усі» — не розділ меню, а перша кнопка стрічки; свого списку страв не має
      if(k === 'all'){ if(str(r.title)) CATALL.n = str(r.title); return; }
      fresh.push({ id:k, n: str(r.title) || k });
    });
    // якщо в базі самі порожні рядки — лишаємо вбудований список
    if(fresh.length){
      CATS.length = 0;
      Array.prototype.push.apply(CATS, fresh);
    }
  }

  /* ---------- 2б. Промокоди ---------- */
  const promos = by.promos || [];
  if(promos.length){
    Object.keys(PROMO).forEach(k=>delete PROMO[k]);
    promos.forEach(r=>{
      const x = r.extra || {};
      if(x.stop) return;                          // код тимчасово вимкнений
      const code = str(r.title).toUpperCase().replace(/\s+/g,'');
      const off  = num(x.off);
      if(!code || off <= 0) return;
      const type = str(x.type) === '%' ? '%' : 'uah';
      const uses = num(x.uses);
      PROMO[code] = { off, type, n: type === '%' ? '-'+off+'%' : '-'+off+' ₴' };
      // скільки разів код узагалі може спрацювати; 0 — без обмежень
      if(uses > 0) PROMO[code].uses = uses;
      // код може діяти лише на одну позицію: в адмінці обирають страву
      // або сет, сюди приходить номер рядка — на сайті це id вигляду db12
      const only = str(x.only_menu) || str(x.only_set);
      if(only) PROMO[code].only = 'db' + only;
    });
  }

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
      if(num(x.bo))  it.bo = num(x.bo);
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
      if(num(x.bo)) it.bo = num(x.bo);
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

  DB_WAIT = false;
  try{ if(window.rerender) window.rerender(); renderCart(); }catch(e){}

  /* ---------- 5. Режим роботи ---------- */
  const st = (by.settings || [])[0], xs = (st && st.extra) || {};

  const okTime = v => /^\d{1,2}:\d{2}$/.test(str(v));
  if(okTime(xs.open_from)) SHOP.openFrom = str(xs.open_from);
  if(okTime(xs.open_to))   SHOP.openTo   = str(xs.open_to);
  // написи біля графіка живуть тут же, поруч із самими годинами
  if(str(xs.open_msg)) SHOP.openMsg = str(xs.open_msg);
  if(str(xs.shut_msg)) SHOP.shutMsg = str(xs.shut_msg);
  try{ applyTimeBounds(); applyWhenChoices(); renderHours(); }catch(e){}

  if(xs.dayoff) dayOffScreen(str(xs.msg) || 'Сьогодні санітарний день', str(xs.msg2) || SHOP.dayOff);
})
.catch(()=>{ /* немає звʼязку — показуємо вбудоване меню */ dbReady(); });

/* Прибиральник з мітлою — щоб екран не був голим текстом.
   Силует одним кольором, як на дорожніх знаках; на чорному тлі
   світлий, а не чорний. Малюємо самі: готової картинки під це немає. */
const BROOM =
  '<svg class="dayoff__art" viewBox="0 0 120 120" width="132" height="132" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="56" fill="rgba(180,54,55,.13)"/>' +
    '<circle cx="60" cy="60" r="56" fill="none" stroke="rgba(180,54,55,.45)" stroke-width="1.5"/>' +
    '<g transform="translate(15,-3) scale(.93)">' +
      '<g fill="#F2EDE6" stroke="#F2EDE6" stroke-linejoin="round">' +
        /* держак */
        '<path d="M53 46 27 79" stroke-width="3.6" stroke-linecap="round" fill="none"/>' +
        /* віник — розвернутий уздовж держака */
        '<g transform="rotate(38 27 79)">' +
          '<path d="M20 73q7-5 14 0l5 21q-12 8-24 0z"/>' +
        '</g>' +
        /* постать */
        '<circle cx="55" cy="26" r="11" stroke="none"/>' +
        '<rect x="45" y="36" width="20" height="34" rx="7" stroke="none"/>' +
        '<path d="M50.5 70v27M60.5 70v27" stroke-width="7.5" stroke-linecap="round" fill="none"/>' +
        '<path d="M62 41 70.5 47.5 52 52" stroke-width="6.6" stroke-linecap="round" fill="none"/>' +
        '<path d="M48 47 40 59" stroke-width="6.6" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      /* сліди руху збоку від віника */
      '<g fill="none" stroke="#F2EDE6" stroke-width="2.4" stroke-linecap="round">' +
        '<path d="M40 82q4 4 1 8"/>' +
        '<path d="M45 79q5 5 1 11"/>' +
      '</g>' +
    '</g>' +
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
