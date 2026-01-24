<script lang="ts">
  import { onMount } from 'svelte';
  import MediaCard from '$lib/components/MediaCard.svelte';
  import MediaFilters from '$lib/components/MediaFilters.svelte';
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';
  import type { TMDBMediaResponse } from '$lib/types/tmdb';

  interface Season {
    season_number: number;
    name: string;
    episode_count: number;
  }

  interface Episode {
    episode_number: number;
    name: string;
    overview: string;
    air_date: string;
  }

  let shows: TMDBMediaResponse[] = [];
  let loading = true;
  let error: string | null = null;
  let page = 1;
  let totalPages = 1;
  let selectedSort = 'trending';
  let selectedGenre = '';
  let selectedYear = '';
  let selectedShow: TMDBMediaResponse | null = null;
  let selectedSeason: number | undefined;
  let selectedEpisode: number | undefined;
  let seasons: Season[] = [];
  let episodes: Episode[] = [];
  let showEpisodeModal = false;

  async function fetchShows(currentPage = 1, reset = false) {
    loading = true;
    error = null;

    try {
      let url = '/api/tv';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: selectedSort,
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedYear && { year: selectedYear })
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
      }

      const data = await response.json();

      if (reset) {
        shows = data.results;
      } else {
        shows = [...shows, ...data.results];
      }

      totalPages = data.total_pages;
    } catch (err) {
      console.error('Error fetching TV shows:', err);
      error = 'Failed to load TV shows';
    } finally {
      loading = false;
    }
  }

  async function fetchSeasons(showId: number) {
    try {
      const response = await fetch(`/api/tv/${showId}/seasons`);
      if (response.ok) {
        const data = await response.json();
        seasons = data.seasons.filter((s: Season) => s.season_number > 0);
        if (seasons.length > 0) {
          await selectSeason(seasons[0].season_number);
        }
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }

  async function selectSeason(seasonNumber: number) {
    selectedSeason = seasonNumber;
    selectedEpisode = undefined;
    try {
      const response = await fetch(`/api/tv/${selectedShow?.id}/season/${seasonNumber}`);
      if (response.ok) {
        const data = await response.json();
        episodes = data.episodes;
        if (episodes.length > 0) {
          selectEpisode(episodes[0].episode_number);
        }
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  }

  function selectEpisode(episodeNumber: number) {
    selectedEpisode = episodeNumber;
    showEpisodeModal = false;
  }

  async function handleFilter(event: CustomEvent<{ sort: string; genre: string; year: string }>) {
    const { sort, genre, year } = event.detail;
    selectedSort = sort;
    selectedGenre = genre;
    selectedYear = year;
    page = 1;
    await fetchShows(1, true);
  }

  async function loadMore() {
    if (page < totalPages) {
      page++;
      await fetchShows(page);
    }
  }

  async function handleShowClick(show: TMDBMediaResponse) {
    selectedShow = show;
    await fetchSeasons(show.id);
    showEpisodeModal = true;
  }

  onMount(() => {
    fetchShows();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold">TV Shows</h1>
  </div>

  <MediaFilters
    type="tv"
    {selectedSort}
    {selectedGenre}
    {selectedYear}
    on:filter={handleFilter}
  />

  {#if selectedShow && selectedSeason && selectedEpisode}
    <div class="mb-8 bg-gray-800 rounded-lg overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-bold">{selectedShow.name}</h2>
            <p class="text-gray-400">Season {selectedSeason} Episode {selectedEpisode}</p>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-white"
            on:click={() => selectedShow = null}
            aria-label="Close video player"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <VideoPlayer
          mediaId={selectedShow.id}
          mediaType="tv"
          title={selectedShow.name || 'Unknown Show'}
          season={selectedSeason}
          episode={selectedEpisode}
        />
      </div>
    </div>
  {/if}

  {#if loading && shows.length === 0}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  {:else if error}
    <div class="text-red-500 text-center py-8">
      {error}
    </div>
  {:else if shows.length === 0}
    <div class="text-gray-400 text-center py-8">
      No TV shows found matching your criteria
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {#each shows as show (show.id)}
        <div
          class="cursor-pointer"
          on:click={() => handleShowClick(show)}
          on:keydown={(e) => e.key === 'Enter' && handleShowClick(show)}
          role="button"
          tabindex="0"
        >
          <MediaCard
            id={show.id}
            type="tv"
            title={show.name || ''}
            posterPath={show.poster_path}
            voteAverage={show.vote_average}
          />
        </div>
      {/each}
    </div>

    {#if page < totalPages}
      <div class="flex justify-center mt-8">
        <button
          type="button"
          class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          on:click={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      </div>
    {/if}
  {/if}
</div>

{#if showEpisodeModal && selectedShow}
  <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Select Episode</h2>
        <button
          type="button"
          class="text-gray-400 hover:text-white"
          on:click={() => showEpisodeModal = false}
          aria-label="Close episode selection"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Seasons -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold mb-2">Seasons</h3>
          {#each seasons as season}
            <button
              type="button"
              class="w-full p-4 rounded-lg text-left transition-colors"
              class:bg-primary-500={selectedSeason === season.season_number}
              class:bg-gray-700={selectedSeason !== season.season_number}
              on:click={() => selectSeason(season.season_number)}
            >
              <div class="font-medium">Season {season.season_number}</div>
              <div class="text-sm text-gray-400">{season.episode_count} Episodes</div>
            </button>
          {/each}
        </div>

        <!-- Episodes -->
        {#if selectedSeason && episodes.length > 0}
          <div class="space-y-4">
            <h3 class="text-lg font-semibold mb-2">Episodes</h3>
            {#each episodes as episode}
              <button
                type="button"
                class="w-full p-4 rounded-lg text-left transition-colors"
                class:bg-primary-500={selectedEpisode === episode.episode_number}
                class:bg-gray-700={selectedEpisode !== episode.episode_number}
                on:click={() => selectEpisode(episode.episode_number)}
              >
                <div class="font-medium">
                  Episode {episode.episode_number}: {episode.name}
                </div>
                <div class="text-sm text-gray-400">
                  Air Date: {new Date(episode.air_date).toLocaleDateString()}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
