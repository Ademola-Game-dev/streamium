<script lang="ts">
  import { onMount } from 'svelte';
  import RichTextEditor from './RichTextEditor.svelte';
  import { authStore } from '$lib/stores/auth';
  import { validateComment } from '$lib/shared/comment-validation';
  import { csrfFetch } from '$lib/utils/csrf';

  export let mediaId: number;
  export let mediaType: 'movie' | 'tv';
  export let season: number | undefined = undefined;
  export let episode: number | undefined = undefined;
  export let onCommentAdded: (comment: {
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
    };
    replies: never[];
    _count: { likes: number };
    isLiked: boolean;
    flagged: boolean;
    parentId: null;
  }) => void;

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
        error = 'Comment is too long';
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
        error = validation.error || 'Invalid comment';
        return;
      }

      const response = await csrfFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          mediaType,
          content,
          season: mediaType === 'tv' ? season : undefined,
          episode: mediaType === 'tv' ? episode : undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const newComment = await response.json();
      editor?.clear();
      onCommentAdded({
        ...newComment,
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

<div class="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
  <h3 class="text-xl font-semibold mb-4">Add a Comment</h3>

  {#if $authStore.isAuthenticated}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <RichTextEditor
          bind:this={editor}
          bind:content
          on:input={handleContentInput}
          class_="min-h-[120px] bg-gray-900/50"
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

      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  {:else}
    <div class="text-center py-6">
      <p class="text-gray-400">Please <a href="/login" class="text-blue-400 hover:underline">log in</a> to leave a comment.</p>
    </div>
  {/if}
</div>
