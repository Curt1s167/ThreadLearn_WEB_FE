# DEV4 — FE Protected Surface & UI Reskin Guide

> **Mục đích:** Khóa phần FE đã gắn BE thuộc scope Dev4, và hướng dẫn lấy **giao diện** từ nhánh `refactor/fe-next-demo-flow` mà **không phá cấu trúc / bố cục / wiring** của nhánh hiện tại.
>
> **Người phụ trách:** Dev4 (Quiz, Quiz Attempts, Gamification, Leaderboard, Subscription)
>
> **Base branch bắt buộc:** nhánh hiện tại đã integrate BE (`fix/e2e-access-ux` / `develop`) — **không** checkout `refactor/fe-next-demo-flow` làm base.
>
> **Tham chiếu BE:**  
> - `ThreadLearn_WEB_BE/docs/DEV4_WORKFLOW.md`  
> - `ThreadLearn_WEB_BE/docs/DEV4_SUMMARY_AND_TESTING_GUIDE.md`

---

## 0. TL;DR

| Muốn | Không được |
|------|------------|
| Lấy **visual** (màu, card, spacing, typography, motion) từ demo shell | Thay route sang `Demo*Page` / `demo-data` |
| Giữ **cấu trúc ban đầu** của app đã integrate (App Router, `DashboardLayout`, services, feature pages) | Merge/checkout nhánh refactor làm nguồn code chính |
| Reskin từng màn Dev4 (quiz, leaderboard, pricing, admin plans/quizzes) | Đụng path API / body / unwrap `data.data` |

**Một câu:** Demo = skin reference. Current = skeleton + data layer. Reskin = bọc skin lên skeleton, không thay skeleton.

---

## 1. “Cấu trúc & bố cục ban đầu” nghĩa là gì?

Trên nhánh **hiện tại** (đúng với team sau khi FE–BE integrate), cấu trúc chuẩn là:

```
app/
  (auth)/          → LoginPage, RegisterPage, PasswordPages (real authService)
  (app)/layout.tsx → DashboardLayout  (Sidebar + Topbar + auth bootstrap + socket)
  (app)/* /page.tsx→ thin wrapper import feature page

src/
  layouts/         → DashboardLayout, Sidebar, Topbar   ← shell app (GIỮ)
  services/        → apiClient + *Service               ← API layer (GIỮ)
  store/           → auth, ui                           ← GIỮ
  features/<domain>/ → *Page containers (useQuery + UI) ← GIỮ logic, chỉ đổi JSX
  features/demo/   → DemoAppShell + Demo*Page + demo-data ← CHỈ reference visual
  components/shared/ → CourseCard, Skeleton, Modal…     ← mở rộng nếu cần
```

### So với `refactor/fe-next-demo-flow` (chỉ để copy visual)

| Thành phần | Refactor (demo) | Ban đầu / current (GIỮ) |
|------------|-----------------|-------------------------|
| App shell | `DemoAppShell` (nền sáng `#f7f4ee`) | `DashboardLayout` + `Sidebar` + `Topbar` (nền tối, bootstrap + socket) |
| Route courses | `DemoCoursesPage` + mock | `CoursesPage` + `coursesService` |
| Route quiz | `DemoQuizPage` + mock | `QuizPage` + `quizService` + countdown + access UX |
| Admin plans / quizzes | **Không có** | **Có** — giữ nguyên route + page |
| Pricing / payment | **Không có** | **Có** — giữ nguyên |
| Data | `demo-data.ts` | `src/services/*` + React Query |

**Kết luận quan hệ Git:** `refactor/fe-next-demo-flow` là **tổ tiên** của current. Current đã chứa file demo + thêm ~87 commit BE. Không cần merge refactor; chỉ **đọc** file demo để port className/JSX.

---

## 2. Scope UC Dev4 (lock theo BE)

