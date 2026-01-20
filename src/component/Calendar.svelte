<script lang="ts">
  import FullCalendar from 'svelte-fullcalendar'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import listPlugin from '@fullcalendar/list'
  import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
  import type {
    Calendar,
    CalendarOptions,
    DatesSetArg,
    EventApi,
    EventChangeArg,
    EventClickArg,
    DateSelectArg,
    EventInput,
  } from '@fullcalendar/core'

  import {
    calendarEvents,
    colorOptions,
    createId,
    defaultColor,
    type CalendarEvent,
  } from '../store/calendar'

  // FullCalendar styles are not exported by the installed packages; keep styling local in this component.

  // Типізація ref (у wrapper є getAPI())
  let calendarRef: { getAPI: () => Calendar } | null = null

  let title = ''
  let activeView: string = 'dayGridMonth'

  let isModalOpen = false
  let editingId: string | null = null
  let formError = ''

  let formTitle = ''
  let formDate = ''
  let formStartTime = ''
  let formEndTime = ''
  let formColor = defaultColor

  const viewButtons = [
    { id: 'dayGridMonth', label: 'Month' },
    { id: 'timeGridWeek', label: 'Week' },
    { id: 'timeGridDay', label: 'Day' },
    { id: 'listWeek', label: 'Agenda' },
  ] as const

  const pad = (v: number) => v.toString().padStart(2, '0')
  const formatDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const formatTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 60 * 60 * 1000)

  const closeModal = () => {
    isModalOpen = false
    formError = ''
    calendarRef?.getAPI().unselect()
  }

  const openCreateModal = (start: Date, end?: Date) => {
    const base = new Date(start)

    // якщо клік по дню (00:00) — ставимо дефолт 09:00
    if (base.getHours() === 0 && base.getMinutes() === 0) base.setHours(9, 0, 0, 0)

    // select у month може давати end = наступний день 00:00 — це не “подія на 24 години”
    const isAllDayRange =
      end &&
      end.getHours() === 0 &&
      end.getMinutes() === 0 &&
      base.getHours() === 9 &&
      base.getMinutes() === 0

    const computedEnd =
      end && end > base && !isAllDayRange ? new Date(end) : addHours(base, 1)

    formTitle = ''
    formDate = formatDateInput(base)
    formStartTime = formatTimeInput(base)
    formEndTime = formatTimeInput(computedEnd)
    formColor = defaultColor
    editingId = null
    formError = ''
    isModalOpen = true
  }

  const openEditModal = (event: EventApi) => {
    const start = event.start ? new Date(event.start) : new Date()
    const end = event.end ? new Date(event.end) : addHours(start, 1)

    formTitle = event.title ?? ''
    formDate = formatDateInput(start)
    formStartTime = formatTimeInput(start)
    formEndTime = formatTimeInput(end)
    formColor = event.backgroundColor || event.borderColor || defaultColor

    editingId = event.id ?? null
    formError = ''
    isModalOpen = true
  }

  const buildEventPayload = () => {
    const startDate = new Date(`${formDate}T${formStartTime}`)
    if (Number.isNaN(startDate.getTime())) return null

    let endDate = formEndTime ? new Date(`${formDate}T${formEndTime}`) : addHours(startDate, 1)
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) endDate = addHours(startDate, 1)

    const start = `${formatDateInput(startDate)}T${formatTimeInput(startDate)}`
    const end = `${formatDateInput(endDate)}T${formatTimeInput(endDate)}`
    return { start, end }
  }

  const handleSave = () => {
    const titleValue = formTitle.trim().slice(0, 30)
    if (!titleValue) {
      formError = 'Title is required.'
      return
    }

    const payload = buildEventPayload()
    if (!payload) {
      formError = 'Enter valid date and time.'
      return
    }

    if (editingId) {
      calendarEvents.update((items) =>
        items.map((e) =>
          e.id === editingId
            ? { ...e, title: titleValue, start: payload.start, end: payload.end, color: formColor }
            : e,
        ),
      )
    } else {
      const newEvent: CalendarEvent = {
        id: createId(),
        title: titleValue,
        start: payload.start,
        end: payload.end,
        color: formColor,
      }
      calendarEvents.update((items) => [...items, newEvent])
    }

    closeModal()
  }

  const handleDelete = () => {
    if (!editingId) return
    calendarEvents.update((items) => items.filter((e) => e.id !== editingId))
    closeModal()
  }

  const syncEventFromApi = (event: EventApi) => {
    if (!event.id) return

    const start = event.start
      ? `${formatDateInput(new Date(event.start))}T${formatTimeInput(new Date(event.start))}`
      : ''
    const end = event.end
      ? `${formatDateInput(new Date(event.end))}T${formatTimeInput(new Date(event.end))}`
      : undefined

    calendarEvents.update((items) =>
      items.map((item) =>
        item.id === event.id
          ? {
              ...item,
              title: event.title ?? item.title,
              start: start || item.start,
              end: end || item.end,
              color: event.backgroundColor || event.borderColor || item.color,
            }
          : item,
      ),
    )
  }

  const handleToday = () => calendarRef?.getAPI().today()
  const handlePrev = () => calendarRef?.getAPI().prev()
  const handleNext = () => calendarRef?.getAPI().next()
  const handleViewChange = (view: string) => calendarRef?.getAPI().changeView(view)

  // Мапимо store -> EventInput (FullCalendar)
  $: fcEvents = ($calendarEvents ?? []).map<EventInput>((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color,
    borderColor: e.color,
  }))

  let options: CalendarOptions

  $: options = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    selectMirror: true,
    nowIndicator: true,
    eventDisplay: 'block',
    eventOrder: 'start,title',
    slotEventOverlap: true,
    eventMaxStack: 3,
    dayMaxEventRows: 3,
    headerToolbar: false,
    height: 'auto',

    events: fcEvents, // стабільно віддає актуальний список

    datesSet(arg: DatesSetArg) {
      title = arg.view.title
      activeView = arg.view.type
    },

    dateClick(arg: DateClickArg) {
      openCreateModal(arg.date)
    },

    select(arg: DateSelectArg) {
      openCreateModal(arg.start, arg.end)
    },

    eventClick(arg: EventClickArg) {
      openEditModal(arg.event)
    },

    eventChange(arg: EventChangeArg) {
      syncEventFromApi(arg.event)
    },
  }

  $: isEditing = editingId !== null
