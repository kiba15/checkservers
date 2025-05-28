import('./check.js')
  .then((module) => {
    // запускаем, если нужно, что-то явно
    console.log('ES-модуль check.js успешно загружен через обёртку.');
  })
  .catch((err) => {
    console.error('Ошибка при загрузке ES-модуля:', err);
  });