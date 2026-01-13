const { app, BrowserWindow, Menu, Tray } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

let win;
let tray;

const Width = 1200;
const Height = 800;
const iconPath = path.join(__dirname, "..", "assets", "icon.ico");

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
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
