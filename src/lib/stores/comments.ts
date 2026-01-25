import { writable } from "svelte/store";
import type { Comment } from "$lib/types/comments";
import { csrfFetch } from "$lib/utils/csrf";

interface CommentStore {
  comments: Comment[];
  total: number;
  loading: boolean;
  error: string | null;
}

function createCommentsStore() {
  const { subscribe, set, update } = writable<CommentStore>({
    comments: [],
    total: 0,
    loading: false,
    error: null,
  });

  return {
    subscribe,
    async getComments(
      mediaType: string,
      mediaId: number,
      page = 1,
      limit = 10,
    ) {
      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const response = await fetch(
          `/api/comments?mediaType=${mediaType}&mediaId=${mediaId}&page=${page}&limit=${limit}`,
        );
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        update((state) => ({
          ...state,
          comments: data.comments,
          total: data.total,
          loading: false,
        }));
        return data;
      } catch (error) {
        update((state) => ({
          ...state,
          error:
            error instanceof Error ? error.message : "Failed to fetch comments",
          loading: false,
        }));
        throw error;
      }
    },

    async addComment({
      mediaType,
      mediaId,
      content,
      rating,
      parentId,
    }: {
      mediaType: string;
      mediaId: number;
      content: string;
      rating?: number;
      parentId?: number;
    }) {
      try {
        const response = await csrfFetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType,
            mediaId,
            content,
            rating,
            parentId,
          }),
        });
        if (!response.ok) throw new Error("Failed to add comment");
        const newComment = await response.json();
        update((state) => ({
          ...state,
          comments: [newComment, ...state.comments],
          total: state.total + 1,
        }));
        return newComment;
      } catch (error) {
        throw error;
      }
    },

    async toggleLike(commentId: number) {
      try {
        const response = await csrfFetch(`/api/comments/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId }),
        });
        if (!response.ok) throw new Error("Failed to toggle like");
        const { liked } = await response.json();
        update((state) => ({
          ...state,
          comments: state.comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: liked,
                _count: {
                  ...comment._count,
                  likes: comment._count.likes + (liked ? 1 : -1),
                },
              };
            }
            return comment;
          }),
        }));
      } catch (error) {
        throw error;
      }
    },

    async updateComment(commentId: number, content: string) {
      try {
        const response = await csrfFetch(`/api/comments/${commentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error("Failed to update comment");
        const updatedComment = await response.json();
        update((state) => ({
          ...state,
          comments: state.comments.map((comment) =>
            comment.id === commentId ? updatedComment : comment,
          ),
        }));
        return updatedComment;
      } catch (error) {
        throw error;
      }
    },

    async deleteComment(commentId: number) {
      try {
        const response = await csrfFetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete comment");
        update((state) => ({
          ...state,
          comments: state.comments.filter(
            (comment) => comment.id !== commentId,
          ),
          total: state.total - 1,
        }));
      } catch (error) {
        throw error;
      }
    },
  };
}

export const commentsStore = createCommentsStore();
