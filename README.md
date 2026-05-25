# ThreadLearn — Frontend

Nền tảng học lập trình đa luồng tích hợp AI (WDP301). Đây là **repo Frontend** xây dựng bằng React 19 + Vite + TypeScript, kết nối tới Backend Node.js/Express qua REST API và Socket.IO.

> Tài liệu này dành cho các thành viên trong team. Đọc xong bạn sẽ hiểu: (1) chạy dự án thế nào, (2) mỗi folder làm gì, (3) tính năng nào đã có / chưa có theo Use Case.

---

## 1. Yêu cầu môi trường

- **Node.js** ≥ 18 (khuyến nghị 20+)
- **npm** ≥ 9
- Backend chạy ở `http://localhost:3001` (Vite đã proxy `/api` sang BE — xem [vite.config.ts](vite.config.ts))

## 2. Cài đặt & chạy

```bash
npm install         # cài dependencies
npm run dev         # chạy dev server ở http://localhost:3000
npm run build       # tsc + vite build, output ra dist/
npm run preview     # preview bản build
npm run lint        # ESLint
```

### Biến môi trường (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 3. Tech Stack

| Lớp | Thư viện | Vai trò |
|---|---|---|
| Build | Vite + TypeScript | Bundler, dev server, type check |
| UI Framework | React 19 | Component model |
| Routing | React Router DOM 7 | Client-side routing + lazy/Suspense |
| Styling | Tailwind CSS 3 + PostCSS | Utility-first CSS, dark theme |
| State (client) | Zustand 5 | Auth store, UI store (persist localStorage) |
| State (server) | TanStack Query 5 | Cache, refetch, mutation |
| HTTP | Axios | Interceptor inject JWT, auto-refresh 401 |
| Form | React Hook Form + Zod | Validate schema |
| Realtime | socket.io-client | Notifications / XP / leaderboard |
| Markdown | react-markdown + remark-gfm + rehype-highlight | Render bài học |
| Toast | Sonner | Notify UI |
| Icon | lucide-react | Bộ icon |
| Animation | framer-motion | Animation (đã cài, chưa dùng nhiều) |

> **Chưa cài**: `@monaco-editor/react` (cần cho UC44/45 — IDE). Khi triển khai phân hệ IDE cần `npm i @monaco-editor/react monaco-editor`.

---

## 4. Cấu trúc thư mục

