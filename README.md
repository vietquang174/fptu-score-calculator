# 🐸 FPTU Score Calculator & Honors Predictor (BIT_SE_K20B)

Hệ thống tính điểm trung bình học kỳ (TBM) unweighted chuẩn quy chế đào tạo Đại học FPT, kiểm tra điều kiện qua môn, dự đoán danh hiệu học thuật và xuất phiếu kết quả A4 cho sinh viên ngành Kỹ thuật Phần mềm (Khóa K20).

![Test Status](https://img.shields.io/badge/Tests-11%2F11%20Passed-10B981?style=flat-square)
![Architecture](https://img.shields.io/badge/Architecture-100%25%20Stateless%20RAM-0066B2?style=flat-square)
![Curriculum](https://img.shields.io/badge/Curriculum-BIT__SE__K20B-F27024?style=flat-square)

---

## ✨ Tính Năng Cốt Lõi

1. **Syllabus Chuẩn 9 Học Kỳ & 10 Kéo Dài:**
   - Cập nhật đầy đủ toàn bộ 145 tín chỉ, các kỳ chuyên ngành hẹp (.NET, Java, AI, Mobile, Embedded...).
   - Đánh dấu chính xác môn tính điểm GPA và môn điều kiện Pass/Fail (Vovinam, Tiếng Anh, Lab, OJT).
2. **Kiểm Tra Điều Kiện & Điểm Liệt FE:**
   - Cảnh báo tức thì điểm thi cuối kỳ $FE \ge 4.0$ và $TBM \ge 5.0$.
3. **Dự Đoán Xếp Loại & Danh Hiệu Cóc Vàng:**
   - Mô phỏng các mốc: *Đạt*, *Khá*, *Giỏi*, *Xuất sắc*, *Top 100* và mốc vàng $\ge 9.60$.
4. **Xuất Phiếu Bảng Điểm A4 Chuyên Nghiệp:**
   - Xuất file PDF hoặc tải ảnh PNG 2× sắc nét, tích hợp mộc chứng nhận Cóc Vàng K20.
   - Hỗ trợ chế độ "Vừa màn hình" xem trọn vẹn cả trên điện thoại.
5. **100% Stateless & Riêng Tư:**
   - Dữ liệu tính toán hoàn toàn nằm trong bộ nhớ RAM trình duyệt, tự động xóa sạch khi tải lại trang (F5).

---

## 🚀 Triển Khai (Deploy) Lên Web Miễn Phí

### Cách 1: GitHub Pages (Tự Động)
1. Tạo một repository mới trên GitHub (ví dụ: `fptu-score-calculator`).
2. Push mã nguồn lên GitHub:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: initial commit for FPTU Score Calculator"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. Trên GitHub, vào **Settings** > **Pages**:
   - Ở mục **Source**, chọn **GitHub Actions** (Quy trình tự động đã cấu hình sẵn trong `.github/workflows/deploy.yml`).
   - Sau ~1 phút, trang web sẽ hoạt động trực tiếp tại: `https://<your-username>.github.io/<your-repo>/`.

### Cách 2: Vercel (Khuyên dùng - Nhanh nhất)
1. Đăng nhập [vercel.com](https://vercel.com).
2. Bấm **Add New Project** > Chọn Repository GitHub vừa tạo.
3. Bấm **Deploy** (Tệp `vercel.json` đã tự động cấu hình sẵn thư mục `ScoreCalculator`).
4. Trang web sẽ có link `.vercel.app` tốc độ cao với HTTPS ngay lập tức.

### Cách 3: Netlify
1. Đăng nhập [netlify.com](https://netlify.com).
2. Chọn **Add new site** > **Import an existing project** > Chọn GitHub.
3. Bấm **Deploy** (Tệp `netlify.toml` đã tự động cấu hình thư mục xuất bản).

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

Chạy bộ kiểm thử gồm 11 suites và hơn 270 test cases:
```bash
node tests/runner.js
```

---

© 2026 FPTU Score Calculator. Phát triển cho cộng đồng sinh viên Đại học FPT.
