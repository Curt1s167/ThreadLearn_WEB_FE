import { apiClient } from './apiClient';
import type {
  CommentV2,
  CommentTargetType,
  PaginatedV2Response,
  SingleV2Response,
} from '../types';

export const commentService = {
  getComments: (
    targetType: CommentTargetType,
    targetId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedV2Response<CommentV2>> =>
    apiClient
      .get('/comments', { params: { targetType, targetId, page, limit } })
      .then((r) => r.data),

  getReplies: (commentId: string): Promise<SingleV2Response<CommentV2[]>> =>
    apiClient.get(`/comments/${commentId}/replies`).then((r) => r.data),

  createComment: (body: {
    targetType: CommentTargetType;
    targetId: string;
    content: string;
    parentId?: string;
  }): Promise<SingleV2Response<CommentV2>> =>
    apiClient.post('/comments', body).then((r) => r.data),

  updateComment: (
    commentId: string,
    content: string
  ): Promise<SingleV2Response<CommentV2>> =>
    apiClient.patch(`/comments/${commentId}`, { content }).then((r) => r.data),

  deleteComment: (commentId: string): Promise<{ message: string }> =>
    apiClient.delete(`/comments/${commentId}`).then((r) => r.data),
};