```
ThreadLearn_WEB_FE/
├── public/                      # Static assets (favicon, ảnh public)
├── src/
│   ├── main.tsx                 # Entry point — render <App /> vào #root
│   ├── App.tsx                  # Wrap providers: QueryClientProvider, ErrorBoundary, Sonner, AppRouter
│   ├── vite-env.d.ts            # Khai báo type cho Vite env vars
│   │
│   ├── routes/                  # Định nghĩa routing + guard
│   │   ├── index.tsx            #   AppRouter: BrowserRouter + tất cả <Route>
│   │   └── ProtectedRoute.tsx   #   ProtectedRoute (đã login) + GuestRoute (chưa login) + role check ADMIN/STUDENT
│   │
│   ├── layouts/                 # Khung giao diện cho user đã login
│   │   ├── DashboardLayout.tsx  #   Layout chính: Sidebar + Topbar + <Outlet/>; khởi tạo useAuthBootstrap + useSocket
│   │   ├── Sidebar.tsx          #   Menu trái, có thể thu gọn
│   │   └── Topbar.tsx           #   Thanh trên: search, notification bell, user menu, theme toggle
│   │
│   ├── components/
│   │   └── shared/              # Component UI dùng chung
│   │       ├── index.tsx        #   Export: Button, Input, Spinner, Skeleton, Badge, Card, Avatar, EmptyState, Modal
│   │       ├── Modal.tsx        #   Component modal (dialog)
│   │       └── ErrorBoundary.tsx#   Bắt lỗi React, hiển thị fallback UI
│   │
│   ├── features/                # Mã chia theo phân hệ tính năng (feature-first)
│   │   ├── auth/                #   Đăng ký / Đăng nhập / Quên mật khẩu / Reset
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── PasswordPages.tsx    (ForgotPasswordPage + ResetPasswordPage)
│   │   ├── courses/             #   Trang dashboard và browse khóa học
│   │   │   ├── DashboardPage.tsx    (trang chủ sau login: enrolled + recommended)
│   │   │   └── CoursesPage.tsx      (danh sách + filter + chi tiết khóa học)
│   │   ├── lessons/             #   Trang bài học + quiz + comment + note + bookmark
│   │   │   ├── pages.tsx            (LessonPage + QuizPage + NotFoundPage)
│   │   │   ├── CommentsSection.tsx
│   │   │   ├── NotesPanel.tsx
│   │   │   └── BookmarksPage.tsx
│   │   ├── quiz/                #   Lịch sử làm quiz
│   │   │   └── QuizHistoryPage.tsx
│   │   ├── leaderboard/         #   Bảng xếp hạng theo XP
│   │   │   └── LeaderboardPage.tsx
│   │   ├── ai/                  #   AI Advisor — gợi ý khóa học / phân tích code
│   │   │   └── AIPage.tsx
│   │   ├── profile/             #   Hồ sơ + upload avatar
│   │   │   └── ProfilePage.tsx
│   │   ├── notifications/       #   Danh sách thông báo (level-up, quiz pass, streak...)
│   │   │   └── NotificationsPage.tsx
│   │   └── admin/               #   Trang quản trị
│   │       └── AdminDashboardPage.tsx  (stats + user list + course actions)
│   │
│   ├── services/                # Lớp gọi API (Axios). Toàn bộ endpoint của BE
│   │   ├── apiClient.ts         #   Axios instance + interceptor token + auto-refresh
│   │   ├── auth.service.ts      #   login, register, getMe, forgot/reset, logout
│   │   └── index.ts             #   Export: coursesService, lessonsService, enrollmentsService,
│   │                            #           quizService, commentsService, bookmarksService,
│   │                            #           notesService, notificationsService, leaderboardService,
│   │                            #           gamificationService, aiService, adminService
│   │
│   ├── store/                   # State client toàn cục (Zustand)
│   │   ├── auth.store.ts        #   user, tokens, stats (XP, level, streak), isAuthenticated
│   │   ├── ui.store.ts          #   sidebar collapsed, theme
│   │   └── index.ts             #   Re-export useAuthStore + useUIStore
│   │
│   ├── hooks/                   # Custom hook
│   │   ├── useSocket.ts         #   Kết nối socket.io, join room user, listen 'notification' / 'xp:awarded' / 'leaderboard:update'
│   │   └── index.ts             #   useAuthBootstrap, useLogout, useDebounce, useMediaQuery
│   │
│   ├── types/
│   │   └── index.ts             # Type chung: User, UserStats, Course, Lesson, Quiz, Question,
│   │                            # QuizAttempt, Comment, Bookmark, Note, Notification,
│   │                            # LeaderboardEntry, AIHistoryLog, PlatformStats
│   │
│   ├── utils/
│   │   └── index.ts             # Helper: cn() (clsx + tailwind-merge), formatNumber, getLevel, ...
│   │
│   ├── styles/
│   │   └── globals.css          # Tailwind directives + biến CSS + dark theme
│   │
│   └── assets/                  # Ảnh trong source (hero.png, vite.svg)
│
├── index.html                   # HTML root, mount #root
├── package.json                 # Khai báo dependencies + scripts
├── vite.config.ts               # Cấu hình Vite: alias @ → src, proxy /api → :3001
├── tailwind.config.js           # Cấu hình Tailwind
├── postcss.config.js            # PostCSS (tailwind + autoprefixer)
├── eslint.config.js             # ESLint
├── tsconfig.json                # TS config gốc
├── tsconfig.app.json            # TS config cho code app
└── tsconfig.node.json           # TS config cho file build/config
```

### Mục đích từng folder (tóm tắt)

| Folder | Trách nhiệm |
|---|---|
| `routes/` | Định nghĩa **đường dẫn URL** và bảo vệ route (auth + role). KHÔNG đặt logic UI ở đây. |
| `layouts/` | **Khung dùng chung** cho nhiều page (sidebar, topbar). Page chỉ render trong `<Outlet/>`. |
| `components/shared/` | UI **primitive tái sử dụng** xuyên feature (Button, Input...). Không phụ thuộc business logic. |
| `features/<tên>/` | **Một phân hệ tính năng** đầy đủ: page + sub-component riêng. Có thể chứa local hook/util nếu chỉ dùng nội bộ. |
| `services/` | **Tất cả call API**. UI tuyệt đối không gọi `axios` trực tiếp — luôn đi qua service. |
| `store/` | **State client** (auth, UI). KHÔNG cache server data ở đây — đã có React Query. |
| `hooks/` | Hook **tái sử dụng** cho nhiều feature (socket, debounce, media query...). |
| `types/` | **Type chung**. Type riêng của một feature đặt ngay trong file feature đó. |
| `utils/` | Helper **thuần** (không gọi API, không phụ thuộc React state). |
| `styles/` | CSS toàn cục + Tailwind. CSS riêng component thì viết trực tiếp bằng Tailwind class. |
| `assets/` | Ảnh / SVG được `import` vào code (Vite sẽ hash + bundle). Ảnh public (không hash) đặt trong `public/`. |

