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
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TOKEN + '/sendMessage', {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        payload: JSON.stringify({ chat_id: CHAT, text: d.text || 'Нове замовлення' })
      });
    } catch (err) {}
  }

  return ContentService.createTextOutput('ok');
}

/* Відкриття посилання в браузері — щоб можна було перевірити,
   що розгортання живе. Замовлення сюди не приходять. */
function doGet() {
  return ContentService.createTextOutput('Fuji Sushi — приймання замовлень працює');
}
