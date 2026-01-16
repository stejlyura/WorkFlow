<script lang="ts">
    import Header from "../component/Header.svelte";
    import Sidemenu from "../component/sidemenu/Sidemenu.svelte";
    import { windowStore } from "../store/window";
</script>

<div class="flex min-h-screen flex-col">
    <main class="flex w-full flex-1">
        <Sidemenu />
        <div class="min-w-0 flex-1">
            <svelte:component this={$windowStore} />
        </div>
    </main>
</div>
