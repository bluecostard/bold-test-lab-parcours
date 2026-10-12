import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("ios/App/App/capacitor.config.json");
const config = JSON.parse(readFileSync(path, "utf8"));
const list = Array.isArray(config.packageClassList) ? config.packageClassList : [];
if (!list.includes("GemeloIapPlugin")) {
  list.push("GemeloIapPlugin");
  config.packageClassList = list;
  writeFileSync(path, `${JSON.stringify(config, null, "\t")}\n`);
  console.log("GemeloIapPlugin ajouté à packageClassList");
} else {
  console.log("GemeloIapPlugin déjà présent dans packageClassList");
}
