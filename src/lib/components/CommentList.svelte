<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { formatDistanceToNow } from 'date-fns';
  import DOMPurify from 'isomorphic-dompurify';
  import ReplyForm from './ReplyForm.svelte';
  import CommentForm from './CommentForm.svelte';
  import { csrfFetch } from '$lib/utils/csrf';

  export let mediaId: number;
  export let mediaType: 'movie' | 'tv';
  export let season: number | undefined = undefined;
  export let episode: number | undefined = undefined;

  interface User {
    id: number;
    username: string;
  }

  interface CommentLike {
    id: number;
    userId: number;
    commentId: number;
  }

  interface Comment {
    id: number;
    content: string;
    createdAt: string;
    user: User;
    replies: Comment[];
    _count: {
      likes: number;
    };
    isLiked: boolean;
    flagged: boolean;
    parentId: number | null;
  }

  type SortOption = 'recent' | 'likes';
  let sortBy: SortOption = 'recent';
  let comments: Comment[] = [];
  let isLoading = true;
  let error = '';
  let page = 1;
  let totalPages = 1;
  let replyingToId: number | null = null;
  let mounted = false;

  $: sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'likes') {
      return b._count.likes - a._count.likes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function formatDate(date: string) {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  }

  function sanitizeContent(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'br'],
      ALLOWED_ATTR: []
    });
  }

  async function loadComments() {
    if (!browser || !mounted) return;

    try {
      isLoading = true;
      error = '';
      let url = `/api/comments?mediaId=${mediaId}&mediaType=${mediaType}&page=${page}`;
      if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
        url += `&season=${season}&episode=${episode}`;
      }
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.comments)) {
        throw new Error('Invalid response format from server');
      }

      comments = data.comments;
      totalPages = data.totalPages;
    } catch (e) {
      console.error('Error loading comments:', e);
      error = e instanceof Error ? e.message : 'Failed to load comments';
    } finally {
      isLoading = false;
    }
  }

  async function handleLike(commentId: number) {
    if (!$authStore.isAuthenticated) return;

    let comment = comments.find(c => c.id === commentId);
    if (!comment) {
      for (const topComment of comments) {
        comment = topComment.replies.find(r => r.id === commentId);
        if (comment) break;
      }
    }
    if (!comment) return;

    comment.isLiked = !comment.isLiked;
    comment._count.likes += comment.isLiked ? 1 : -1;
    comments = [...comments];

    try {
      const response = await csrfFetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (!response.ok) {
        comment.isLiked = !comment.isLiked;
        comment._count.likes += comment.isLiked ? 1 : -1;
        comments = [...comments];

        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to like comment');
      }
    } catch (e) {
      console.error('Error liking comment:', e);
    }
  }

  async function handleFlag(commentId: number) {
    if (!$authStore.isAuthenticated) return;

    const reason = prompt('Please provide a reason for reporting this comment:');
    if (reason === null) return;

    let comment = comments.find(c => c.id === commentId);
    if (!comment) {
      for (const topComment of comments) {
        comment = topComment.replies.find(r => r.id === commentId);
        if (comment) break;
      }
    }
    if (!comment) return;

    comment.flagged = true;
    comments = [...comments];

    try {
      const response = await csrfFetch(`/api/comments/${commentId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        comment.flagged = false;
        comments = [...comments];

        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to flag comment');
      }
    } catch (e) {
      console.error('Error flagging comment:', e);
    }
  }

  function handleReplyClick(commentId: number) {
    if (!$authStore.isAuthenticated) return;
    replyingToId = commentId;
  }

  function handleReplyCancel() {
    replyingToId = null;
  }

  function handleReplyAdded(newReply: Comment) {
    const parentComment = comments.find(c => c.id === newReply.parentId);
    if (parentComment) {
      parentComment.replies = [...parentComment.replies, newReply];
      comments = [...comments];
    }
    replyingToId = null;
  }

  function handleCommentAdded(newComment: Comment) {
    comments = [newComment, ...comments];
  }

  $: if (mounted && mediaType === 'tv' && browser) {
    const episodeKey = `${season}-${episode}`;
    loadComments();
  }

  onMount(() => {
    mounted = true;
    loadComments();
  });
</script>

<div class="space-y-6">
  <CommentForm
    {mediaId}
    {mediaType}
    {season}
    {episode}
    onCommentAdded={handleCommentAdded}
  />

  <div class="flex items-center gap-4 text-sm text-gray-400">
    <span>Sort by:</span>
    <button
      class="hover:text-white transition-colors"
      class:text-white={sortBy === 'recent'}
      on:click={() => sortBy = 'recent'}
    >
      Most Recent
    </button>
    <span>•</span>
    <button
      class="hover:text-white transition-colors"
      class:text-white={sortBy === 'likes'}
      on:click={() => sortBy = 'likes'}
    >
      Most Liked
    </button>
  </div>

  {#if isLoading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
      <p class="text-red-400">{error}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        on:click={loadComments}
      >
        Try Again
      </button>
    </div>
  {:else if comments.length === 0}
    <div class="bg-gray-800/50 rounded-lg p-8 text-center backdrop-blur-sm border border-gray-700/50">
      <div class="flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <div>
          <p class="text-gray-400 text-lg mb-2">No comments yet</p>
          <p class="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      {#each sortedComments as comment (comment.id)}
        {#if !comment.parentId}
          <div class="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <span class="text-lg font-semibold">{comment.user.username[0].toUpperCase()}</span>
                </div>
                <div>
                  <div class="font-semibold">{comment.user.username}</div>
                  <div class="text-sm text-gray-400">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div class="prose prose-invert max-w-none">
              {@html sanitizeContent(comment.content)}
            </div>

            <div class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/50">
              <button
                class="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                class:text-blue-400={comment.isLiked}
                on:click={() => handleLike(comment.id)}
                disabled={!$authStore.isAuthenticated}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{comment._count.likes}</span>
              </button>

              {#if $authStore.isAuthenticated}
                <button
                  class="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                  on:click={() => handleReplyClick(comment.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Reply</span>
                </button>
              {/if}

              {#if $authStore.isAuthenticated && !comment.flagged}
                <button
                  class="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                  on:click={() => handleFlag(comment.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <span>Report</span>
                </button>
              {/if}
            </div>

            {#if replyingToId === comment.id}
              <div class="mt-4 pl-8">
                <ReplyForm
                  {mediaId}
                  {mediaType}
                  {season}
                  {episode}
                  parentId={comment.id}
                  onReplyAdded={handleReplyAdded}
                  onCancel={handleReplyCancel}
                />
              </div>
            {/if}

            {#if comment.replies.length > 0}
              <div class="mt-4 pl-8 space-y-4">
                {#each comment.replies as reply (reply.id)}
                  <div class="bg-gray-800/30 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span class="text-sm font-semibold">{reply.user.username[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div class="font-semibold">{reply.user.username}</div>
                        <div class="text-xs text-gray-400">
                          {formatDate(reply.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div class="prose prose-invert max-w-none">
                      {@html sanitizeContent(reply.content)}
                    </div>
                    <div class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/30">
                      <button
                        class="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                        class:text-blue-400={reply.isLiked}
                        on:click={() => handleLike(reply.id)}
                        disabled={!$authStore.isAuthenticated}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>{reply._count.likes}</span>
                      </button>

                      {#if $authStore.isAuthenticated && !reply.flagged}
                        <button
                          class="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                          on:click={() => handleFlag(reply.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                          <span>Report</span>
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
