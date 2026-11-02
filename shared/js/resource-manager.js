/**
 * Neural Odyssey AI - Resource & Personal Notebook Manager (Master Pro Edition)
 * Tích hợp:
 * 1. 📝 Sổ Tay Đa Phương Tiện (Rich Scratchpad): Hỗ trợ Ảnh, Ảnh GIF, Video ngắn (.mp4), Paste từ Clipboard (Ctrl+V).
 * 2. 👁️ Live Markdown Preview: Xem trực tiếp ảnh động, video, định dạng văn bản.
 * 3. ✏️ Nút Sửa Nhanh Tại Chỗ (Inline Edit): Chỉnh sửa ghi chú & timestamp ngay dưới video player.
 * 4. 💾 File System Access API: Tự động ghi file JSON trực tiếp vào folder ổ cứng.
 * 5. 🚀 GitHub REST API Direct Sync: 1-Click đồng bộ tạo Git commit.
 * 6. 🟠 Smart Unsynced Tracker: Cảnh báo nhắc nhẹ khi có ghi chú mới chưa đẩy lên GitHub.
 */

class NeuralResourceManager {
  constructor(options = {}) {
    this.topicId = options.topicId || 'default-topic';
    this.containerId = options.containerId || 'resource-lab-container';
    this.curatedList = options.curatedResources || [];
    this.repoName = options.repoName || 'Proplasma/Neural-Odyssey-AI';
    this.filePath = options.filePath || `simulations/${this.topicId}/${this.topicId}-resources.json`;
    
    // Khóa lưu trữ cục bộ
    this.storageKey = `neural_odyssey_res_${this.topicId}`;
    this.notepadKey = `neural_odyssey_notepad_${this.topicId}`;
    this.syncMetaKey = `neural_odyssey_sync_meta_${this.topicId}`;
    this.ghTokenKey = `neural_odyssey_gh_pat`;

    this.activeTab = 'notes'; // 'notes' hoặc 'videos'
    this.notepadMode = 'edit'; // 'edit' hoặc 'preview'
    this.activeVideo = null;
    this.isEditingVideoNote = false;
    this.isPiP = false;
    this.isCollapsed = false;
    this.fileHandle = null;

    this.init();
  }

  async init() {
    this.loadCustomResources();
    this.loadNotepad();
    this.loadSyncMeta();
    this.renderMainStructure();
    this.createFloatingPiPContainer();
    this.bindEvents();
    this.updateSyncBadge();

    // Kích hoạt video đầu tiên nếu có
    const firstVideo = this.getAllResources().find(r => r.type === 'youtube');
    if (firstVideo) {
      this.playVideo(firstVideo.id, false);
    }
  }

