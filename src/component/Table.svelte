<script lang="ts">
  import type { Readable } from "svelte/store";
  import { readable } from "svelte/store";
  import type { Data } from "../store/data";
  import Button from "../ui/Button.svelte";

  export let rowsStore: Readable<Data[]> = readable([]);
  export let showAddRow = false;
  export let isAddingCheck = false;
  export let draft: Pick<Data, "name" | "position" | "salary" | "currentPosition"> | null = null;
  export let canSave = false;
  export let onSave: (() => void) | null = null;
  export let onRemove: ((id: number) => void) | null = null;
  export let onUpdate: ((id: number, next: Omit<Data, "id">) => void) | null = null;
  export let onEditStart: (() => void) | null = null;
  export let onAddCancel: (() => void) | null = null;

  $: rows = $rowsStore;
  $: columnClass = showAddRow ? "grid-cols-6" : "grid-cols-5";

  let editId: number | null = null;
  let editDraft: Pick<Data, "name" | "position" | "salary" | "currentPosition"> | null = null;

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100";

  const updateDraft = () => {
    if (!draft) return;
    draft = { ...draft };
  };

  const updateEditDraft = () => {
    if (!editDraft) return;
    editDraft = { ...editDraft };
  };

  const isFilled = (value: string) => value.trim().length > 0;

  $: canEditSave =
    !!editDraft &&
    isFilled(editDraft.name) &&
    isFilled(editDraft.position) &&
    isFilled(editDraft.salary) &&
    isFilled(editDraft.currentPosition);

  const startEdit = (item: Data) => {
    onEditStart && onEditStart();
    editId = item.id;
    editDraft = {
      name: item.name,
      position: item.position,
      salary: item.salary,
      currentPosition: item.currentPosition
    };
  };

  const resetEdit = () => {
    editId = null;
    editDraft = null;
  };

  const saveEdit = () => {
    if (editId === null || !editDraft || !canEditSave) return;
    onUpdate &&
      onUpdate(editId, {
        name: editDraft.name.trim(),
        position: editDraft.position.trim(),
        salary: editDraft.salary.trim(),
        currentPosition: editDraft.currentPosition.trim()
      });
    resetEdit();
  };

  const removeEdit = (id: number) => {
    onRemove && onRemove(id);
    if (editId === id) resetEdit();
  };

  const shouldIgnoreOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    return !!target.closest("[data-edit-row]") || !!target.closest("[data-edit-toggle]");
  };

  const handleWindowClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (editId !== null && !shouldIgnoreOutsideClick(event)) {
      resetEdit();
    }

    if (showAddRow && !target.closest("[data-table-root]") && !target.closest("[data-add-button]")) {
      onAddCancel && onAddCancel();
    }
  };

  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (editId !== null) resetEdit();
    if (showAddRow) onAddCancel && onAddCancel();
  };
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<div class="w-full rounded-lg border border-slate-200 bg-white shadow-sm" data-table-root>
  <div class={`grid ${columnClass} gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700`}>
    <div>Company name</div>
    <div>position</div>
    <div>salary</div>
    <div>Current position</div>
    <div class="text-right">Actions</div>
    {#if showAddRow}
      <div class="text-right">Save</div>
    {/if}
  </div>

  {#if showAddRow && draft}
    <div class={`grid ${columnClass} gap-2 px-4 py-3 text-sm`}>
      <input
        class={inputClass}
        placeholder="Company name"
        bind:value={draft.name}
        on:input={updateDraft}
      />
      <input
        class={inputClass}
        placeholder="Position"
        bind:value={draft.position}
        on:input={updateDraft}
      />
      <input
        class={inputClass}
        placeholder="Salary"
        bind:value={draft.salary}
        on:input={updateDraft}
      />
      <input
        class={inputClass}
        placeholder="Current position"
        bind:value={draft.currentPosition}
        on:input={updateDraft}
      />
      <div></div>
      <div class="flex items-center justify-end">
        <Button disabled={!canSave} on:click={() => onSave && onSave()}>Save</Button>
      </div>
    </div>
  {/if}

  {#if rows.length === 0 && !isAddingCheck}
    <div class="px-4 py-3 text-sm text-slate-500">No data yet</div>
  {:else}
    <div class="divide-y divide-slate-100">
      {#each rows as item (item.id)}
        <div
          class={`grid ${columnClass} gap-2 px-4 py-2 text-sm text-slate-800`}
          data-edit-row={editId === item.id ? "true" : undefined}
        >
          {#if editId === item.id && editDraft}
            <input
              class={inputClass}
              placeholder="Company name"
              bind:value={editDraft.name}
              on:input={updateEditDraft}
            />
            <input
              class={inputClass}
              placeholder="Position"
              bind:value={editDraft.position}
              on:input={updateEditDraft}
            />
            <input
              class={inputClass}
              placeholder="Salary"
              bind:value={editDraft.salary}
              on:input={updateEditDraft}
            />
            <input
              class={inputClass}
              placeholder="Current position"
              bind:value={editDraft.currentPosition}
              on:input={updateEditDraft}
            />
            <div class="flex justify-end gap-2">
              <Button disabled={!canEditSave} on:click={saveEdit}>Save changes</Button>
              <Button variant="danger" on:click={() => removeEdit(item.id)}>Delete</Button>
            </div>
          {:else}
            <div class="truncate">{item.name}</div>
            <div class="truncate">{item.position}</div>
            <div>{item.salary}</div>
            <div class="truncate">{item.currentPosition}</div>
            <div class="flex justify-end">
              <Button
                variant="danger"
                disabled={editId !== null}
                on:click={() => startEdit(item)}
                data-edit-toggle
              >
                Change
              </Button>
            </div>
          {/if}
          {#if showAddRow}
            <div></div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
