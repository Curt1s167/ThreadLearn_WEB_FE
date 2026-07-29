import type { ApiResponse } from '../types';
import { apiClient } from './apiClient';

export interface VideoBookmark {
  _id: string;
  lessonId: string;
  timestampSeconds: number;
  note?: string;
  createdAt: string;
}

export const videoBookmarksService = {
  list: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<VideoBookmark[]>>(
      '/video-bookmarks',
      {
        params: { lessonId },
      }
    );
    return data.data;
  },
  create: async (input: {
    lessonId: string;
    timestampSeconds: number;
    note?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<VideoBookmark>>(
      '/video-bookmarks',
      input
    );
    return data.data;
  },
  remove: async (bookmarkId: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/video-bookmarks/${bookmarkId}`
    );
    return data.data;
  },
};