| Block | UC | FE surface chính |
|-------|-----|------------------|
| B1 | UC36–39 Admin quiz + questions | `/admin/quizzes`, `AdminQuizManagementPage`, `AdminQuizForm`, `quizService` admin methods |
| B2 | UC40–43 Student take/submit/history/detail | `/quiz/*`, `QuizPage`, `QuizHistoryPage`, `QuizAttemptDetailPage` |
| B3 | UC48–49 XP / level / streak | `gamificationService`, `XpLevelStreakWidget`, stats trên Dashboard/Profile |
| B4 | UC50 Leaderboard | `/leaderboard`, `LeaderboardPage`, `LeaderboardContent`, socket rank |
| B5 | UC51–52 Plans + purchase | `/admin/plans`, `/pricing`, callback, mock VNPay, `subscriptionService` |
| Cross | Guard admin | `app/(app)/admin/layout.tsx` → non-admin `/403` |

Ngoài scope (auth, courses list/detail, lessons, comments, notes, bookmarks, AI, IDE, admin users/courses stub): **không bắt buộc reskin Dev4**. Giữ page + API call hiện có.

---

## 3. Protected surface — KHÔNG ĐƯỢC thay bằng Demo*

### 3.1 Services & types (LOCK — chỉ sửa nếu BE contract đổi)

| File | Object / methods lock |
|------|------------------------|
| `src/services/apiClient.ts` | JWT interceptor, refresh, base URL |
| `src/services/index.ts` | `quizService`, `gamificationService`, `leaderboardService`, `subscriptionService` |
| `src/services/auth.service.ts` | Không thuộc UC Dev4 nhưng **không được phá** (login → test flow) |
| `src/types/index.ts` | `Quiz`, `QuizAttempt`, `QuizSubmitResult`, `UserStats`, `LeaderboardEntry`, `SubscriptionPlan`, `UserSubscription`, plan/purchase payloads |

**Contract path bắt buộc (khớp BE testing guide):**

| Method | Path |
|--------|------|
| Student get quiz | `GET /quiz/lesson/:lessonId` |
| Submit | `POST /quiz/submit` |
| History | `GET /quiz/attempts/me` |
| Attempt detail | `GET /quiz/attempts/:attemptId` |
| Admin list/create quiz | `GET|POST /quiz` |
| Admin quiz by id | `GET|PUT|DELETE /quiz/:id` |
| Questions | `POST|PUT|DELETE /quiz/:id/questions[/:questionId]` |
| Stats | `GET /gamification/stats` |
| Leaderboard | `GET /leaderboard`, `GET /leaderboard/me` |
| Plans | `GET|POST /subscription/plans`, `PUT|DELETE /subscription/plans/:id` |
| Purchase / me | `POST /subscription/purchase`, `GET /subscription/my-subscription` |

### 3.2 Routes & feature pages (LOCK logic + data hooks)

| Route | Wrapper | Feature (logic GIỮ) |
|-------|---------|---------------------|
| `/admin/quizzes` | `app/(app)/admin/quizzes/page.tsx` | `AdminQuizManagementPage`, `AdminQuizForm` |
| `/admin/plans` | `app/(app)/admin/plans/page.tsx` | `AdminPlanManagementPage` |
| `/admin/*` | `app/(app)/admin/layout.tsx` | Role guard |
| `/quiz/[lessonId]` | `app/(app)/quiz/[lessonId]/page.tsx` | `QuizPage` (countdown, auto-submit, access) |
| `/quiz/history` | … | `QuizHistoryPage` |
| `/quiz/attempts/[attemptId]` | … | `QuizAttemptDetailPage` |
| `/leaderboard` | … | `LeaderboardPage` + `LeaderboardContent` |
| `/pricing` | … | `PricingPage` + `PricingPlans` |
| `/pricing/callback` | … | `PaymentResultPage` |
| `/mock-payment/vnpay` | … | mock payment flow |
| `/profile` (XP widget) | … | `ProfileGamificationPage` / `XpLevelStreakWidget` |

### 3.3 Shell / cross-cutting (LOCK hành vi)

| File | Phải giữ |
|------|----------|
| `app/(app)/layout.tsx` | Import **`DashboardLayout`** (không đổi sang `DemoAppShell` thuần) |
| `src/layouts/DashboardLayout.tsx` | `useAuthBootstrap`, `useSocket`, auth redirect, `ErrorBoundary` |
| `src/layouts/Sidebar.tsx` | Nav student + **admin Quizzes / Plans** |
| `src/hooks/useSocket.ts` | Events XP / leaderboard (nếu BE emit) |
| `src/hooks/index.ts` | `useAuthBootstrap` load stats |

