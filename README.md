# WazeHUD-CYD 2.8 — Website giới thiệu

Website tĩnh tiếng Việt theo phong cách công nghệ/HUD, thiết kế responsive cho điện thoại và máy tính.

## Tính năng
- Landing page giới thiệu WazeHUD-CYD 2.8.
- Minh họa HUD bằng CSS/HTML (không giả làm ảnh chụp firmware thật).
- Mục tính năng, các giao diện V1/V2/V3, hướng dẫn và cảnh báo chọn firmware.
- Hai nút USB và BLE riêng. Trang dùng GitHub Releases API để tìm asset được phát hành thật, sau đó lấy chính xác `browser_download_url` từ API. Nếu không tìm được asset phù hợp hoặc API lỗi, nút chỉ mở trang Releases chính thức; website không đoán URL tải.
- Không cần build, framework, API key hoặc backend.

## Chạy thử
Mở `index.html` trong trình duyệt. Để kiểm tra GitHub API ổn định hơn, nên chạy qua local web server, ví dụ VS Code Live Server.

## Triển khai GitHub Pages
1. Tạo repository mới cho website, ví dụ `WazeHUD-CYD-Website` (hoặc thêm các file này vào thư mục `docs/` của repo hiện có nếu bạn muốn giữ cùng repository).
2. Đưa toàn bộ nội dung thư mục này lên nhánh `main`, giữ nguyên cấu trúc thư mục.
3. Vào **Settings → Pages**.
4. Ở **Build and deployment**, chọn **Deploy from a branch**.
5. Chọn branch `main` và folder `/ (root)`, sau đó **Save**.
6. Chờ GitHub Actions/Pages hoàn tất và mở URL Pages hiển thị trong Settings → Pages.

Workflow `.github/workflows/pages.yml` có thể dùng thay cho cấu hình deploy-from-branch: vào Settings → Pages và chọn **GitHub Actions** làm nguồn triển khai.

## Tùy chỉnh
- Nội dung: `index.html`
- Giao diện: `assets/css/style.css`
- Logic đọc Releases và phân loại asset: `assets/js/main.js`
- Repository firmware hiện dùng: https://github.com/sontac/WazeHUD-CYD-2.8
- Releases: https://github.com/sontac/WazeHUD-CYD-2.8/releases

## Lưu ý về asset USB/BLE
Logic hiện tìm trong 20 bản phát hành công khai gần nhất, bỏ qua draft/prerelease, rồi chọn asset có tên chứa `USB` hoặc `BLE` và phần mở rộng `.bin`, `.zip` hoặc `.uf2`. Nếu tên tệp trong repo dùng quy ước khác, cập nhật hàm `channelMatches()` trong `assets/js/main.js`.
