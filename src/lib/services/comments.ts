import { csrfFetch } from "$lib/utils/csrf";

type MediaType = "movie" | "tv";

interface CommentUser {
  username: string;
}

interface CommentCounts {
  likes: number;
  replies: number;
}

interface BaseComment {
  id: number;
  userId: number;
  mediaId: number;
  mediaType: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
  flagged: boolean;
  flagReason?: string | null;
  flaggedAt?: Date | null;
}

export interface CommentWithDetails extends BaseComment {
  user: CommentUser;
  _count: CommentCounts;
  isLiked?: boolean;
}

export class CommentService {
  async createComment(
    mediaId: number,
    mediaType: MediaType,
    content: string,
    parentId?: number | null,
  ): Promise<BaseComment> {
    const response = await csrfFetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaId,
        mediaType,
        content,
        parentId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create comment');
    }

    return response.json();
  }

  async getComments(
    mediaId: number,
    mediaType: MediaType,
    parentId: number | null = null,
    page = 1,
    limit = 10,
  ): Promise<{ comments: CommentWithDetails[]; total: number }> {
    const params = new URLSearchParams({
      mediaId: mediaId.toString(),
      mediaType,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (parentId !== null) {
      params.append('parentId', parentId.toString());
    }

    const response = await fetch(`/api/comments?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch comments');
    }

    return response.json();
  }

  async getFlaggedComments(
    page = 1,
    limit = 10,
  ): Promise<{ comments: CommentWithDetails[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`/api/comments/flagged?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch flagged comments');
    }

    return response.json();
  }

  async getReplies(
    commentId: number,
    page = 1,
    limit = 5,
  ): Promise<{ replies: CommentWithDetails[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`/api/comments/${commentId}?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch replies');
    }

    return response.json();
  }

  async likeComment(commentId: number): Promise<void> {
    const response = await csrfFetch('/api/comments/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to like comment');
    }
  }

  async updateComment(
    commentId: number,
    content: string,
  ): Promise<BaseComment> {
    const response = await csrfFetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update comment');
    }

    return response.json();
  }

  async deleteComment(commentId: number): Promise<void> {
    const response = await csrfFetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete comment');
    }
  }

  async flagComment(commentId: number, reason?: string): Promise<void> {
    const response = await csrfFetch(`/api/comments/${commentId}/flag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to flag comment');
    }
  }

  async unflagComment(commentId: number): Promise<void> {
    const response = await csrfFetch(`/api/comments/${commentId}/unflag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unflag comment');
    }
  }
}

export const commentService = new CommentService();
