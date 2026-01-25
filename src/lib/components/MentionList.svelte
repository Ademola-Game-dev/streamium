<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let items: { id: number; username: string }[] = [];
  export let command: (props: { id: number; label: string }) => void;

  let selectedIndex = 0;
  const dispatch = createEventDispatcher();

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      enterHandler();
      return true;
    }

    return false;
  }

  function upHandler() {
    selectedIndex = (selectedIndex + items.length - 1) % items.length;
  }

  function downHandler() {
    selectedIndex = (selectedIndex + 1) % items.length;
  }

  function enterHandler() {
    selectItem(selectedIndex);
  }

  function selectItem(index: number) {
    const item = items[index];
    if (item) {
      command({ id: item.id, label: item.username });
    }
  }

  dispatch('keydown', { onKeyDown });
</script>

<div class="mention-list bg-gray-800 rounded-lg shadow-lg overflow-hidden">
  {#each items as item, index}
    <button
      class="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
      class:bg-gray-700={index === selectedIndex}
      on:click={() => selectItem(index)}
    >
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
          <span class="text-sm font-medium">
            {item.username[0].toUpperCase()}
          </span>
        </div>
        <span class="text-sm">{item.username}</span>
      </div>
    </button>
  {/each}
</div>

<style>
  .mention-list {
    max-height: 200px;
    overflow-y: auto;
  }
</style>
