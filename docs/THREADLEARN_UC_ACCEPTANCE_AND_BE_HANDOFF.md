# ThreadLearn UC Acceptance And BE Handoff

Ngay cap nhat: 2026-07-17  
Nhanh FE hien tai: `fix/dev1-fe-acceptance` tren nen `feat/ui-light-theme-reskin`  
Nhanh giao dien tham chieu: `refactor/fe-next-demo-flow`

## 1. Muc Dich

Tai lieu nay dung de nghiem thu muc do hoan thien FE theo 53 use case cua ThreadLearn va chi ro cac phan BE can cap nhat de team tiep tuc thay mock data bang luong that.

Huong tich hop hien tai:

- Giu lai cac luong da ket noi BE neu content va logic dung.
- Giao dien uu tien theo nhanh demo light theme.
- Cac phan chua co BE hoac BE chua du truong thi giu mock/fallback de demo du flow.
- Khi BE tra du du lieu, FE se uu tien du lieu that truoc va tu dong giam phu thuoc mock.

## 2. Luu Y Stack Thuc Te

Mo ta du an ban dau ghi `React + Vite`, nhung FE hien tai dang chay bang:

- `Next.js 15` App Router
- `React 19`
- `Tailwind CSS`
- `TanStack Query`
- `Zustand`
- `Socket.IO Client`

Do do BE can doi chieu theo route/service hien tai cua FE, khong theo cau truc Vite cu.

## 3. Quy Uoc Trang Thai

| Trang thai | Y nghia |
| --- | --- |
| `Done` | FE da co UI va dang goi BE endpoint that. |
| `Partial` | Da co mot phan UI/API, nhung thieu flow, thieu DTO, thieu trang admin, hoac chua du nghiem thu. |
| `Mock` | Dang hien fallback/demo data de giu giao dien day du. Can BE bo sung de thay bang du lieu that. |
| `Missing` | Chua co UI hoac chua co service/endpoint ro rang trong FE. |

## 4. Nguyen Tac Mock Data Hien Tai

Mock/fallback hien duoc giu co chu dich trong:

- `src/features/ui-reskin/demo-fallbacks.ts`
- `/dashboard`: fallback enrollment/course progress neu user chua co enrollment.
- `/courses`: fallback course cards neu API loi hoac data rong.
- `/courses/[courseId]`: fallback lesson/outcome/tag/media neu BE thieu truong.
- `/lessons/[id]`: code runner va AI hint dang la demo UI, notes/comments/bookmark/complete van goi BE.
- `/bookmarks`: fallback bookmarks neu rong.
- `/notifications`: fallback notifications neu API loi hoac rong.
- `/ai`: sample code, mock latest result/history neu chua co history.
- `/leaderboard`: fallback ranking neu API loi hoac rong.
- `/pricing`: fallback plans neu BE chua co plan.
- `/ide`: dang dung `DemoIDEPage`, chua phai Monaco/Judge0 production flow.

Quy tac thay mock: BE tra data dung contract thi FE dung data that; khong can xoa mock ngay lap tuc cho den khi tung dev xac nhan flow cua minh on dinh.

## 5. Route Va Service Dang Ton Tai

### Auth And User

Routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/auth/callback`
- `/profile`

Services:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google` redirect
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email` voi body `{ email, code }`
- `POST /auth/resend-verification` voi body `{ email }`
- `POST /auth/refresh`
- `GET /users/profile`
- `PATCH /users/profile`
- `POST /users/avatar`

Email verification flow hien tai da doi sang OTP 6 so:

- Sau register, BE tao OTP 6 so va gui ve email.
- FE redirect user sang `/verify-email?email=<encoded-email>`.
- User nhap OTP 6 so tren FE.
- FE goi `POST /auth/verify-email` voi body `{ email, code }`.
- OTP het han sau 10 phut.
- OTP sai qua 5 lan se bi tu choi theo logic BE.
- Resend verification goi `POST /auth/resend-verification` voi body `{ email }` de tao OTP moi.
- BE khong gui verify link token nua.
- FE khong verify bang query `token` nua. Neu URL cu co `token`, FE hien thong bao flow cu khong con dung va yeu cau nhap email + OTP.
- Reset password van giu flow token link rieng va khong doi sang OTP trong phase nay.

### Learning

Routes:

- `/dashboard`
- `/courses`
- `/courses/[courseId]`
- `/lessons/[id]`

Services:

- `GET /courses`
- `GET /courses/:id`
- `POST /courses`
- `PUT /courses/:id`
- `POST /courses/:courseId/thumbnail`
- `GET /lessons?courseId=...`
- `GET /lessons/:id`
- `POST /lessons`
- `PUT /lessons/:id`
- `DELETE /lessons/:id`
- `POST /lessons/:id/complete`
- `POST /enrollments`
- `GET /enrollments/me`
- `POST /enrollments/:id/progress`
- `GET /students/me/resume`

### Interaction, IDE, AI

Routes:

- `/ide`
- `/ai`
- `/bookmarks`
- `/notifications`

Services:

- `GET /comments`
- `POST /comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`
- `GET /bookmarks`
- `POST /bookmarks/toggle`
- `GET /notes?lessonId=...`
- `POST /notes`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `POST /ai/recommendation`
- `GET /ai/history`

Realtime:

- Socket event `notification`
- Socket event `leaderboard:update`
- Socket event `xp:awarded`

### Quiz, Gamification, Subscription

Routes:

- `/quiz/[lessonId]`
- `/quiz/history`
- `/quiz/attempts/[attemptId]`
- `/leaderboard`
- `/pricing`
- `/pricing/callback`
- `/mock-payment/vnpay`

Services:

- `GET /quiz`
- `GET /quiz/:id`
- `GET /quiz/lesson/:lessonId`
- `GET /quiz/attempts/:attemptId`
- `POST /quiz`
- `PUT /quiz/:id`
- `DELETE /quiz/:id`
- `POST /quiz/:id/questions`
- `PUT /quiz/:id/questions/:questionId`
- `DELETE /quiz/:id/questions/:questionId`
- `POST /quiz/submit`
- `GET /quiz/attempts/me`
- `GET /gamification/stats`
- `GET /leaderboard?limit=...`
- `GET /leaderboard/me`
- `GET /subscription/plans`
- `GET /subscription/plans/:id`
- `POST /subscription/plans`
- `PUT /subscription/plans/:id`
- `DELETE /subscription/plans/:id`
- `GET /subscription/my-subscription`
- `POST /subscription/purchase`
- `POST /subscription/webhook/payment`

### Admin

Routes:

- `/admin`
- `/admin/users`
- `/admin/courses`
- `/admin/quizzes`
- `/admin/plans`

Services:

- `GET /admin/stats`
- `GET /admin/dashboard/statistics`
- `GET /admin/students`
- `POST /admin/students`
- `PATCH /admin/students/:id`
- `PATCH /admin/students/:id/lock`
- `PATCH /admin/students/:id/unlock`
- `PATCH /courses/:id/publish`
- `DELETE /courses/:id`

Luu y:

- `/admin/users` da co table/form/action that cho student management UC10-UC13 tren nhanh `fix/dev1-fe-acceptance`.
- `/admin` da co stats cards va statistics summary/charts UI cho UC14.
- `/admin/courses` hien van la placeholder UI, du service wrapper da co san.

## 6. Nghiem Thu Theo Dev Va UC

### DEV 1 - Authentication, User Management, Dashboard, Payment And Notification

| UC | Ten UC | FE hien tai | BE/action can chot |
| --- | --- | --- | --- |
| UC01 | Register Account | `Done` | Register gui `firstName`, `lastName`, `email`, `password`. Sau register, BE gui OTP 6 so ve email; FE redirect sang `/verify-email?email=<encoded-email>`. |
| UC02 | Register with Google | `Done` | FE co route `/auth/callback`, nhan `accessToken`, `refreshToken`, `user`, `error`, luu auth vao store va redirect khoi URL co token. |
| UC03 | Verify Email | `Done` | Flow da doi sang OTP 6 so. FE `/verify-email` nhap email + OTP, goi `POST /auth/verify-email` body `{ email, code }`. Resend goi `POST /auth/resend-verification` body `{ email }`. OTP het han sau 10 phut, toi da 5 lan sai. |
| UC04 | Log In | `Done` | FE goi `/auth/login`, luu `user`, `accessToken`, `refreshToken`. Can dam bao locked/unverified user tra error message ro. |
| UC05 | Log In with Google | `Done` | FE goi BE Google redirect va xu ly callback tai `/auth/callback`. |
| UC06 | Log Out | `Done` | FE logout qua store/token local. Neu BE co revoke refresh token thi co the them endpoint sau. |
| UC07 | Forgot Password | `Done` | FE goi `/auth/forgot-password`. BE tra message an toan, khong leak email ton tai. |
| UC08 | Reset Password | `Done` | FE goi `/auth/reset-password`. Reset password van dung link token rieng, khong doi sang OTP trong phase nay. |
| UC09 | Update Profile / Upload Avatar | `Done` | FE co `PATCH /users/profile` va `POST /users/avatar`. Profile/gamification UI da co fallback an toan khi stats thieu field. |
| UC10 | Add Student | `Done` | `/admin/users` da co UI tao student, body `{ email, firstName, lastName, password? }`. |
| UC11 | Lock / Unlock Student | `Done` | `/admin/users` da co action lock/unlock, lock body `{ lockedReason? }`, unlock khong can body. |
| UC12 | View Student List | `Done` | `/admin/users` da co table, pagination, search, filter `isActive`, `isVerified`. |
| UC13 | Update Student Information | `Done` | `/admin/users` da co update form, chi gui fields duoc phep: `firstName`, `lastName`, `avatarUrl`, `isVerified`. |
| UC14 | View Statistics Charts | `Done` | `/admin` doc `/admin/stats` va `/admin/dashboard/statistics`, ho tro `summary`, `charts`, fallback rong/loading/error an toan. |
| UC53 | View Notifications | `Partial` | FE goi notifications va socket, co fallback mock. Can BE chot event payload va notification types. |

Can DEV 1 uu tien / ghi chu sau cap nhat:

- `/admin/users` da co table/form/action cho UC10-UC13.
- Google OAuth callback da chot ve FE route `/auth/callback`.
- Verify email da doi sang OTP 6 so, khong dung verify link token nua.
- Can live smoke OTP flow voi SMTP/mailbox:
  - register account moi
  - nhan OTP 6 so qua email
  - verify tai `/verify-email?email=<email>`
  - login thanh cong sau khi verified
- Can live smoke `/admin/users` voi admin credential va seed data that.
- Notification payload realtime van can chot: `id`, `title`, `message`, `type`, `metadata`, `link`, `createdAt`.
- Response `/admin/stats` can ho tro:
  - `totalUsers`
  - `totalCourses`
  - `totalEnrollments`
  - `totalQuizAttempts`
  - optional `courseCompletionRate`
  - optional `quizPassRate`
- FE co fallback tam thoi `totalUsers ?? totalStudents ?? 0` de tuong thich du lieu cu.
- `/admin/dashboard/statistics` can tra `{ summary, charts }`; FE da co UI fallback khi du lieu rong/thieu field.

### DEV 2 - Course, Lesson And Learning Experience

| UC | Ten UC | FE hien tai | BE/action can chot |
| --- | --- | --- | --- |
| UC15 | Add New Course | `Partial` | Service co `POST /courses`; `/admin/courses` con placeholder, chua co form tao. |
| UC16 | Edit Course Information | `Partial` | Service co `PUT /courses/:id`; UI admin chua co edit. |
| UC17 | Hide / Show Course | `Partial` | Service co `PATCH /courses/:id/publish`; UI admin chua co control. |
| UC18 | Delete Course | `Partial` | Service co `DELETE /courses/:id`; UI admin chua co confirm/action. |
| UC19 | Add Lesson to Course | `Partial` | Service co `POST /lessons`; admin lesson UI chua co. |
| UC20 | Edit / Upgrade Lesson | `Partial` | Service co `PUT /lessons/:id`; admin lesson UI chua co. |
| UC21 | Lock / Unlock Lesson | `Partial` | Type co `isLocked`, nhung service/action rieng lock/unlock chua ro. |
| UC22 | Delete Lesson | `Partial` | Service co `DELETE /lessons/:id`; admin lesson UI chua co. |
| UC23 | View Course Detail | `Done` | `/courses/[courseId]` goi BE, co fallback khi thieu lessons/tags/media. |
| UC24 | Search / Filter Courses | `Partial` | `/courses` co search/filter basic. MongoDB Vector Search chua co contract ro. |
| UC25 | View Lesson | `Partial` | `/lessons/[id]` goi BE va render markdown. Guest free lesson access/rbac can chot. |
| UC26 | Enroll in Course | `Done` | FE goi `POST /enrollments`. Can BE chot duplicate enrollment va premium restriction. |
| UC27 | Complete Lesson | `Done` | FE goi `POST /lessons/:id/complete`. Can BE tra `xpAwarded`, `enrollment`. |
| UC28 | Track Learning Progress | `Partial` | Dashboard/doc progress tu enrollments, co fallback. Can BE chot `progress`, `completedLessons`, `lastLessonId`, `totalLessons`. |

Can DEV 2 uu tien:

- Hoan thien BE DTO cho course detail:
  - `course._id`, `title`, `description`, `shortDescription`, `thumbnailUrl`, `tags`, `level`, `language`, `isPublished`, `isPremium`, `totalLessons`, `totalEnrollments`, `estimatedDuration`.
  - `lessons[]`: `_id`, `courseId`, `title`, `content` hoac `contentMarkdown`, `duration`, `order` hoac `orderIndex`, `isLocked`, `videoUrl`, `attachments`.
- Lam ro quyen Guest: course detail xem duoc, lesson free dau tien xem duoc, lesson locked tra 403 hay metadata locked.
- Chot search/filter params: `search`, `level`, `language`, `tags`, `page`, `limit`.
- Neu co Vector Search, BE nen tra cung shape voi `GET /courses` de FE khong can tach UI.
- Hoan thien `/admin/courses` va lesson authoring UI hoac cung cap endpoint chuan de FE noi.

### DEV 3 - Comment, Bookmark, Note, IDE And AI

| UC | Ten UC | FE hien tai | BE/action can chot |
| --- | --- | --- | --- |
| UC29 | Add Comment in Lesson | `Done` | FE goi `POST /comments` voi `targetType=LESSON`, `targetId`. |
| UC30 | Reply to Comment | `Done` | FE gui `parentId`; can BE tra nested/flat comment on dinh. |
| UC31 | Edit Comment | `Done` | Trong spec dang bi typo `Ednt`; FE co `PATCH /comments/:id`. |
| UC32 | Delete Comment | `Done` | Trong spec dang typo `Delete Comit Commement`; FE co `DELETE /comments/:id`. |
| UC33 | View Lesson Bookmarks | `Partial` | `/bookmarks` goi BE, co fallback neu rong. Can BE populate lesson/course title/link. |
| UC34 | Save Lesson Bookmark | `Done` | FE goi `/bookmarks/toggle` tu lesson page. |
| UC35 | Add Note in Lesson | `Done` | FE goi `GET /notes?lessonId` va `POST /notes`. |
| UC44 | Run Code in IDE | `Mock` | `/ide` va lesson code runner chua goi Judge0. Can BE code execution endpoint. |
| UC45 | View Code Execution Output | `Mock` | Console output dang demo. Can BE tra stdout/stderr/status/time/memory. |
| UC46 | Submit Code And Request AI Recommendation | `Partial` | `/ai` goi `/ai/recommendation`; lesson inline AI hint dang mock. Can BE chot quota va response chi tiet. |
| UC47 | View AI Chat / Analysis History | `Partial` | `/ai/history` da goi BE, co fallback sample neu rong. |
| UC53 | View Notifications | `Partial` | Dung chung DEV1 notification service/socket. |

Can DEV 3 uu tien:

- Bo sung production IDE:
  - FE can Monaco editor (`@monaco-editor/react` hien chua co trong dependency).
  - BE can endpoint chay code qua Judge0 hoac code execution system.
- De xuat contract code execution:
  - `POST /code-executions/run`
  - Request: `language`, `sourceCode`, `stdin?`, `lessonId?`
  - Response: `id`, `status`, `stdout`, `stderr`, `compileOutput`, `timeMs`, `memoryKb`, `testCases?`
- Chot AI response:
  - `response`, `suggestions[]`, `raceConditions[]`, `optimizedCode`, `explanation`, `tokenUsage`, `modelName`, `status`, `category`.
- Chot quota Premium/Free:
  - Free 10 lan/ngay.
  - Premium 30-40 lan/ngay.
  - BE nen tra remaining quota trong response hoac endpoint rieng.
- Chot bookmark response co du `targetId`, `title`, `lessonId`, `anchorText`, `position`, `tags`, `createdAt`.

### DEV 4 - Quiz, Gamification, Leaderboard And Subscription

| UC | Ten UC | FE hien tai | BE/action can chot |
| --- | --- | --- | --- |
| UC36 | CRUD Quiz | `Done` | `/admin/quizzes` goi list/create/update/delete quiz. Can BE on dinh payload. |
| UC37 | Add Question | `Done` | FE goi `POST /quiz/:id/questions`. |
| UC38 | Edit Question | `Done` | FE goi `PUT /quiz/:id/questions/:questionId`. |
| UC39 | Delete Question | `Done` | FE goi `DELETE /quiz/:id/questions/:questionId`. |
| UC40 | Take Quiz | `Done` | `/quiz/[lessonId]` lay quiz theo lesson va submit answers. |
| UC41 | Grade Quiz | `Done` | FE goi `/quiz/submit`; grading nam o BE/System. |
| UC42 | View Quiz Result | `Done` | `/quiz/attempts/[attemptId]` lay attempt detail. |
| UC43 | View Quiz Attempt History | `Done` | `/quiz/history` goi `/quiz/attempts/me`. |
| UC48 | Accumulate XP | `Partial` | FE doc `/gamification/stats`, socket `xp:awarded`. Can BE chot trigger XP sau quiz/lesson. |
| UC49 | View User Level | `Partial` | Topbar/profile/dashboard doc level/xp; can BE chot stats shape. |
| UC50 | View Leaderboard | `Partial` | `/leaderboard` goi BE, co fallback mock neu rong/loi. |
| UC51 | Manage Service Plans | `Done` | `/admin/plans` co list/create/update/delete. |
| UC52 | Purchase Feature Plan | `Partial` | `/pricing` purchase goi BE; co mock payment route. Can BE chot payment gateway/webhook flow. |

Can DEV 4 uu tien:

- Chot quiz DTO:
  - `Quiz`: `_id`, `lessonId`, `title`, `description`, `questions[]`, `xpReward`, `timeLimit` hoac `timeLimitSeconds`, `passingScore` hoac `passingScorePercent`.
  - `Question`: `_id`, `questionText`, `options[]`, `correctAnswerIndex`.
  - `Submit result`: `attempt`, `score`, `passed`, `xpRewarded`, `passingScorePercent`, `isTimeout`.
- Chot attempt history/detail co du `answers`, `score`, `passed`, `timeTaken`, `startedAt`, `completedAt`, `xpRewarded`.
- Chot gamification stats: `xp`, `level`, `streak/currentStreak`, `totalLessonsCompleted`, `quizzesCompleted`, `coursesCompleted`.
- Chot leaderboard entry: `rank`, `userId`, `name`, `avatar`, `xp`, `level`.
- Chot subscription/payment:
  - `SubscriptionPlan`: `_id`, `name`, `description`, `price`, `currency`, `durationDays`, `features[]`, `isActive`.
  - `purchase` nen tra `paymentUrl` neu thanh toan that, hoac `status=succeeded` neu mock/dev mode.

## 7. Cac Diem Thieu Lon So Voi Mo Ta Du An

1. IDE production chua hoan thien.
   - Hien `/ide` la demo page.
   - Lesson page co mock code runner.
   - Chua co Monaco Editor/Judge0 that trong FE.

2. AI premium flow chua day du.
   - FE co trang `/ai` goi analyze/history.
   - Chua co hien quota 10/ngay va 30-40/ngay.
   - Chua co AST visualization hay warning race condition day du trong UI lesson.

3. Admin course/lesson management con placeholder.
   - `/admin/users` da co CRUD/action UI cho student management UC10-UC13.
   - `/admin` da co dashboard stats va statistics/charts UI cho UC14.
   - `/admin/courses` van con placeholder, chua co CRUD table/form that.
   - Admin lesson authoring UI chua hoan thien.

4. Course search chua xac nhan Vector Search.
   - FE dang gui filter/search basic.
   - Neu BE lam MongoDB Vector Search thi can giu response shape nhu courses list.

5. Guest/free lesson policy can chot.
   - Mo ta yeu cau guest xem danh sach, hoc thu bai dau tien, gui lien he.
   - FE hien co route protected layout cho app; can chot route nao public va BE tra quyen ra sao.

6. Contact flow cua Guest chua thay trong FE route hien tai.
   - Neu day la UC bat buoc, can them route/form va endpoint.

7. Java support chua ro.
   - Mo ta uu tien JavaScript va Java neu co thoi gian.
   - FE/BE contract can chot `language` accepted values cho course, IDE, AI.

## 8. Checklist BE Can Cap Nhat De FE Bo Mock

### Contract Chung

- Tat ca response theo shape:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

- Moi entity nen co `_id`; FE co normalize them `id` nhung `_id` van la chinh.
- Date tra ISO string.
- Error tra message ro trong `message`.

### Auth Contract Sau Cap Nhat OTP

Register:

```http
POST /auth/register
```

Request:

```json
{
  "firstName": "Hoang",
  "lastName": "Nguyen",
  "email": "user@example.com",
  "password": "password"
}
```

Expected behavior:

- BE tao user unverified.
- BE tao OTP 6 so.
- BE luu hash OTP, expiry, attempts, last sent timestamp.
- BE gui email OTP.
- BE khong tra OTP, verification token, password hash trong response.
- FE redirect sang `/verify-email?email=<encoded-email>`.

Verify email:

```http
POST /auth/verify-email
```

Request:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Expected behavior:

- `email` required va valid email.
- `code` required, exactly 6 digits.
- OTP het han sau 10 phut.
- Sai OTP tang attempt count.
- Toi da 5 lan sai.
- Thanh cong thi set `isVerified=true` va clear OTP hash/expiry/attempt/last-sent fields.
- Already verified user co the tra success safe message.
- Khong log OTP/code/token/password.

Resend verification:

```http
POST /auth/resend-verification
```

Request:

```json
{
  "email": "user@example.com"
}
```

Expected behavior:

- BE tao OTP moi va thay the OTP cu.
- BE gui email OTP moi.
- Existing unverified users theo token cu can bam resend verification de nhan OTP moi.
- Khong leak user existence neu policy bao mat yeu cau message an toan.

### Seed Data Can Co De Demo Khong Dung Mock

- It nhat 3 courses published:
  - 1 JavaScript beginner/free.
  - 1 JavaScript concurrent/intermediate.
  - 1 Java/Premium neu kip.
- Moi course co it nhat 2-4 lessons.
- Moi lesson co markdown content, duration/order, lock/free flag.
- Moi lesson nen co 1 quiz neu nam trong flow quiz.
- It nhat 5 leaderboard users.
- It nhat 2 subscription plans.
- It nhat 3 notification mau cho user demo.
- It nhat 1 enrollment co progress de dashboard hien that.
- It nhat 1 admin account de smoke `/admin`, `/admin/users`, `/admin/dashboard/statistics`.
- It nhat 2-3 student accounts co trang thai khac nhau:
  - verified/unverified
  - active/locked

### Endpoint/Flow Uu Tien Cao

1. Verify live OTP email verification flow:
   - register account moi
   - nhan OTP 6 so qua email
   - verify bang `/verify-email?email=<email>`
   - login thanh cong sau khi verified

2. Verify live `/admin/users` data/action UC10-UC13 voi admin credential va seed data that:
   - list
   - search
   - filter `isActive`
   - filter `isVerified`
   - create
   - update
   - lock
   - unlock

3. Verify live `/admin/stats` va `/admin/dashboard/statistics` UC14 voi admin credential:
   - cards
   - summary
   - charts
   - empty/loading/error fallback

4. `/admin/courses` va lesson authoring cho UC15-UC22.

5. `/code-executions/run` hoac endpoint tuong duong cho UC44-UC45.

6. AI quota/history response day du cho UC46-UC47.

7. Payment purchase/callback/webhook that cho UC52.

8. Public/guest access policy cho course detail va free lesson.

## 9. Ghi Chu Ve Use Case List

Danh sach UC user dua co mot so diem can sua lai truoc khi dua vao SRS/final report:

- DEV 3 co typo:
  - `UC31: Ednt` nen la `UC31: Edit Comment`.
  - `UC32: Delete Comit Commement` nen la `UC32: Delete Comment`.
- Notification `UC53` dang duoc gan DEV3, nhung ve module co lien quan DEV1. Nen thong nhat owner chinh/phu.
- Payment xuat hien o DEV1 vai tro chinh nhung UC51-UC52 nam DEV4. Nen thong nhat:
  - DEV4 owner subscription/payment flow.
  - DEV1 ho tro user plan state va notification payment.
- Mo ta ban dau co 4 phan he chinh, nhung final UC da tach thanh 4 dev theo ownership. Khi update BE nen lay UC table lam source of truth.
- Email verification da doi tu verify link token sang OTP 6 so. Neu SRS/final report con ghi token link thi can update lai de tranh lech contract.

## 10. Ket Luan Nghiem Thu Hien Tai

FE hien tai da co bo route chinh va giao dien light-theme cho phan Student/Pricing/Leaderboard/AI/Course/Lesson, dong thoi van giu cac API call da tich hop BE.

Sau cap nhat gan nhat tren nhanh `fix/dev1-fe-acceptance`, DEV1 FE acceptance da dat muc `PASS WITH CAVEATS`:

- Auth register/login/logout/forgot/reset da co UI va service.
- Google OAuth callback da co route `/auth/callback`.
- Verify email da doi tu verify link token sang OTP 6 so.
- Profile/avatar co UI va profile/gamification fallback an toan.
- Admin users UC10-UC13 da co UI day du tren `/admin/users`, nhung can live smoke voi admin credential.
- Admin dashboard statistics UC14 da co stats cards, summary va charts/fallback UI, nhung can live smoke voi admin credential.

Email verification flow moi:

- BE gui OTP 6 so qua email sau register/resend.
- FE hien `/verify-email` voi email input va 6 o OTP.
- FE goi `POST /auth/verify-email` body `{ email, code }`.
- OTP het han sau 10 phut va toi da 5 lan sai.
- Existing unverified users theo token cu can bam resend verification de nhan OTP moi.
- Reset password van dung reset token link rieng va khong thay doi trong phase nay.

Tuy nhien muc do hoan thien full product chua dat 100% vi con cac khoang trong lon:

- Admin courses/lessons chua CRUD UI day du.
- IDE/Judge0 chua production.
- AI quota/deep analysis chua day du.
- Guest/contact/free lesson policy chua ro.
- Mot so man hinh dang fallback mock de dam bao demo UI khong bi trong.

Muc tieu tiep theo la tung dev BE cap nhat endpoint/DTO theo bang tren. Sau khi BE co data that, FE se nghiem thu lai tung route va giam dan mock trong `src/features/ui-reskin/demo-fallbacks.ts`.