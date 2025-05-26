// import {db} from './db.js'
//  *****************************************************

const dateTimeToLocale = (date) => {
  const options = {
    year:   "numeric",
    month:  "numeric",
    day:    "numeric",
    hour:   "numeric",
    minute: "numeric",
    second: "numeric",
  };
  //return date.format("DD.MM.YYYY HH:mm:ss")
  return date.toLocaleDateString("ru-RU", options);
};

const ipFromString = (str) => {
  const mas = str.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  return mas.length ? mas[0] : ''
}

export { dateTimeToLocale, ipFromString};
