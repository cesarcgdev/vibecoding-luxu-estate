const fs = require("fs");
const files = ["data/dictionaries/en.json", "data/dictionaries/es.json", "data/dictionaries/fr.json"];
files.forEach(f => {
  let content = fs.readFileSync(f, "utf-8");
  let count = 0;
  content = content.replace(/"filters":\s*\{/g, match => {
    count++;
    if (count === 1) return "\"filters_1\": {";
    if (count === 2) return "\"filters_2\": {";
    return match;
  });
  const obj = JSON.parse(content);
  obj.filters = { ...obj.filters_1, ...obj.filters_2 };
  delete obj.filters_1;
  delete obj.filters_2;
  fs.writeFileSync(f, JSON.stringify(obj, null, 2));
});
