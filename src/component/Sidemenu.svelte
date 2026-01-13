<script lang="ts">
    type MenuTypes = {
        id: number,
        name: string,
        link: string
    }
    const Menu: MenuTypes[] = [
        {id: 1, name: 'Home', link: '#'},
        {id: 2, name: 'Resumes', link: '#'},
        {id: 3, name: 'Calandar', link: '#'},
    ]
</script>


<aside class="w-full bg-slate-900 text-white shadow-sm">
        {#each Menu as item (item.id)}
            <div>
                <div>{item.name}</div>
            </div>
        {/each}
</aside>