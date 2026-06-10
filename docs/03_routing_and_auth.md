# Routing & Authentication Guards

Trong quá trình chuyển đổi sang Next.js App Router, hệ thống Routing của dự án dựa trên kiến trúc file-system (thay vì các thẻ `<Route>` truyền thống).

## 1. Route Groups
Thư mục `app/` sử dụng ngoặc đơn `()` để tạo **Route Groups**. Route Group cho phép chúng ta chia layout mà không ảnh hưởng tới URL path.

### `app/(auth)`
- **Mục đích:** Dành cho khách (chưa đăng nhập).
- **Các trang:** `/login`, `/register`, `/forgot-password`, `/reset-password`.
- **Layout (`app/(auth)/layout.tsx`):**
  Thực hiện chức năng **Guest Guard**. Layout kiểm tra state `isAuthenticated` từ Zustand, nếu người dùng ĐÃ đăng nhập, họ sẽ bị `redirect` về `/dashboard`.

### `app/(app)`
- **Mục đích:** Dành cho học viên/admin (đã đăng nhập).
- **Các trang:** `/dashboard`, `/courses`, `/lessons`, `/admin`,...
- **Layout (`app/(app)/layout.tsx`):**
  Thực hiện chức năng **Auth Guard**. 
  1. Kiểm tra nếu CHƯA đăng nhập, `redirect` về `/login`.
  2. Bọc toàn bộ các trang con bằng `<DashboardLayout />` (Sidebar + Topbar).
  3. **Role-based Guard:** Nếu route bắt đầu bằng `/admin` nhưng người dùng không phải là `ADMIN`, `redirect` về trang `/403` (Forbidden).

## 2. Dynamic Routing

- File có ngoặc vuông `[ ]` tạo ra các Dynamic Route.
- `app/(app)/courses/[courseId]/page.tsx` sẽ match với `/courses/123`.
- Trong code của Component, ta lấy `courseId` thông qua hook `useParams()` của `next/navigation`.

## 3. Search Parameters (Query String)

Khi muốn đọc/ghi query parameters (ví dụ: `/courses?search=react`), chúng ta sử dụng `useSearchParams()` từ `next/navigation`. 
Do Next.js 15 mặc định tạo các trang static rendering, việc gọi `useSearchParams` trực tiếp ở mức cao nhất của Page sẽ gây lỗi khi build. Do đó, tất cả các Page sử dụng hook này phải được bọc trong một ranh giới `<Suspense>`.
