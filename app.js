/* ============================================================
   FUJI SUSHI · Умань — логіка сайту
   Кошик у localStorage, замовлення йде в Telegram.
   Страви малюються кодом — фото немає.
   ============================================================ */

const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const uah = n => n.toLocaleString('uk-UA') + ' ₴';
const byId = id => ITEMS.find(i=>i.id===id);

/* ---------- ІКОНКИ (без емодзі) ---------- */
const ICON = {
  phone:'<path d="M6.6 3.5h3l1.6 4-2 1.4a12 12 0 0 0 5.9 5.9l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7 2 2 0 0 1 6.6 3.5z"/>',
  cart:'<path d="M3.5 6.5h17l-1.6 12a1.6 1.6 0 0 1-1.6 1.4H6.7a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M8.6 9.6V6a3.4 3.4 0 0 1 6.8 0v3.6"/>',
  home:'<path d="M4 10.5 12 4l8 6.5V19a1.4 1.4 0 0 1-1.4 1.4h-3.2v-5.6H8.6v5.6H5.4A1.4 1.4 0 0 1 4 19z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h11"/>',
  truck:'<path d="M2.6 16.4h1.8m13.2 0h2M4.4 16.4a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 1 0-4.8 0M15 16.4a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 1 0-4.8 0"/><path d="M4.4 16.4V6.6h9.2v9.8M13.6 9.6h3.6l2.6 4.4v2.4"/>',
  search:'<circle cx="11" cy="11" r="6.4"/><path d="m16 16 4 4"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
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
const total = ()=>Object.entries(cart).reduce((a,[id,q])=>{const m=byId(id);return a+(m?m.p*q:0);},0);

/* крок 1 — тільки список і вибір способу; крок 2 — контакти */
let mode='Доставка';
function setStep(s){
  const one=$('#step1'), two=$('#step2'); if(!one) return;
  one.hidden = s!==1; two.hidden = s!==2;
  const ad=$('#fAddr'); if(ad){ ad.hidden = mode==='Самовиніс'; if(ad.hidden) ad.value=''; }
  if(s===2) setTimeout(()=>$('#fName')?.focus(),80);
}

function renderCart(){
  const n=count(), t=total();
  $$('.cart-btn i').forEach(e=>{ e.textContent=n; e.classList.toggle('on',n>0); });

  const body=$('#cartBody'); if(!body) return;
  if(!n){
    body.innerHTML=`<div class="cart__empty">${art({t:'roll',ing:['ohir'],n:'порожньо'},110)}<div>Кошик порожній</div></div>`;
    $('#cartFoot').hidden=true; setStep(1); return;
  }
  $('#cartFoot').hidden=false;
  body.innerHTML=Object.entries(cart).map(([id,q])=>{
    const m=byId(id); if(!m) return '';
    return `<div class="ci">
      <div class="ci__a">${art(m,52)}</div>
      <div class="ci__t"><b>${m.n}</b><span>${uah(m.p*q)}</span></div>
      <div class="qty"><button data-dec="${id}" aria-label="Менше">−</button><i>${q}</i><button data-inc="${id}" aria-label="Більше">+</button></div>
      <button class="ci__x" data-del="${id}" aria-label="Прибрати ${m.n}">${icon('close')}</button>
    </div>`;
  }).join('');

  const free=t>=SHOP.freeFrom;
  $('#sumT').textContent=uah(t);
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
  el.className='fly'; el.innerHTML=art(m,62);
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

/* ---------- картка страви ---------- */
function cardHTML(m){
  const tags=[];
  if(m.neu)  tags.push('<span class="tag">новинка</span>');
  if(m.week) tags.push('<span class="tag tag--w">сет тижня</span>');
  if(m.veg)  tags.push('<span class="tag tag--v">без риби</span>');
  const d = m.d ? m.d
          : m.list ? m.list.slice(0,3).join(' · ')+(m.list.length>3?` · +${m.list.length-3}`:'')
          : (m.ing||[]).map(k=>(ING[k]||{}).n).filter(Boolean).join(', ');
  return `<article class="card">
    <div class="card__img">${tags.length?`<div class="card__tags">${tags.join('')}</div>`:''}${art(m,190)}</div>
    <div class="card__in">
      <h3 class="card__n">${m.n}</h3>
      <p class="card__d">${d}</p>
      <div class="card__b">
        <span>
          <span class="card__w">${m.w||''}</span>
          <span class="card__p">${m.p}<em> ₴</em></span>
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
});
function openCart(v){
  $('#cart').classList.toggle('on',v);
  $('#veil').classList.toggle('on',v);
  document.body.classList.toggle('locked',v);
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') openCart(false); });

/* ============================================================
   ЗАМОВЛЕННЯ В TELEGRAM
   ============================================================ */
function orderText(){
  const lines=Object.entries(cart).map(([id,q],i)=>{
    const m=byId(id); return `${i+1}. ${m.n} — ${q} × ${m.p} = ${m.p*q} ₴`;
  });
  const t=total(), free=t>=SHOP.freeFrom;
  const v=s=>($('#'+s)?.value||'').trim();
  const pay=$('input[name=pay]:checked')?.value||'—';
  return [
    'НОВЕ ЗАМОВЛЕННЯ · FUJI SUSHI',
    '——————————————',
    ...lines,
    '——————————————',
    `Сума: ${t} ₴`,
    `Спосіб: ${mode}` + (mode==='Доставка' ? ` (${free?'безкоштовно':'за тарифом'})` : ''),
    `Оплата: ${pay}`,
    '',
    `Імʼя: ${v('fName')||'—'}`,
    `Телефон: ${v('fTel')||'—'}`,
    ...(mode==='Доставка' ? [`Адреса: ${v('fAddr')||'—'}`] : []),
    `Коментар: ${v('fNote')||'—'}`
  ].join('\n');
}
function validate(){
  if(!count()){ toast('Кошик порожній'); return false; }
  if(total()<SHOP.minOrder){ toast('Мінімальне замовлення '+SHOP.minOrder+' ₴'); return false; }
  let ok=true;
  const need=[['fName',2],['fTel',9]];
  if(mode==='Доставка') need.push(['fAddr',4]);
  need.forEach(([id,min])=>{
    const el=$('#'+id), bad=el.value.trim().length<min;
    el.classList.toggle('bad',bad); if(bad) ok=false;
  });
  if(!ok) toast(mode==='Доставка' ? 'Заповніть імʼя, телефон і адресу' : 'Заповніть імʼя і телефон');
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
        cart={}; save(); renderCart(); setStep(1);
        toast('Замовлення надіслано — ми передзвонимо');
        setTimeout(()=>openCart(false),1200);
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
        <h3>Кошик</h3>
        <button class="icn" id="cartClose" aria-label="Закрити">${icon('close')}</button>
      </div>
      <div class="cart__b" id="cartBody"></div>
      <div class="cart__f" id="cartFoot" hidden>
        <div class="prog">
          <div class="prog__t"><span id="progTxt"></span><b id="progLeft"></b></div>
          <div class="prog__b"><i id="progBar"></i></div>
        </div>
        <div class="sum"><span>До сплати</span><b id="sumT">0 ₴</b></div>

        <div class="mode" id="step1">
          <button class="btn" data-mode="Доставка">${icon('truck')}<span>Доставка</span></button>
          <button class="btn btn--glass" data-mode="Самовиніс"><span>Самовиніс</span></button>
        </div>

        <div id="step2" hidden>
          <button class="back" id="back">← Назад</button>
          <div class="frm">
            <div class="two">
              <input id="fName" type="text" placeholder="Імʼя" autocomplete="name">
              <input id="fTel" type="tel" placeholder="Телефон" autocomplete="tel">
            </div>
            <input id="fAddr" type="text" placeholder="Адреса доставки">
            <textarea id="fNote" rows="2" placeholder="Коментар"></textarea>
            <div class="pay">
              <label><input type="radio" name="pay" value="Готівкою" checked><span>Готівкою</span></label>
              <label><input type="radio" name="pay" value="Карткою"><span>Карткою</span></label>
            </div>
            <button class="btn btn--full" id="send">${icon('tg')}<span>Надіслати в Telegram</span></button>
          </div>
        </div>
      </div>
    </aside>`;

  // тост живе поза обгорткою кошика, щоб його не обрізало
  const t=document.createElement('div'); t.className='toast'; t.id='toast';
  document.body.appendChild(t);

  $$('.cart-btn').forEach(b=>{ if(b.id!=='cartClose') b.onclick=()=>openCart(true); });
  $('#cartClose').onclick=()=>openCart(false);
  $('#veil').onclick=()=>openCart(false);
  $('#send').onclick=sendOrder;
  $('#back').onclick=()=>setStep(1);
  $$('#step1 [data-mode]').forEach(b=>b.onclick=()=>{ mode=b.dataset.mode; setStep(2); });
  renderCart();
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
