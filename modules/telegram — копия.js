import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.TG_TOKEN

console.log('starting bot...')
//let bot = new TelegramBot(token, { polling: false });




//const TelegramBot = require("node-telegram-bot-api");
import fs from "fs";
import path from "path";

// ������ Замените на свой токен
const bot = new TelegramBot(token, { polling: true });

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Эмуляция __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ������ Загрузка данных
function loadData() {
  const DATA_FILE = path.join(__dirname, 'user_servers.json');

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// ������ Сохранение данных
function saveData(data) {
  const DATA_FILE = path.join(__dirname, 'user_servers.json');
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ������ Главное меню пользователя
function showUserServersMenu(chatId) {
  const data = loadData();
  const servers = data[chatId] || [];

  const buttons = servers.map(server => [{ text: server.name }]);

  // Команды
  buttons.push(
    [{ text: "✅ Добавить адрес сервера" }],
    [{ text: "✏️ Изменить адрес сервера" }],
    [{ text: "❌ Удалить адрес сервера" }]
  );

  bot.sendMessage(chatId, "Выберите сервер или действие:", {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
}


const userState = {}; // { [chatId]: { action: 'add' | 'edit' | 'delete', contextData } }

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  const data = loadData();
  if (!data[chatId]) data[chatId] = [];

  const state = userState[chatId];

  // ������ Обрабатываем состояния
  if (state) {
    if (state.action === 'add') {
      const [name, address] = text.split(",").map(s => s.trim());
      if (name && address) {
        data[chatId].push({ name, address });
        saveData(data);
        bot.sendMessage(chatId, `✅ Сервер "${name}" добавлен!`);
      } else {
        bot.sendMessage(chatId, "❗ Неверный формат. Пример: MyServer, 1.2.3.4");
      }
      delete userState[chatId];
      return showUserServersMenu(chatId);
    }

    if (state.action === 'edit_step_1') {
      const server = data[chatId].find(s => s.name === text);
      if (!server) {
        bot.sendMessage(chatId, "❗ Сервер не найден.");
        delete userState[chatId];
        return;
      }
      userState[chatId] = { action: 'edit_step_2', server };
      return bot.sendMessage(chatId, `Введите новый адрес для сервера "${server.name}":`);
    }

    if (state.action === 'edit_step_2') {
      const server = state.server;
      server.address = text;
      saveData(data);
      bot.sendMessage(chatId, `������ Адрес сервера "${server.name}" обновлён!`);
      delete userState[chatId];
      return showUserServersMenu(chatId);
    }

    if (state.action === 'delete') {
      const index = data[chatId].findIndex(s => s.name === text);
      if (index === -1) {
        bot.sendMessage(chatId, "❗ Сервер не найден.");
      } else {
        const name = data[chatId][index].name;
        data[chatId].splice(index, 1);
        saveData(data);
        bot.sendMessage(chatId, `❌ Сервер "${name}" удалён.`);
      }
      delete userState[chatId];
      return showUserServersMenu(chatId);
    }
  }

  // ������ Основные команды
  switch (text) {
    case "/start":
      return showUserServersMenu(chatId);

    case "✅ Добавить адрес сервера":
      userState[chatId] = { action: "add" };
      return bot.sendMessage(chatId, "Введите название и адрес сервера через запятую:\nПример: MyServer, 1.2.3.4");

    case "✏️ Изменить адрес сервера":
      userState[chatId] = { action: "edit_step_1" };
      return bot.sendMessage(chatId, "Введите имя сервера, который хотите изменить:");

    case "❌ Удалить адрес сервера":
      userState[chatId] = { action: "delete" };
      return bot.sendMessage(chatId, "Введите имя сервера, который хотите удалить:");

    default:
      const server = (data[chatId] || []).find(s => s.name === text);
      if (server) {
        return bot.sendMessage(chatId, `Сервер: ${server.name}\n������ Адрес: ${server.address}`);
      } else {
        return bot.sendMessage(chatId, `Неизвестная команда ${text}. Используйте /start`);
      }
  }
});


export {bot};

