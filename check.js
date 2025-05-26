import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import { bot } from './modules/telegram.js'; // импортируем telegram-бота

import echoRouter from './routes/echo.routes.js'
import express from 'express'
import dotenv from "dotenv"
// import https from 'https'
import http from 'http'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// EDWARD
const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())
app.use(process.env.API_ECHO_PATH,   echoRouter)
  
const timeoutDefault = 300;
  
// let server = https.createServer(optionsServer, app);
let server = http.createServer(app);

server.listen(PORT, () => console.log(`server started on port ${PORT}`))
// EDWARD


const DATA_FILE = path.join(__dirname, 'user_servers.json');

// Загружаем данные
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Сохраняем данные
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Нормализация адреса — если без протокола, подставим https → http
function normalizeToCheckVariants(address) {
  if (/^https?:\/\//i.test(address)) {
    return [address]; // указано явно — использовать как есть
  }
  return [
    `https://${address}`,
    `http://${address}`
  ];
}

// Проверка доступности по любому из вариантов
export async function isServerAvailable(address) {
  const variants = normalizeToCheckVariants(address);

  for (const url of variants) {
    try {
      const res = await axios.get(url, {
        timeout: 7000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (HealthBot)',
          'Accept': '*/*'
        },
        validateStatus: () => true // не кидай ошибку при 404/500
      });

      console.log(`[CHECK ✅] ${url} → ${res.status}`);
      if (res.status >= 200 && res.status < 400) {
        return true;
      }
    } catch (err) {
      console.log(`[CHECK ❌] ${url} → ${err.code || err.message}`);
    }
  }

  return false;
}

// Основной проверочный цикл
async function checkServers() {
  const data = loadData();
  const now = new Date();

  for (const userId of Object.keys(data)) {
    const servers = data[userId];

    for (const server of servers) {
      const isUp = await isServerAvailable(server.address);
      
      let timeoutSec = timeoutDefault
      if (server.timeout) {
        timeoutSec = server.timeout;
      }
      
      console.log(`timeout ${server.address} → ${timeoutSec}`);     

      if (isUp) {
        // Сервер доступен — сбрасываем downSince
        if (server.downSince) {
          server.downSince = null;
          console.log(`? Сервер ${server.name} снова доступен.`);
        }
      } else {
        if (!server.downSince) {
          server.downSince = now.toISOString(); // только сейчас упал
        } else {
          const downSinceDate = new Date(server.downSince);
          const diffSec = Math.floor((now - downSinceDate) / 1000);

          if (diffSec >= timeoutSec && !server.notified) {
            const msg = `?? Сервер *${server.name}* недоступен уже *${diffSec} секунд*.\n?? Адрес: ${server.address}`;
            bot.sendMessage(userId, msg, { parse_mode: 'Markdown' });
            server.notified = true;
          }
        }
      }

      // Если снова стал доступен — сброс уведомлений
      if (isUp && server.notified) {
        bot.sendMessage(userId, `? Сервер *${server.name}* снова в сети.`, { parse_mode: 'Markdown' });
        server.notified = false;
      }
    }
  }

  saveData(data);
}

// Запускаем проверку каждую минуту
console.log("? Мониторинг серверов запущен.");
checkServers(); // первый запуск сразу
setInterval(checkServers, 60 * 1000);