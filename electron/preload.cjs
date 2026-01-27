const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  saveStore: (data) => ipcRenderer.send("store:save", data),
  loadStore: () => ipcRenderer.invoke("store:load"),
  pickDirectory: () => ipcRenderer.invoke("media:pickDirectory"),
});
