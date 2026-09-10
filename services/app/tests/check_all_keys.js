/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const es = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/es.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/en.json"), "utf8"));
const pt = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/pt.json"), "utf8"));

function getKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}

const esList = getKeys(es);
const enList = getKeys(en);
const ptList = getKeys(pt);

const enSet = new Set(enList);
const ptSet = new Set(ptList);
const esSet = new Set(esList);

const missingInEN = esList.filter(k => !enSet.has(k));
const missingInPT = esList.filter(k => !ptSet.has(k));
const extraInEN = enList.filter(k => !esSet.has(k));
const extraInPT = ptList.filter(k => !esSet.has(k));

console.log("ES total keys:", esList.length);
console.log("EN total keys:", enList.length);
console.log("PT total keys:", ptList.length);
console.log("Keys in ES missing in EN:", missingInEN);
console.log("Keys in ES missing in PT:", missingInPT);
console.log("Keys in EN extra:", extraInEN);
console.log("Keys in PT extra:", extraInPT);
