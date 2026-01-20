<script lang="ts">
    let section: number = 1
</script>

<section class="app-card">
    <div class="mb-3">
        <div class="app-section-title">Language Lab</div>
        <div class="text-sm font-semibold text-slate-700">English</div>
    </div>

    <div class="flex items-center gap-3">
        <select bind:value={section} class="w-48">
            <option value={1}>Train</option>
            <option value={2}>Your words</option>
        </select>
    </div>
</section>
