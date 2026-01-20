<script lang="ts">
    import calendar from './assets/calendar.svg'
    import englishIcon from '../../../assets/english.png'
    import home from './assets/home.svg'
    import cv from './assets/cv.svg'
    import Calendar from '../Calendar.svelte';
    import TableContainer from '../TableContainer.svelte';
    import MainContainer from '../MainContainer.svelte';
    import English from '../englishLearn/Eglish.svelte';
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
        {id: 4, name: 'English', img: englishIcon, link: '#', element: English},
    ]
</script>


<aside class="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-200 bg-white py-4 shadow-sm">
        {#each Menu as item (item.id)}
            <button
                type="button"
                class="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:bg-slate-100"
                on:click={() => setWindow(item.element)}
                aria-label={item.name}
            >
                <img
                    class="h-6 w-6 brightness-0 opacity-80"
                    src={item.img}
                    alt=""
                >
            </button>
        {/each}
</aside>
