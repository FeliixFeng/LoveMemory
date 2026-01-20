/**
 * LoveMemory - 前端交互逻辑
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'loveMemory';
  
  const state = {
    startDate: null,
    photos: []
  };

  const elements = {
    daysCount: document.getElementById('daysCount'),
    dateDisplay: document.getElementById('dateDisplay'),
    startDate: document.getElementById('startDate'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    previewContainer: document.getElementById('previewContainer'),
    galleryGrid: document.getElementById('galleryGrid'),
    emptyGallery: document.getElementById('emptyGallery'),
    floatingHearts: document.getElementById('floatingHearts'),
    secretGate: document.getElementById('secretGate'),
    imageModal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    modalClose: document.getElementById('modalClose')
  };

  function init() {
    loadState();
    setupEventListeners();
    updateCountdown();
    renderGallery();
    createFloatingHearts();
    
    setInterval(updateCountdown, 60000);
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        state.startDate = data.startDate ? new Date(data.startDate) : null;
        state.photos = data.photos || [];
        
        if (state.startDate) {
          elements.startDate.value = formatDateForInput(state.startDate);
        }
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startDate: state.startDate?.toISOString(),
        photos: state.photos
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function setupEventListeners() {
    elements.startDate.addEventListener('change', handleDateChange);
    
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    
    elements.modalClose.addEventListener('click', closeModal);
    elements.imageModal.addEventListener('click', (e) => {
      if (e.target === elements.imageModal) closeModal();
    });
    
    elements.secretGate.addEventListener('click', handleSecretGate);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function handleDateChange(e) {
    const dateValue = e.target.value;
    if (dateValue) {
      state.startDate = new Date(dateValue + 'T00:00:00');
      saveState();
      updateCountdown();
      showToast('💕 纪念日已保存');
    }
  }

  function updateCountdown() {
    if (!state.startDate) {
      elements.daysCount.textContent = '?';
      elements.dateDisplay.textContent = '请设置你们的纪念日 💕';
      return;
    }

    const now = new Date();
    const diff = now - state.startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    animateNumber(elements.daysCount, days);
    elements.dateDisplay.textContent = `从 ${formatDateForDisplay(state.startDate)} 开始`;
  }

  function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    const duration = 1000;
    const steps = 30;
    const increment = (target - current) / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const value = Math.round(current + increment * step);
      element.textContent = value;
      
      if (step >= steps) {
        element.textContent = target;
        clearInterval(timer);
      }
    }, duration / steps);
  }

  function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      processFiles(files);
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  }

  function processFiles(files) {
    elements.previewContainer.innerHTML = '';
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewItem = createPreviewItem(e.target.result, file);
        elements.previewContainer.appendChild(previewItem);
      };
      reader.readAsDataURL(file);
    });
    
    files.forEach(file => uploadFile(file));
  }

  function createPreviewItem(src, file) {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.innerHTML = `
      <img src="${src}" alt="Preview">
      <div class="preview-overlay">
        <div class="preview-loader"></div>
        <span class="preview-status">上传中...</span>
      </div>
    `;
    div.dataset.fileName = file.name;
    return div;
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const previewItem = elements.previewContainer.querySelector(
      `[data-file-name="${file.name}"]`
    );
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      
      state.photos.unshift({
        url: data.url,
        uploadedAt: new Date().toISOString()
      });
      saveState();
      
      if (previewItem) {
        previewItem.querySelector('.preview-status').textContent = '✓ 完成';
        previewItem.classList.add('upload-success');
        
        setTimeout(() => {
          previewItem.remove();
          if (elements.previewContainer.children.length === 0) {
            renderGallery();
          }
        }, 1500);
      }
      
      addPhotoToGallery(data.url, true);
      
    } catch (error) {
      console.error('Upload error:', error);
      if (previewItem) {
        previewItem.querySelector('.preview-status').textContent = '✗ 失败';
        previewItem.classList.add('upload-error');
      }
      showToast('上传失败，请重试', 'error');
    }
  }

  function renderGallery() {
    if (state.photos.length === 0) {
      elements.galleryGrid.innerHTML = '';
      elements.emptyGallery.style.display = 'block';
      return;
    }
    
    elements.emptyGallery.style.display = 'none';
    elements.galleryGrid.innerHTML = '';
    
    state.photos.forEach(photo => {
      addPhotoToGallery(photo.url, false);
    });
  }

  function addPhotoToGallery(url, animate = false) {
    elements.emptyGallery.style.display = 'none';
    
    const item = document.createElement('div');
    item.className = 'gallery-item' + (animate ? ' new-item' : '');
    
    item.innerHTML = `
      <img src="${url}" alt="Memory" loading="lazy">
      <div class="gallery-item-overlay">
        <button class="view-btn" title="查看">🔍</button>
        <button class="delete-btn" title="删除">🗑️</button>
      </div>
    `;
    
    const img = item.querySelector('img');
    img.addEventListener('click', () => openModal(url));
    
    item.querySelector('.view-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(url);
    });
    
    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePhoto(url, item);
    });
    
    if (animate) {
      elements.galleryGrid.insertBefore(item, elements.galleryGrid.firstChild);
    } else {
      elements.galleryGrid.appendChild(item);
    }
  }

  function deletePhoto(url, element) {
    if (!confirm('确定要删除这张照片吗？')) return;
    
    element.classList.add('deleting');
    
    setTimeout(() => {
      state.photos = state.photos.filter(p => p.url !== url);
      saveState();
      element.remove();
      
      if (state.photos.length === 0) {
        elements.emptyGallery.style.display = 'block';
      }
      
      showToast('照片已删除');
    }, 300);
  }

  function openModal(url) {
    elements.modalImage.src = url;
    elements.imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elements.imageModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function createFloatingHearts() {
    const hearts = ['💕', '💗', '💖', '💘', '❤️', '🩷'];
    const count = 15;
    
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.animationDuration = (15 + Math.random() * 20) + 's';
      heart.style.animationDelay = (Math.random() * 10) + 's';
      heart.style.fontSize = (16 + Math.random() * 24) + 'px';
      heart.style.opacity = 0.3 + Math.random() * 0.4;
      elements.floatingHearts.appendChild(heart);
    }
  }

  function handleSecretGate() {
    showToast('🔐 Secret feature coming soon...');
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDateForDisplay(date) {
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
