<script lang="ts">
  import { page } from '$app/stores';
  import { commentsStore } from '$lib/stores/comments';
  import type { Comment } from '@prisma/client';

  export let comment: Comment;

  const isAdmin = $page.data.user?.isAdmin ?? false;

  async function deleteComment() {
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      commentsStore.deleteComment(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  async function flagComment() {
    try {
      const response = await fetch(`/api/comments/${comment.id}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to flag comment');
      }

      commentsStore.updateComment(comment.id, comment.content);
    } catch (error) {
      console.error('Error flagging comment:', error);
    }
  }

  async function unflagComment() {
    try {
      const response = await fetch(`/api/comments/${comment.id}/unflag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unflag comment');
      }

      commentsStore.updateComment(comment.id, comment.content);
    } catch (error) {
      console.error('Error unflagging comment:', error);
    }
  }
</script>

{#if isAdmin}
  <div class="flex items-center gap-2">
    <button
      class="text-sm text-red-500 hover:text-red-600"
      on:click={deleteComment}
      title="Delete comment"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>

    {#if comment.flagged}
      <button
        class="text-sm text-green-500 hover:text-green-600"
        on:click={unflagComment}
        title="Unflag comment"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    {:else}
      <button
        class="text-sm text-yellow-500 hover:text-yellow-600"
        on:click={flagComment}
        title="Flag comment"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </button>
    {/if}
  </div>
{/if}
