# WazeHUD-CYD 2.8 — Website giới thiệu

Website tĩnh tiếng Việt theo phong cách công nghệ/HUD, thiết kế responsive cho điện thoại và máy tính.

## Tính năng
- Landing page giới thiệu WazeHUD-CYD 2.8.
- Minh họa HUD bằng CSS/HTML (không giả làm ảnh chụp firmware thật).
- Mục tính năng, các giao diện V1/V2/V3, hướng dẫn và cảnh báo chọn firmware.
- Hai nút USB và BLE riêng. Trang dùng GitHub Releases API để tìm asset được phát hành thật, sau đó lấy chính xác `browser_download_url` từ API. Nếu không tìm được asset phù hợp hoặc API lỗi, nút chỉ mở trang Releases chính thức; website không đoán URL tải.
- Trình nạp USB/BLE trên trình duyệt dùng ESP Web Tools; tạo manifest động từ đúng asset `.bin` gộp trong GitHub Releases và ghi tại offset `0x0`. Manifest đặt `improv: false` vì firmware không cần Improv Wi-Fi Serial.
- Có nút truy cập nhanh tới mục nạp firmware trong hero và menu điều hướng.
- Có bộ đếm lượt truy cập công khai dùng Visitor Badge API; số liệu phụ thuộc dịch vụ bên thứ ba và cần kết nối internet.
- Có nút chuyển ngôn ngữ Tiếng Việt/English cho phần Web Flasher. Các chuỗi trong hộp thoại thư viện ESP Web Tools được dịch best-effort; một số thông báo nội bộ có thể vẫn bằng tiếng Anh do thư viện không cung cấp tùy chọn locale chính thức.
- Không cần backend hoặc API key; trình nạp cần internet, HTTPS và trình duyệt máy tính có Web Serial.

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

## Nạp firmware từ trình duyệt
- Mục Web Flasher chỉ bật nút nạp khi tìm thấy đúng tên file firmware gộp, ví dụ `WazeHUD-CYD-USB-v1.1.4.bin` hoặc `WazeHUD-CYD-BLE-v1.1.4.bin`.
- Manifest ESP Web Tools dùng `chipFamily: ESP32`, một phần firmware với `offset: 0`, và bật lựa chọn xóa flash trước khi nạp.
- Website cần chạy qua HTTPS (GitHub Pages đáp ứng điều này). Dùng Chrome hoặc Microsoft Edge trên máy tính; hỗ trợ Web Serial trên điện thoại không được giả định.
- Cần cáp USB truyền dữ liệu. Chọn đúng kênh USB/BLE, không rút cáp hoặc đóng trang khi đang nạp. Người dùng cần xác nhận thao tác trong hộp thoại của trình nạp.
- Trình nạp tải firmware trực tiếp từ GitHub Release. Tên tệp không khớp quy ước thì nút bị vô hiệu hóa; website không tự đoán URL hoặc nạp tệp ZIP.
- Mặc dù đã cấu hình theo thông tin firmware gộp tại `0x0`, vẫn cần kiểm thử thực tế trên thiết bị CYD trước khi thông báo tính năng đã được xác nhận hoàn toàn.

## Lưu ý về asset USB/BLE
Phần tải xuống tìm asset `.bin`, `.zip` hoặc `.uf2` có tên chứa `USB`/`BLE` trong 20 bản phát hành công khai gần nhất, bỏ qua draft/prerelease. Riêng trình nạp chỉ chấp nhận tên BIN gộp theo mẫu `WazeHUD-CYD-USB-vX.Y.Z.bin` hoặc `WazeHUD-CYD-BLE-vX.Y.Z.bin`. Nếu quy ước tên thay đổi, cập nhật `channelMatches()` và `mergedBinMatches()` trong `assets/js/main.js`.


## Ảnh giao diện thực tế
Ảnh chủ dự án đã được đặt tại `assets/images/`:
- `hud-boot.jpg`: ảnh thiết bị/màn hình khởi động.
- `ui-v1-toc-do-hien-tai.jpg`: giao diện V1.
- `ui-v2-bien-gioi-han.jpg`: giao diện V2.
- `ui-v3-giao-dien-tuy-bien.jpg`: giao diện V3.
- `app-chon-giao-dien.jpg`: ảnh lựa chọn giao diện trong ứng dụng.

Để thay ảnh, tải ảnh mới lên đúng đường dẫn và giữ nguyên tên tệp; hoặc sửa thuộc tính `src` trong `index.html` nếu đổi tên.
Mục “Tính năng trong ảnh thực tế” mô tả các chi tiết nhìn thấy trong ảnh, không khẳng định đó là changelog của bản phát hành mới nhất. Changelog chính thức liên kết tới GitHub Releases.


## Bản dễ đọc hơn và Web Flasher
- Đã tăng cỡ chữ toàn trang.
- Logo vector WazeHUD (Waze trắng, HUD cyan, biểu tượng riêng) đặt trong `assets/images/wazehud-logo.svg`.
- Khu vực hero chỉ còn ảnh thiết bị thật, đã bỏ màn hình HUD minh họa và các nhãn nổi cạnh ảnh.
- Đã tích hợp giao diện nạp trực tiếp USB/BLE bằng ESP Web Tools, dùng manifest tạo động từ asset BIN gộp trên GitHub Releases và offset `0x0`. Cần thử nạp thực tế trên thiết bị trước khi xác nhận hoạt động end-to-end.