### 3.4 Cấm tuyệt đối

```text
❌ git checkout refactor/fe-next-demo-flow  (mất BE wiring)
❌ app/(app)/layout.tsx → <DemoAppShell>  mà không port bootstrap/socket/admin
❌ page.tsx export DemoQuizPage / DemoLeaderboardPage thay feature page
❌ import data từ demo-data.ts cho màn production
❌ Đổi path/method/body service Dev4 cho “khớp mock”
❌ Xóa /admin/plans, /admin/quizzes, /pricing, quiz attempts routes
```

---

## 4. Cách lấy UI từ refactor mà vẫn đúng cấu trúc ban đầu

### 4.1 Mô hình đúng

```
┌──────────────────────────────────────────────────────────┐
│  app/(app)/layout.tsx                                    │
│    DashboardLayout (CẤU TRÚC BAN ĐẦU — GIỮ)              │
│      Sidebar + Topbar  ← được phép RESKIN className      │
│      {children}                                          │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│  Feature *Page (CẤU TRÚC BAN ĐẦU — GIỮ)                  │
│    useQuery / mutation → services                        │
│    loading / error / empty                               │
│    handlers (submit, purchase, CRUD…)                    │
│    JSX + Tailwind  ← LẤY CẢM HỨNG TỪ demo pages          │
└──────────────────────────────────────────────────────────┘
                             ▲
                             │ copy visual only
┌────────────────────────────┴─────────────────────────────┐
│  features/demo/pages.tsx + DemoAppShell (REFERENCE ONLY) │
│  origin/refactor/fe-next-demo-flow (đọc, không base)     │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Hai lựa chọn skin (chọn 1, đừng trộn nửa vời)

| Option | Mô tả | Khuyến nghị Dev4 |
|--------|--------|------------------|
| **A. Reskin dark shell hiện tại** | Giữ `DashboardLayout` tối; port card/spacing/motion từ demo vào *Page | **Khuyến nghị** — ít rủi ro, đúng “bố cục ban đầu” |
| **B. Light shell kiểu demo** | Port visual `DemoAppShell` **vào** `Sidebar`/`Topbar`/`DashboardLayout` (màu `#f7f4ee`, nav trắng), **vẫn** giữ bootstrap + socket + admin links | Chỉ khi cả team muốn light theme toàn app |

**Không chọn:** swap layout file sang `DemoAppShell` nguyên bản (mất admin nav, pricing, bootstrap, socket).

### 4.3 Quy trình reskin 1 màn (lặp lại)

1. Mở file **real**: ví dụ `src/features/quiz/QuizPage.tsx`.
2. Mở file **demo reference**: `src/features/demo/pages.tsx` → `DemoQuizPage` (hoặc `git show origin/refactor/fe-next-demo-flow:src/features/demo/pages.tsx`).
3. **Giữ nguyên:** imports service, `useQuery`/`useMutation`, state nghiệp vụ, guards, timer, toast lỗi API.
4. **Thay:** markup + className (card, pill, header, button style) theo demo.
5. **Map field:** demo mock → field API thật (`id`/`_id`, `timeLimitSeconds`, `score`, `xpRewarded`…).
6. Chạy checklist §6 cho màn đó.
7. Commit nhỏ: `style(quiz): reskin QuizPage from demo shell visual`.

### 4.4 Thứ tự reskin đề xuất (Dev4 only)

