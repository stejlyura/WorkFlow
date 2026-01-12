<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let disabled = false;
  export let type: "button" | "submit" | "reset" = "button";
  export let variant: "success" | "danger" | "neutral" | "ghost" = "success";
  export let className: string = "";

  const dispatch = createEventDispatcher();
  let restClass = "";
  let restProps: Record<string, unknown> = {};

  const base =
    "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    success: "border-green-700 bg-green-600 text-white hover:bg-green-700 focus:ring-green-100",
    danger: "border-red-600 bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
    neutral: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-100",
    ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-100"
  } as const;

  $: ({ class: restClass = "", ...restProps } = $$restProps);
  $: classes = `${base} ${variants[variant]} ${className} ${restClass}`.trim();
</script>

<button
  {...restProps}
  type={type}
  class={classes}
  disabled={disabled}
  on:click={(event) => dispatch("click", event)}
>
  <slot/>
</button>
