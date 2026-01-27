<script lang="ts">
  import { onMount } from "svelte";
  import Button from "../ui/Button.svelte";

  type MediaType = "image" | "video";
  type MediaItem = {
    id: number;
    filePath: string;
    fileUrl: string;
    folderName: string;
    fileName: string;
    type: MediaType;
  };

  type DirectoryPickResult = {
    directoryPath: string | null;
    items: MediaItem[];
  };

  declare global {
    interface Window {
      desktop?: {
        pickDirectory?: () => Promise<DirectoryPickResult>;
      };
    }
  }

  let isElectron = false;
  let isLoading = false;
  let directoryPath = "";
  let items: MediaItem[] = [];
  let selectedFolders: string[] = [];
  let showImages = false;
  let showVideos = false;
  let failedMediaIds: number[] = [];
  let failedFolderPreviews: string[] = [];
  let loadingMediaIds: number[] = [];
  let loadingFolderPreviews: string[] = [];

  onMount(() => {
    isElectron = typeof window !== "undefined" && !!window.desktop?.pickDirectory;
  });

  const resetFilters = () => {
    selectedFolders = [];
    showImages = false;
    showVideos = false;
  };

  const pickDirectory = async () => {
    if (!window?.desktop?.pickDirectory) return;
    isLoading = true;
    try {
      const result = await window.desktop.pickDirectory();
      if (!result?.directoryPath && (!result?.items || result.items.length === 0)) {
        return;
      }

      directoryPath = result.directoryPath ?? "";
      items = result.items ?? [];
      failedMediaIds = [];
      failedFolderPreviews = [];
      loadingMediaIds = items.map((item) => item.id);
      loadingFolderPreviews = Array.from(new Set(items.map((item) => item.folderName)));
      resetFilters();
    } finally {
      isLoading = false;
    }
  };

  const toggleFolder = (name: string) => {
    if (selectedFolders.includes(name)) {
      selectedFolders = selectedFolders.filter((folder) => folder !== name);
      return;
    }
    selectedFolders = [...selectedFolders, name];
  };

  const markMediaLoading = (id: number) => {
    if (!loadingMediaIds.includes(id)) {
      loadingMediaIds = [...loadingMediaIds, id];
    }
  };

  const markMediaLoaded = (id: number) => {
    if (loadingMediaIds.includes(id)) {
      loadingMediaIds = loadingMediaIds.filter((entry) => entry !== id);
    }
  };

  const markMediaFailed = (id: number) => {
    if (!failedMediaIds.includes(id)) {
      failedMediaIds = [...failedMediaIds, id];
    }
    markMediaLoaded(id);
  };

  const markFolderPreviewLoading = (name: string) => {
    if (!loadingFolderPreviews.includes(name)) {
      loadingFolderPreviews = [...loadingFolderPreviews, name];
    }
  };

  const markFolderPreviewLoaded = (name: string) => {
    if (loadingFolderPreviews.includes(name)) {
      loadingFolderPreviews = loadingFolderPreviews.filter((entry) => entry !== name);
    }
  };

  const markFolderPreviewFailed = (name: string) => {
    if (!failedFolderPreviews.includes(name)) {
      failedFolderPreviews = [...failedFolderPreviews, name];
    }
    markFolderPreviewLoaded(name);
  };

  $: folderOptions = (() => {
    const map = new Map<string, MediaItem>();
    for (const item of items) {
      if (!map.has(item.folderName)) {
        map.set(item.folderName, item);
      }
    }
    return Array.from(map.values())
      .map((item) => ({
        name: item.folderName,
        previewUrl: item.fileUrl,
        previewType: item.type,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  $: filteredItems = items.filter((item) => {
    const folderMatch =
      selectedFolders.length === 0 || selectedFolders.includes(item.folderName);
    const typeMatch =
      (!showImages && !showVideos) ||
      (showImages && item.type === "image") ||
      (showVideos && item.type === "video");
    return folderMatch && typeMatch;
  });
</script>

{#if isElectron}
  <div class="space-y-6">
    <div class="sticky top-3 z-20 -mx-6 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div class="mx-6 flex flex-col gap-4 py-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="app-section-title">Media Shelf</div>
            <div class="text-sm font-semibold text-slate-700">Folder cards</div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              class="w-64 text-xs sm:w-80"
              placeholder="c/data/document"
              value={directoryPath}
              readonly
            />
            <Button variant="neutral" on:click={pickDirectory} disabled={isLoading}>
              {isLoading ? "Scanning..." : "Add directory"}
            </Button>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Folders</span>
            {#if folderOptions.length === 0}
              <span class="text-slate-400">Add a directory to start</span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            {#each folderOptions as folder}
              <label
                class={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedFolders.includes(folder.name)
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  class="sr-only"
                  checked={selectedFolders.includes(folder.name)}
                  on:change={() => toggleFolder(folder.name)}
                />
                <span class="relative h-7 w-7 overflow-hidden rounded-full border border-white/40 bg-slate-100">
                  {#if failedFolderPreviews.includes(folder.name)}
                    <div class="flex h-full w-full items-center justify-center text-[9px] font-semibold text-slate-400">
                      no preview
                    </div>
                  {:else if folder.previewType === "image"}
                    <img
                      src={folder.previewUrl}
                      alt=""
                      class="h-full w-full object-cover"
                      on:error={() => markFolderPreviewFailed(folder.name)}
                      on:load={() => markFolderPreviewLoaded(folder.name)}
                    />
                  {:else}
                    <video
                      src={folder.previewUrl}
                      muted
                      playsinline
                      class="h-full w-full object-cover"
                      on:error={() => markFolderPreviewFailed(folder.name)}
                      on:loadeddata={() => markFolderPreviewLoaded(folder.name)}
                    ></video>
                  {/if}
                  {#if !failedFolderPreviews.includes(folder.name) && loadingFolderPreviews.includes(folder.name)}
                    <div class="absolute inset-0 grid place-items-center bg-white/60">
                      <span class="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></span>
                    </div>
                  {/if}
                </span>
                <span>{folder.name}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label
            class={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              showImages
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              class="sr-only"
              bind:checked={showImages}
            />
            <span class="h-2 w-2 rounded-full bg-amber-400"></span>
            Images
          </label>

          <label
            class={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              showVideos
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              class="sr-only"
              bind:checked={showVideos}
            />
            <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
            Videos
          </label>

          <div class="ml-auto text-xs text-slate-500">
            Showing {filteredItems.length} of {items.length}
          </div>
        </div>

      </div>
    </div>

    {#if items.length === 0}
      <section class="app-card text-center text-sm text-slate-500">
        Choose a directory to load images and videos.
      </section>
    {:else if filteredItems.length === 0}
      <section class="app-card text-center text-sm text-slate-500">
        No items match the selected filters.
      </section>
    {:else}
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {#each filteredItems as item}
          <article class="app-card flex flex-col gap-3 overflow-hidden">
            <div class="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
              {#if !failedMediaIds.includes(item.id)}
                {#if item.type === "image"}
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    class="h-full w-full object-cover"
                    on:load={() => markMediaLoaded(item.id)}
                    on:error={() => markMediaFailed(item.id)}
                  />
                {:else}
                  <video
                    src={item.fileUrl}
                    muted
                    loop
                    playsinline
                    preload="metadata"
                    class="h-full w-full object-cover"
                    on:loadeddata={() => markMediaLoaded(item.id)}
                    on:error={() => markMediaFailed(item.id)}
                  ></video>
                {/if}
              {/if}
              {#if loadingMediaIds.includes(item.id)}
                <div class="absolute inset-0 grid place-items-center bg-white">
                  <span class="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"></span>
                </div>
              {/if}
            </div>
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-800">{item.folderName}</div>
                <div class="text-xs text-slate-500">#{item.id} - {item.fileName}</div>
              </div>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">
                {item.type}
              </span>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
{/if}
