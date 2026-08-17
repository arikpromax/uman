/* ============================================================
   FUJI SUSHI — приймання замовлень
   ------------------------------------------------------------
   Цей код НЕ є частиною сайту. Він живе в Google Apps Script,
   лежить у папці лише як зразок для копіювання.

   Що робить: приймає замовлення з сайту, дописує рядок у таблицю
   і пересилає його в Telegram.

   Навіщо так, а не прямо з сайту: токен бота лежить тут, а цей
   скрипт ніхто, крім вас, не бачить. У коді сайту він був би
   відкритий усім, і GitHub відкликав би його автоматично.

   ЯК ПОСТАВИТИ
   1. Створіть Google-таблицю.
   2. У ній: Розширення → Apps Script.
   3. Зітріть усе, що там було, і вставте цей файл.
   4. Впишіть TOKEN і CHAT нижче.
   5. Розгорнути → Новий розгортання → тип «Веб-застосунок»:
        Виконувати від імені: Я
        Хто має доступ:      Усі
      Отримаєте посилання виду https://script.google.com/macros/s/…/exec
   6. Дайте це посилання мені — я впишу його в сайт.

   Змінили код — треба зробити НОВЕ розгортання, інакше працює старе.
   ============================================================ */

const TOKEN = '';   // токен бота від @BotFather
const CHAT  = '';   // куди слати: id чату або групи

const HEAD = ['Час','Спосіб','Імʼя','Телефон','Адреса','Коли','Оплата',
              'Приборів','Промокод','Сума','Замовлення','Коментар'];

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}

  // 1. рядок у таблицю
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEAD);
      sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      new Date(), d.mode || '', d.name || '', d.phone || '', d.addr || '',
      d.when || '', d.pay || '', d.pers || '', d.promo || '', d.sum || '',
      d.items || '', d.note || ''
    ]);
  } catch (err) {}

  // 2. те саме в Telegram
  if (TOKEN && CHAT) {
    var tel = normPhone(d.phone);
    var text = esc(d.text || 'Нове замовлення');
    // номер міжнародним — тоді Telegram сам робить його натисним
    if (tel && d.phone) text = text.split(esc(d.phone)).join(tel);
    tg('sendMessage', { chat_id: CHAT, text: text, parse_mode: 'HTML' });

    /* Кнопки для дзвінка в Telegram не буває: посилання tel: він
       відхиляє в клавіатурі й мовчки викидає з тексту — перевірено,
       у збережених сутностях його немає. Працює лише картка
       контакту: кнопку дзвінка в ній малює сам Telegram. */
    if (tel) {
      tg('sendContact', {
        chat_id: CHAT,
        phone_number: tel,
        first_name: d.name || 'Замовник',
        last_name: d.mode === 'Самовиніс' ? '· самовиніс' : '· доставка'
      });
    }
  }

  return ContentService.createTextOutput('ok');
}

/* Текст іде як HTML, тож кутові дужки з імені чи коментаря
   треба знешкодити — інакше Telegram відмовиться його показати. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tg(method, payload) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/' + method, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });
  } catch (err) {}
}

/* 0971234567 → +380971234567. Без міжнародного формату Telegram
   не впізнає номер і не дасть по ньому подзвонити. */
function normPhone(s) {
  var d = String(s || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 && d.charAt(0) === '0') return '+38' + d;
  if (d.length === 12 && d.substring(0, 2) === '38') return '+' + d;
  if (d.length === 9) return '+380' + d;
  return '+' + d;
}

/* Відкриття посилання в браузері — щоб можна було перевірити,
   що розгортання живе. Замовлення сюди не приходять. */
function doGet() {
  return ContentService.createTextOutput('Fuji Sushi — приймання замовлень працює');
}
