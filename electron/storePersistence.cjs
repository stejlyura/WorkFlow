const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function getSavePath() {
  const dir = path.join(app.getPath("documents"), "MyElectronApp"); // папка в Документах
  const file = path.join(dir, "store.json");
  return { dir, file };
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function atomicWriteJson(filePath, dataObj) {
  const tmpPath = filePath + ".tmp";
  const json = JSON.stringify(dataObj, null, 2);

  await fs.promises.writeFile(tmpPath, json, "utf-8");
  await fs.promises.rename(tmpPath, filePath); // атомарная замена
}

function setupStorePersistence() {
  let lastData = null;
  let timer = null;

  ipcMain.on("store:save", async (_event, data) => {
    lastData = data;

    // debounce: если стор часто меняется — пишем не чаще чем раз в 500мс
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const { dir, file } = getSavePath();
        await ensureDir(dir);
        await atomicWriteJson(file, lastData);
      } catch (e) {
        console.error("Failed to save store:", e);
      }
    }, 500);
  });

  ipcMain.handle("store:load", async () => {
    try {
      const { dir, file } = getSavePath();
      await ensureDir(dir);

      if (!fs.existsSync(file)) return null;

      const raw = await fs.promises.readFile(file, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load store:", e);
      return null;
    }
  });
}

module.exports = { setupStorePersistence };