| Phase | Màn | Source visual gợi ý | Rủi ro |
|-------|-----|---------------------|--------|
| P0 | Shell: Sidebar / Topbar (className only) | `DemoAppShell` nav | Trung bình — ảnh hưởng mọi trang |
| P1 | `LeaderboardPage` + `LeaderboardContent` | `DemoLeaderboardPage` | Thấp |
| P2 | `QuizHistoryPage`, `QuizAttemptDetailPage` | `DemoQuizHistoryPage` | Thấp |
| P3 | `QuizPage` | `DemoQuizPage` | **Cao** — giữ countdown + auto-submit + access |
| P4 | `PricingPage` / `PricingPlans` / `PaymentResultPage` | demo không có → tự align token | Trung bình |
| P5 | `AdminQuiz*` / `AdminPlan*` | demo không có → align token admin | Trung bình |
| P6 | `XpLevelStreakWidget` + stats cards trên Dashboard | demo dashboard cards | Thấp — **không** xóa API enrollments/resume của dev khác |

**Ngoài scope:** courses, lessons, auth, AI — chỉ làm nếu block E2E (ví dụ CTA “Start quiz” từ lesson).

---

## 5. Việc Dev4 cần làm NGAY (action plan)

### Bước 1 — Chuẩn bị branch (5 phút)

```bash
cd ThreadLearn_WEB_FE
git fetch origin
git checkout fix/e2e-access-ux   # hoặc develop đã có BE
git pull
git checkout -b feat/dev4-ui-reskin-demo-visual
```

### Bước 2 — Chốt skin

- [ ] Chọn **Option A** (dark shell reskin) **hoặc** **Option B** (light shell port vào DashboardLayout).
- [ ] Ghi quyết định vào PR description.

### Bước 3 — Reskin theo phase §4.4

- [ ] P0 shell (nếu cần thống nhất visual toàn app)
- [ ] P1 leaderboard
- [ ] P2 quiz history / attempt detail
- [ ] P3 quiz take (cẩn thận)
- [ ] P4 pricing / payment
- [ ] P5 admin quiz + plans
- [ ] P6 XP widget

Mỗi phase: 1 PR nhỏ hoặc 1 commit rõ ràng + checklist §6.

### Bước 4 — Không làm

- [ ] Không merge `refactor/fe-next-demo-flow`
- [ ] Không đổi service path
- [ ] Không thay route Dev4 bằng `Demo*Page`
- [ ] Không refactor courses/lessons trừ khi vỡ link vào quiz

### Bước 5 — Verify trước khi báo xong (từ DEV4 testing guide)

1. Admin login → `/admin/plans` tạo plan.
2. Student → `/pricing` purchase → mock payment → `my-subscription` active.
3. Quiz có `timeLimitSeconds` → countdown + auto submit.
4. Pass quiz → `GET /gamification/stats` XP tăng; leaderboard me cập nhật.
5. `/admin/quizzes` CRUD + add/edit/delete question.
6. Non-admin `/admin/*` → `/403`.
7. `/quiz/history` + attempt detail load đúng.

---

## 6. Checklist nghiệm thu UI reskin (PASS/FAIL)

| # | Tiêu chí | PASS khi |
|---|----------|----------|
| 1 | Cấu trúc ban đầu | Vẫn `DashboardLayout` (hoặc shell đã port đủ bootstrap/socket/admin) |
| 2 | Route Dev4 | Vẫn trỏ feature page real, không `Demo*` |
| 3 | API | Network tab đúng path §3.1 |
| 4 | Quiz timer | Countdown + auto submit còn |
| 5 | Admin guard | Non-admin → 403 |
| 6 | Payment | Callback/mock không kẹt skeleton |
| 7 | Visual | Card/spacing/typography gần demo, **không** còn mock banner “Demo mode” trên production shell |
| 8 | Out-of-scope | Courses/lessons/auth vẫn chạy (smoke) |

---

## 7. File map nhanh — copy visual từ đâu

| Real (sửa JSX) | Demo reference (chỉ đọc) |
|----------------|---------------------------|
| `src/layouts/Sidebar.tsx` | `src/features/demo/DemoAppShell.tsx` (nav + logo) |
| `src/layouts/Topbar.tsx` | header phụ trong `DemoAppShell` |
| `src/features/quiz/QuizPage.tsx` | `DemoQuizPage` trong `features/demo/pages.tsx` |
| `src/features/quiz/QuizHistoryPage.tsx` | `DemoQuizHistoryPage` |
| `src/features/leaderboard/*` | `DemoLeaderboardPage` |
| `src/features/gamification/XpLevelStreakWidget.tsx` | stats cards trong `DemoDashboardPage` / `DemoProfilePage` |
| `src/features/subscription/*` | **không có demo** → dùng token chung sau khi chốt P0 |
| `src/features/admin/AdminQuiz*` | **không có demo** → token chung |
| `src/features/admin/AdminPlan*` | **không có demo** → token chung |

