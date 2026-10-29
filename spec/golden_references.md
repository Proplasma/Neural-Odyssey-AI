# BẢNG TRA CỨU CÁC KHO THAM CHIẾU CHUẨN VÀNG (GOLDEN REFERENCES DIRECTORY)

Tài liệu này dùng để AI Coding Agent và người học tra cứu, đối chiếu nhanh mã nguồn gốc và mô hình tương tác (UX Pattern) của từng chủ đề thuật toán.

| Nhóm Thuật Toán | Repo Tham Chiếu Gốc (GitHub) | Tác Giả / Tổ Chức | Module / File Lõi Cần Đối Chiếu | Mô Hình Tương Tác Cần Kế Thừa |
| :--- | :--- | :--- | :--- | :--- |
| **01. Toán nền tảng & Tối ưu** | [`seeingtheory/Seeing-Theory`](https://github.com/seeingtheory/Seeing-Theory)<br>[`distillpub/template`](https://github.com/distillpub/template) | Brown University / Distill Pub | `js/` (Probability & Linear algebra) | Đồng bộ thanh trượt biến đổi không gian; Pseudocode liên kết trực tiếp với bước chạy. |
| **02. Machine Learning Cổ điển** | [`trekhleb/homemade-machine-learning`](https://github.com/trekhleb/homemade-machine-learning)<br>[`stared/interactive-machine-learning-list`](https://github.com/stared/interactive-machine-learning-list) | Oleksii Trekhleb | `src/` (KMeans, LinearRegression, SVM, etc.) | Tương tác kéo thả điểm dữ liệu 2D; Tách biệt hàm `fit_step`, `predict`, `loss`. |
| **03. Mạng Nơ-ron & Deep Learning** | [`tensorflow/playground`](https://github.com/tensorflow/playground)<br>[`karpathy/convnetjs`](https://github.com/karpathy/convnetjs) | Google / Andrej Karpathy | `src/nn.ts` (Playground)<br>`build/convnet.js` | Độ dày dây nối biểu diễn trọng số $w$; 2D Heatmap biểu diễn vùng phân lớp quyết định. |
| **04. Computer Vision & CNN** | [`poloclub/cnn-explainer`](https://github.com/poloclub/cnn-explainer) | Georgia Tech Polo Club | `src/components/` (Conv, Pooling, ReLU) | **Hover-to-Trace**: Di chuột vào ô Feature Map để làm sáng receptive field & filter đầu vào. |
| **05. NLP & Transformers** | [`poloclub/transformer-explainer`](https://github.com/poloclub/transformer-explainer)<br>[`bbycroft/llm-viz`](https://github.com/bbycroft/llm-viz) | Georgia Tech / Brendan Bycroft | `src/components/` (Self-Attention, QKV) | Ma trận $Q, K, V$; Đường nối Attention Weights đậm nhạt; Thanh trượt Temperature $\rightarrow$ Softmax. |

---

### Hướng dẫn chèn Badge Kiểm chứng vào mỗi trang HTML:
Mỗi file HTML cần chèn thanh điều hướng đầu trang có cấu trúc sau:

```html
<header class="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white/80 backdrop-blur sticky top-0 z-50">
  <div class="flex items-center space-x-3">
    <span class="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-800">[Chương]</span>
    <h1 class="text-lg font-bold text-slate-900">[Tên Thuật Toán] Interactive Visualizer</h1>
  </div>
  <div class="flex items-center space-x-3">
    <!-- Nút kiểm chứng mã nguồn gốc -->
    <a href="https://github.com/[repo-name]" target="_blank" rel="noopener noreferrer" 
       class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
       title="Click để đối chiếu với mã nguồn chuẩn mực của [Tên Repo]">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      <span>Tham chiếu: <strong>[Repo]</strong></span>
    </a>
    <!-- Nút kiểm thử 3x3 -->
    <button id="toggle-audit-btn" class="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors">
      🧪 3x3 Audit Mode
    </button>
  </div>
</header>
```
