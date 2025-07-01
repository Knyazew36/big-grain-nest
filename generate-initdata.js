// generate-initdata.js
import crypto from 'crypto';

// 1) Укажи свой BOT_TOKEN и тестовые данные пользователя
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Нужно передать BOT_TOKEN через env: BOT_TOKEN=xxx node generate-initdata.js');
  process.exit(1);
}

const fields = {
  id: '123456789', // Telegram ID (строка)
  first_name: 'Sergey', // Имя
  username: 'sergey_tester', // Необязательно
  auth_date: `${Math.floor(Date.now() / 1000)}`, // В секундах
};

// 2) Формируем data_check_string
const dataCheckString = Object.keys(fields)
  .sort()
  .map((key) => `${key}=${fields[key]}`)
  .join('\n');

// 3) Вычисляем hash по алгоритму Telegram
const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

// 4) Собираем initData
const initData = Object.entries({ ...fields, hash })
  .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  .join('&');

console.log('Сгенерировано initData:\n');
console.log(initData);
