<script lang="ts">
  import { writable, derived } from "svelte/store";
  import { dataStore, addData, removeDataById, updateDataById } from "../store/data";
  import type { Data } from "../store/data";

  import Table from "./Table.svelte";
  import Button from "../ui/Button.svelte";

  const search = writable("");
  const sortKey = writable<"name" | "position" | "salary" | "currentPosition">("name");
  const sortDir = writable<"asc" | "desc">("asc");

  let isAdding = false;
  let draft = {
    name: "",
    position: "",
    salary: "",
    currentPosition: ""
  };

  const resetDraft = () => {
    draft = { name: "", position: "", salary: "", currentPosition: "" };
  };

  let canSave = false;
  $: canSave =
    draft.name.trim().length > 0 &&
    draft.position.trim().length > 0 &&
    draft.salary.trim().length > 0 &&
    draft.currentPosition.trim().length > 0;

  const saveDraft = () => {
    if (!canSave) return;
    addData({
      id: Date.now(),
      name: draft.name.trim(),
      position: draft.position.trim(),
      salary: draft.salary.trim(),
      currentPosition: draft.currentPosition.trim()
    });
    resetDraft();
    isAdding = false;
  };

  const cancelAdd = () => {
    resetDraft();
    isAdding = false;
  };

  const removeRow = (id: number) => {
    removeDataById(id);
  };

  const updateRow = (id: number, next: Omit<Data, "id">) => {
    updateDataById(id, next);
  };

  const visibleRows = derived([dataStore, search, sortKey, sortDir], ([$data, $search, $key, $dir]) => {
    const q = $search.trim().toLowerCase();

    // 1) filter
    let rows = q
      ? $data.filter((x) =>
          `${x.name} ${x.position} ${x.salary} ${x.currentPosition}`.toLowerCase().includes(q)
        )
      : $data;

    // 2) sort (без мутації оригіналу)
    rows = rows.slice().sort((a, b) => {
      const dir = $dir === "asc" ? 1 : -1;

      const va = a[$key] as unknown;
      const vb = b[$key] as unknown;

      // salary як число (якщо раптом строка)
      if ($key === "salary") {
        const na = typeof va === "number" ? va : Number(String(va).replace(/[^\d.-]/g, ""));
        const nb = typeof vb === "number" ? vb : Number(String(vb).replace(/[^\d.-]/g, ""));
        return (na - nb) * dir;
      }

      // boolean сортуємо як 1/0
      if (typeof va === "boolean" && typeof vb === "boolean") {
        return ((va ? 1 : 0) - (vb ? 1 : 0)) * dir;
      }

      // строки/інше
      return String(va).localeCompare(String(vb)) * dir;
    });

    return rows;
  });
</script>

<div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between m-3">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <input
      class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 sm:w-64"
      placeholder="Search..."
      bind:value={$search}
    />

    <div>
      <select
        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 sm:w-48"
        bind:value={$sortKey}
      >
        <option value="name">name</option>
        <option value="position">position</option>
        <option value="salary">salary</option>
        <option value="currentPosition">currentPosition</option>
      </select>
    </div>
    
  </div>

  <button
    class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-100"
    on:click={() => sortDir.update((v) => (v === "asc" ? "desc" : "asc"))}
  >
    Sort: {$sortDir}
  </button>
  
</div>

<Table
  rowsStore={visibleRows}
  showAddRow={isAdding}
  isAddingCheck={isAdding}
  bind:draft
  canSave={canSave}
  onSave={saveDraft}
  onRemove={removeRow}
  onUpdate={updateRow}
  onEditStart={() => (isAdding = false)}
  onAddCancel={cancelAdd}
/>

<Button on:click={() => (isAdding = true)} class="m-3" data-add-button>Add new</Button>


