<script lang="ts">
    import type { Data } from "../store/data";
    import { dataStore } from "../store/data";
    import Button from "../ui/Button.svelte";

    export let delement: Data[] | null = null;

    $: rows = delement ?? $dataStore;
</script>

<div class="w-full">
    <div class="grid grid-cols-5 gap-2 font-semibold">
        <div>Company name</div>
        <div>position</div>
        <div>salary</div>
        <div>Current position</div>
        <div class="text-right">Change</div>
    </div>

    {#if rows.length === 0}
        <div class="mt-2 text-sm text-slate-500">No data yet</div>
    {:else}
        {#each rows as item (item.id)}
            <div class="grid grid-cols-5 gap-2 py-1">
                <div>{item.name}</div>
                <div>{item.position}</div>
                <div>{item.salary}</div>
                <div>{item.currentPosition}</div>
                <div class="flex justify-end">
                    <Button>Change</Button>
                </div>
            </div>
        {/each}
    {/if}
</div>
