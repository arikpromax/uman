/* ============================================================
   FUJI SUSHI — шар ефектів
   ------------------------------------------------------------
   Усе тут — прикраса. Якщо знадобиться «як було», досить
   прибрати <script src="fx.js"> з обох сторінок: сайт працює
   без цього файлу повністю.

   Важке (нахил карток, світло за курсором, магнітні кнопки)
   вмикається лише на пристроях з мишею і вимикається, якщо
   в системі стоїть «зменшити рух».
   ============================================================ */
(function(){
'use strict';

const RM   = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches && innerWidth > 900;
const q  = (s,r=document)=>r.querySelector(s);
const qq = (s,r=document)=>[...r.querySelectorAll(s)];
const lerp = (a,b,t)=>a+(b-a)*t;

/* ---------- 1. поява сторінки ---------- */
document.documentElement.classList.add('fx');
addEventListener('load',()=>document.documentElement.classList.add('fx-ready'),{once:true});
setTimeout(()=>document.documentElement.classList.add('fx-ready'),1200); // страховка

/* ---------- 2. смуга прогресу прокрутки ---------- */
const bar = document.createElement('i');
bar.className = 'fx-bar';
document.body.appendChild(bar);
let barRaf = 0;
addEventListener('scroll',()=>{
  if(barRaf) return;
  barRaf = requestAnimationFrame(()=>{
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h>0 ? scrollY/h : 0) + ')';
    barRaf = 0;
  });
},{passive:true});

/* ---------- 3. зерно плівки ---------- */
if(!RM){
  const grain = document.createElement('div');
  grain.className = 'fx-grain';
  grain.setAttribute('aria-hidden','true');
  document.body.appendChild(grain);
}

/* ---------- 4. світло, що йде за курсором ---------- */
if(FINE && !RM){
  const lamp = document.createElement('div');
  lamp.className = 'fx-lamp';
  lamp.setAttribute('aria-hidden','true');
  document.body.appendChild(lamp);
  let tx=innerWidth/2, ty=innerHeight/3, cx=tx, cy=ty, on=false;
  addEventListener('pointermove',e=>{
    tx=e.clientX; ty=e.clientY;
    if(!on){ on=true; lamp.style.opacity='1'; }
  },{passive:true});
  (function loop(){
    cx=lerp(cx,tx,.075); cy=lerp(cy,ty,.075);
    lamp.style.transform='translate3d('+(cx-260)+'px,'+(cy-260)+'px,0)';
    requestAnimationFrame(loop);
  })();
}

/* ---------- 5. поява блоків під час прокрутки ---------- */
/* Показ — з підстраховкою. Якщо спостерігач з якоїсь причини не
   спрацює, контент лишиться прозорим назавжди: для меню це смерть.
   Тому: те, що вже у вікні, показуємо одразу, а решту ще й
   домітаємо на прокрутці й раз на секунду. */
const io = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('shown'); io.unobserve(e.target); }});
},{threshold:.08,rootMargin:'0px 0px -40px 0px'});

function sweep(){
  qq('.fx-rise:not(.shown)').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.top < innerHeight && r.bottom > 0) el.classList.add('shown');
  });
}
setInterval(sweep,1000);
addEventListener('scroll',()=>{ clearTimeout(sweep._t); sweep._t=setTimeout(sweep,90); },{passive:true});

// панелі оформлення сюди не беремо: вони стартують схованими,
// і поки не відкриються, лишалися б прозорими
const REVEAL = '.card, .grp, .info > div, .sec-h, .hours, .cat, .footer__in > div';
function scan(){
  qq(REVEAL).forEach(el=>{
    if(el.dataset.fx) return;
    el.dataset.fx='1';
    el.classList.add('fx-rise');
    // сходинка затримки в межах свого ряду
    const sibs=[...el.parentElement.children].filter(x=>x.matches(REVEAL));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el),7)*55 + 'ms');
    const r=el.getBoundingClientRect();
    if(r.top < innerHeight && r.bottom > -200) requestAnimationFrame(()=>el.classList.add('shown'));
    else io.observe(el);
  });
  requestAnimationFrame(sweep);
}
scan();

