# 🧠 Interactive AI/ML Algorithm Visualizer

> Thư viện mô phỏng & trực quan hóa thuật toán Trí Tuệ Nhân Tạo / Machine Learning tương tác cao trên nền tảng Web tĩnh. 
> Xây dựng theo phong cách học thuật từ **Distill.pub**, **3Blue1Brown**, **CNN Explainer** và **TensorFlow Playground**.

---

## 🌟 Các Nguyên Tắc Thiết Kế Cốt Lõi (Core Principles)

Dự án này được bảo đảm chất lượng bởi bộ quy chuẩn kỹ thuật nghiêm ngặt [`spec/ai_interactive_visualizer_spec.md`](spec/ai_interactive_visualizer_spec.md):

1. **100% Toán Học Thực Tế (No Fake Math / No Hardcoded Animations):** Mọi chuyển động, giá trị hàm mất mát (Loss) và đường biên phân lớp đều được tính toán theo thời gian thực từ các hàm toán học viết bằng JavaScript thuần (đạo hàm thật, nhân ma trận thật, cập nhật trọng số thật).
2. **Kiến Trúc Giao Diện 3 Tầng Đồng Bộ (Synchronized 3-Pane):**
   - **Khung 1 (Interactive Visual Canvas):** Cho phép người học click thêm/sửa điểm dữ liệu, kéo thả tâm cụm, chỉnh trọng số trực tiếp trên hình vẽ; tích hợp cơ chế **Hover-to-Trace**.
   - **Khung 2 (Live Math & State Inspector):** Công thức toán **KaTeX** đổi màu đồng bộ với hình vẽ, hiển thị bước thế số thực tế theo thời gian thực.
   - **Khung 3 (Failure Sandbox):** Các nút kịch bản phá hủy thuật toán (Learning Rate quá lớn, Dữ liệu ngoại lai cực đoan, Bẫy cực trị địa phương...) kèm lý giải nguyên nhân & giải pháp.
3. **Thanh Tra Cứu & Kiểm Chứng Gốc (1-Click Verification Badges):** Mỗi trang mô phỏng luôn có nút liên kết trực tiếp tới repo mã nguồn gốc trên GitHub và bài báo nghiên cứu gốc để người học tự kiểm chứng độ tin cậy.
4. **Chế Độ Kiểm Thử Nhẩm Tay 15s (3x3 Audit Mode):** Chạy thuật toán trên tập dữ liệu tối giản (ma trận 3x3 hoặc 3 điểm tọa độ nguyên) kèm log từng bước để đối chiếu khớp 100%.
5. **Tiêu Chuẩn Song Ngữ Thông Minh (Bilingual System):** Dẫn dắt bằng tiếng Việt tự nhiên; giữ nguyên thuật ngữ chuyên ngành tiếng Anh in đậm kèm **Interactive Glossary Tooltip** nổi lên khi di chuột.

---

## 🏛️ Bảng Quy Chiếu Repo Chuẩn Vàng (Golden Repositories)

Mọi thuật toán trong dự án đều được đối chiếu trực tiếp với các kho lưu trữ mã nguồn mở kinh điển:

| Nhóm Chủ Đề | Repo Tham Chiếu Gốc | Module / Cấu Trúc Kế Thừa |
| :--- | :--- | :--- |
| **01. Toán Nền Tảng** | [`seeingtheory/Seeing-Theory`](https://github.com/seeingtheory/Seeing-Theory) | Đồng bộ thanh trượt tham số phân phối xác suất & giải tích hình học. |
| **02. Classical ML** | [`trekhleb/homemade-machine-learning`](https://github.com/trekhleb/homemade-machine-learning) | Tách biệt các hàm `fit_step`, `predict`, tính loss & kéo thả điểm 2D. |
| **03. Neural Networks** | [`tensorflow/playground`](https://github.com/tensorflow/playground) & [`karpathy/convnetjs`](https://github.com/karpathy/convnetjs) | Độ dày dây nối biểu diễn trọng số $w$, 2D Heatmap phân vùng quyết định. |
| **04. Computer Vision** | [`poloclub/cnn-explainer`](https://github.com/poloclub/cnn-explainer) | Cơ chế **Hover-to-Trace** cửa sổ trượt (Kernel/Filter $\rightarrow$ Feature Map). |
| **05. Transformers** | [`poloclub/transformer-explainer`](https://github.com/poloclub/transformer-explainer) | Ma trận $Q, K, V$, đường nối Attention Weights, thanh trượt Temperature. |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
├── index.html                              # Dashboard chính (Trang chủ GitHub Pages)
├── .cursorrules                            # Cấu hình tự động cho Cursor AI
├── CLAUDE.md                               # Cấu hình tự động cho Claude Code
├── .github/copilot-instructions.md         # Cấu hình tự động cho GitHub Copilot
│
├── spec/                                   # Quy chuẩn & Tài liệu điều hành
│   ├── ai_interactive_visualizer_spec.md   # Master Spec cho AI Coding Agent
│   ├── golden_references.md                # Bảng liên kết tra cứu nhanh
│   └── templates/
│       └── starter_template.html           # File khung trắng 3 cột chuẩn
│
└── simulations/                            # Các trang mô phỏng theo 5 chương
    ├── 01-math-foundations/                # Đại số tuyến tính, Gradient Descent, Xác suất
    ├── 02-classical-ml/                    # K-Means, Linear/Logistic Regression, SVM
    ├── 03-neural-networks/                 # MLP, Backprop, Activation, Optimizers
    ├── 04-computer-vision/                 # 2D Convolution, Pooling, Feature Maps
    └── 05-nlp-transformers/                # Self-Attention, QKV, Softmax Temperature
```

---

## 🚀 Hướng Dẫn Sử Dụng

1. **Xem trực tiếp trên máy (Offline):**
   - Không cần cài đặt Node.js hay bất kỳ môi trường phụ thuộc nào.
   - Chỉ cần click đúp chuột vào file `index.html` hoặc bất kỳ file `.html` nào trong thư mục `simulations/` để mở ngay trên trình duyệt (Chrome, Edge, Safari, Firefox).

2. **Triển khai lên GitHub Pages (Online):**
   - Đẩy toàn bộ repo lên GitHub.
   - Vào mục **Settings** $\rightarrow$ **Pages** $\rightarrow$ Chọn Branch `main` và thư mục `/ (root)` $\rightarrow$ Bấm **Save**.
   - Website tương tác của bạn sẽ chạy tự động tại: `https://<tên-user>.github.io/<tên-repo>/`.

3. **Yêu cầu AI Agent tạo bài học mới:**
   - Bạn chỉ cần ra lệnh cho AI trong Cursor, Claude Code hoặc Copilot:
     > *"Hãy tạo bài mô phỏng thuật toán [Tên Thuật Toán] vào thư mục simulations/[Chương]/ tuân thủ đúng spec."*
   - AI sẽ tự động đọc file `.cursorrules` / `CLAUDE.md`, nhân bản từ template chuẩn và viết toán học thật cho bạn.
