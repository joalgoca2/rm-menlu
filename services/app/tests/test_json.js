const es = require("../src/locales/es.json");
const en = require("../src/locales/en.json");
const pt = require("../src/locales/pt.json");

console.log("ES landing keys count:", Object.keys(es.landing || {}).length);
console.log("EN landing keys count:", Object.keys(en.landing || {}).length);
console.log("PT landing keys count:", Object.keys(pt.landing || {}).length);
