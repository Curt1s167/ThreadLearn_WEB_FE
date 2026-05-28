# State Management

Dự án sử dụng chiến lược **tách biệt State** để tối ưu hóa hiệu suất và dễ dàng bảo trì:
1. **Client State** (Trạng thái UI, phiên đăng nhập, tùy chọn của người dùng): Quản lý bằng **Zustand**.
2. **Server State** (Dữ liệu từ API, danh sách khóa học, tiến độ học tập): Quản lý bằng **TanStack Query (React Query)**.

---

## 1. Client State với Zustand (`src/store/`)

Zustand được chọn thay vì Redux vì tính gọn nhẹ, API đơn giản, và không yêu cầu thiết lập boilerplate dài dòng.

### a. `auth.store.ts`
Chịu trách nhiệm lưu trữ phiên người dùng và trạng thái đăng nhập.
- **Dữ liệu lưu trữ:** `user`, `accessToken`, `refreshToken`, và `stats` (XP, Level, Streak).
- **Middleware Persist:** Zustand sẽ tự động đồng bộ state này vào `localStorage`. Khi người dùng F5 hoặc tắt trình duyệt, trạng thái đăng nhập vẫn được giữ nguyên.
- **Hydration:** Khi dùng Next.js, việc render ở server không có `localStorage`, do đó Zustand được cấu hình để chờ ứng dụng mount trên Client rồi mới áp dụng state từ `localStorage` để tránh lỗi Hydration mismatch.

### b. `ui.store.ts`
Chịu trách nhiệm lưu trữ các trạng thái giao diện toàn cục.
- **Dữ liệu lưu trữ:** trạng thái đóng/mở sidebar (`sidebarCollapsed`) và giao diện sáng/tối (`theme`).
- Cũng sử dụng Persist middleware để lưu lựa chọn giao diện của người dùng.

---

## 2. Server State với TanStack Query

Mọi tương tác fetch dữ liệu từ Backend REST API đều đi qua `useQuery` và `useMutation` thay vì sử dụng `useEffect` truyền thống.

### Tại sao dùng TanStack Query?
- **Caching tự động:** Nếu bạn vừa vào trang `/courses`, sau đó sang trang `/profile` rồi quay lại `/courses`, dữ liệu sẽ hiển thị ngay lập tức từ cache thay vì tải lại (loading) từ đầu.
- **Background Refetch:** React Query sẽ tự động gọi lại API ngầm (refetch) khi người dùng đổi tab trình duyệt hoặc kết nối mạng lại, đảm bảo dữ liệu luôn mới nhất.
- **Đơn giản hóa loading/error state:** Hook trả về sẵn trạng thái `isLoading`, `isError`, giúp loại bỏ việc tự quản lý state thủ công.

### Quy trình sử dụng
1. Giao diện (Component) gọi React Query Hook.
2. Hook gọi hàm từ lớp `src/services/` (chứa logic Axios).
3. Query trả kết quả về UI.
4. Khi cần cập nhật dữ liệu (VD: thêm Bookmark), dùng `useMutation`, khi hoàn tất gọi `queryClient.invalidateQueries({ queryKey: ['bookmarks'] })` để làm mới dữ liệu.
