/**
 * Neural Odyssey AI - Resource & Video Lab Manager
 * Quản lý tư liệu học tập, nhúng video YouTube với Timestamp, Blog Cards,
 * Picture-in-Picture (Floating Player), LocalStorage override & JSON Export.
 */

class NeuralResourceManager {
  constructor(options = {}) {
    this.topicId = options.topicId || 'default-topic';
    this.containerId = options.containerId || 'resource-lab-container';
    this.curatedList = options.curatedResources || [];
    this.storageKey = `neural_odyssey_res_${this.topicId}`;
    
    this.activeVideo = null;
    this.isPiP = false;
    this.isCollapsed = false;

    this.init();
  }

  init() {
    this.loadCustomResources();
    this.renderMainStructure();
    this.createFloatingPiPContainer();
    this.bindEvents();
    
    // Tự động kích hoạt video đầu tiên nếu có
    const firstVideo = this.getAllResources().find(r => r.type === 'youtube');
    if (firstVideo) {
      this.playVideo(firstVideo.id, false);
    }
  }

  // --- LOCALSTORAGE & DATA HANDLING ---
  loadCustomResources() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.customList = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Lỗi khi đọc LocalStorage:', e);
      this.customList = [];
    }
  }

  saveCustomResources() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.customList));
    } catch (e) {
      console.error('Lỗi khi ghi LocalStorage:', e);
    }
  }

  getAllResources() {
    return [...this.curatedList, ...this.customList];
  }

  // --- YOUTUBE URL PARSER CHUẨN XÁC ---
  static parseYouTube(url) {
    if (!url) return null;
    let videoId = null;
    let startSeconds = 0;

    // Trích xuất Video ID
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    if (match && match[1]) {
      videoId = match[1];
    }

    // Trích xuất Timestamp (t=120, t=2m30s, start=120)
    const timeMatch = url.match(/[?&](?:t|start)=([0-9a-z]+)/i);
    if (timeMatch && timeMatch[1]) {
      const val = timeMatch[1];
      if (/^\d+$/.test(val)) {
        startSeconds = parseInt(val, 10);
      } else {
        const m = val.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
        if (m) {
          const h = parseInt(m[1] || 0, 10);
          const min = parseInt(m[2] || 0, 10);
          const s = parseInt(m[3] || 0, 10);
          startSeconds = h * 3600 + min * 60 + s;
        }
      }
    }

    return videoId ? { videoId, startSeconds } : null;
  }

  // --- GIAO DIỆN CHÍNH (ACCORDION KHUNG 4 DƯỚI CHÂN TRANG) ---
  renderMainStructure() {
    const root = document.getElementById(this.containerId);
    if (!root) return;

    root.innerHTML = `
      <section class="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <!-- Accordion Header -->
        <div class="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div class="flex items-center gap-3 cursor-pointer select-none" id="res-toggle-header">
            <span class="text-xl">🎬</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Góc Học Tập & Video Thực Nghiệm
                </h3>
                <span id="res-counter-badge" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  ${this.getAllResources().length} Tư liệu
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Xem video giảng giải từ các chuyên gia, lưu link blog & ghi chú cá nhân
              </p>
            </div>
            <span id="res-chevron" class="text-slate-400 text-xs transition-transform transform duration-200 ml-1">▼</span>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-open-add-modal" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
              <span>+</span> Thêm Tư Liệu / Video
            </button>
            <button id="btn-open-export-modal" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition" title="Xuất dữ liệu JSON để dán vào Git repo">
              <span>⚡</span> Xuất JSON
            </button>
          </div>
        </div>

        <!-- Accordion Body -->
        <div id="res-content-body" class="p-6 transition-all duration-300">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Video Player Dock (Col 7) -->
            <div class="lg:col-span-7 flex flex-col gap-3" id="res-inline-player-wrapper">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Trình Phát Video</span>
                  <span id="res-current-title" class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs font-medium">Chưa chọn video</span>
                </div>
                <!-- Nút bật Picture-in-Picture -->
                <button id="btn-toggle-pip" class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 transition">
                  <span>📺</span> <span>Bật Cửa Sổ Nổi (PiP)</span>
                </button>
              </div>

              <!-- Iframe Container -->
              <div class="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                <div id="res-player-dock" class="w-full h-full">
                  <!-- Iframe nhúng tại đây -->
                  <div class="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
                    <span class="text-3xl mb-2">🎬</span>
                    <p>Chọn một video từ danh sách bên phải hoặc thêm video YouTube mới để bắt đầu xem.</p>
                  </div>
                </div>
              </div>

              <!-- Timestamp & Ghi chú của video đang xem -->
              <div id="res-active-notes-box" class="hidden bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              </div>
            </div>

            <!-- Resource Cards List (Col 5) -->
            <div class="lg:col-span-5 flex flex-col gap-3">
              <div class="flex items-center justify-between pb-1">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Danh Sách Tư Liệu Đã Lưu</span>
                <span class="text-[11px] text-slate-400">Click để mở / xem video</span>
              </div>
              <div class="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-1" id="res-cards-list">
                <!-- Render các card tư liệu -->
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- MODAL THÊM TƯ LIỆU MỚI -->
      <div id="res-modal-add" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">➕</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Thêm Tư Liệu Học Tập & Video</h3>
            </div>
            <button id="btn-close-add-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2">&times;</button>
          </div>

          <form id="res-form-add" class="flex flex-col gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại tư liệu:</label>
              <select id="form-input-type" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
                <option value="youtube">🎥 Video YouTube (Tự nhận diện ID & Timestamp)</option>
                <option value="blog">📝 Bài viết / Blog (Distill, TowardsDataScience...)</option>
                <option value="paper">📄 Bài báo học thuật (ArXiv / Paper)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn (URL) *:</label>
              <input type="url" id="form-input-url" required placeholder="https://www.youtube.com/watch?v=... hoặc https://..." 
                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề tư liệu *:</label>
              <input type="text" id="form-input-title" required placeholder="Ví dụ: StatQuest K-Means in 5 minutes" 
                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tác giả / Kênh:</label>
                <input type="text" id="form-input-author" placeholder="Ví dụ: Josh Starmer" 
                       class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bắt đầu tại (Giây hoặc mm:ss):</label>
                <input type="text" id="form-input-time" placeholder="Ví dụ: 120 hoặc 02:00" 
                       class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú cá nhân (Insight tâm đắc):</label>
              <textarea id="form-input-notes" rows="3" placeholder="Ghi chú điều bạn học được, hoặc mốc thời gian đáng xem nhất..." 
                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"></textarea>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span>Đánh giá:</span>
                <select id="form-input-rating" class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 font-semibold text-amber-500">
                  <option value="5">⭐⭐⭐⭐⭐ (Cực hay)</option>
                  <option value="4">⭐⭐⭐⭐ (Rất tốt)</option>
                  <option value="3">⭐⭐⭐ (Tham khảo)</option>
                </select>
              </div>

              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                Lưu Tư Liệu
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL XUẤT JSON (GIT SYNC) -->
      <div id="res-modal-export" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">⚡</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Xuất Cấu Hình JSON (Git Sync)</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Copy đoạn JSON này dán vào file code để lưu vĩnh viễn lên GitHub</p>
              </div>
            </div>
            <button id="btn-close-export-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2">&times;</button>
          </div>

          <textarea id="res-export-textarea" readonly rows="10" 
                    class="w-full mono text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-xl border border-slate-800 focus:outline-none"></textarea>

          <div class="flex justify-end gap-2">
            <button id="btn-copy-json" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
              <span>📋</span> <span id="copy-text">Sao Chép Vào Clipboard</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderCardsList();
  }

  // --- FLOATING PICTURE-IN-PICTURE CONTAINER ---
  createFloatingPiPContainer() {
    let pip = document.getElementById('res-floating-pip');
    if (!pip) {
      pip = document.createElement('div');
      pip.id = 'res-floating-pip';
      pip.className = 'fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 z-50 hidden flex flex-col overflow-hidden transition-all duration-300';
      pip.innerHTML = `
        <!-- PiP Header (Draggable) -->
        <div class="px-3.5 py-2 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between cursor-move select-none" id="pip-drag-handle">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate pr-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="pip-title" class="truncate">Video Lab PiP</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-400">
            <button id="btn-pip-dock" class="hover:text-white p-1 rounded hover:bg-slate-800 text-xs" title="Ghim lại về trang chính">
              ⬇
            </button>
            <button id="btn-pip-close" class="hover:text-rose-400 p-1 rounded hover:bg-slate-800 text-xs font-bold" title="Đóng cửa sổ nổi">
              &times;
            </button>
          </div>
        </div>
        <!-- PiP Video Area -->
        <div class="relative w-full aspect-video bg-black" id="pip-video-wrapper">
          <!-- Iframe sẽ được chuyển vào đây khi bật PiP -->
        </div>
      `;
      document.body.appendChild(pip);
      this.initDraggablePiP(pip);
    }
  }

  // Kéo thả cửa sổ PiP tự do trên màn hình
  initDraggablePiP(el) {
    const handle = el.querySelector('#pip-drag-handle');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Đổi class từ fixed right sang style left/top
      el.style.bottom = 'auto';
      el.style.right = 'auto';
      el.style.left = `${initialLeft}px`;
      el.style.top = `${initialTop}px`;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        el.style.left = `${Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, initialLeft + dx))}px`;
        el.style.top = `${Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, initialTop + dy))}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // --- RENDER DANH SÁCH CARDS ---
  renderCardsList() {
    const listEl = document.getElementById('res-cards-list');
    const badgeEl = document.getElementById('res-counter-badge');
    if (!listEl) return;

    const all = this.getAllResources();
    if (badgeEl) badgeEl.innerText = `${all.length} Tư liệu`;

    if (all.length === 0) {
      listEl.innerHTML = `
        <div class="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
          Chưa có tư liệu nào. Hãy bấm <strong>"+ Thêm Tư Liệu"</strong> để lưu link video hoặc blog đầu tiên!
        </div>
      `;
      return;
    }

    listEl.innerHTML = all.map(res => {
      const isVideo = res.type === 'youtube';
      const isSelected = this.activeVideo && this.activeVideo.id === res.id;
      const icon = isVideo ? '🎥' : (res.type === 'paper' ? '📄' : '📝');
      const badgeType = isVideo ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      const stars = '⭐'.repeat(res.rating || 5);

      return `
        <div class="res-item-card p-3 rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70'} hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col gap-2 cursor-pointer"
             data-id="${res.id}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <span class="text-sm">${icon}</span>
              <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${res.title}</h4>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${badgeType}">
              ${isVideo ? 'YouTube' : 'Blog/Doc'}
            </span>
          </div>

          <!-- Tác giả & Đánh giá -->
          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tác giả: <strong>${res.author || 'Ngoại nguồn'}</strong></span>
            <span class="text-[10px]">${stars}</span>
          </div>

          <!-- Ghi chú tóm tắt (nếu có) -->
          ${res.userNotes ? `
            <p class="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 leading-normal line-clamp-2">
              💡 ${res.userNotes}
            </p>
          ` : ''}

          <!-- Hành động -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
            ${isVideo ? `
              <button class="btn-play-card text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1" data-id="${res.id}">
                ▶ Xem Video ${res.startSeconds ? `(${Math.floor(res.startSeconds/60)}p${res.startSeconds%60}s)` : ''}
              </button>
            ` : `
              <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1" onclick="event.stopPropagation()">
                Mở Bài Viết ↗
              </a>
            `}

            ${res.source === 'custom' ? `
              <button class="btn-delete-card text-slate-400 hover:text-rose-500 font-semibold transition" data-id="${res.id}" title="Xóa tư liệu này" onclick="event.stopPropagation()">
                🗑 Xóa
              </button>
            ` : `
              <span class="text-[10px] text-slate-400 italic">Curated</span>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện click card
    listEl.querySelectorAll('.res-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const res = this.getAllResources().find(r => r.id === id);
        if (res && res.type === 'youtube') {
          this.playVideo(id);
        } else if (res && res.url) {
          window.open(res.url, '_blank');
        }
      });
    });

    // Bắt sự kiện nút Xóa custom
    listEl.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.deleteCustomResource(id);
      });
    });
  }

  // --- PLAY VIDEO (INLINE HOẶC PIP) ---
  playVideo(resourceId, scrollIntoView = true) {
    const res = this.getAllResources().find(r => r.id === resourceId);
    if (!res || res.type !== 'youtube') return;

    this.activeVideo = res;
    
    // Cập nhật tiêu đề & notes
    const titleEl = document.getElementById('res-current-title');
    const pipTitleEl = document.getElementById('pip-title');
    if (titleEl) titleEl.innerText = res.title;
    if (pipTitleEl) pipTitleEl.innerText = res.title;

    const notesBox = document.getElementById('res-active-notes-box');
    if (notesBox) {
      if (res.userNotes) {
        notesBox.classList.remove('hidden');
        notesBox.innerHTML = `
          <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
            <span>💡 Ghi chú của bạn:</span>
            ${res.startSeconds ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Nhảy vào: ${Math.floor(res.startSeconds/60)}m${res.startSeconds%60}s</span>` : ''}
          </div>
          <p>${res.userNotes}</p>
        `;
      } else {
        notesBox.classList.add('hidden');
      }
    }

    // Nhúng Iframe an toàn
    const startParam = res.startSeconds ? `?start=${res.startSeconds}&autoplay=1` : `?autoplay=1`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${res.videoId}${startParam}`;
    const iframeHtml = `
      <iframe src="${embedUrl}" title="${res.title}" 
              class="w-full h-full border-0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen></iframe>
    `;

    const targetContainer = this.isPiP 
      ? document.getElementById('pip-video-wrapper') 
      : document.getElementById('res-player-dock');

    if (targetContainer) {
      targetContainer.innerHTML = iframeHtml;
    }

    this.renderCardsList();

    if (scrollIntoView && !this.isPiP) {
      document.getElementById('res-inline-player-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --- CHUYỂN ĐỔI CHẾ ĐỘ PIP (PICTURE-IN-PICTURE) ---
  togglePiP() {
    this.isPiP = !this.isPiP;
    const pipEl = document.getElementById('res-floating-pip');
    const pipWrapper = document.getElementById('pip-video-wrapper');
    const dockWrapper = document.getElementById('res-player-dock');
    const btnTogglePiP = document.getElementById('btn-toggle-pip');

    if (this.isPiP) {
      // Chuyển sang PiP
      pipEl.classList.remove('hidden');
      if (dockWrapper.firstElementChild) {
        pipWrapper.appendChild(dockWrapper.firstElementChild);
      }
      dockWrapper.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
          <span class="text-2xl mb-1">📺</span>
          <p>Video đang phát ở chế độ <strong>Cửa Sổ Nổi (PiP)</strong> góc màn hình.</p>
          <button id="btn-dock-back" class="mt-2 text-blue-500 hover:underline">Ghim trở lại đây</button>
        </div>
      `;
      document.getElementById('btn-dock-back')?.addEventListener('click', () => this.togglePiP());
      btnTogglePiP.innerHTML = `<span>⬇</span> <span>Ghim Về Trang Chính</span>`;
    } else {
      // Quay về Dock trang chính
      pipEl.classList.add('hidden');
      if (pipWrapper.firstElementChild) {
        dockWrapper.innerHTML = '';
        dockWrapper.appendChild(pipWrapper.firstElementChild);
      }
      btnTogglePiP.innerHTML = `<span>📺</span> <span>Bật Cửa Sổ Nổi (PiP)</span>`;
    }
  }

  // --- THÊM & XÓA CUSTOM RESOURCE ---
  addCustomResource(data) {
    const newId = `custom_${Date.now()}`;
    const parsed = data.type === 'youtube' ? NeuralResourceManager.parseYouTube(data.url) : null;

    let startSec = 0;
    if (data.timeInput) {
      if (/^\d+$/.test(data.timeInput)) {
        startSec = parseInt(data.timeInput, 10);
      } else {
        const parts = data.timeInput.split(':');
        if (parts.length === 2) {
          startSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
      }
    } else if (parsed && parsed.startSeconds) {
      startSec = parsed.startSeconds;
    }

    const item = {
      id: newId,
      type: data.type,
      title: data.title,
      author: data.author || 'Tự lưu trữ',
      url: data.url,
      videoId: parsed ? parsed.videoId : null,
      startSeconds: startSec,
      userNotes: data.notes || '',
      rating: parseInt(data.rating || 5, 10),
      source: 'custom'
    };

    this.customList.unshift(item);
    this.saveCustomResources();
    this.renderCardsList();

    if (item.type === 'youtube') {
      this.playVideo(item.id);
    }
  }

  deleteCustomResource(id) {
    if (confirm('Bạn có chắc muốn xóa tư liệu ghi chú này?')) {
      this.customList = this.customList.filter(item => item.id !== id);
      this.saveCustomResources();
      this.renderCardsList();
    }
  }

  // --- BIND EVENTS ---
  bindEvents() {
    // 1. Toggle Accordion
    const toggleHeader = document.getElementById('res-toggle-header');
    const contentBody = document.getElementById('res-content-body');
    const chevron = document.getElementById('res-chevron');

    toggleHeader?.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        contentBody.classList.add('hidden');
        chevron.style.transform = 'rotate(-90deg)';
      } else {
        contentBody.classList.remove('hidden');
        chevron.style.transform = 'rotate(0deg)';
      }
    });

    // 2. PiP Buttons
    document.getElementById('btn-toggle-pip')?.addEventListener('click', () => this.togglePiP());
    document.getElementById('btn-pip-dock')?.addEventListener('click', () => this.togglePiP());
    document.getElementById('btn-pip-close')?.addEventListener('click', () => {
      this.togglePiP();
    });

    // 3. Add Modal
    const addModal = document.getElementById('res-modal-add');
    document.getElementById('btn-open-add-modal')?.addEventListener('click', () => addModal.classList.remove('hidden'));
    document.getElementById('btn-close-add-modal')?.addEventListener('click', () => addModal.classList.add('hidden'));

    document.getElementById('res-form-add')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('form-input-type').value;
      const url = document.getElementById('form-input-url').value;
      const title = document.getElementById('form-input-title').value;
      const author = document.getElementById('form-input-author').value;
      const timeInput = document.getElementById('form-input-time').value;
      const notes = document.getElementById('form-input-notes').value;
      const rating = document.getElementById('form-input-rating').value;

      this.addCustomResource({ type, url, title, author, timeInput, notes, rating });
      addModal.classList.add('hidden');
      e.target.reset();
    });

    // 4. Export Modal
    const exportModal = document.getElementById('res-modal-export');
    const exportTextarea = document.getElementById('res-export-textarea');
    document.getElementById('btn-open-export-modal')?.addEventListener('click', () => {
      const all = this.getAllResources();
      exportTextarea.value = JSON.stringify(all, null, 2);
      exportModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-export-modal')?.addEventListener('click', () => exportModal.classList.add('hidden'));

    document.getElementById('btn-copy-json')?.addEventListener('click', () => {
      exportTextarea.select();
      navigator.clipboard.writeText(exportTextarea.value).then(() => {
        const copyText = document.getElementById('copy-text');
        copyText.innerText = 'Đã Sao Chép Thành Công!';
        setTimeout(() => copyText.innerText = 'Sao Chép Vào Clipboard', 2000);
      });
    });
  }
}
