import { apiClient } from './apiClient';
import type {
  NotificationV2,
  UnreadCountResult,
  PaginatedV2Response,
  SingleV2Response,
} from '../types';

export const notificationService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
  }): Promise<PaginatedV2Response<NotificationV2>> =>
    apiClient.get('/notifications', { params }).then((r) => r.data),

  getUnreadCount: (): Promise<SingleV2Response<UnreadCountResult>> =>
    apiClient.get('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<SingleV2Response<NotificationV2>> =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: (): Promise<SingleV2Response<{ updated: number }>> =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),
};
