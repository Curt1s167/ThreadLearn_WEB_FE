# DEV4 — UI Reskin Pilot Branch

> **Branch:** `feat/dev4-ui-reskin-pilot-demo-pages`  
> **Base:** current BE-integrated FE (`fix/e2e-access-ux` / develop lineage)  
> **Goal:** Thử **full page UI** (layout + theme + motion) lấy cảm hứng từ `refactor/fe-next-demo-flow`, trong khi **giữ** service / React Query / toast lỗi / auth flow.

Xem thêm:

- `docs/DEV4_FE_PROTECTED_SURFACE.md` — lock surface Dev4  
- `docs/DESIGN_WHITE_THEME_RESKIN.md` — design + **PR tracker đầy đủ**

---

## PR progress (cập nhật 2026-07-13)

| PR | Nội dung | Status | Commit | Trang test |
|----|----------|--------|--------|------------|
| PR1 | Tokens + shared light primitives + toaster | ✅ Done | `b686428` | — |
| PR2 | Light shell Sidebar/Topbar/DashboardLayout | ✅ Done | `b686428` | Shell sau login |
| PR3 | Repo-wide contrast bridge | ✅ Done | `b686428` | Quiz/pricing/admin đọc được |
| PR4 | Pilot layout polish = Demo\*Page | ✅ Done | `606faeb` | `/dashboard`, `/leaderboard`, `/quiz/history` |
| PR5 | Auth light + flip root cream | ✅ Done | `75705ca` | `/login`, `/register`, `/forgot-password`, `/403` |
| **PR6** | **Quiz take + attempt detail fidelity** | ✅ **Done** | **`215c5cf`** | **`/quiz/[lessonId]`**, **`/quiz/attempts/[id]`** |
| PR7 | Pricing / payment fidelity | ⬜ Pending | — | `/pricing` |
| PR8 | Admin quizzes / plans fidelity | ⬜ Pending | — | `/admin/quizzes`, `/admin/plans` |
| PR9 | XP widget / profile | ⬜ Pending | — | `/profile` |
| PR10 | Courses / lessons demo (Dev4 sau PR6–9) | ⬜ Pending | — | `/courses`, `/lessons/[id]` |

**Pilot seed (trước merge unit):** `165ff26`  
**Merge unit PR1–PR3:** `b686428`  
**PR4 polish:** `606faeb`

---

## Pilot pages (đã làm trên branch này)

| Route | File | API (giữ) | UI demo |
|-------|------|-----------|---------|
| `/dashboard` | `src/features/courses/DashboardPage.tsx` | stats, enrollments, resume, myRank | Full layout DemoDashboard (hero, streak, cards, grid courses) |
| `/leaderboard` | `LeaderboardPage.tsx` + `LeaderboardContent.tsx` | `getTop`, `getMyRank` | Full DemoLeaderboard (dark hero + white table + motion) |
| `/quiz/history` | `src/features/quiz/QuizHistoryPage.tsx` | `getMyAttempts` | Full DemoQuizHistory (pink pill + table rows) |

Helpers UI-only: `src/features/ui-reskin/demo-ui.tsx`  
(`UI_PLACEHOLDERS`, `DemoPill`, `DemoPageRoot` / heroes, `formatXp` — **không** thay business data).

### PR4 — trang test bắt buộc

| # | URL | Kỳ vọng visual (demo) | Kỳ vọng data |
|---|-----|----------------------|--------------|
| 1 | `/dashboard` | Hero ink + streak lime + 3 stats + 2 course cards (Demo CourseCard) + AI/activity aside | stats / enrollments / resume API |
| 2 | `/leaderboard` | Hero ink + rows `#rank \| name \| Level \| XP`, highlight you lime | getTop + getMyRank |
| 3 | `/quiz/history` | Hero white + pink pill + rows title/score/Passed·Retry/XP | getMyAttempts |

Shell: `DashboardLayout` light (PR2) — **chưa** full markup `DemoAppShell` (nav collapse, header product). Full shell demo-like more = polish later / still product IA.

---

## Hardcode / placeholder (cố ý)

| Placeholder | Lý do |
|-------------|--------|
| Season label leaderboard | BE chưa có season |
| Quiz attempt title từ `quizId` slice | List attempts chưa embed quiz title |
| `+XP` khi pass nhưng thiếu `xpRewarded` | Field optional |
| AI coach “3 of 5 reviews” | Chưa có usage API |
| Recent activity list | Chưa có activity feed API |
| Weekday streak strip fill | Layout demo; **số ngày streak** vẫn từ API |
| Course card accent colors | Trang trí |

---

## Cách chạy thử

```bash
cd ThreadLearn_WEB_FE
git checkout feat/dev4-ui-reskin-pilot-demo-pages
npm run dev
```

Đăng nhập student → mở:

1. `/dashboard`
2. `/leaderboard`
3. `/quiz/history`

Tắt BE / sai token → phải thấy **error/retry** (không fake data rank/XP).

---

## Chưa làm (phase sau)

| Hạng mục | PR |
|----------|-----|
| ~~Auth full cream + root body cream~~ | ~~PR5~~ ✅ |
| ~~Quiz take layout demo (giữ countdown/submit)~~ | ~~PR6~~ ✅ |
| Pricing / payment polish | PR7 |
| Admin quizzes / plans polish | PR8 |
| Profile / XP widget polish | PR9 |
| Courses list / lesson room full demo | PR10 |
| Shell 100% markup DemoAppShell (optional) | ngoài PR4 — product shell đã light |

---

## Quyết định sau pilot

- **OK visual + API ổn** → tiếp **PR5** hoặc **PR6**.  
- **Lệch shell vs DemoAppShell** → polish Sidebar/Topbar markup thêm (vẫn giữ bootstrap/socket/admin).  
- **Không ưng** → `git checkout` branch cũ; pilot branch không merge.
