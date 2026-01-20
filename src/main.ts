import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { dataStore } from "./store/data";
import { calendarEvents } from "./store/calendar";
import { get } from "svelte/store";

async function initDesktopPersistence() {
  if (!window.desktop) return;

  const saved = await window.desktop.loadStore();
  if (saved) {
    if (Array.isArray(saved)) {
      dataStore.set(saved);
    } else {
      if (Array.isArray(saved.data)) {
        dataStore.set(saved.data);
      }
      if (Array.isArray(saved.calendar)) {
        calendarEvents.set(saved.calendar);
      }
    }
  }

  let currentData = get(dataStore);
  let currentCalendar = get(calendarEvents);

  const persist = () => {
    window.desktop?.saveStore({
      data: currentData,
      calendar: currentCalendar,
    });
  };

  dataStore.subscribe((value) => {
    currentData = value;
    persist();
  });

  calendarEvents.subscribe((value) => {
    currentCalendar = value;
    persist();
  });

  persist();
}

initDesktopPersistence();

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
