<script lang="ts">
  import { onMount } from 'svelte';
  import MediaCard from '$lib/components/MediaCard.svelte';
  import MediaFilters from '$lib/components/MediaFilters.svelte';
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';
  import type { TMDBMediaResponse } from '$lib/types/tmdb';

  let movies: TMDBMediaResponse[] = [];
  let loading = true;
  let error: string | null = null;
  let page = 1;
  let totalPages = 1;
  let selectedSort = 'trending';
  let selectedGenre = '';
  let selectedYear = '';
  let selectedMovie: TMDBMediaResponse | null = null;

  async function fetchMovies(currentPage = 1, reset = false) {
    loading = true;
    error = null;

    try {
      let url = '/api/movies';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        sort: selectedSort,
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedYear && { year: selectedYear })
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if (reset) {
        movies = data.results;
      } else {
        movies = [...movies, ...data.results];
      }

      totalPages = Math.min(data.total_pages, 500);
    } catch (err) {
      console.error('Error fetching movies:', err);
      error = 'Failed to load movies';
    } finally {
      loading = false;
    }
  }

  async function handleFilter(event: CustomEvent<{ sort: string; genre: string; year: string }>) {
    const { sort, genre, year } = event.detail;
    selectedSort = sort;
    selectedGenre = genre;
    selectedYear = year;
    page = 1;
    await fetchMovies(1, true);
  }

  async function loadMore() {
    if (!loading && page < totalPages) {
      const nextPage = page + 1;
      await fetchMovies(nextPage);
      page = nextPage;
    }
  }

  function handleMovieClick(movie: TMDBMediaResponse) {
    selectedMovie = movie;
  }

  onMount(() => {
    fetchMovies();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold">Movies</h1>
  </div>

  <MediaFilters
    type="movie"
    {selectedSort}
    {selectedGenre}
    {selectedYear}
    on:filter={handleFilter}
  />

  {#if selectedMovie}
    <div class="mb-8 bg-gray-800 rounded-lg overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">{selectedMovie.title}</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-white"
            on:click={() => selectedMovie = null}
            aria-label="Close video player"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <VideoPlayer
          mediaId={selectedMovie.id}
          mediaType="movie"
          title={selectedMovie.title || 'Unknown Movie'}
        />
      </div>
    </div>
  {/if}

  {#if loading && movies.length === 0}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  {:else if error}
    <div class="text-red-500 text-center py-8">
      {error}
    </div>
  {:else if movies.length === 0}
    <div class="text-gray-400 text-center py-8">
      No movies found matching your criteria
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {#each movies as movie (movie.id)}
        <div
          class="cursor-pointer"
          on:click={() => handleMovieClick(movie)}
          on:keydown={(e) => e.key === 'Enter' && handleMovieClick(movie)}
          role="button"
          tabindex="0"
        >
          <MediaCard
            id={movie.id}
            type="movie"
            title={movie.title || ''}
            posterPath={movie.poster_path}
            voteAverage={movie.vote_average}
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
