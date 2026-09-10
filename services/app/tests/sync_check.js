/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const es = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/es.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/en.json"), "utf8"));
const pt = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/locales/pt.json"), "utf8"));

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}

const esKeys = getAllKeys(es);
const enKeys = new Set(getAllKeys(en));
const ptKeys = new Set(getAllKeys(pt));

const missingInEn = esKeys.filter((k) => !enKeys.has(k));
const missingInPt = esKeys.filter((k) => !ptKeys.has(k));

console.log("Missing in EN:", missingInEn);
console.log("Missing in PT:", missingInPt);
