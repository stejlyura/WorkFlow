<script lang="ts">
    const type: MenuTypes = {
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

<aside>
    {#each Menu as item (item.id)}
        <div>
            <div>{name}</div>
        </div>
    {/each}
</aside>