const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL, fileURLToPath } = require("url");
const { setupStorePersistence } = require("./storePersistence.cjs");

const isDev = !app.isPackaged;

let win;
let tray;

const Width = 1200;
const Height = 800;
const iconPath = path.join(__dirname, "..", "assets", "icon.ico");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"]);

async function collectMediaFiles(rootDir) {
  const items = [];
  let id = 1;

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      const isImage = IMAGE_EXTS.has(ext);
      const isVideo = VIDEO_EXTS.has(ext);

      if (!isImage && !isVideo) continue;

      const folderName = path.basename(path.dirname(fullPath));
      const normalized = fullPath.replace(/\\/g, "/");
      const fileUrl = `media://localhost/${encodeURI(normalized)}`;

      items.push({
        id: id++,
        filePath: fullPath,
        fileUrl,
        folderName,
        fileName: entry.name,
        type: isImage ? "image" : "video",
      });
    }
  }

  await walk(rootDir);
  return items;
}

function createWindow() {
  win = new BrowserWindow({
    width: Width,
    height: Height,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  tray = new Tray(iconPath);
  tray.setToolTip(app.getName());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("media", (request, callback) => {
    try {
      const mediaUrl = new URL(request.url);
      const filePath = fileURLToPath(`file://${mediaUrl.pathname}`);
      callback({ path: filePath });
    } catch (error) {
      console.error("Failed to resolve media url:", request.url, error);
      callback({ error: -6 });
    }
  });

  setupStorePersistence();
  createWindow();
  createTray();

  ipcMain.handle("media:pickDirectory", async () => {
    const targetWindow = BrowserWindow.getFocusedWindow() ?? win;
    const result = await dialog.showOpenDialog(targetWindow, {
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { directoryPath: null, items: [] };
    }

    const directoryPath = result.filePaths[0];
    try {
      const items = await collectMediaFiles(directoryPath);
      return { directoryPath, items };
    } catch (error) {
      console.error("Failed to scan directory:", error);
      return { directoryPath, items: [] };
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
