<script lang="ts">
  import { onMount } from 'svelte';
  import { watchlistStore } from '$lib/stores/watchlist';
  import MediaCard from '$lib/components/MediaCard.svelte';

  $: items = $watchlistStore.items;
  $: loading = $watchlistStore.loading;
  $: error = $watchlistStore.error;

  onMount(async () => {
    try {
      await watchlistStore.getWatchlist();
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">My Watchlist</h1>

  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-900/50 text-red-200 p-4 rounded-lg text-center">
      {error}
    </div>
  {:else if items.length === 0}
    <div class="bg-gray-800/50 text-gray-400 p-8 rounded-lg text-center">
      <p class="text-lg mb-2">Your watchlist is empty</p>
      <p class="text-sm text-gray-500">Add movies or TV shows to watch later!</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {#each items as item (item.id)}
        <MediaCard
          id={item.mediaId}
          type={item.mediaType === 'movie' ? 'movie' : 'tv'}
          title={item.title}
          posterPath={item.posterPath}
          voteAverage={item.voteAverage}
        />
      {/each}
    </div>
  {/if}
</div>
