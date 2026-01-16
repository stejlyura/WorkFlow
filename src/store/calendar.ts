import { writable } from 'svelte/store'

export type CalendarEvent = {
  id: string
  title: string
  start: string // "YYYY-MM-DDTHH:mm"
  end?: string  // "YYYY-MM-DDTHH:mm"
  color: string
}

export const colorOptions = [
  '#3D7BFD',
  '#22C55E',
  '#F97316',
  '#A855F7',
  '#EF4444',
  '#14B8A6',
] as const

export const defaultColor = colorOptions[0]

export const createId = () =>
  (crypto?.randomUUID?.() ?? `evt_${Math.random().toString(16).slice(2)}_${Date.now()}`)

export const calendarEvents = writable<CalendarEvent[]>([
  // приклад:
  // { id: createId(), title: 'Demo', start: '2026-01-16T10:00', end: '2026-01-16T11:00', color: defaultColor }
])