// меню перемальовується при фільтрах і пошуку — підхоплюємо нові картки
const mo = new MutationObserver(()=>{ clearTimeout(mo._t); mo._t=setTimeout(scan,40); });
mo.observe(document.body,{childList:true,subtree:true});

/* ---------- 6. нахил і відблиск на картках ---------- */
if(FINE && !RM){
  let raf=0, cur=null, mx=0, my=0, rx=0, ry=0;
  document.addEventListener('pointermove',e=>{
    const card=e.target.closest('.card, .banner');
    if(card!==cur){
      if(cur) reset(cur);
      cur=card;
      if(cur) cur.classList.add('fx-tilt');
    }
    if(!cur) return;
    const r=cur.getBoundingClientRect();
    mx=(e.clientX-r.left)/r.width;
    my=(e.clientY-r.top)/r.height;
    const soft = cur.classList.contains('banner') ? 3 : 7;
    ry=(mx-.5)*soft; rx=(.5-my)*soft;
    if(!raf) raf=requestAnimationFrame(apply);
  },{passive:true});
  document.addEventListener('pointerleave',()=>{ if(cur){ reset(cur); cur=null; } });
  function apply(){
    raf=0; if(!cur) return;
    cur.style.setProperty('--mx',(mx*100)+'%');
    cur.style.setProperty('--my',(my*100)+'%');
    cur.style.setProperty('--rx',rx+'deg');
    cur.style.setProperty('--ry',ry+'deg');
  }
  function reset(el){
    el.classList.remove('fx-tilt');
    el.style.setProperty('--rx','0deg');
    el.style.setProperty('--ry','0deg');
  }
}

/* ---------- 7. магнітні кнопки + хвиля по кліку ---------- */
if(FINE && !RM){
  document.addEventListener('pointermove',e=>{
    // .add навмисно не магнітимо — у нього своє обертання на hover
    const b=e.target.closest('.btn, .mbtn');
    qq('.fx-mag').forEach(x=>{ if(x!==b){ x.classList.remove('fx-mag'); x.style.transform=''; }});
    if(!b) return;
    const r=b.getBoundingClientRect();
    b.classList.add('fx-mag');
    b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.14)+'px,'+((e.clientY-r.top-r.height/2)*.22)+'px)';
  },{passive:true});
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.btn, .mbtn, .cat, .add, .card__add');
  if(!b || RM) return;
  const r=b.getBoundingClientRect();
  const w=document.createElement('span');
  w.className='fx-wave';
  w.style.left=(e.clientX-r.left)+'px';
  w.style.top=(e.clientY-r.top)+'px';
  b.appendChild(w);
  setTimeout(()=>w.remove(),620);
});

/* ---------- 8. паралакс банера ---------- */
if(FINE && !RM){
  const bx=q('.banners');
  if(bx) bx.addEventListener('pointermove',e=>{
    const b=e.target.closest('.banner'); if(!b) return;
    const art=b.querySelector('.banner__art'); if(!art) return;
    const r=b.getBoundingClientRect();
    art.style.transform='translate(-'+((e.clientX-r.left)/r.width*22-11)+'px,calc(-50% + '+((e.clientY-r.top)/r.height*16-8)+'px))';
  },{passive:true});
}

/* ---------- 9. заголовок героя по словах ---------- */
const h1=q('.h1');
if(h1 && !RM && !h1.dataset.fx){
  h1.dataset.fx='1';
  h1.innerHTML = h1.textContent.trim().split(' ')
    .map((w,i)=>'<span class="fx-w" style="--d:'+(i*55)+'ms">'+w+'</span>').join(' ');
  requestAnimationFrame(()=>h1.classList.add('shown'));
}

})();
