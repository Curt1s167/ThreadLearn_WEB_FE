import { apiClient } from './apiClient';
import type {
  AIAnalysisResult,
  AIAnalysisHistoryItem,
  PaginatedV2Response,
  SingleV2Response,
} from '../types';

export const aiAnalysisService = {
  recommend: (body: {
    inputCode: string;
    language: string;
    codeExecutionId?: string;
  }): Promise<SingleV2Response<AIAnalysisResult>> =>
    apiClient.post('/ai-analysis/recommend', body).then((r) => r.data),

  getHistory: (
    page = 1,
    limit = 10
  ): Promise<PaginatedV2Response<AIAnalysisHistoryItem>> =>
    apiClient
      .get('/ai-analysis/history', { params: { page, limit } })
      .then((r) => r.data),
};
