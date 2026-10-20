import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("ios/App/App/capacitor.config.json");
const config = JSON.parse(readFileSync(path, "utf8"));
const list = Array.isArray(config.packageClassList) ? config.packageClassList : [];
let changed = false;
for (const name of ["GemeloIapPlugin", "GemeloVideoPlugin"]) {
  if (!list.includes(name)) {
    list.push(name);
    changed = true;
    console.log(`${name} ajouté à packageClassList`);
  } else {
    console.log(`${name} déjà présent dans packageClassList`);
  }
}
if (changed) {
  config.packageClassList = list;
  writeFileSync(path, `${JSON.stringify(config, null, "\t")}\n`);
}
