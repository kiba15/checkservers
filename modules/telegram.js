import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TG_TOKEN

console.log('starting bot...')

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Текущий путь
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Переход в корень проекта
const ROOT_DIR = path.join(__dirname, '..');

// Пути к файлам
const DATA_FILE = path.join(ROOT_DIR, 'user_servers.json');


// Загрузка/сохранение данных
function loadData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Команды
const COMMANDS = {
//  ADD: 'add_server',
//  EDIT: 'edit_server',
//  DELETE: 'delete_server',
    HELP: 'help',
};

const COMMAND_BUTTON_LABELS = {
  //[COMMANDS.ADD]: '✅ Добавить сервер',
  //[COMMANDS.EDIT]: '✏️Изменить сервер',
  //[COMMANDS.DELETE]: '❌ Удалить сервер',
    [COMMANDS.HELP]: 'ℹ О боте...', 
};

const userState = {};

function getCommandFromText(text) {
  return Object.entries(COMMAND_BUTTON_LABELS).find(([, label]) => label === text)?.[0] || null;
}

function showUserServersMenu(chatId) {
  const data = loadData();
  const servers = data[chatId] || [];

  const buttons = servers.map(s => [{ text: s.name }]);
  buttons.push(
   // [{ text: COMMAND_BUTTON_LABELS[COMMANDS.ADD] }],
   // [{ text: COMMAND_BUTTON_LABELS[COMMANDS.EDIT] }],
   // [{ text: COMMAND_BUTTON_LABELS[COMMANDS.DELETE] }]
    [{ text: COMMAND_BUTTON_LABELS[COMMANDS.HELP] }]
  );

  bot.sendMessage(chatId, 'ℹ️ Выберите сервер или действие:', {
   reply_markup: {
     keyboard: buttons,
     resize_keyboard: true,
      one_time_keyboard: false,
    }
  });
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Установка Telegram-команд
bot.setMyCommands([
  { command: 'start', description: 'ℹ️Главное меню' },
  { command: 'add', description: '✅ Добавить сервер' },
  { command: 'edit', description: '✏ Изменить сервер' },
  { command: 'delete', description: '❌ Удалить сервер' }
]);

// Обработка сообщений
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const data = loadData();
  
  const timeoutDefault = 300;
  
  if (!data[chatId]) data[chatId] = [];
  const servers = data[chatId];
  const state = userState[chatId];

  // Работа с состоянием
  if (state) {
    switch (state.action) {
      case 'add': {
        const [name, address, timeoutRaw] = text.split(',').map(s => s.trim());


        // ������ Обработка timeout
        let timeout = null;
        if (timeoutRaw) {
          const parsed = parseInt(timeoutRaw, 10);
          if (isNaN(parsed) || parsed < 10 || parsed > 120000) {
            bot.sendMessage(chatId, "❗ Таймаут должен быть числом от 10 до 120000 (мс).");
            return;
          }
          timeout = parsed;
        } else {
          timeout = timeoutDefault;
        }

        
        if (name && address) {
        
          //if (!timeout) {
          // timeout = parseInt(timeoutDefault, 10) ;        
          //}     
        
          servers.push({ name, address, timeout});
          saveData(data);
          bot.sendMessage(chatId, `✅ Сервер "${name}" добавлен!`);
        } else {
          bot.sendMessage(chatId, "❗ Формат: Название, IP");
        }
        delete userState[chatId];
        return showUserServersMenu(chatId);
      }

      case 'edit_step_1': {
        const server = servers.find(s => s.name === text);
        if (!server) {
          bot.sendMessage(chatId, "❗ Сервер не найден.");
          delete userState[chatId];
        } else {
          userState[chatId] = { action: 'edit_step_2', server };
          bot.sendMessage(chatId, `Введите новый адрес для сервера "${server.name}" (и таймаут получения оповещения через запятую (если не указано, то ${timeoutDefault} сек.):`);
        }
        return;
      }

      case 'edit_step_2': {
        const currentData = loadData(); // загружаем актуальный data
        const currentServers = currentData[chatId] || [];

        // Ищем по имени (взяли имя из старого сохранённого server)
        const serverToUpdate = currentServers.find(s => s.name === state.server.name);
        if (serverToUpdate) {
        
          const [address_new, timeout_new] = text.split(',').map(s => s.trim());        
        
          serverToUpdate.address = address_new.trim();
          if (timeout_new) {
             serverToUpdate.timeout = timeout_new.trim();
          } else {
             serverToUpdate.timeout = timeoutDefault;
          }
          
          saveData(currentData);
          bot.sendMessage(chatId, `❗ Сервер "${serverToUpdate.name}" обновлён!`);
        } else {
          bot.sendMessage(chatId, "❗ Не удалось найти сервер для обновления.");
        }
      
        delete userState[chatId];
        return showUserServersMenu(chatId);
      }

      case 'delete': {
        const index = servers.findIndex(s => s.name === text);
        if (index === -1) {
          bot.sendMessage(chatId, "❗ Сервер не найден.");
        } else {
          const name = servers[index].name;
          servers.splice(index, 1);
          saveData(data);
          bot.sendMessage(chatId, `❗ Сервер "${name}" удалён.`);
        }
        delete userState[chatId];
        return showUserServersMenu(chatId);
      }
    }
  }

  // Команды через кнопки
  const command = getCommandFromText(text);
  switch (command) {
  //  case COMMANDS.ADD:
   //   userState[chatId] = { action: 'add' };
  //    return bot.sendMessage(chatId, "Введите название и адрес сервера через запятую:\nℹ️ Пример: `MyServer, 1.2.3.4`");

  //  case COMMANDS.EDIT:
  //    userState[chatId] = { action: 'edit_step_1' };
  //    return bot.sendMessage(chatId, "Введите имя сервера, который хотите изменить:");

  //  case COMMANDS.DELETE:
   //   userState[chatId] = { action: 'delete' };
  //    return bot.sendMessage(chatId, "Введите имя сервера, который хотите удалить:");
  
    case COMMANDS.HELP:
     userState[chatId] = { action: 'help' };
      return bot.sendMessage(chatId, `Бот для отслеживания доступности web-серверов. Используйте команды в Меню бота. Проверка осуществляется каждую 1 минуту. Задержка получения сообщения о неактивности (в секундах) настраивается при добавлении сервера третьим параметром, через запятую после адреса сервера (если не указано -  ${timeoutDefault} секунд)`); 
  }

  // Команды вручную
  if (text === '/start') return showUserServersMenu(chatId);

  if (text === '/add') {
    userState[chatId] = { action: 'add' };
    return bot.sendMessage(chatId, "Введите название и адрес сервера через запятую (третий необязательный параметр - таймаут оповещения в секундах, по умолчанию 300):\nℹ️Пример: `MyServer, www.myserver.com, 600`");
  }

  if (text === '/edit') {
    userState[chatId] = { action: 'edit_step_1' };
    return bot.sendMessage(chatId, "Введите имя сервера, который хотите изменить:");
  }

  if (text === '/delete') {
    userState[chatId] = { action: 'delete' };
    return bot.sendMessage(chatId, "Введите имя сервера, который хотите удалить:");
  }

  // Проверка на имя сервера
  const server = servers.find(s => s.name === text);
  if (server) {
    return bot.sendMessage(chatId, `ℹ️ Сервер: ${server.name}\nℹ ️IP: ${server.address}\nℹ  Таймаут ${server.timeout} сек.`);
  }

  // Неизвестная команда
  bot.sendMessage(chatId, "❓ Неизвестная команда. Используйте /start");
});



export {bot};

