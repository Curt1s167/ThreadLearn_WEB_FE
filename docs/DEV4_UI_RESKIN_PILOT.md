# DEV4 — UI Reskin Branch Notes

> **Working branch:** `feat/ui-light-theme-reskin`  
> **Base:** latest `origin/develop`  
> **Legacy WIP (same tree, do not continue):** `feat/dev4-ui-reskin-pilot-demo-pages`  
> **Goal:** Full light **demo visual** language + keep service / React Query / toast / auth flow.

Xem thêm:

- `docs/DEV4_FE_PROTECTED_SURFACE.md` — lock surface Dev4  
- `docs/DESIGN_WHITE_THEME_RESKIN.md` — design + **PR tracker đầy đủ**

---

## PR progress (clean history on `feat/ui-light-theme-reskin`)

| PR | Nội dung | Status | Commit | Trang test |
|----|----------|--------|--------|------------|
| docs | Design + trackers | ✅ Done | `c4d5515` | — |
| PR1 | Tokens + shared light primitives + toaster | ✅ Done | `457a312` | — |
| PR2 | Light shell Sidebar/Topbar/DashboardLayout | ✅ Done | `c6fc543` | Shell sau login |
| PR3 | Repo-wide contrast bridge | ✅ Done | `0d40c83` | Quiz/pricing/admin đọc được |
| PR4 | Pilot layout polish = Demo\*Page | ✅ Done | `369bebf` | `/dashboard`, `/leaderboard`, `/quiz/history` |
| PR5 | Auth light + 403/404 | ✅ Done | `d5e1ff6` | `/login`, `/register`, `/forgot-password`, `/403` |
| PR6 | Quiz take + attempt detail fidelity | ✅ Done | `c356005` | `/quiz/[lessonId]`, `/quiz/attempts/[id]` |
| PR7 | Pricing / payment fidelity | ✅ Done | `4f91d3c` | `/pricing`, callback, mock VNPay |
| PR8 | Admin quizzes / plans fidelity | ✅ Done | `8cf3be0` | `/admin/quizzes`, `/admin/plans`, `/admin` |
| **PR9** | **XP widget / profile** | ✅ **Done** | `04be21b` | **`/profile`** |
| PR10 | Courses / lessons demo (Dev4 sau PR6–9) | ⬜ Pending | — | `/courses`, `/lessons/[id]` |

```bash
git log --oneline origin/develop..feat/ui-light-theme-reskin
```

---

## Pilot pages (đã làm)

| Route | File | API (giữ) | UI demo |
|-------|------|-----------|---------|
| `/dashboard` | `src/features/courses/DashboardPage.tsx` | stats, enrollments, resume, myRank | DemoDashboard layout |
| `/leaderboard` | `LeaderboardPage.tsx` + `LeaderboardContent.tsx` | `getTop`, `getMyRank` | DemoLeaderboard layout |
| `/quiz/history` | `src/features/quiz/QuizHistoryPage.tsx` | `getMyAttempts` | DemoQuizHistory layout |
| `/quiz/[lessonId]` | `QuizPage.tsx` | take + submit + timer | DemoQuiz 2-col |
| `/quiz/attempts/[id]` | `QuizAttemptDetailPage.tsx` | getAttemptById | Light demo polish |

Helpers: `src/features/ui-reskin/demo-ui.tsx`

---

## Cách chạy thử

```bash
cd ThreadLearn_WEB_FE
git checkout feat/ui-light-theme-reskin
npm run dev
```

---

## Chưa làm

| Hạng mục | PR |
|----------|-----|
| ~~Pricing / payment polish~~ | ~~PR7~~ ✅ |
| ~~Admin quizzes / plans polish~~ | ~~PR8~~ ✅ |
| ~~XP widget / profile~~ | ~~PR9~~ ✅ |
| Courses list / lesson room full demo | **PR10 (next)** |