### Quy ước thêm code mới

1. **Thêm 1 page mới**: tạo file trong `features/<phân-hệ>/`, mount vào `routes/index.tsx`.
2. **Thêm 1 endpoint API**: thêm hàm vào `services/index.ts` (hoặc tách file riêng nếu lớn), KHÔNG gọi `axios` trực tiếp trong page.
3. **Cần state toàn cục mới**: ưu tiên TanStack Query (nếu là dữ liệu server). Chỉ thêm vào `store/` khi là state client (theme, sidebar, modal toàn cục...).
4. **UI primitive mới** (Button khác, Tag, Toggle...): bỏ vào `components/shared/`.
5. **Đặt tên file**: `PascalCase.tsx` cho component/page, `camelCase.ts` cho util/service/hook.

---

## 5. Đối chiếu mức độ hoàn thiện theo Use Case

> **Ký hiệu**: ✅ Hoàn thành · 🟡 Một phần (có service / route nhưng UI chưa đủ) · ❌ Chưa làm

### Phân hệ 1 — Authentication & Account Management

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC01 | Register Account | ✅ | [src/features/auth/RegisterPage.tsx](src/features/auth/RegisterPage.tsx) + `authService.register` |
| UC02 | Register with Google | ❌ | Chưa có Google OAuth flow (cần `@react-oauth/google` hoặc redirect endpoint BE) |
| UC03 | Verify Email | ❌ | Chưa có page verify email; type `User.isEmailVerified` đã có |
| UC04 | Log In | ✅ | [src/features/auth/LoginPage.tsx](src/features/auth/LoginPage.tsx) |
| UC05 | Log In with Google | ❌ | Chưa có |
| UC06 | Log Out | ✅ | `useLogout` trong [src/hooks/index.ts](src/hooks/index.ts) |
| UC07 | Forgot Password | ✅ | [src/features/auth/PasswordPages.tsx](src/features/auth/PasswordPages.tsx) (ForgotPasswordPage) |
| UC08 | Reset Password | ✅ | [src/features/auth/PasswordPages.tsx](src/features/auth/PasswordPages.tsx) (ResetPasswordPage) |
| UC09 | Update Profile / Upload Avatar | ✅ | [src/features/profile/ProfilePage.tsx](src/features/profile/ProfilePage.tsx) |

