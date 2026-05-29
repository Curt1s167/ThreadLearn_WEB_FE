import { apiClient } from './apiClient';
import type {
  BookmarkV2,
  BookmarkTargetType,
  BookmarkToggleResult,
  PaginatedV2Response,
  SingleV2Response,
} from '../types';

export const bookmarkService = {
  toggle: (body: {
    targetType: BookmarkTargetType;
    targetId: string;
    title: string;
    thumbnailUrl?: string;
  }): Promise<SingleV2Response<BookmarkToggleResult>> =>
    apiClient.post('/bookmarks/toggle', body).then((r) => r.data),

  getMyBookmarks: (params?: {
    page?: number;
    limit?: number;
    targetType?: BookmarkTargetType;
  }): Promise<PaginatedV2Response<BookmarkV2>> =>
    apiClient.get('/bookmarks/me', { params }).then((r) => r.data),

  check: (
    targetType: BookmarkTargetType,
    targetId: string
  ): Promise<SingleV2Response<{ bookmarked: boolean }>> =>
    apiClient
      .get('/bookmarks/check', { params: { targetType, targetId } })
      .then((r) => r.data),
};
