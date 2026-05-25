import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/PasswordPages';
import { DashboardPage } from '../features/courses/DashboardPage';
import { CoursesPage } from '../features/courses/CoursesPage';
import { LeaderboardPage } from '../features/leaderboard/LeaderboardPage';
import { AIPage } from '../features/ai/AIPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { BookmarksPage } from '../features/lessons/BookmarksPage';
import { QuizHistoryPage } from '../features/quiz/QuizHistoryPage';
import { QuizPage, LessonPage, NotFoundPage } from '../features/lessons/pages';
import { Spinner } from '../components/shared';

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size={24} />
      <p className="text-gray-700 font-mono text-xs">Loading...</p>
    </div>
  </div>
);

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth routes — guest only */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        {/* App routes — authenticated */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Student */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CoursesPage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/quiz/:lessonId" element={<QuizPage />} />
          <Route path="/quiz/history" element={<QuizHistoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <div className="p-4 text-gray-500 font-mono">User management — UC10-UC13</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <div className="p-4 text-gray-500 font-mono">Course management — UC15-UC22</div>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Error pages */}
        <Route path="/403" element={
          <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono font-bold text-[80px] text-white/5">403</p>
              <p className="font-mono text-gray-400 -mt-2">Access denied</p>
            </div>
          </div>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
