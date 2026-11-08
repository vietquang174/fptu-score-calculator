# FPTU SCORE & HONORS CALCULATOR (BIT_SE_K20B)
> **Trang Web Tính Điểm Học Kỳ & Dự Đoán Danh Hiệu Sinh Viên FPTU**  
> Dành cho sinh viên ngành Kỹ thuật Phần mềm khóa K20 (`BIT_SE_K20B`).

---

## 🚀 Cách Mở & Sử Dụng Ứng Dụng
1. Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt web hiện đại nào (Chrome, Edge, Firefox, Cốc Cốc, Safari...).
2. Không cần cài đặt `Node.js`, không cần chạy lệnh Server, không cần cấu hình Database.
3. Ứng dụng hoạt động theo kiến trúc **Stateless Client-side**:
   - Mọi tính toán diễn ra trực tiếp ngay trên trình duyệt (Real-time).
   - Dữ liệu hoàn toàn bảo mật và tự động xóa trắng khi F5 hoặc đóng tab web.

---

## 📂 Cấu Trúc Mã Nguồn

```
D:\WORKING - IMPORTANT\SCORE CALCULATOR WEB\
├── index.html         # Giao diện chính (Tailwind CSS, Icons, Bố cục 2 cột, Modal)
├── styles.css         # Bộ màu thương hiệu FPTU (#F27024, #0066B2, #51B848, #FFB800), hiệu ứng Shimmer, pháo hoa
├── data.js           # Dữ liệu phân bổ 9 học kỳ chuẩn từ SYLLABUS_SE20.pdf, Schema môn mẫu & Template
├── app.js            # Engine tính điểm, kiểm tra liệt, TBM kỳ, xếp loại danh hiệu, xuất ảnh html2canvas
├── README.md         # Tài liệu hướng dẫn sử dụng & cập nhật Syllabus
└── Syllabus\         # Thư mục chứa các file Syllabus PDF gốc
    ├── SYLLABUS_SE20.pdf
    ├── MAD101_SYLLABUS.pdf
    ├── DBI202_SYLLABUS.pdf
    ├── VOV114_SYLLABUS.pdf
    └── LAB211_SYLLABUS.pdf
```

---

## 🎯 Các Tính Năng Đã Hoàn Thiện Chuẩn 100% Theo Đặc Tả

### 1. Phân bổ toàn bộ 9 Học kỳ (Kỳ 0 -> Kỳ 9)
- Phân biệt rõ môn **Có tính TBM** và môn **Không tính TBM (Môn điều kiện/Thể chất/Lab)**.
- Đã nạp sẵn Syllabus chuẩn chi tiết cho:
  - **`MAD101`**: PT (30%, 3 bài), Ass (20%, 2 bài), Programming Ass (10%), FE (40%, điều kiện $\ge 4.0$).
  - **`DBI202`**: Assignment (20%), Lab (10%, 5 bài), PE (30%), PT (10%, 2 bài), FE (30%, điều kiện $\ge 4.0$).
  - **`VOV114`**: Vovinam 1 (FE 100%, $\ge 5.0$ để Pass, không tính vào TBM kỳ).
  - **`LAB211`**: OOP with Java Lab (`Is Scored: False`, chỉ có nút chọn Pass/Not Pass, không tính TBM).
- Các môn còn lại nạp sẵn Template tương ứng (Lý thuyết chuẩn, Thực hành PE, Online Coursera, Đồ án SWP) và cho phép người dùng tùy chỉnh/đổi template/thêm bớt cột điểm linh hoạt.

### 2. Logic Tính Toán & Cảnh Báo Thông Minh
- **Linh hoạt 2 chế độ nhập bài con:** Tự động chia nhỏ ô nhập từng bài (PT1, PT2, Lab1..Lab5) tính trung bình, kèm nút chuyển nhanh sang chế độ nhập gộp 1 điểm TB.
- **Quy tắc làm tròn chuẩn FAP FPTU:**
  - Điểm tổng kết từng môn: làm tròn **1 chữ số thập phân** (VD: `8.4`).
  - Điểm TBM kỳ: làm tròn **2 chữ số thập phân** (VD: `8.45`).
- **Kiểm tra điều kiện qua môn (Pass / Not Pass):**
  - Môn chỉ Pass khi: Đủ điểm + Điểm môn $\ge 5.0$ + Điểm TB các cột quá trình $> 0$ + Điểm thi cuối kỳ $\text{FE} \ge 4.0$ (Vovinam $\ge 5.0$).
  - Cảnh báo cụ thể nguyên nhân khi Not Pass: Liệt FE, Liệt điểm quá trình hoặc Điểm tổng kết $< 5.0$.
- **Nhắc nhở điền thiếu (Missing Warning):**
  - Highlight vàng cam các ô đang bỏ trống.
  - Hiển thị danh sách các môn còn thiếu trên bảng thông báo.

### 3. Dự Đoán Xếp Loại & Danh Hiệu Học Kỳ
- **$\text{TBM Kỳ} = \frac{\sum \text{Điểm môn tính điểm}}{\text{Số môn tính điểm}}$** (Trung bình cộng đơn thuần, không nhân tín chỉ).
- Bảng xếp loại:
  - `< 5.0` hoặc có môn rớt: **Chưa Đạt / Not Pass** (Đỏ).
  - `5.0 - < 7.0`: **Pass (Đạt)** (Xanh lá `#51B848`).
  - `7.0 - < 8.0`: **Khá** (Xanh dương `#0066B2`).
  - `8.0 - < 9.0`: **Giỏi** (Cam FPT `#F27024`).
  - `9.0 - < 9.2`: **Sinh viên Xuất Sắc** (Vàng FPT `#FFB800`).
  - `9.2 - < 9.6`: **Sinh viên Xuất Sắc** + Badge nổi bật: **🌟 Có khả năng lọt Top 100 SV Xuất sắc!**
  - $\ge 9.6$: **Sinh viên Xuất Sắc** + Hiệu ứng pháo hoa chúc mừng + Badge: **🐸🏆 Có khả năng đạt CÓC VÀNG!**
- **Quy chế môn điều kiện:** Nếu sinh viên trượt môn điều kiện (Vovinam hoặc LAB211) thì hệ thống không xét danh hiệu khen thưởng trong kỳ đó.

### 4. Xuất Bảng Điểm Dự Đoán (Share & Export Card)
- Bấm nút **"Xuất Bảng Điểm"** hiển thị Phiếu Điểm Sinh Viên FPTU thiết kế sang trọng: Logo FPT, mã ngành `BIT_SE_K20B`, bảng điểm từng môn, TBM kỳ, danh hiệu dự đoán, quote truyền cảm hứng ngẫu nhiên và watermark chìm FPTU.
- Tích hợp 2 tính năng:
  - 📥 **Tải ảnh PNG về máy** (độ phân giải 2x sắc nét qua `html2canvas`).
  - 📋 **Sao chép ảnh vào Clipboard** (để dán Ctrl+V gửi qua Messenger/Zalo/Story).

---

## 📝 Hướng Dẫn Bổ Sung Toàn Bộ Syllabus Sau Này
Khi bạn gửi thêm Syllabus các môn tiếp theo:
1. Mở file `data.js`.
2. Khai báo schema tương ứng trong `SAMPLE_SUBJECTS_SCHEMA` tương tự như `MAD101` hoặc `DBI202`.
3. Điền các đầu điểm (`name`, `weight %`, `parts`, `minScore`, `isFE`).
4. Hệ thống sẽ tự động liên kết và hiển thị chính xác 100% cho sinh viên.
