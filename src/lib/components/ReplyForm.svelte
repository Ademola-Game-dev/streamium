<script lang="ts">
  import RichTextEditor from './RichTextEditor.svelte';
  import { validateComment } from '$lib/shared/comment-validation';
  import { authStore } from '$lib/stores/auth';
  import { csrfFetch } from '$lib/utils/csrf';

  interface User {
    id: number;
    username: string;
  }

  export let mediaId: number;
  export let mediaType: 'movie' | 'tv';
  export let season: number | undefined = undefined;
  export let episode: number | undefined = undefined;
  export let parentId: number;
  export let onReplyAdded: (reply: {
    id: number;
    content: string;
    createdAt: string;
    user: User;
    replies: never[];
    _count: { likes: number };
    isLiked: boolean;
    flagged: boolean;
    parentId: number;
  }) => void;
  export let onCancel: () => void;

  let content = '<p></p>';
  let isSubmitting = false;
  let error = '';
  let charCount = 0;
  let isValid = false;
  let editor: RichTextEditor;
  const MAX_CHARS = 1000;

  $: {
    if (content === '<p></p>') {
      isValid = false;
      error = '';
      charCount = 0;
    } else {
      const validation = validateComment(content);
      isValid = validation.isValid && charCount <= MAX_CHARS;
      if (!validation.isValid && validation.error) {
        error = validation.error;
      } else if (charCount > MAX_CHARS) {
        error = 'Reply is too long';
      } else {
        error = '';
      }
    }
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    try {
      isSubmitting = true;
      error = '';

      const validation = validateComment(content);
      if (!validation.isValid) {
        error = validation.error || 'Invalid reply';
        return;
      }

      const response = await csrfFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          mediaType,
          content,
          parentId,
          season: mediaType === 'tv' ? season : undefined,
          episode: mediaType === 'tv' ? episode : undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post reply');
      }

      const newReply = await response.json();
      editor?.clear();
      onReplyAdded({
        ...newReply,
        user: $authStore.user!,
        replies: [],
        _count: { likes: 0 },
        isLiked: false,
        flagged: false
      });
    } catch (err) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'An unexpected error occurred';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function handleContentInput(event: CustomEvent<string>) {
    content = event.detail;

    const textContent = content.replace(/<[^>]*>/g, '');
    charCount = textContent.length;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div class="space-y-2">
    <RichTextEditor
      bind:this={editor}
      bind:content
      on:input={handleContentInput}
      class_="min-h-[100px] bg-gray-900/50"
    />

    <div class="flex justify-between items-center text-sm">
      <span class="text-gray-400">
        {charCount}/{MAX_CHARS} characters
      </span>
      {#if error}
        <span class="text-red-400">{error}</span>
      {/if}
    </div>
  </div>

  <div class="flex justify-end gap-2">
    <button
      type="button"
      class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
      on:click={onCancel}
    >
      Cancel
    </button>
    <button
      type="submit"
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isValid || isSubmitting}
    >
      {isSubmitting ? 'Posting...' : 'Post Reply'}
    </button>
  </div>
</form>
