import { apiClient } from './apiClient';
import type {
  Exercise,
  RunCodeResult,
  SubmissionHistory,
  PaginatedV2Response,
  SingleV2Response,
} from '../types';

export const codeExecutionService = {
  getExercise: (lessonId: string): Promise<SingleV2Response<Exercise>> =>
    apiClient.get(`/exercises/${lessonId}`).then((r) => r.data),

  runCode: (body: {
    exerciseId: string;
    code: string;
    language: string;
  }): Promise<SingleV2Response<RunCodeResult>> =>
    apiClient.post('/code-execution/run', body).then((r) => r.data),

  getHistory: (
    exerciseId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedV2Response<SubmissionHistory>> =>
    apiClient
      .get('/code-execution/history', { params: { exerciseId, page, limit } })
      .then((r) => r.data),
};
