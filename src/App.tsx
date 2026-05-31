import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LessonPage, QuizPage, NotFoundPage } from './features/lessons/pages';

const LoginPage       = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage    = lazy(() => import('./features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPwPage    = lazy(() => import('./features/auth/PasswordPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPwPage     = lazy(() => import('./features/auth/PasswordPages').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage   = lazy(() => import('./features/courses/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CoursesPage     = lazy(() => import('./features/courses/CoursesPage').then(m => ({ default: m.CoursesPage })));
const BookmarksPage   = lazy(() => import('./features/bookmark/BookmarkListPage').then(m => ({ default: m.BookmarksPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ProfilePage     = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AIPage          = lazy(() => import('./features/ai/AIPage').then(m => ({ default: m.AIPage })));
const LeaderboardPage = lazy(() => import('./features/leaderboard/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const AdminDashboard  = lazy(() => import('./features/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const QuizHistoryPage = lazy(() => import('./features/quiz/QuizHistoryPage').then(m => ({ default: m.QuizHistoryPage })));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
};

const Loader = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-gray-600 font-mono text-sm animate-pulse">Loading...</div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PrivateRoute><DashboardLayout>{children}</DashboardLayout></PrivateRoute>
);

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/register"         element={<RegisterPage />} />
        <Route path="/forgot-password"  element={<ForgotPwPage />} />
        <Route path="/reset-password"   element={<ResetPwPage />} />

        {/* Student */}
        <Route path="/"              element={<Layout><DashboardPage /></Layout>} />
        <Route path="/dashboard"     element={<Navigate to="/" replace />} />
        <Route path="/courses"       element={<Layout><CoursesPage /></Layout>} />
        <Route path="/lessons/:id"   element={<Layout><LessonPage /></Layout>} />
        <Route path="/quiz/:lessonId" element={<Layout><QuizPage /></Layout>} />
        <Route path="/bookmarks"     element={<Layout><BookmarksPage /></Layout>} />
        <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
        <Route path="/profile"       element={<Layout><ProfilePage /></Layout>} />
        <Route path="/ai"            element={<Layout><AIPage /></Layout>} />
        <Route path="/leaderboard"   element={<Layout><LeaderboardPage /></Layout>} />
        <Route path="/quiz-history"  element={<Layout><QuizHistoryPage /></Layout>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><DashboardLayout><AdminDashboard /></DashboardLayout></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
