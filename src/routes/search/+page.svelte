<script lang="ts">
  import MediaCard from '$lib/components/MediaCard.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data;
  $: results = data.results;
  $: totalPages = data.totalPages;
  $: searchQuery = $page.url.searchParams.get('query') || '';

  let mounted = false;
  onMount(() => {
    mounted = true;
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-white mb-4">Search</h1>

  <form method="get" data-sveltekit-reload class="mb-8">
    <div class="flex gap-2">
      <input
        name="query"
        value={searchQuery}
        placeholder="Search movies and TV shows..."
        class="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <button
        type="submit"
        class="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
      >
        Search
      </button>
    </div>
  </form>

  {#if !searchQuery}
    <div class="text-center py-12">
      <h2 class="text-xl text-gray-400">Enter a search term</h2>
    </div>
  {:else if results.length === 0}
    <div class="text-center py-12">
      <h2 class="text-xl text-gray-400">No results found</h2>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {#if mounted}
        {#each results as item (item.id)}
          <MediaCard
            id={item.id}
            type={item.media_type === 'movie' ? 'movie' : 'tv'}
            title={item.media_type === 'movie' ? (item.title || '') : (item.name || '')}
            posterPath={item.poster_path}
            voteAverage={item.vote_average}
          />
        {/each}
      {/if}
    </div>

    {#if totalPages > 1}
      <div class="mt-8 flex justify-center gap-4">
        {#if parseInt($page.url.searchParams.get('page') || '1') > 1}
          <a
            href="/search?query={searchQuery}&page={parseInt($page.url.searchParams.get('page') || '1') - 1}"
            data-sveltekit-reload
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Previous
          </a>
        {/if}

        <span class="px-4 py-2 text-white">
          Page {$page.url.searchParams.get('page') || '1'} of {totalPages}
        </span>

        {#if parseInt($page.url.searchParams.get('page') || '1') < totalPages}
          <a
            href="/search?query={searchQuery}&page={parseInt($page.url.searchParams.get('page') || '1') + 1}"
            data-sveltekit-reload
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Next
          </a>
        {/if}
      </div>
    {/if}
  {/if}
</div>
