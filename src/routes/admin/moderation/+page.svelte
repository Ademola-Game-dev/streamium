<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { CommentWithDetails } from '$lib/services/comments';
  import { csrfFetch } from '$lib/utils/csrf';

  let comments: CommentWithDetails[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    if (!$page.data.user?.isAdmin) {
      goto('/');
      return;
    }
    await loadFlaggedComments();
  });

  async function loadFlaggedComments() {
    try {
      const response = await fetch('/api/comments/flagged');
      if (!response.ok) throw new Error('Failed to load flagged comments');
      const data = await response.json();
      comments = data.comments;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load comments';
      console.error('Error loading flagged comments:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteComment(commentId: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await csrfFetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      await loadFlaggedComments();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete comment';
      console.error('Error deleting comment:', err);
    }
  }

  async function unflagComment(commentId: number) {
    try {
      const response = await csrfFetch(`/api/comments/${commentId}/unflag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to unflag comment');

      await loadFlaggedComments();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to unflag comment';
      console.error('Error unflagging comment:', err);
    }
  }

  function formatDate(date: string | Date | null | undefined) {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleString();
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold text-white">Comment Moderation</h1>
  </div>

  {#if loading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
    </div>
  {:else if error}
    <div class="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {:else if comments.length === 0}
    <div class="text-center py-8 text-gray-400">
      No flagged comments found
    </div>
  {:else}
    <div class="space-y-6">
      {#each comments as comment (comment.id)}
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-sm text-gray-400">
                Posted by {comment.user.username} on {formatDate(comment.createdAt)}
              </p>
              <p class="text-sm text-red-400 mt-1">
                Flagged on {formatDate(comment.flaggedAt)}
                {#if comment.flagReason}
                  - Reason: {comment.flagReason}
                {/if}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                on:click={() => unflagComment(comment.id)}
              >
                Unflag
              </button>
              <button
                class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                on:click={() => deleteComment(comment.id)}
              >
                Delete
              </button>
            </div>
          </div>

          <p class="text-white whitespace-pre-wrap">{comment.content}</p>

          <div class="mt-4 text-sm text-gray-400">
            <p>Media: {comment.mediaType} #{comment.mediaId}</p>
            <p>Likes: {comment._count?.likes || 0}</p>
            <p>Replies: {comment._count?.replies || 0}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
