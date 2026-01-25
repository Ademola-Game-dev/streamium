<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import data from '@emoji-mart/data';
  import * as emojiMart from 'emoji-mart';

  export let buttonClass = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{ select: string }>();
  let showPicker = false;
  let pickerElement: HTMLDivElement;
  let buttonElement: HTMLButtonElement;
  type EmojiData = { native: string };
  type EmojiMartPicker = { destroy?: () => void };
  let picker: EmojiMartPicker | null = null;

  emojiMart.init({ data });

  function handleClickOutside(event: MouseEvent) {
    if (showPicker &&
        pickerElement &&
        !pickerElement.contains(event.target as Node) &&
        buttonElement &&
        !buttonElement.contains(event.target as Node)) {
      showPicker = false;
    }
  }

  function togglePicker() {
    if (!disabled) {
      showPicker = !showPicker;
    }
  }

  function handleSelect(emoji: EmojiData) {
    dispatch('select', emoji.native);
    showPicker = false;
  }

  function createPicker() {
    if (showPicker && pickerElement) {
      if (picker) {
        picker.destroy?.();
      }
      return new emojiMart.Picker({
        parent: pickerElement,
        data,
        onEmojiSelect: handleSelect,
        theme: 'dark',
        showPreview: false,
        showSkinTones: false,
        emojiSize: 20,
        emojiButtonSize: 28,
        maxFrequentRows: 0,
      });
    }
    return null;
  }

  $: picker = createPicker();

  onDestroy(() => {
    if (picker) {
      picker.destroy?.();
    }
  });
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative">
  <button
    bind:this={buttonElement}
    type="button"
    class="p-1 rounded hover:bg-gray-700/50 transition-colors {buttonClass}"
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    on:click={togglePicker}
    {disabled}
    aria-label="Add emoji"
    title="Add emoji"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>

  {#if showPicker}
    <div
      bind:this={pickerElement}
      class="absolute bottom-full right-0 mb-2 z-50"
    ></div>
  {/if}
</div>

<style>
  :global(em-emoji-picker) {
    --rgb-background: 31 41 55;
    --rgb-input: 55 65 81;
    --rgb-color: 209 213 219;
    height: 350px !important;
  }
</style>
