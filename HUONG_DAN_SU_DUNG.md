# Hướng dẫn sử dụng ThreadLearn Frontend

Tài liệu này hướng dẫn cài đặt, chạy và truy cập giao diện Frontend của ThreadLearn trên môi trường phát triển.

## 1. Yêu cầu môi trường

- Node.js 20.x (khuyến nghị)
- npm 9 trở lên
- ThreadLearn Backend đang chạy tại `http://localhost:5000`

## 2. Cài đặt thư viện

Mở một cửa sổ PowerShell riêng cho Frontend:

```powershell
cd C:\ThreadLearn\ThreadLearn_WEB_FE
npm.cmd install
```

Nếu terminal cho phép chạy trực tiếp `npm`, có thể thay `npm.cmd` bằng `npm`.

## 3. Cấu hình môi trường

Nếu chưa có file `.env`, tạo từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Cấu hình mặc định để kết nối với Backend local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_API_TIMEOUT_MS=5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=ThreadLearn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Các biến được sử dụng phía trình duyệt phải bắt đầu bằng `NEXT_PUBLIC_`. Sau khi sửa `.env`, cần dừng và chạy lại Frontend.

## 4. Chạy Frontend

Đảm bảo Backend đã chạy, sau đó thực hiện:

```powershell
npm.cmd run dev
```

Mở trình duyệt tại:

<http://localhost:3001>

Frontend sẽ gọi API tại `http://localhost:5000/api/v1` và kết nối Socket.IO tại `http://localhost:5000`.

## 5. Luồng khởi động đầy đủ

Chạy hệ thống bằng các terminal riêng:

1. Khởi động MongoDB và Redis.
2. Chạy Backend bằng `npm.cmd run start:dev` trong `ThreadLearn_WEB_BE`.
3. Chạy Frontend bằng `npm.cmd run dev` trong `ThreadLearn_WEB_FE`.
4. Truy cập <http://localhost:3001>.

## 6. Các lệnh thường dùng

| Lệnh | Công dụng |
| --- | --- |
| `npm.cmd run dev` | Chạy Frontend ở chế độ phát triển trên port 3001 |
| `npm.cmd run dev:webpack` | Chạy development server bằng Webpack |
| `npm.cmd run build` | Build ứng dụng cho production |
| `npm.cmd run start` | Chạy bản production trên port 3001 |
| `npm.cmd run lint` | Kiểm tra quy tắc code |

Để chạy bản production:

```powershell
npm.cmd run build
npm.cmd run start
```

## 7. Sử dụng website

Sau khi mở <http://localhost:3001>, người dùng có thể:

- Đăng ký, đăng nhập và xác minh tài khoản.
- Xem danh sách khóa học và nội dung bài học.
- Làm bài quiz và xem lịch sử kết quả.
- Ghi chú, đánh dấu bài học và bình luận.
- Xem bảng xếp hạng, XP và tiến độ học tập.
- Sử dụng các tính năng AI khi dịch vụ liên quan đã được cấu hình.
- Xem và mua các gói dịch vụ nếu Backend đã cấu hình cổng thanh toán.

Tài khoản có quyền quản trị có thể truy cập các màn hình quản lý người dùng, khóa học, quiz, thông báo và gói dịch vụ.

## 8. Lỗi thường gặp

### Frontend chạy nhưng không tải được dữ liệu

- Kiểm tra Backend tại <http://localhost:5000/api/v1/health>.
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env`.
- Kiểm tra `CORS_ORIGIN=http://localhost:3001` trong `.env` của Backend.

### Port 3001 đang được sử dụng

Đóng tiến trình đang dùng port 3001 trước khi chạy lại. Nếu đổi port Frontend, đồng thời cập nhật `CORS_ORIGIN`, `FRONTEND_URL` của Backend và `NEXT_PUBLIC_APP_URL` của Frontend.

### Thay đổi `.env` chưa có hiệu lực

Dừng development server bằng `Ctrl+C`, sau đó chạy lại:

```powershell
npm.cmd run dev
```

### Turbopack gặp lỗi

Thử chạy development server bằng Webpack:

```powershell
npm.cmd run dev:webpack
```

### PowerShell chặn npm.ps1

Sử dụng `npm.cmd` thay cho `npm`, ví dụ:

```powershell
npm.cmd run dev
```

