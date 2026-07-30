import type { ApiResponse } from '../types';
import { apiClient } from './apiClient';

export interface VideoWatchProgress {
  _id: string;
  lessonId: string;
  currentTimeSeconds: number;
  durationSeconds?: number;
  updatedAt: string;
}

export const videoWatchProgressService = {
  get: async (lessonId: string) => {
    const { data } = await apiClient.get<ApiResponse<VideoWatchProgress | null>>(
      '/video-watch-progress',
      { params: { lessonId } }
    );
    return data.data;
  },
  save: async (input: {
    lessonId: string;
    currentTimeSeconds: number;
    durationSeconds?: number;
  }) => {
    const { data } = await apiClient.put<ApiResponse<VideoWatchProgress>>(
      '/video-watch-progress',
      input
    );
    return data.data;
  },
  reset: async (lessonId: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      '/video-watch-progress',
      { params: { lessonId } }
    );
    return data.data;
  },
};
