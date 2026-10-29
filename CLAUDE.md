# CURSOR RULES: INTERACTIVE AI/ML ALGORITHM VISUALIZER

Khi làm việc trong kho lưu trữ này, bạn BẮT BUỘC phải tuân thủ tuyệt đối quy chuẩn kỹ thuật tại file:
`spec/ai_interactive_visualizer_spec.md`

## TÓM TẮT CÁC QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. **NGUYÊN TẮC THAM CHIẾU GỐC (REFERENCE-FIRST):** Trước khi viết code bất kỳ thuật toán nào, phải đối chiếu với 5 Golden Repositories (`tensorflow/playground`, `poloclub/cnn-explainer`, `poloclub/transformer-explainer`, `trekhleb/homemade-machine-learning`, `seeingtheory/Seeing-Theory`). Tuyệt đối không tự sáng tác cách biểu diễn cẩu thả.
2. **CẤM GIẢ LẬP TOÁN HỌC (NO FAKE MATH):** Mọi chuyển động, giá trị đồ thị, loss, decision boundary PHẢI được tính toán từ các hàm toán học thực tế viết bằng JavaScript thuần (đạo hàm thật, nhân ma trận thật, cập nhật trọng số thật). Không dùng `Math.random()` để làm giả kết quả học.
3. **KIẾN TRÚC 3 TẦNG ĐỒNG BỘ:**
   - **Khung 1 (Interactive Canvas):** Tương tác đồ họa trực tiếp (kéo thả điểm, centroids, điều khiển play/step/reset, cơ chế Hover-to-Trace).
   - **Khung 2 (Live Math & State Inspector):** Công thức KaTeX có mã màu đồng bộ với hình vẽ, kèm dòng thế số thực tế theo thời gian thực tại bước chạy hiện tại.
   - **Khung 3 (Failure Sandbox):** Các nút kịch bản phá hủy thuật toán (Learning rate quá lớn, Outliers, Vanishing gradient...) kèm phân tích nguyên nhân & giải pháp.
4. **THANH TRA CỨU & KIỂM CHỨNG GỐC (REFERENCE BADGES):** Ở đầu trang (Header), bắt buộc có huy hiệu liên kết trực tiếp (`target="_blank"`) dẫn về Repo GitHub tham chiếu gốc (chỉ rõ file lõi) và bài báo nghiên cứu gốc để người học tự kiểm chứng.
5. **SONG NGỮ THÔNG MINH:** Dẫn dắt bằng tiếng Việt tự nhiên; giữ nguyên thuật ngữ chuyên ngành tiếng Anh in đậm có dấu gạch chân chấm bi, kèm Interactive Tooltip (Nghĩa tiếng Việt, Ký hiệu toán học, Bản chất trực quan).
6. **CHẾ ĐỘ KIỂM THỬ NHẨM TAY 30s (3x3 AUDIT MODE):** Luôn có nút bật Toy Dataset siêu nhỏ (ma trận 3x3 hoặc 3 điểm tọa độ nguyên) kèm log tính toán từng bước để người học nhẩm tay kiểm chứng độ chính xác.
7. **TECH STACK:** Đóng gói trong 1 file `.html` duy nhất (Single-File Component) sử dụng CDN Tailwind CSS, KaTeX, HTML5 Canvas/SVG, D3.js hoặc Chart.js.
