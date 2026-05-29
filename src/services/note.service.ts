import { apiClient } from './apiClient';
import type { NoteV2, SingleV2Response } from '../types';

export const noteService = {
  getNotes: (lessonId: string): Promise<SingleV2Response<NoteV2[]>> =>
    apiClient.get('/notes', { params: { lessonId } }).then((r) => r.data),

  createNote: (body: {
    lessonId: string;
    anchorText: string;
    anchorStart: number;
    anchorEnd: number;
    noteContent: string;
  }): Promise<SingleV2Response<NoteV2>> =>
    apiClient.post('/notes', body).then((r) => r.data),

  updateNote: (
    noteId: string,
    noteContent: string
  ): Promise<SingleV2Response<NoteV2>> =>
    apiClient.patch(`/notes/${noteId}`, { noteContent }).then((r) => r.data),

  deleteNote: (noteId: string): Promise<{ message: string }> =>
    apiClient.delete(`/notes/${noteId}`).then((r) => r.data),
};