Lệnh xem bản gốc refactor (nếu local demo đã bị sửa):

```bash
git show origin/refactor/fe-next-demo-flow:src/features/demo/pages.tsx | less
git show origin/refactor/fe-next-demo-flow:src/features/demo/DemoAppShell.tsx | less
```

---

## 8. Protected file list (paste vào PR)

```
# LOCK — logic / API (review kỹ nếu diff)
src/services/apiClient.ts
src/services/index.ts          # quizService, gamificationService, leaderboardService, subscriptionService
src/services/auth.service.ts
src/types/index.ts
src/layouts/DashboardLayout.tsx
src/hooks/useSocket.ts
src/hooks/index.ts
app/(app)/layout.tsx
app/(app)/admin/layout.tsx

# LOCK logic — reskin JSX OK
src/features/quiz/QuizPage.tsx
src/features/quiz/QuizHistoryPage.tsx
src/features/quiz/QuizAttemptDetailPage.tsx
src/features/leaderboard/LeaderboardPage.tsx
src/features/leaderboard/LeaderboardContent.tsx
src/features/gamification/XpLevelStreakWidget.tsx
src/features/subscription/PricingPage.tsx
src/features/subscription/PricingPlans.tsx
src/features/subscription/PaymentResultPage.tsx
src/features/admin/AdminQuizManagementPage.tsx
src/features/admin/AdminQuizForm.tsx
src/features/admin/AdminPlanManagementPage.tsx
src/layouts/Sidebar.tsx
src/layouts/Topbar.tsx

# REFERENCE ONLY — không wire làm route production
src/features/demo/**
```

---

## 9. Lịch sử / ghi chú

| Ngày | Ghi chú |
|------|--------|
| 2026-07-13 | Tạo file: lock surface Dev4 + plan reskin visual từ `refactor/fe-next-demo-flow` trên base current. |
| 2026-07-13 | Design full light theme approved. Implementation tracker: `docs/DESIGN_WHITE_THEME_RESKIN.md` (top table). |
| 2026-07-13 | **PR1–PR3 done** (`b686428` merge unit). **PR4 done** (`606faeb`) — test `/dashboard`, `/leaderboard`, `/quiz/history`. Branch `feat/dev4-ui-reskin-pilot-demo-pages`. |
| 2026-07-13 | **PR5 done** — light auth shell + 403/404. |
| 2026-07-13 | **PR6 done** — DemoQuiz layout (2-col) + attempt detail; timer/auto-submit unchanged. |
| 2026-07-13 | **History rebuild:** branch **`feat/ui-light-theme-reskin`** from latest `origin/develop` with atomic commits docs→PR1…PR6. Continue work here (not on `feat/dev4-ui-reskin-pilot-demo-pages`). |
| 2026-07-13 | **PR7 done** (`4f91d3c`) — pricing/payment demo-light UI. |
| 2026-07-13 | **PR8 done** (`8cf3be0`) — admin quiz/plan tables + dashboard light fidelity; CRUD/modals locked. Test `/admin/quizzes`, `/admin/plans`, `/admin`. Next: PR9 profile/XP. |
| 2026-07-14 | **PR9 done** (`04be21b`) — profile 2-col DemoProfile layout + XpLevelStreakWidget light cards; avatar upload + getStats locked. Test `/profile`. Next: PR10 courses/lessons. |
| 2026-07-14 | **PR10 done** — courses catalog/detail + lesson room + bookmarks demo fidelity; CourseCard shared restyle; list/enroll/complete/bookmark/notes/comments APIs locked. Test `/courses`, `/courses/[id]`, `/lessons/[id]`, `/bookmarks`. |

**Cập nhật khi:** thêm màn Dev4, đổi contract BE, hoặc team chốt Option A/B skin / land PR mới.
