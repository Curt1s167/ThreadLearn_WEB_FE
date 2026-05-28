# API Integration & Realtime (Socket)

## 1. Giao tiếp API qua Axios (`src/services/apiClient.ts`)

Toàn bộ ứng dụng không bao giờ gọi hàm `axios` trực tiếp trong Component. Các lời gọi API được tổ chức thành các class Service (ví dụ `coursesService`, `authService`).

### Axios Interceptors
`apiClient.ts` cấu hình một Axios Instance với 2 tầng chặn (Interceptors) quan trọng:

1. **Request Interceptor (Gửi Token):**
   Mỗi khi Axios gửi Request đi, Interceptor sẽ truy xuất `accessToken` từ `auth.store` (Zustand) và tự động gắn vào Header `Authorization: Bearer <token>`. Lập trình viên không cần phải tự truyền token ở mỗi API call.

2. **Response Interceptor (Tự động Refresh Token):**
   Khi Backend trả về mã lỗi `401 Unauthorized` (Token hết hạn):
   - Interceptor sẽ bắt lỗi này, tạm dừng Request cũ.
   - Gửi yêu cầu lấy token mới (Refresh Token) tới Backend.
   - Nếu thành công, cập nhật Token vào Zustand và tự động gửi lại Request cũ. Người dùng sẽ không hề cảm nhận được gián đoạn.
   - Nếu Refresh Token cũng hết hạn, tự động đăng xuất người dùng và đẩy ra `/login`.

---

## 2. Hệ thống Realtime (`src/hooks/useSocket.ts`)

Ngoài REST API, ThreadLearn sử dụng WebSocket (`socket.io-client`) để cung cấp trải nghiệm Gamification trực tiếp mà không cần load lại trang.

### Cơ chế kết nối
- Hook `useSocket` được gọi duy nhất 1 lần ở cấp cao nhất của hệ thống nội bộ (bên trong `DashboardLayout`).
- Khi user được chứng thực, Socket sẽ kết nối tới `NEXT_PUBLIC_SOCKET_URL` và gửi sự kiện `join_user_room` với `userId`. Backend sẽ đưa user vào phòng chat riêng của họ.

### Các sự kiện lắng nghe (Event Listeners)
Hook này cài đặt các Listener toàn cục:
- **`notification`**: Khi có thông báo mới, hệ thống hiển thị một Toast (Sonner) ở góc màn hình và yêu cầu TanStack Query làm mới danh sách `['notifications']`.
- **`xp:awarded`**: Cập nhật lại UI thông báo số lượng kinh nghiệm nhận được và làm mới dữ liệu Gamification.
- **`leaderboard:update`**: Kích hoạt việc làm mới bảng xếp hạng khi có thay đổi.

### Hủy kết nối
Khi người dùng đăng xuất, Socket sẽ tự động đóng kết nối để giải phóng tài nguyên hệ thống.