  // --- LOCALSTORAGE & SYNC STATE ---
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
      this.markAsUnsynced();
      this.autoWriteToLocalFile();
    } catch (e) {
      console.error('Lỗi khi ghi LocalStorage:', e);
    }
  }

  loadNotepad() {
    try {
      this.notepadContent = localStorage.getItem(this.notepadKey) || '';
    } catch (e) {
      this.notepadContent = '';
    }
  }

  saveNotepad(content) {
    try {
      this.notepadContent = content;
      localStorage.setItem(this.notepadKey, content);
      this.markAsUnsynced();
      this.autoWriteToLocalFile();
    } catch (e) {
      console.error('Lỗi khi ghi Notepad:', e);
    }
  }

  loadSyncMeta() {
    try {
      const data = localStorage.getItem(this.syncMetaKey);
      this.syncMeta = data ? JSON.parse(data) : { lastSyncTime: null, isSynced: true };
    } catch (e) {
      this.syncMeta = { lastSyncTime: null, isSynced: true };
    }
  }

  markAsUnsynced() {
    this.syncMeta.isSynced = false;
    localStorage.setItem(this.syncMetaKey, JSON.stringify(this.syncMeta));
    this.updateSyncBadge();
  }

  markAsSynced() {
    this.syncMeta.isSynced = true;
    this.syncMeta.lastSyncTime = new Date().toISOString();
    localStorage.setItem(this.syncMetaKey, JSON.stringify(this.syncMeta));
    this.updateSyncBadge();
  }

  getAllResources() {
    // Gộp curated với custom (nếu custom có cùng ID thì lấy custom làm bản ghi đè)
    const map = new Map();
    this.curatedList.forEach(r => map.set(r.id, { ...r }));
    this.customList.forEach(r => map.set(r.id, { ...r }));
    return Array.from(map.values());
  }

  getCombinedData() {
    return {
      topicId: this.topicId,
      personalNotes: this.notepadContent,
      resources: this.getAllResources()
    };
  }

  // --- FILE SYSTEM ACCESS API ---
  async linkLocalFile() {
    try {
      if ('showSaveFilePicker' in window) {
        this.fileHandle = await window.showSaveFilePicker({
          suggestedName: `${this.topicId}-resources.json`,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        await this.autoWriteToLocalFile();
        this.showToast('✅ Đã gắn kết thành công với file trong ổ cứng!', 'success');
        this.updateFileStatusBadge(true);
      } else {
        alert('Trình duyệt hiện tại chưa hỗ trợ File System Access API. Bạn hãy mở trên Google Chrome hoặc Microsoft Edge nhé!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Lỗi khi chọn file:', err);
        this.showToast('❌ Không thể gắn kết file: ' + err.message, 'error');
      }
    }
  }

  async autoWriteToLocalFile() {
    if (!this.fileHandle) return;
    try {
      const writable = await this.fileHandle.createWritable();
      const content = JSON.stringify(this.getCombinedData(), null, 2);
      await writable.write(content);
      await writable.close();
      this.updateFileStatusBadge(true);
    } catch (err) {
      console.warn('Không thể tự động ghi file ổ cứng:', err);
      this.updateFileStatusBadge(false);
    }
  }

  updateFileStatusBadge(linked) {
    const el = document.getElementById('res-file-badge');
    if (!el) return;
    if (linked) {
      el.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700';
      el.innerHTML = `<span>💾 Đã gắn file ổ cứng</span>`;
      el.title = 'Mỗi khi bạn gõ note, file trong ổ cứng sẽ tự động cập nhật ngay lập tức!';
    } else {
      el.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200';
      el.innerHTML = `<span>📁 Gắn kết file ổ cứng</span>`;
      el.title = 'Bấm vào để chọn file JSON trong folder bài học để tự động lưu vào ổ cứng';
    }
  }

  // --- GITHUB REST API DIRECT SYNC ---
  async syncToGitHub() {
    const token = localStorage.getItem(this.ghTokenKey);
    if (!token) {
      document.getElementById('res-modal-gh-config')?.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('btn-sync-github');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block">⏳</span> <span>Đang đồng bộ...</span>`;

    try {
      const branch = 'main';
      const apiUrl = `https://api.github.com/repos/${this.repoName}/contents/${this.filePath}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      let sha = null;
      try {
        const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }
      } catch (e) {}

      const jsonContent = JSON.stringify(this.getCombinedData(), null, 2);
      const utf8Bytes = new TextEncoder().encode(jsonContent);
      let binary = '';
      utf8Bytes.forEach(b => binary += String.fromCharCode(b));
      const base64Content = btoa(binary);

      const body = {
        message: `docs: sync notes, media & videos for ${this.topicId} [via Web UI]`,
        content: base64Content,
        branch: branch
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        this.markAsSynced();
        this.showToast('🚀 Đã đồng bộ thành công lên GitHub! GitHub Pages sẽ tự cập nhật sau 30s.', 'success');
      } else {
        const errData = await putRes.json();
        throw new Error(errData.message || 'Lỗi khi gọi GitHub API');
      }
    } catch (err) {
      console.error('Lỗi Sync GitHub:', err);
      this.showToast(`❌ Đồng bộ thất bại: ${err.message}. Vui lòng kiểm tra lại Token!`, 'error');
      document.getElementById('res-modal-gh-config')?.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
      this.updateSyncBadge();
    }
  }

  // --- CẢNH BÁO NHẮC NHẸ THÔNG MINH ---
  updateSyncBadge() {
    const badgeEl = document.getElementById('res-sync-badge');
    const syncBtn = document.getElementById('btn-sync-github');
    if (!badgeEl) return;

    if (!this.syncMeta.isSynced) {
      badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse';
      badgeEl.innerHTML = `<span>🟠</span> <span>Chưa sync lên GitHub</span>`;
      badgeEl.title = 'Bạn có ghi chú mới chưa đồng bộ lên GitHub. Bấm nút Đồng Bộ để lưu vĩnh viễn!';
      
      if (syncBtn) {
        syncBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md transition transform hover:scale-[1.02]';
      }
    } else {
      badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      const timeStr = this.syncMeta.lastSyncTime ? new Date(this.syncMeta.lastSyncTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'vừa xong';
      badgeEl.innerHTML = `<span>🟢</span> <span>Đã đồng bộ (${timeStr})</span>`;
      badgeEl.title = 'Toàn bộ tư liệu & ghi chú đã khớp hoàn toàn với GitHub!';

      if (syncBtn) {
        syncBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition';
      }
    }
  }

  // --- PARSE YOUTUBE URL ---
  static parseYouTube(url) {
    if (!url) return null;
    let videoId = null;
    let startSeconds = 0;

    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    if (match && match[1]) {
      videoId = match[1];
    }

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

  // --- TRÌNH PARSER MARKDOWN & MEDIA SIÊU NHẸ (CHO TAB PREVIEW) ---
  renderMarkdownToHtml(md) {
    if (!md || !md.trim()) {
      return `<p class="text-slate-400 italic">Sổ tay đang trống. Hãy chuyển sang tab "Soạn Thảo" để viết ghi chú hoặc dán ảnh/GIF!</p>`;
    }

    // Escape HTML cơ bản để chống XSS
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Phục hồi lại thẻ video an toàn nếu có
    html = html.replace(/&lt;video src="([^"]+)" controls(.*?)&gt;&lt;\/video&gt;/g, '<video src="$1" controls class="max-h-80 w-auto rounded-xl my-3 shadow-md border border-slate-700"$2></video>');

    // Parse Ảnh & GIF: ![alt](url_hoac_base64)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      return `
        <div class="my-3 flex flex-col items-start gap-1">
          <img src="${src}" alt="${alt}" class="max-h-80 w-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-md object-contain hover:scale-[1.01] transition cursor-pointer" onclick="window.open(this.src)" title="Click để phóng to ảnh">
          ${alt ? `<span class="text-[11px] text-slate-500 italic">🖼️ ${alt}</span>` : ''}
        </div>
      `;
    });

    // Parse Tiêu đề
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b dark:border-slate-800">$1</h2>');

    // Parse In đậm & In nghiêng
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Parse Inline Code `code`
    html = html.replace(/`(.*?)`/g, '<code class="mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs">$1</code>');

    // Parse Gạch đầu dòng
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300 leading-relaxed">$1</li>');

    // Parse Xuống dòng
    html = html.replace(/\n/g, '<br>');

    return `<div class="prose dark:prose-invert text-xs leading-relaxed">${html}</div>`;
  }

  // --- GIAO DIỆN CHÍNH ---
  renderMainStructure() {
    const root = document.getElementById(this.containerId);
    if (!root) return;

    root.innerHTML = `
      <section class="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        
        <!-- Accordion Header -->
        <div class="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div class="flex items-center gap-3 cursor-pointer select-none" id="res-toggle-header">
            <span class="text-xl">📓</span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sổ Tay Cá Nhân & Góc Học Tập
                </h3>
                <span id="res-file-badge" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200">
                  📁 Gắn kết file ổ cứng
                </span>
                <span id="res-sync-badge"></span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ghi chép tự do, chèn ảnh/GIF/video, auto-save từng phím, hỗ trợ sửa nhanh
              </p>
            </div>
            <span id="res-chevron" class="text-slate-400 text-xs transition-transform transform duration-200 ml-1">▼</span>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-open-add-modal" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
              <span>+</span> Thêm Note / Video
            </button>
            
            <button id="btn-sync-github" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition" title="Đồng bộ ngay lên GitHub repository">
              <span>🚀</span> <span>Đồng Bộ Lên GitHub</span>
            </button>

            <button id="btn-open-export-modal" class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition" title="Xem & Xuất mã JSON">
              <span>⚡</span> JSON
            </button>
          </div>
        </div>

        <!-- TAB NAVIGATION -->
        <div class="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
          <div class="flex items-center gap-1" id="tab-nav">
            <button class="tab-btn active px-4 py-2 text-xs font-bold border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition flex items-center gap-1.5" data-tab="notes">
              <span>📝</span> <span>Sổ Tay Ghi Chú Cá Nhân</span>
            </button>
            <button class="tab-btn px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent transition flex items-center gap-1.5" data-tab="videos">
              <span>🎬</span> <span>Video & Tư Liệu Tham Khảo</span>
              <span id="tab-res-count" class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800">${this.getAllResources().length}</span>
            </button>
          </div>

          <div class="text-[11px] text-slate-400 hidden sm:flex items-center gap-3" id="tab-status-tip">
            <span>💡 Mẹo: Có thể bấm <strong>Ctrl + V</strong> để dán trực tiếp ảnh từ Clipboard!</span>
          </div>
        </div>

        <!-- Accordion Body -->
        <div id="res-content-body" class="p-6 transition-all duration-300">
          
          <!-- TAB 1: SỔ TAY GHI CHÚ ĐA PHƯƠNG TIỆN (RICH SCRATCHPAD) -->
          <div id="tab-content-notes" class="flex flex-col gap-3">
            
            <!-- Toolbar Của Sổ Tay: Chèn Ảnh, GIF, Video & Switch Edit/Preview -->
            <div class="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              
              <div class="flex items-center gap-1.5">
                <!-- Chế độ Soạn thảo / Xem trước -->
                <div class="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button id="btn-mode-edit" class="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white transition flex items-center gap-1">
                    ✏️ Soạn Thảo
                  </button>
                  <button id="btn-mode-preview" class="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition flex items-center gap-1">
                    👁️ Xem Trước (Render)
                  </button>
                </div>

                <span class="text-slate-300 dark:text-slate-700">|</span>

                <!-- Nút chèn Ảnh / GIF -->
                <button id="btn-insert-image" class="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5" title="Chèn ảnh hoặc ảnh GIF động">
                  <span>🖼️</span> <span>Chèn Ảnh / GIF</span>
                </button>
                <input type="file" id="input-file-image" accept="image/*" class="hidden">

                <!-- Nút chèn Video Ngắn -->
                <button id="btn-insert-video" class="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5" title="Chèn video ngắn (.mp4)">
                  <span>🎥</span> <span>Chèn Video</span>
                </button>
                <input type="file" id="input-file-video" accept="video/mp4,video/webm" class="hidden">
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span id="notepad-save-indicator" class="text-emerald-600 dark:text-emerald-400 font-medium">✓ Đã tự lưu</span>
                <span>•</span>
                <span id="notepad-char-count">0 ký tự</span>
                <span>•</span>
                <button id="btn-copy-notepad" class="hover:text-blue-600 dark:hover:text-blue-400 transition" title="Sao chép toàn bộ">
                  📋 Copy
                </button>
                <span>•</span>
                <button id="btn-download-notepad" class="hover:text-blue-600 dark:hover:text-blue-400 transition" title="Tải file .md">
                  📥 Tải .md
                </button>
                <span>•</span>
                <button id="btn-clear-notepad" class="hover:text-rose-600 transition" title="Xóa trắng sổ tay">
                  🧹 Xóa
                </button>
              </div>

            </div>

            <!-- Khung Soạn Thảo Textarea (Edit Mode) -->
            <textarea id="personal-notepad" rows="10" 
                      placeholder="✍️ Gõ bất kỳ ghi chú nào bạn muốn tại đây...
- Hỗ trợ dán ảnh trực tiếp từ Clipboard (chụp màn hình rồi bấm Ctrl + V)
- Hỗ trợ chèn link ảnh/GIF: ![Mô tả](url)
- Hỗ trợ chèn video ngắn: <video src='...' controls></video>
- Tự động lưu theo từng phím gõ vào máy tính!" 
                      class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition"></textarea>

            <!-- Khung Xem Trước Preview (Preview Mode - Ẩn mặc định) -->
            <div id="personal-notepad-preview" class="hidden w-full min-h-[220px] max-h-[460px] overflow-y-auto p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition shadow-inner">
            </div>

          </div>

          <!-- TAB 2: VIDEO LAB & TƯ LIỆU THAM KHẢO -->
          <div id="tab-content-videos" class="hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Video Player Dock (Col 7) -->
            <div class="lg:col-span-7 flex flex-col gap-3" id="res-inline-player-wrapper">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Trình Phát Video</span>
                  <span id="res-current-title" class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs font-medium">Chưa chọn video</span>
                </div>
                <button id="btn-toggle-pip" class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 transition">
                  <span>📺</span> <span>Bật Cửa Sổ Nổi (PiP)</span>
                </button>
              </div>

              <!-- Iframe Container -->
              <div class="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                <div id="res-player-dock" class="w-full h-full">
                  <div class="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
                    <span class="text-3xl mb-2">🎬</span>
                    <p>Chọn một video từ danh sách bên phải hoặc thêm video YouTube mới để bắt đầu xem.</p>
                  </div>
                </div>
              </div>

              <!-- Timestamp & Ghi chú của video đang xem (KÈM NÚT SỬA NHANH) -->
              <div id="res-active-notes-box" class="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed transition flex flex-col gap-2">
                <!-- Nội dung hiển thị / Form sửa nhanh sẽ được render ở đây -->
              </div>
            </div>

            <!-- Resource Cards List (Col 5) -->
            <div class="lg:col-span-5 flex flex-col gap-3">
              <div class="flex items-center justify-between pb-1">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Danh Sách Tư Liệu & Thẻ Note</span>
                <span class="text-[11px] text-slate-400">Click để mở / xem</span>
              </div>
              <div class="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-1" id="res-cards-list">
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- MODAL THÊM TƯ LIỆU / NOTE MỚI -->
      <div id="res-modal-add" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">➕</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Thêm Tư Liệu Hoặc Thẻ Ghi Chú</h3>
            </div>
            <button id="btn-close-add-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2">&times;</button>
          </div>

          <form id="res-form-add" class="flex flex-col gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loại mục:</label>
              <select id="form-input-type" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
                <option value="note">📝 Thẻ Ghi Chú Cá Nhân (Không cần link)</option>
                <option value="youtube">🎥 Video YouTube (Nhận diện ID & Timestamp)</option>
                <option value="blog">📄 Bài viết / Blog / Tài liệu Web</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề ghi chú / tư liệu *:</label>
              <input type="text" id="form-input-title" required placeholder="Ví dụ: Đúc kết về bước cập nhật tâm cụm K-Means..." 
                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
            </div>

            <div id="form-group-url" class="hidden">
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn (URL):</label>
              <input type="url" id="form-input-url" placeholder="https://..." 
                     class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
            </div>

            <div id="form-group-video-meta" class="hidden grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tác giả / Kênh:</label>
                <input type="text" id="form-input-author" placeholder="Ví dụ: Josh Starmer" 
                       class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bắt đầu tại (mm:ss hoặc giây):</label>
                <input type="text" id="form-input-time" placeholder="Ví dụ: 02:00" 
                       class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100">
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nội dung ghi chú *:</label>
              <textarea id="form-input-notes" required rows="4" placeholder="Viết những gì bạn đúc kết, mẹo nhớ, hoặc giải thích cá nhân..." 
                        class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"></textarea>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span>Mức quan trọng:</span>
                <select id="form-input-rating" class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 font-semibold text-amber-500">
                  <option value="5">⭐⭐⭐⭐⭐ (Cốt lõi)</option>
                  <option value="4">⭐⭐⭐⭐ (Quan trọng)</option>
                  <option value="3">⭐⭐⭐ (Tham khảo)</option>
                </select>
              </div>

              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                Lưu Thẻ Ghi Chú
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CHÈN LINK ẢNH / VIDEO -->
      <div id="res-modal-media-link" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-2">
            <h4 class="text-xs font-bold text-slate-900 dark:text-white" id="media-modal-title">Chèn Đường Dẫn Media</h4>
            <button id="btn-close-media-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">&times;</button>
          </div>
          <div class="flex flex-col gap-2 text-xs">
            <label class="text-slate-700 dark:text-slate-300 font-medium" id="media-modal-label">URL ảnh / GIF online:</label>
            <input type="url" id="input-media-url" placeholder="https://..." class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100">
            <div class="flex items-center justify-between mt-1">
              <span class="text-[11px] text-slate-400">Hoặc chọn file từ máy:</span>
              <button id="btn-trigger-file-upload" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-200 text-[11px]">
                📁 Chọn File Máy Tính
              </button>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
            <button id="btn-confirm-insert-media" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs">
              Chèn Vào Sổ Tay
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL CẤU HÌNH GITHUB TOKEN -->
      <div id="res-modal-gh-config" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🐙</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Cấu Hình Đồng Bộ GitHub</h3>
            </div>
            <button id="btn-close-gh-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2">&times;</button>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Nhập <strong>GitHub Personal Access Token (PAT)</strong> có quyền ghi vào repo <code>${this.repoName}</code> để bấm 1-click là tự tạo commit lên GitHub:
          </p>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">GitHub Token:</label>
            <input type="password" id="input-gh-token" placeholder="ghp_... hoặc github_pat_..." 
                   class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-800 dark:text-slate-100">
            <p class="text-[11px] text-slate-400">Token được lưu an toàn tại LocalStorage máy bạn, không gửi đi đâu khác.</p>
          </div>

          <div class="pt-2 border-t dark:border-slate-800 flex items-center justify-between">
            <button id="btn-clear-gh-token" class="text-xs text-rose-500 hover:underline">Xóa Token cũ</button>
            <div class="flex gap-2">
              <button id="btn-save-gh-token" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
                Lưu Token & Đồng Bộ Ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL XUẤT JSON -->
      <div id="res-modal-export" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">⚡</span>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Xuất Cấu Hình JSON & Lệnh Git</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Toàn bộ sổ tay ghi chép, media và danh sách tư liệu</p>
              </div>
            </div>
            <button id="btn-close-export-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl px-2">&times;</button>
          </div>

          <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] mono text-emerald-400 flex items-center justify-between">
            <code>git add . && git commit -m "docs: sync notes" && git push</code>
            <button id="btn-copy-git-cmd" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]">Copy Lệnh</button>
          </div>

          <textarea id="res-export-textarea" readonly rows="8" 
                    class="w-full mono text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-xl border border-slate-800 focus:outline-none"></textarea>

          <div class="flex justify-end gap-2">
            <button id="btn-copy-json" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
              <span>📋</span> <span id="copy-text">Sao Chép JSON</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TOAST NOTIFICATION CONTAINER -->
      <div id="res-toast" class="fixed top-5 right-5 z-50 hidden px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold transition-all duration-300 transform translate-y-[-10px]"></div>
    `;

    const notepad = document.getElementById('personal-notepad');
    if (notepad) {
      notepad.value = this.notepadContent;
      this.updateCharCount(this.notepadContent);
    }

    this.renderCardsList();
    this.updateFileStatusBadge(false);
  }

  updateCharCount(text) {
    const el = document.getElementById('notepad-char-count');
    if (el) {
      el.innerText = `${text.length} ký tự`;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('res-toast');
    if (!toast) return;
    toast.innerText = message;
    if (type === 'success') {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold bg-emerald-600 text-white border border-emerald-400 block animate-bounce';
    } else if (type === 'error') {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold bg-rose-600 text-white border border-rose-400 block';
    } else {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold bg-slate-900 text-white border border-slate-700 block';
    }
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  // --- FLOATING PICTURE-IN-PICTURE CONTAINER ---
  createFloatingPiPContainer() {
    let pip = document.getElementById('res-floating-pip');
    if (!pip) {
      pip = document.createElement('div');
      pip.id = 'res-floating-pip';
      pip.className = 'fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 z-50 hidden flex flex-col overflow-hidden transition-all duration-300';
      pip.innerHTML = `
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
        <div class="relative w-full aspect-video bg-black" id="pip-video-wrapper"></div>
      `;
      document.body.appendChild(pip);
      this.initDraggablePiP(pip);
    }
  }

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
    const badgeEl = document.getElementById('tab-res-count');
    if (!listEl) return;

    const all = this.getAllResources();
    if (badgeEl) badgeEl.innerText = all.length;

    if (all.length === 0) {
      listEl.innerHTML = `
        <div class="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
          Chưa có mục nào. Bấm <strong>"+ Thêm Note / Video"</strong> để tạo thẻ ghi chú hoặc video đầu tiên!
        </div>
      `;
      return;
    }

    listEl.innerHTML = all.map(res => {
      const isVideo = res.type === 'youtube';
      const isSelected = this.activeVideo && this.activeVideo.id === res.id;
      
      let icon = '📝';
      let badgeType = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      let labelType = 'Ghi Chú';

      if (isVideo) {
        icon = '🎥';
        badgeType = 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
        labelType = 'YouTube';
      } else if (res.type === 'paper') {
        icon = '📄';
        badgeType = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
        labelType = 'Doc/Paper';
      }

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
              ${labelType}
            </span>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Tác giả: <strong>${res.author || 'Cá nhân'}</strong></span>
            <span class="text-[10px]">${stars}</span>
          </div>

          ${res.userNotes ? `
            <p class="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 leading-normal line-clamp-3">
              💡 ${res.userNotes}
            </p>
          ` : ''}

          <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
            ${isVideo ? `
              <button class="btn-play-card text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1" data-id="${res.id}">
                ▶ Xem Video ${res.startSeconds ? `(${Math.floor(res.startSeconds/60)}p${res.startSeconds%60}s)` : ''}
              </button>
            ` : (res.url ? `
              <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1" onclick="event.stopPropagation()">
                Mở Bài Viết ↗
              </a>
            ` : `
              <span class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Ghi chú cá nhân</span>
            `)}

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

    listEl.querySelectorAll('.res-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const res = this.getAllResources().find(r => r.id === id);
        if (res && res.type === 'youtube') {
          this.switchTab('videos');
          this.playVideo(id);
        } else if (res && res.url) {
          window.open(res.url, '_blank');
        }
      });
    });

    listEl.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.deleteCustomResource(id);
      });
    });
  }

  // --- RENDER GHI CHÚ DƯỚI VIDEO (KÈM NÚT SỬA NHANH INLINE) ---
  renderActiveVideoNotes() {
    const notesBox = document.getElementById('res-active-notes-box');
    if (!notesBox || !this.activeVideo) return;

    const res = this.activeVideo;

    if (this.isEditingVideoNote) {
      // Chế độ chỉnh sửa inline
      notesBox.innerHTML = `
        <div class="flex items-center justify-between border-b dark:border-slate-800 pb-2 mb-1">
          <span class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>✏️</span> <span>Sửa Nhanh Ghi Chú & Timestamp</span>
          </span>
          <span class="text-[10px] text-slate-400">Đang chỉnh sửa</span>
        </div>

        <div class="flex flex-col gap-2">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Nội dung ghi chú của bạn:</label>
            <textarea id="inline-edit-notes-input" rows="3" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500">${res.userNotes || ''}</textarea>
          </div>

          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-1.5 text-[11px]">
              <label class="text-slate-600 dark:text-slate-400 font-medium">Bắt đầu tại (mm:ss hoặc giây):</label>
              <input type="text" id="inline-edit-time-input" value="${res.startSeconds ? `${Math.floor(res.startSeconds/60)}:${(res.startSeconds%60).toString().padStart(2, '0')}` : '0'}" 
                     class="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100">
            </div>

            <div class="flex items-center gap-2">
              <button id="btn-cancel-inline-edit" class="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition">
                Hủy
              </button>
              <button id="btn-save-inline-edit" class="px-3.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-cancel-inline-edit')?.addEventListener('click', () => {
        this.isEditingVideoNote = false;
        this.renderActiveVideoNotes();
      });

      document.getElementById('btn-save-inline-edit')?.addEventListener('click', () => {
        const newNotes = document.getElementById('inline-edit-notes-input').value.trim();
        const timeInput = document.getElementById('inline-edit-time-input').value.trim();
        
        let startSec = 0;
        if (/^\d+$/.test(timeInput)) {
          startSec = parseInt(timeInput, 10);
        } else {
          const parts = timeInput.split(':');
          if (parts.length === 2) {
            startSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          }
        }

        // Cập nhật dữ liệu
        this.updateVideoNote(res.id, newNotes, startSec);
      });

    } else {
      // Chế độ hiển thị bình thường kèm nút Sửa Nhanh
      notesBox.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <span>💡 Ghi chú của bạn:</span>
            ${res.startSeconds ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Nhảy vào: ${Math.floor(res.startSeconds/60)}m${(res.startSeconds%60).toString().padStart(2, '0')}s</span>` : ''}
          </div>
          <!-- NÚT SỬA NHANH THEO YÊU CẦU -->
          <button id="btn-trigger-inline-edit" class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/70 rounded-md border border-blue-200 dark:border-blue-900 transition" title="Chỉnh sửa ghi chú và timestamp của video này">
            <span>✏️</span> <span>Sửa nhanh</span>
          </button>
        </div>
        <p class="text-slate-700 dark:text-slate-300 leading-relaxed">${res.userNotes || '<em class="text-slate-400">Chưa có ghi chú cho video này. Bấm "Sửa nhanh" để thêm ngay!</em>'}</p>
      `;

      document.getElementById('btn-trigger-inline-edit')?.addEventListener('click', () => {
        this.isEditingVideoNote = true;
        this.renderActiveVideoNotes();
      });
    }
  }

  updateVideoNote(videoId, newNotes, startSeconds) {
    // Tìm trong customList
    let customItem = this.customList.find(r => r.id === videoId);

    if (customItem) {
      customItem.userNotes = newNotes;
      customItem.startSeconds = startSeconds;
    } else {
      // Nếu là curated item, tạo 1 bản custom override
      const curatedItem = this.curatedList.find(r => r.id === videoId);
      if (curatedItem) {
        const override = {
          ...curatedItem,
          userNotes: newNotes,
          startSeconds: startSeconds,
          source: 'custom'
        };
        this.customList.unshift(override);
      }
    }

    if (this.activeVideo && this.activeVideo.id === videoId) {
      this.activeVideo.userNotes = newNotes;
      this.activeVideo.startSeconds = startSeconds;
    }

    this.saveCustomResources();
    this.isEditingVideoNote = false;
    this.renderActiveVideoNotes();
    this.renderCardsList();
    this.showToast('✅ Đã cập nhật ghi chú thành công!', 'success');
  }

  // --- PLAY VIDEO ---
  playVideo(resourceId, scrollIntoView = true) {
    const res = this.getAllResources().find(r => r.id === resourceId);
    if (!res || res.type !== 'youtube') return;

    this.activeVideo = res;
    this.isEditingVideoNote = false;
    
    const titleEl = document.getElementById('res-current-title');
    const pipTitleEl = document.getElementById('pip-title');
    if (titleEl) titleEl.innerText = res.title;
    if (pipTitleEl) pipTitleEl.innerText = res.title;

    this.renderActiveVideoNotes();

    const isLocalFile = window.location.protocol === 'file:';
    const originParam = !isLocalFile && window.location.origin ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    const startParam = res.startSeconds ? `&start=${res.startSeconds}` : '';
    
    const embedUrl = `https://www.youtube.com/embed/${res.videoId}?enablejsapi=1&rel=0&modestbranding=1${startParam}${originParam}`;
    
    const iframeHtml = `
      <div class="relative w-full h-full flex flex-col">
        <iframe src="${embedUrl}" title="${res.title}" 
                class="w-full h-full border-0 flex-1" 
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen></iframe>
        
        <div class="bg-slate-900/90 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
          <span class="truncate">Không phát được do chính sách YouTube?</span>
          <div class="flex items-center gap-2 shrink-0">
            <a href="${res.url}" target="_blank" rel="noopener noreferrer" 
               class="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 hover:underline">
              <span>Mở Xem Trên YouTube</span> ↗
            </a>
            ${isLocalFile ? `
              <span class="text-slate-600">|</span>
              <a href="https://proplasma.github.io/Neural-Odyssey-AI/simulations/02-classical-ml/kmeans-clustering.html" target="_blank" 
                 class="text-blue-400 hover:text-blue-300 font-medium hover:underline" title="Xem trên link online có HTTPS để tránh lỗi Error 153">
                Xem trên GitHub Pages 🌐
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    const targetContainer = this.isPiP 
      ? document.getElementById('pip-video-wrapper') 
      : document.getElementById('res-player-dock');

    if (targetContainer) {
      targetContainer.innerHTML = iframeHtml;
    }

    this.renderCardsList();

    if (scrollIntoView && !this.isPiP && this.activeTab === 'videos') {
      document.getElementById('res-inline-player-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --- TOGGLE PIP ---
  togglePiP() {
    this.isPiP = !this.isPiP;
    const pipEl = document.getElementById('res-floating-pip');
    const pipWrapper = document.getElementById('pip-video-wrapper');
    const dockWrapper = document.getElementById('res-player-dock');
    const btnTogglePiP = document.getElementById('btn-toggle-pip');

    if (this.isPiP) {
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
      pipEl.classList.add('hidden');
      if (pipWrapper.firstElementChild) {
        dockWrapper.innerHTML = '';
        dockWrapper.appendChild(pipWrapper.firstElementChild);
      }
      btnTogglePiP.innerHTML = `<span>📺</span> <span>Bật Cửa Sổ Nổi (PiP)</span>`;
    }
  }

  // --- CHUYỂN TAB CHÍNH ---
  switchTab(tabName) {
    this.activeTab = tabName;
    const tabNotes = document.getElementById('tab-content-notes');
    const tabVideos = document.getElementById('tab-content-videos');
    const buttons = document.querySelectorAll('.tab-btn');

    buttons.forEach(b => {
      if (b.getAttribute('data-tab') === tabName) {
        b.className = 'tab-btn active px-4 py-2 text-xs font-bold border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition flex items-center gap-1.5';
      } else {
        b.className = 'tab-btn px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-b-2 border-transparent transition flex items-center gap-1.5';
      }
    });

    if (tabName === 'notes') {
      tabNotes?.classList.remove('hidden');
      tabVideos?.classList.add('hidden');
    } else {
      tabNotes?.classList.add('hidden');
      tabVideos?.classList.remove('hidden');
      if (this.activeVideo) {
        this.playVideo(this.activeVideo.id, false);
      }
    }
  }

  // --- CHUYỂN CHẾ ĐỘ SỔ TAY: EDIT VS PREVIEW ---
  switchNotepadMode(mode) {
    this.notepadMode = mode;
    const textarea = document.getElementById('personal-notepad');
    const preview = document.getElementById('personal-notepad-preview');
    const btnEdit = document.getElementById('btn-mode-edit');
    const btnPrev = document.getElementById('btn-mode-preview');

    if (mode === 'preview') {
      btnPrev.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white transition flex items-center gap-1';
      btnEdit.className = 'px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition flex items-center gap-1';
      textarea.classList.add('hidden');
      preview.classList.remove('hidden');
      preview.innerHTML = this.renderMarkdownToHtml(this.notepadContent);
    } else {
      btnEdit.className = 'px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white transition flex items-center gap-1';
      btnPrev.className = 'px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md transition flex items-center gap-1';
      preview.classList.add('hidden');
      textarea.classList.remove('hidden');
      textarea.focus();
    }
  }

  // --- CHÈN MEDIA VÀO VỊ TRÍ CON TRỎ CỦA TEXTAREA ---
  insertTextAtCursor(textToInsert) {
    const textarea = document.getElementById('personal-notepad');
    if (!textarea) return;

    if (this.notepadMode === 'preview') {
      this.switchNotepadMode('edit');
    }

    const startPos = textarea.selectionStart || 0;
    const endPos = textarea.selectionEnd || 0;
    const before = textarea.value.substring(0, startPos);
    const after = textarea.value.substring(endPos, textarea.value.length);

    textarea.value = before + textToInsert + after;
    textarea.selectionStart = textarea.selectionEnd = startPos + textToInsert.length;
    textarea.focus();

    this.saveNotepad(textarea.value);
    this.updateCharCount(textarea.value);
  }

  // --- THÊM & XÓA CUSTOM RESOURCE / NOTE ---
  addCustomResource(data) {
    const newId = `custom_${Date.now()}`;
    const isVideo = data.type === 'youtube';
    const parsed = isVideo ? NeuralResourceManager.parseYouTube(data.url) : null;

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
      author: data.author || 'Ghi chép của tôi',
      url: data.url || '',
      videoId: parsed ? parsed.videoId : null,
      startSeconds: startSec,
      userNotes: data.notes || '',
      rating: parseInt(data.rating || 5, 10),
      source: 'custom',
      createdAt: new Date().toISOString()
    };

    this.customList.unshift(item);
    this.saveCustomResources();
    this.renderCardsList();

    if (item.type === 'youtube') {
      this.switchTab('videos');
      this.playVideo(item.id);
    }
    this.showToast('✅ Đã lưu thẻ ghi chú thành công vào máy tính!', 'success');
  }

  deleteCustomResource(id) {
    if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
      this.customList = this.customList.filter(item => item.id !== id);
      this.saveCustomResources();
      this.renderCardsList();
      this.showToast('🗑 Đã xóa thẻ khỏi máy tính.', 'info');
    }
  }

  // --- BIND EVENTS ---
  bindEvents() {
    // 1. Toggle Accordion
    const toggleHeader = document.getElementById('res-toggle-header');
    const contentBody = document.getElementById('res-content-body');
    const chevron = document.getElementById('res-chevron');

    toggleHeader?.addEventListener('click', (e) => {
      if (e.target.closest('#res-file-badge') || e.target.closest('#res-sync-badge')) return;
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        contentBody.classList.add('hidden');
        chevron.style.transform = 'rotate(-90deg)';
      } else {
        contentBody.classList.remove('hidden');
        chevron.style.transform = 'rotate(0deg)';
      }
    });

    // 2. Chuyển Tab (Sổ tay cá nhân vs Video Lab)
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // 3. Chuyển chế độ Sổ tay (Edit vs Preview)
    document.getElementById('btn-mode-edit')?.addEventListener('click', () => this.switchNotepadMode('edit'));
    document.getElementById('btn-mode-preview')?.addEventListener('click', () => this.switchNotepadMode('preview'));

    // 4. Sổ tay tự động lưu theo từng phím gõ
    const notepad = document.getElementById('personal-notepad');
    const indicator = document.getElementById('notepad-save-indicator');
    let saveTimeout = null;

    notepad?.addEventListener('input', (e) => {
      const val = e.target.value;
      this.updateCharCount(val);
      if (indicator) {
        indicator.innerText = 'Đang lưu...';
        indicator.className = 'text-[11px] text-amber-500 font-medium';
      }

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.saveNotepad(val);
        if (indicator) {
          indicator.innerText = '✓ Đã tự lưu';
          indicator.className = 'text-[11px] text-emerald-600 dark:text-emerald-400 font-medium';
        }
      }, 350);
    });

    // 5. TÍNH NĂNG ĐỈNH CAO: PASTE ẢNH TRỰC TIẾP TỪ CLIPBOARD (CTRL + V)
    notepad?.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            this.insertTextAtCursor(`\n\n![Ảnh chụp ${new Date().toLocaleTimeString('vi-VN')}](${dataUrl})\n\n`);
            this.showToast('📸 Đã dán ảnh từ Clipboard thành công!', 'success');
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    });

    // 6. Nút Chèn Ảnh / GIF & Video
    const modalMedia = document.getElementById('res-modal-media-link');
    const mediaInputUrl = document.getElementById('input-media-url');
    let currentMediaType = 'image'; // 'image' hoặc 'video'

    document.getElementById('btn-insert-image')?.addEventListener('click', () => {
      currentMediaType = 'image';
      document.getElementById('media-modal-title').innerText = 'Chèn Ảnh Hoặc Ảnh GIF Động';
      document.getElementById('media-modal-label').innerText = 'Nhập link ảnh online (.png, .jpg, .gif, .webp):';
      mediaInputUrl.value = '';
      modalMedia.classList.remove('hidden');
    });

    document.getElementById('btn-insert-video')?.addEventListener('click', () => {
      currentMediaType = 'video';
      document.getElementById('media-modal-title').innerText = 'Chèn Video Ngắn';
      document.getElementById('media-modal-label').innerText = 'Nhập link video online (.mp4, .webm):';
      mediaInputUrl.value = '';
      modalMedia.classList.remove('hidden');
    });

    document.getElementById('btn-close-media-modal')?.addEventListener('click', () => modalMedia.classList.add('hidden'));

    document.getElementById('btn-confirm-insert-media')?.addEventListener('click', () => {
      const url = mediaInputUrl.value.trim();
      if (!url) {
        alert('Vui lòng nhập đường dẫn URL!');
        return;
      }
      if (currentMediaType === 'image') {
        this.insertTextAtCursor(`\n\n![Hình ảnh](${url})\n\n`);
      } else {
        this.insertTextAtCursor(`\n\n<video src="${url}" controls class="w-full max-w-md rounded-xl my-2 border border-slate-700"></video>\n\n`);
      }
      modalMedia.classList.add('hidden');
      this.showToast('✅ Đã chèn media vào sổ tay!', 'success');
    });

    // File upload picker
    const fileImgInput = document.getElementById('input-file-image');
    const fileVidInput = document.getElementById('input-file-video');

    document.getElementById('btn-trigger-file-upload')?.addEventListener('click', () => {
      modalMedia.classList.add('hidden');
      if (currentMediaType === 'image') {
        fileImgInput.click();
      } else {
        fileVidInput.click();
      }
    });

    fileImgInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.insertTextAtCursor(`\n\n![${file.name}](${ev.target.result})\n\n`);
          this.showToast(`🖼️ Đã chèn ảnh: ${file.name}`, 'success');
        };
        reader.readAsDataURL(file);
      }
    });

    fileVidInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.insertTextAtCursor(`\n\n<video src="${ev.target.result}" controls class="w-full max-w-md rounded-xl my-2 border border-slate-700"></video>\n\n`);
          this.showToast(`🎥 Đã chèn video: ${file.name}`, 'success');
        };
        reader.readAsDataURL(file);
      }
    });

    // 7. Các nút thao tác Sổ tay
    document.getElementById('btn-copy-notepad')?.addEventListener('click', () => {
      const text = notepad.value;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 Đã sao chép toàn bộ ghi chú!', 'info');
      });
    });

    document.getElementById('btn-download-notepad')?.addEventListener('click', () => {
      const text = notepad.value;
      if (!text) {
        alert('Sổ tay đang trống!');
        return;
      }
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.topicId}-notes.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.showToast('📥 Đã tải file markdown về máy!', 'success');
    });

    document.getElementById('btn-clear-notepad')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xóa toàn bộ nội dung trong sổ tay này?')) {
        notepad.value = '';
        this.saveNotepad('');
        this.updateCharCount('');
        document.getElementById('personal-notepad-preview').innerHTML = '';
        this.showToast('🧹 Đã xóa sạch sổ tay.', 'info');
      }
    });

    // 8. Gắn kết file ổ cứng
    document.getElementById('res-file-badge')?.addEventListener('click', () => this.linkLocalFile());

    // 9. Nút Đồng bộ GitHub
    document.getElementById('btn-sync-github')?.addEventListener('click', () => this.syncToGitHub());

    // 10. Modal GitHub Token
    const ghModal = document.getElementById('res-modal-gh-config');
    const ghInput = document.getElementById('input-gh-token');
    const existingToken = localStorage.getItem(this.ghTokenKey);
    if (existingToken && ghInput) ghInput.value = existingToken;

    document.getElementById('btn-close-gh-modal')?.addEventListener('click', () => ghModal.classList.add('hidden'));
    document.getElementById('btn-save-gh-token')?.addEventListener('click', () => {
      const val = ghInput.value.trim();
      if (val) {
        localStorage.setItem(this.ghTokenKey, val);
        ghModal.classList.add('hidden');
        this.syncToGitHub();
      } else {
        alert('Vui lòng nhập GitHub Token!');
      }
    });
    document.getElementById('btn-clear-gh-token')?.addEventListener('click', () => {
      localStorage.removeItem(this.ghTokenKey);
      if (ghInput) ghInput.value = '';
      this.showToast('Đã xóa GitHub Token.', 'info');
    });

    // 11. PiP Buttons
    document.getElementById('btn-toggle-pip')?.addEventListener('click', () => this.togglePiP());
    document.getElementById('btn-pip-dock')?.addEventListener('click', () => this.togglePiP());
    document.getElementById('btn-pip-close')?.addEventListener('click', () => this.togglePiP());

    // 12. Add Modal (Hiện/ẩn trường URL theo loại)
    const addModal = document.getElementById('res-modal-add');
    const typeSelect = document.getElementById('form-input-type');
    const groupUrl = document.getElementById('form-group-url');
    const groupVideoMeta = document.getElementById('form-group-video-meta');
    const inputUrl = document.getElementById('form-input-url');

    typeSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'note') {
        groupUrl.classList.add('hidden');
        groupVideoMeta.classList.add('hidden');
        inputUrl.required = false;
      } else if (val === 'youtube') {
        groupUrl.classList.remove('hidden');
        groupVideoMeta.classList.remove('hidden');
        inputUrl.required = true;
      } else {
        groupUrl.classList.remove('hidden');
        groupVideoMeta.classList.add('hidden');
        inputUrl.required = true;
      }
    });

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

    // 13. Export Modal
    const exportModal = document.getElementById('res-modal-export');
    const exportTextarea = document.getElementById('res-export-textarea');
    document.getElementById('btn-open-export-modal')?.addEventListener('click', () => {
      const all = this.getCombinedData();
      exportTextarea.value = JSON.stringify(all, null, 2);
      exportModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-export-modal')?.addEventListener('click', () => exportModal.classList.add('hidden'));

    document.getElementById('btn-copy-json')?.addEventListener('click', () => {
      exportTextarea.select();
      navigator.clipboard.writeText(exportTextarea.value).then(() => {
        const copyText = document.getElementById('copy-text');
        copyText.innerText = 'Đã Sao Chép!';
        setTimeout(() => copyText.innerText = 'Sao Chép JSON', 2000);
      });
    });

    document.getElementById('btn-copy-git-cmd')?.addEventListener('click', () => {
      navigator.clipboard.writeText('git add . && git commit -m "docs: sync notes" && git push').then(() => {
        this.showToast('📋 Đã copy lệnh Git!', 'info');
      });
    });
  }
}
