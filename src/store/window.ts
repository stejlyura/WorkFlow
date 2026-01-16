import { writable } from "svelte/store";
import type { ComponentType } from "svelte";
import MainContainer from "../component/MainContainer.svelte";

export const windowStore = writable<ComponentType>(MainContainer);

export const setWindow = (component: ComponentType) => {
  windowStore.set(component);
};
