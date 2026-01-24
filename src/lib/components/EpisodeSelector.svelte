<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Season {
    season_number: number;
    name: string;
    episode_count: number;
  }

  interface Episode {
    episode_number: number;
    name: string;
    overview: string;
  }

  export let mediaId: number;
  export let showModal = false;

  const dispatch = createEventDispatcher();
  let seasons: Season[] = [];
  let episodes: Episode[] = [];
  let selectedSeason: number | undefined;
  let selectedEpisode: number | undefined;

  $: if (showModal && mediaId && !seasons.length) {
    loadSeasons();
  }

  async function loadSeasons() {
    try {
      const response = await fetch(`/api/tv/${mediaId}/seasons`);
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
    try {
      const response = await fetch(`/api/tv/${mediaId}/season/${seasonNumber}`);
      if (response.ok) {
        const data = await response.json();
        episodes = data.episodes;
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  }

  function selectEpisode(episodeNumber: number) {
    selectedEpisode = episodeNumber;
    dispatch('select', { season: selectedSeason, episode: episodeNumber });
    closeModal();
  }

  function closeModal() {
    showModal = false;
    dispatch('close');
  }
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 class="text-xl font-semibold">Select Episode</h2>
        <button
          type="button"
          class="text-gray-400 hover:text-white"
          on:click={closeModal}
          aria-label="Close episode selection"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex divide-x divide-gray-700">
        <!-- Seasons -->
        <div class="w-1/3 overflow-y-auto">
          <div class="p-2">
            {#each seasons as season}
              <button
                type="button"
                class="w-full px-3 py-2 rounded text-left text-sm transition-colors mb-1"
                class:bg-primary-500={selectedSeason === season.season_number}
                class:bg-gray-700={selectedSeason !== season.season_number}
                class:hover:bg-primary-600={selectedSeason === season.season_number}
                class:hover:bg-gray-600={selectedSeason !== season.season_number}
                on:click={() => selectSeason(season.season_number)}
              >
                Season {season.season_number}
              </button>
            {/each}
          </div>
        </div>

        <!-- Episodes -->
        <div class="w-2/3 overflow-y-auto">
          <div class="p-2">
            {#if selectedSeason && episodes.length > 0}
              {#each episodes as episode}
                <button
                  type="button"
                  class="w-full px-3 py-2 rounded text-left text-sm transition-colors mb-1"
                  class:bg-primary-500={selectedEpisode === episode.episode_number}
                  class:bg-gray-700={selectedEpisode !== episode.episode_number}
                  class:hover:bg-primary-600={selectedEpisode === episode.episode_number}
                  class:hover:bg-gray-600={selectedEpisode !== episode.episode_number}
                  on:click={() => selectEpisode(episode.episode_number)}
                >
                  <div class="font-medium">
                    Episode {episode.episode_number}
                  </div>
                  <div class="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {episode.name}
                  </div>
                </button>
              {/each}
            {:else}
              <div class="text-gray-400 text-sm p-3">
                Select a season to view episodes
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
