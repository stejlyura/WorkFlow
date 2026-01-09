import { writable } from "svelte/store"

export type Data = {
  id: number
  name: string
  position: string
  salary: string
  currentPosition: string
}

const initialData: Data[] = []

export const dataStore = writable<Data[]>(initialData)

export const setData = (next: Data[]) => dataStore.set(next)

export const addData = (item: Data) =>
  dataStore.update((items) => [...items, item])

export const removeDataById = (id: number) =>
  dataStore.update((items) => items.filter((item) => item.id !== id))

export const updateDataById = (id: number, next: Omit<Data, "id">) =>
  dataStore.update((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item)))

// usage (lowercase example):
// import { dataStore, addData } from "./store/data"
// $dataStore
// addData({ id: 1, name: "anna", position: "dev", salary: "1000", currentPosition: "lead" })