### Phân hệ 2 — User Management (Admin)

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC10 | Add Student | 🟡 | `adminService.createStudent` đã có; route `/admin/users` còn là placeholder ([routes/index.tsx:76](src/routes/index.tsx#L76)) |
| UC11 | Lock / Unlock Student | 🟡 | `adminService.toggleUserLock` có; UI mới có trong AdminDashboardPage, chưa có trang quản trị riêng |
| UC12 | View Student List | 🟡 | Hiển thị trong [AdminDashboardPage.tsx](src/features/admin/AdminDashboardPage.tsx); chưa có pagination / search nâng cao |
| UC13 | Update Student Information | 🟡 | `adminService.updateUser` có; UI chưa hoàn thiện |

### Phân hệ 3 — Dashboard & Analytics

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC14 | View Statistics Charts | 🟡 | [AdminDashboardPage.tsx](src/features/admin/AdminDashboardPage.tsx) đã có **stat tiles** (tổng user/course/revenue); **chưa có chart** — cần thêm thư viện (recharts / chart.js) |

### Phân hệ 4 — Course Management (Admin)

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC15 | Add New Course | ❌ | Route `/admin/courses` còn placeholder ([routes/index.tsx:84](src/routes/index.tsx#L84)); `coursesService.create` đã có ở service |
| UC16 | Edit Course Information | ❌ | Service có (`coursesService.update`); chưa có form UI |
| UC17 | Hide / Show Course | 🟡 | `adminService.toggleCoursePublish` có; chưa gắn UI riêng |
| UC18 | Delete Course | 🟡 | `adminService.deleteCourse` có; chưa gắn UI riêng |

### Phân hệ 5 — Lesson Management (Admin)

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC19 | Add Lesson to Course | ❌ | `lessonsService.create` có; chưa có form admin |
| UC20 | Edit / Upgrade Lesson | ❌ | `lessonsService.update` có; chưa có UI |
| UC21 | Lock / Unlock Lesson | ❌ | Chưa làm |
| UC22 | Delete Lesson | ❌ | `lessonsService.delete` có; chưa có UI |

### Phân hệ 6 — Course Browsing & Learning

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC23 | View Course Detail | ✅ | [CoursesPage.tsx](src/features/courses/CoursesPage.tsx) — route `/courses/:courseId` |
| UC24 | Search / Filter Courses (Vector Search) | 🟡 | Đã có ô search + filter level/tags ở FE; backend vector search là phần BE chịu trách nhiệm |
| UC25 | View Lesson | ✅ | `LessonPage` trong [features/lessons/pages.tsx](src/features/lessons/pages.tsx) |
| UC26 | Enroll in Course | ✅ | `enrollmentsService.enroll` + nút trong CoursesPage/LessonPage |
| UC27 | Complete Lesson | ✅ | `enrollmentsService.updateProgress` |
| UC28 | Track Learning Progress | ✅ | DashboardPage hiển thị progress; data từ `enrollmentsService.getMyEnrollments` |

### Phân hệ 7 — Comment System

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC29 | Add Comment in Lesson | ✅ | [CommentsSection.tsx](src/features/lessons/CommentsSection.tsx) |
| UC30 | Reply to Comment | ✅ | Hỗ trợ thread qua `parentId` |
| UC31 | Edit Comment | ✅ | Chỉ chủ comment được sửa |
| UC32 | Delete Comment | ✅ | Chủ comment / admin được xóa |

### Phân hệ 8 — Bookmark & Note

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC33 | View Lesson Bookmarks | ✅ | [BookmarksPage.tsx](src/features/lessons/BookmarksPage.tsx) |
| UC34 | Save Lesson Bookmark | ✅ | `bookmarksService.toggle` từ LessonPage |
| UC35 | Add Note in Lesson | ✅ | [NotesPanel.tsx](src/features/lessons/NotesPanel.tsx) (note + code snippet) |

### Phân hệ 9 — Quiz Management (Admin)

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC36 | Create Quiz | ❌ | `quizService.create` có; chưa có UI admin |
| UC37 | Add Question | ❌ | Chưa có UI |
| UC38 | Edit Question | ❌ | Chưa có UI |
| UC39 | Delete Question | ❌ | Chưa có UI |

### Phân hệ 10 — Quiz Runtime & History

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC40 | Take Quiz | ✅ | `QuizPage` trong [features/lessons/pages.tsx](src/features/lessons/pages.tsx) |
| UC41 | Grade Quiz | ✅ | Submit qua `quizService.submit` (BE chấm) |
| UC42 | View Quiz Result | ✅ | QuizPage hiển thị score + passed sau submit |
| UC43 | View Quiz Attempt History | ✅ | [QuizHistoryPage.tsx](src/features/quiz/QuizHistoryPage.tsx) |

### Phân hệ 11 — IDE & Code Execution

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC44 | Run Code in IDE | ❌ | **Chưa có Monaco Editor**. Cần `npm i @monaco-editor/react monaco-editor`, tạo `features/ide/` |
| UC45 | View Code Execution Output | ❌ | Chưa có panel output. Phụ thuộc BE tích hợp Judge0 |

### Phân hệ 12 — AI Features

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC46 | Submit Code & Request AI Recommendation | 🟡 | [AIPage.tsx](src/features/ai/AIPage.tsx) hiện đang là **course recommendation**, chưa hỗ trợ submit code và nhận phân tích đa luồng |
| UC47 | View AI Chat / Analysis History | 🟡 | `aiService.getHistory` đã có; UI hiển thị danh sách lịch sử nhưng chưa có chat-style |

### Phân hệ 13 — Gamification & Leaderboard

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC48 | Accumulate XP (XP Engine) | ✅ | XP do BE cấp; FE nhận event `xp:awarded` qua [useSocket.ts](src/hooks/useSocket.ts) |
| UC49 | View User Level | ✅ | `UserStats.level` hiển thị ở ProfilePage / DashboardPage |
| UC50 | View Leaderboard | ✅ | [LeaderboardPage.tsx](src/features/leaderboard/LeaderboardPage.tsx) — top 50 + my rank |

### Phân hệ 14 — Subscription, Payment & Notifications

| UC | Mô tả | Trạng thái | Vị trí code |
|---|---|---|---|
| UC51 | Manage Service Plans (Admin) | ❌ | Chưa có UI; `User.planType` đã có trong type |
| UC52 | Purchase Feature Plan | ❌ | Chưa tích hợp cổng thanh toán |
| UC53 | View Notifications | ✅ | [NotificationsPage.tsx](src/features/notifications/NotificationsPage.tsx) + toast realtime qua socket |

---

## 6. Tổng kết mức độ hoàn thiện

| Phân hệ | ✅ | 🟡 | ❌ | Tổng |
|---|---|---|---|---|
| 1. Authentication | 6 | 0 | 3 | 9 |
| 2. User Management (Admin) | 0 | 4 | 0 | 4 |
| 3. Dashboard & Analytics | 0 | 1 | 0 | 1 |
| 4. Course Management (Admin) | 0 | 2 | 2 | 4 |
| 5. Lesson Management (Admin) | 0 | 0 | 4 | 4 |
| 6. Browsing & Learning | 5 | 1 | 0 | 6 |
| 7. Comment System | 4 | 0 | 0 | 4 |
| 8. Bookmark & Note | 3 | 0 | 0 | 3 |
| 9. Quiz Management (Admin) | 0 | 0 | 4 | 4 |
| 10. Quiz Runtime | 4 | 0 | 0 | 4 |
| 11. IDE & Code Execution | 0 | 0 | 2 | 2 |
| 12. AI Features | 0 | 2 | 0 | 2 |
| 13. Gamification | 3 | 0 | 0 | 3 |
| 14. Subscription / Notifications | 1 | 0 | 2 | 3 |
| **Tổng** | **26** | **10** | **17** | **53** |

→ **Hoàn thành đầy đủ ~49%**, **làm dở ~19%**, **chưa làm ~32%**.

### Việc ưu tiên kế tiếp (gợi ý)

1. **IDE phân hệ 11** — cài `@monaco-editor/react`, tạo `features/ide/`, kết nối Judge0 qua BE.
2. **Admin CRUD (phân hệ 4, 5, 9)** — thay các route placeholder trong [routes/index.tsx:76-87](src/routes/index.tsx#L76-L87) bằng page thật.
3. **Google OAuth (UC02, UC05)** — cài `@react-oauth/google`, dùng `VITE_GOOGLE_CLIENT_ID` đã khai báo.
4. **Email verify page (UC03)** — thêm route `/verify-email?token=...`.
5. **AI cho code đa luồng (UC46, UC47)** — chuyển AIPage từ recommend-course sang submit-code + chat UI.
6. **Payment (UC51, UC52)** — tích hợp cổng (VNPay / MoMo / Stripe).
7. **Charts UC14** — thêm `recharts` để vẽ biểu đồ user/revenue theo thời gian.

---

## 7. Realtime (Socket.IO)

Sự kiện FE đang lắng nghe trong [src/hooks/useSocket.ts](src/hooks/useSocket.ts):

| Event | Tác dụng |
|---|---|
| `notification` | Invalidate query notifications + hiển thị toast |
| `xp:awarded` | Invalidate gamification stats |
| `leaderboard:update` | Invalidate leaderboard query |

BE phát các event này trong các flow: hoàn thành bài, pass quiz, level-up, đổi rank, gửi thông báo hệ thống.

---

## 8. Quy tắc làm việc nhóm

- **Branch**: `feature/<uc-id>-<slug>` (ví dụ `feature/uc44-monaco-ide`).
- **Commit**: viết ngắn gọn, mô tả "tại sao", ưu tiên tiếng Anh. Một commit = một mục đích.
- **PR**: ghi rõ UC số mấy, ảnh chụp màn hình UI nếu là feature visual.
- **Trước khi push**: chạy `npm run lint` và `npm run build` để chắc không lỗi TS.
- **KHÔNG commit** `.env`, `node_modules/`, `dist/`.
