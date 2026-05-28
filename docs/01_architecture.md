# Architecture & Project Structure

Tài liệu này giải thích lý do tại sao dự án chuyển từ Vite sang Next.js 15, cách hoạt động của App Router, và kiến trúc phân chia mã theo Feature.

## 1. Tại sao lại là Next.js 15 App Router?

Trong quá trình phát triển ThreadLearn, dự án đã chuyển đổi từ **Vite + React Router** sang **Next.js 15 App Router**. 

### Server Components vs Client Components
Mặc định trong Next.js 15 App Router, mọi component đều là **Server Component**. Tuy nhiên, ThreadLearn là một **Single Page Application (SPA)** với rất nhiều tương tác client-side (Zustand persist state, Socket.io, TanStack Query cache).
Do đó, chúng ta chủ động thêm chỉ thị `'use client'` ở đầu các page và component tương tác. Dù được render dưới dạng Client Components, Next.js vẫn cung cấp:
- **Hệ thống Routing file-based** mạnh mẽ và trực quan thay vì quản lý hàng loạt route trong file index.
- **Khả năng tối ưu hoá file tĩnh** (Image, Font) và Bundling xịn xò (Turbopack/Webpack).

## 2. Kiến trúc Feature-First (`src/features/`)

Thay vì tổ chức code theo loại file (tất cả components vào `components/`, tất cả pages vào `pages/`), chúng ta tổ chức code theo **Tính năng (Feature)**.

### Cấu trúc một Feature
Mỗi thư mục bên trong `src/features/` đại diện cho một mảng nghiệp vụ:
```
src/features/lessons/
├── BookmarksPage.tsx    # Giao diện chính của Bookmark
├── CommentsSection.tsx  # Component hiển thị danh sách Comment (chỉ dùng trong lesson)
├── NotesPanel.tsx       # Component hiển thị Ghi chú (chỉ dùng trong lesson)
└── pages.tsx            # Export các màn hình LessonPage, QuizPage
```

### Lợi ích
- **Tính đóng gói (Encapsulation):** Những component phụ thuộc nội bộ sẽ nằm gọn trong thư mục feature, không làm "rác" thư mục `components/shared/`.
- **Khả năng mở rộng:** Khi cần sửa đổi phân hệ Quiz, lập trình viên chỉ cần tìm trong `features/quiz/` mà không cần duyệt qua cả hệ thống.

## 3. Thư mục `app/` làm nhiệm vụ gì?

Trong khi toàn bộ logic hiển thị và xử lý nằm ở `src/features/`, thư mục `app/` chỉ làm nhiệm vụ **Routing (Định tuyến)**:

```tsx
// app/(app)/dashboard/page.tsx
'use client';
import { DashboardPage } from '@/features/courses/DashboardPage';

export default function Dashboard() {
  return <DashboardPage />;
}
```
**Quy tắc:** Tuyệt đối không viết logic phức tạp hay styling đồ sộ trực tiếp vào các file trong `app/`. Hãy import các Component từ `src/features/` để giữ thư mục `app/` luôn sạch sẽ và tập trung vào routing.
