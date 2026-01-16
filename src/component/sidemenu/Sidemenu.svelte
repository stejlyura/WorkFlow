<script lang="ts">
    import calendar from './assets/calendar.svg'
    import home from './assets/home.svg'
    import cv from './assets/cv.svg'
    import Calendar from '../Calendar.svelte';
    import TableContainer from '../TableContainer.svelte';
    import MainContainer from '../MainContainer.svelte';
    import { setWindow } from '../../store/window';
    
    type MenuTypes = {
        id: number,
        name: string,
        img: string,
        link: string,
        element: any,
    }
    const Menu: MenuTypes[] = [
        {id: 1, name: 'Home', img: home, link: '#', element: MainContainer},
        {id: 2, name: 'Resumes', img: cv, link: '#', element:TableContainer },
        {id: 3, name: 'Calandar', img: calendar, link: '#', element: Calendar},
    ]
</script>


<aside class="bg-slate-900 text-white shadow-sm w-15 shrink-0 flex justify-center items-center flex-col">
        {#each Menu as item (item.id)}
            <div class="border-white border-2 rounded-2xl p-1">
                <img
                    class="brightness-0 invert w-8 hover:cursor-pointer"
                    src={item.img}
                    alt=""
                    on:click={() => setWindow(item.element)}
                >
            </div>
        {/each}
</aside>