</script>

<section class="app-card">
  <div class="mb-2 app-section-title">Calendar View</div>

  <div class="grid items-center gap-3 pb-3 lg:grid-cols-[1fr_auto_1fr]">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-slate-100"
        on:click={handleToday}
      >
        Today
      </button>

      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        on:click={handlePrev}
      >
        Back
      </button>

      <button
        type="button"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        on:click={handleNext}
      >
        Next
      </button>
    </div>

    <div class="text-center text-sm font-semibold text-slate-600 lg:text-center">
      {title}
    </div>

    <div class="flex flex-wrap justify-start gap-2 lg:justify-end">
      {#each viewButtons as btn (btn.id)}
        <button
          type="button"
          class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition
                 {activeView === btn.id
                   ? 'border-blue-600 bg-blue-600 text-white'
                   : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}"
          on:click={() => handleViewChange(btn.id)}
        >
          {btn.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="app-card-muted p-2">
    <FullCalendar bind:this={calendarRef} {options} />
  </div>
</section>

{#if isModalOpen}
  <div class="fixed inset-0 z-50 grid place-items-center bg-slate-900/20 p-4" on:click|self={closeModal}>
    <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold">{isEditing ? 'Edit event' : 'Add event'}</h3>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-lg leading-none hover:bg-slate-200"
          aria-label="Close"
          on:click={closeModal}
        >
          <span class="rotate-45">+</span>
        </button>
      </div>

      <div class="grid gap-3">
        <label class="grid gap-1 text-xs font-medium text-slate-600">
          <span>Event name</span>
          <input
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            bind:value={formTitle}
            maxlength="30"
            type="text"
            placeholder="Event name"
          />
        </label>

        <label class="grid gap-1 text-xs font-medium text-slate-600">
          <span>Date</span>
          <input
            class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            bind:value={formDate}
            type="date"
          />
        </label>

        <div class="grid grid-cols-2 gap-2">
          <label class="grid gap-1 text-xs font-medium text-slate-600">
            <span>Start time</span>
            <input
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
              bind:value={formStartTime}
              type="time"
            />
          </label>

          <label class="grid gap-1 text-xs font-medium text-slate-600">
            <span>End time</span>
            <input
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
              bind:value={formEndTime}
              type="time"
            />
          </label>
        </div>

        <div class="grid gap-2 text-xs font-medium text-slate-600">
          <span>Color</span>
          <div class="flex gap-2">
            {#each colorOptions as color}
              <button
                type="button"
                class="h-6 w-6 rounded-full ring-2 transition
                       {formColor === color ? 'ring-slate-800' : 'ring-transparent hover:ring-slate-300'}"
                style={`background-color: ${color}`}
                aria-label="Pick color"
                on:click={() => (formColor = color)}
              />
            {/each}
          </div>
        </div>

        {#if formError}
          <p class="text-xs font-semibold text-red-500">{formError}</p>
        {/if}
      </div>

      <div class="mt-4 flex items-center justify-between">
        <button
          type="button"
          class="text-sm font-semibold text-red-500 hover:text-red-600"
          on:click={() => (isEditing ? handleDelete() : closeModal())}
        >
          {isEditing ? 'Delete' : 'Cancel'}
        </button>

        <button
          type="button"
          class="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          on:click={handleSave}
        >
          {isEditing ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Мінімальні глобальні правки FullCalendar (Tailwind не може напряму стилізувати внутрішні fc-* класи без плагінів) */
  :global(.fc) {
    --fc-border-color: #e2e8f0;          /* slate-200 */
    --fc-today-bg-color: rgba(59, 130, 246, 0.10); /* blue-500/10 */
    font-size: 12px;
  }

  :global(.fc .fc-col-header-cell) {
    background: #f8fafc; /* slate-50 */
    font-size: 11px;
    text-transform: uppercase;
  }

  :global(.fc .fc-daygrid-event .fc-event-time) {
    display: none;
  }

  :global(.fc .fc-event) {
    border-radius: 8px;
  }
</style>
