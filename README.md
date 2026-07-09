# ThreadLearn — Frontend

Nền tảng học lập trình đa luồng tích hợp AI (WDP301). Đây là **repo Frontend** xây dựng bằng **Next.js 15 (App Router)** + React 19 + TypeScript, kết nối tới Backend Node.js/Express qua REST API và Socket.IO.

> Tài liệu này dành cho các thành viên trong team. Bạn cũng có thể tìm thấy toàn bộ tài liệu giải thích chuyên sâu về lý thuyết và cách hoạt động của hệ thống trong thư mục `docs/`.

---

## 1. Yêu cầu môi trường

- **Node.js** ≥ 18 (khuyến nghị 20+)
- **npm** ≥ 9
- Backend chạy ở `http://localhost:5000` (Next.js đã được cấu hình proxy `/api` sang BE — xem `next.config.ts`)

## 2. Cài đặt & chạy

```bash
npm install         # cài dependencies
npm run dev         # chạy dev server ở http://localhost:3001
npm run build       # build cho production (tạo thư mục .next/)
npm run start       # chạy production server
npm run lint        # chạy ESLint
```

### Biến môi trường (`.env`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

*(Lưu ý: Do sử dụng Next.js, các biến môi trường lộ ra client phải có tiền tố `NEXT_PUBLIC_` thay vì `VITE_`)*

---

## 3. Tech Stack

| Lớp | Thư viện | Vai trò |
|---|---|---|
| Framework | Next.js 15 (App Router) | Routing, Caching, Bundle 최적화 |
| UI Framework | React 19 | Component model |
| Styling | Tailwind CSS 3 + PostCSS | Utility-first CSS, dark theme |
| State (client) | Zustand 5 | Auth store, UI store (persist localStorage) |
| State (server) | TanStack Query 5 | Cache, refetch, mutation dữ liệu từ Server |
| HTTP | Axios | Interceptor inject JWT, auto-refresh 401 |
| Form | React Hook Form + Zod | Validate schema |
| Realtime | socket.io-client | Notifications / XP / leaderboard |
| Markdown | react-markdown + remark-gfm | Render bài học |
| Toast | Sonner | Notify UI |

---

## 4. Tài liệu chi tiết (Thư mục `docs/`)

Để hiểu sâu về lý thuyết và kiến trúc hệ thống, vui lòng tham khảo các tài liệu sau trong thư mục `docs/`:

- [01_architecture.md](./docs/01_architecture.md): Lý thuyết App Router, SPA trong Next.js, kiến trúc Feature-first.
- [02_state_management.md](./docs/02_state_management.md): Giải thích Zustand (Client state) và TanStack Query (Server state).
- [03_routing_and_auth.md](./docs/03_routing_and_auth.md): Cơ chế Route Groups `(auth)`, `(app)`, và bảo mật route (Layout Guards).
- [04_api_and_realtime.md](./docs/04_api_and_realtime.md): Cơ chế tự động đính token với Axios Interceptors và xử lý Realtime (Socket.IO).

---

## 5. Cấu trúc thư mục

```
ThreadLearn_WEB_FE/
├── app/                         # App Router của Next.js
│   ├── layout.tsx               # Root Layout (chứa Providers, global css)
│   ├── page.tsx                 # Redirect mặc định
│   ├── (auth)/                  # Route group cho Khách (chưa login)
│   └── (app)/                   # Route group cho User (đã login, có Dashboard Layout)
│
├── src/
│   ├── components/
│   │   └── shared/              # Component UI dùng chung (Button, Card, Input)
│   │   └── providers/           # Các wrapper Provider (QueryClient, Toaster)
│   │
│   ├── features/                # Mã chia theo phân hệ tính năng (Feature-first)
│   │   ├── auth/                # Chứa các trang UI Đăng nhập, Đăng ký...
│   │   ├── courses/             # UI Dashboard, danh sách khóa học
│   │   ├── lessons/             # UI Bài học, Bookmark, Comment, Note
│   │   └── ...                  # Các phân hệ khác
│   │
│   ├── services/                # Lớp gọi API (Axios). Toàn bộ endpoint của BE
│   ├── store/                   # State client toàn cục (Zustand)
│   ├── hooks/                   # Custom hook (useSocket, useAuthBootstrap)
│   ├── types/                   # Type Interface chung của toàn dự án
│   ├── utils/                   # Hàm Helper tiện ích
│   └── styles/                  # globals.css
│
├── docs/                        # Tài liệu mô tả hệ thống
├── public/                      # Static assets
├── next.config.ts               # Cấu hình Next.js & Proxy
└── tailwind.config.js           # Cấu hình TailwindCSS
```

## 6. Quy tắc làm việc nhóm

- **Branch**: `feature/<uc-id>-<slug>` (ví dụ `feature/uc44-monaco-ide`).
- **Commit**: viết ngắn gọn, mô tả "tại sao", ưu tiên tiếng Anh. Một commit = một mục đích.
- **Trước khi push**: chạy `npm run lint` và `npm run build` để chắc không lỗi TS.
