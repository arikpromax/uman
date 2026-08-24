/* ============================================================
   Позначка версії для скриптів і стилів
   ------------------------------------------------------------
   GitHub Pages віддає файли з Cache-Control: max-age=600, тож
   браузер до десяти хвилин користується старою копією app.js —
   сайт уже оновлений, а людина бачить попередній код.

   Цей скрипт дописує до адрес позначку ?v=…, яка міняється з
   кожним запуском. Нова адреса — брати з кешу нема чого.

   Запускати перед пушем:  node bump.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ASSETS = ['style.css', 'data.js', 'app.js', 'fx.js', 'db.js', 'favicon.png'];
const PAGES  = ['index.html', path.join('menu', 'index.html')];

const d = new Date();
const p = n => String(n).padStart(2, '0');
const V = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;

let touched = 0;
PAGES.forEach(page => {
  if (!fs.existsSync(page)) return;
  let html = fs.readFileSync(page, 'utf8');
  const before = html;

  ASSETS.forEach(a => {
    // ловимо і з ../, і без; і вже проставлену стару версію
    const re = new RegExp('((?:\\.\\./)?' + a.replace('.', '\\.') + ')(\\?v=[\\w-]+)?(["\'])', 'g');
    html = html.replace(re, (_, file, __, quote) => `${file}?v=${V}${quote}`);
  });

  if (html !== before) {
    fs.writeFileSync(page, html);
    touched++;
  }
  console.log(page + ': ' + (html === before ? 'без змін' : 'версія ' + V));
});

if (!touched) console.log('нічого не змінилося — перевірте назви файлів');
