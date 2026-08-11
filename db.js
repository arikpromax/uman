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
        '&collection=in.(menu,sets,settings)&order=sort_order'+
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

  /* ---------- 2. Меню і сети з бази ---------- */
  const menu = by.menu || [], sets = by.sets || [];
  if(menu.length || sets.length){
    const fresh = [];

    menu.forEach(r=>{
      const x = r.extra || {};
      const it = {
        id:'db'+r.id, c:str(x.cat)||'fila', n:r.title,
        p:num(r.price), w:str(x.w),
        t:str(x.t)||'roll',
        ing:csv(x.ing)
      };
      if(str(x.d))    it.d = x.d;
      if(num(x.promo))it.promo = num(x.promo);
      if(x.top) it.top = 1;
      if(x.neu) it.neu = 1;
      if(x.hot) it.hot = 1;
      if(x.veg) it.veg = 1;
      if(x.add) it.add = 1;
      if(r.image_url) it.img = r.image_url;
      fresh.push(it);
    });

    sets.forEach(r=>{
      const x = r.extra || {};
      const it = {
        id:'db'+r.id, c:'set', n:'Сет «'+r.title+'»', p:num(r.price),
        w:[str(x.pcs),str(x.w)].filter(Boolean).join(' · '),
        t:'set', ing:csv(x.ing),
        list:list(x.list)
      };
      if(num(x.promo)) it.promo = num(x.promo);
      if(x.week) it.week = 1;
      if(x.top)  it.top  = 1;
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

    try{ if(window.rerender) window.rerender(); renderCart(); }catch(e){}
  }

  /* ---------- 3. Режим роботи ---------- */
  const st = (by.settings || [])[0], xs = (st && st.extra) || {};

  const okTime = v => /^\d{1,2}:\d{2}$/.test(str(v));
  if(okTime(xs.open_from)) SHOP.openFrom = str(xs.open_from);
  if(okTime(xs.open_to))   SHOP.openTo   = str(xs.open_to);
  try{ applyTimeBounds(); renderHours(); }catch(e){}

  if(xs.dayoff) dayOffScreen(str(xs.msg) || 'Сьогодні вихідний', str(xs.msg2) || SHOP.dayOff);
})
.catch(()=>{ /* немає звʼязку — сайт живе на вбудованому меню */ });

/* Заглушка на весь екран: замовити сьогодні не можна */
function dayOffScreen(title, note){
  const esc = s => String(s).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ov = document.createElement('div');
  ov.id = 'dayoff';
  ov.innerHTML =
    '<div class="dayoff__in">' +
      '<img src="logo.jpg" alt="" width="86" height="86">' +
      '<h2>' + esc(title) + '</h2>' +
      (note ? '<p>' + esc(note) + '</p>' : '') +
      '<a class="btn" href="tel:' + esc(SHOP.phone) + '"><span>' + esc(SHOP.phoneView) + '</span></a>' +
    '</div>';
  document.body.appendChild(ov);
  document.body.classList.add('locked');
}
})();
