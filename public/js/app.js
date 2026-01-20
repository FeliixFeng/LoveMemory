function loveMemory() {
  return {
    startDate: '',
    daysTogether: 0,
    nextAnniversaryDays: 0,
    formattedStartDate: '--',
    photos: [],
    heroImage: '',
    isDragging: false,
    isUploading: false,
    lightboxOpen: false,
    lightboxImage: '',
    showSecretModal: false,
    showSettings: false,
    showCoverMenu: false,
    showMilestoneModal: false,
    showGalleryModal: false,
    scrolled: false,
    heroImageLoaded: false,
    currentHeroIndex: 0,
    heroTimer: null,
    hearts: [],
    
    milestones: [],
    editingMilestoneId: null,
    milestoneForm: {
      date: '',
      title: '',
      desc: '',
      icon: 'ph-heart'
    },
    
    milestoneIcons: [
      { id: 'ph-heart', name: 'Love' },
      { id: 'ph-airplane-tilt', name: 'Travel' },
      { id: 'ph-house', name: 'Home' },
      { id: 'ph-ring', name: 'Ring' },
      { id: 'ph-baby', name: 'Baby' },
      { id: 'ph-cake', name: 'Birthday' },
      { id: 'ph-camera', name: 'Photo' },
      { id: 'ph-star', name: 'Star' }
    ],
    
    defaultHeroImages: [
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=2573&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2549&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621091211034-53136cc1eb32?q=80&w=2535&auto=format&fit=crop'
    ],
    
    get activeHeroImages() {
      return this.heroImage 
        ? [this.heroImage, ...this.defaultHeroImages.slice(0, 4)]
        : this.defaultHeroImages;
    },
    
    get leftColumnPhotos() {
      return this.photos.slice(0, 6).filter((_, i) => i % 2 === 0);
    },
    
    get rightColumnPhotos() {
      return this.photos.slice(0, 6).filter((_, i) => i % 2 !== 0);
    },

    currentQuote: { text: '', author: '' },
    toast: { show: false, message: '', icon: 'ph-check' },
    
    quotes: [
      { text: "Time expands, then contracts, all in tune with the stirrings of the heart.", author: "Haruki Murakami" },
      { text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
      { text: "You are my today and all of my tomorrows.", author: "Leo Christopher" },
      { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
      { text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
      { text: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
      { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
      { text: "Love turns ordinary moments into timeless memories.", author: "Unknown" },
      { text: "We don't measure time in hours, but in memories.", author: "Unknown" },
      { text: "初见乍欢，久处仍怦然。", author: "佚名" },
      { text: "你是例外，也是偏爱。", author: "佚名" },
      { text: "那就在一起，晨昏与四季。", author: "佚名" },
      { text: "心怀浪漫宇宙，也惜人间日常。", author: "佚名" },
      { text: "在遇见你的那一刻，浩瀚众星，皆降为尘。", author: "佚名" },
      { text: "时间会告诉我们，简单的喜欢最长远，平凡中的陪伴最心安。", author: "佚名" },
      { text: "浮世三千，吾爱有三。日、月与卿。", author: "佚名" },
      { text: "春水初生，春林初盛，春风十里，不如你。", author: "冯唐" },
      { text: "山有木兮木有枝，心悦君兮君不知。", author: "《越人歌》" },
      { text: "玲珑骰子安红豆，入骨相思知不知。", author: "温庭筠" },
      { text: "愿我如星君如月，夜夜流光相皎洁。", author: "范成大" },
    ],
    
    formatDate(isoString) {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    
    formatDateShort(isoString) {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    },

    init() {
      this.loadData();
      this.refreshQuote();
      this.updateCountdown();
      this.startCarousel();
      this.initHearts();
      
      this.$nextTick(() => {
        const container = document.querySelector('.scroll-snap-x');
        if (container) container.scrollLeft = 0;
      });
      
      setInterval(() => this.updateCountdown(), 60000);
    },
    
    async loadData() {
      try {
        const response = await fetch('/api/data?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          this.startDate = data.startDate || '';
          this.photos = data.photos || [];
          this.heroImage = data.heroImage || '';
          this.milestones = data.milestones || [];
          
          if (this.milestones.length === 0) {
            this.initDefaultMilestones();
            this.saveData(); 
          }
          
          this.milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
          this.updateCountdown();
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    },
    
    async saveData() {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: this.startDate,
            photos: this.photos,
            heroImage: this.heroImage,
            milestones: this.milestones
          })
        });
      } catch (e) {
        console.error('Failed to save data:', e);
        this.showToast('Failed to sync', 'ph-warning');
      }
    },
    
    // Missing methods restored below:
    
    openMilestoneModal(milestone = null) {
      if (milestone) {
        // Edit mode
        this.editingMilestoneId = milestone.id;
        this.milestoneForm = { ...milestone };
      } else {
        // Create mode
        this.editingMilestoneId = null;
        this.milestoneForm = {
          date: new Date().toISOString().split('T')[0],
          title: '',
          desc: '',
          icon: 'ph-heart'
        };
      }
      this.showMilestoneModal = true;
    },
    
    saveMilestone() {
      if (!this.milestoneForm.title || !this.milestoneForm.date) {
        this.showToast('Please fill in title and date', 'ph-warning');
        return;
      }
      
      if (this.editingMilestoneId) {
        const index = this.milestones.findIndex(m => m.id === this.editingMilestoneId);
        if (index !== -1) {
          this.milestones[index] = { ...this.milestoneForm, id: this.editingMilestoneId };
        }
      } else {
        this.milestones.push({
          ...this.milestoneForm,
          id: Date.now()
        });
      }
      
      this.milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      this.saveData();
      this.showMilestoneModal = false;
      this.showToast('Milestone saved', 'ph-check');
      
      this.$nextTick(() => {
        const container = document.querySelector('.scroll-snap-x');
        if (container) container.scrollTo({ left: 0, behavior: 'smooth' });
      });
    },
    
    deleteMilestone() {
      if (!this.editingMilestoneId) return;
      
      if (confirm('Delete this milestone?')) {
        this.milestones = this.milestones.filter(m => m.id !== this.editingMilestoneId);
        this.saveData();
        this.showMilestoneModal = false;
        this.showToast('Milestone deleted', 'ph-trash');
      }
    },
    
    initDefaultMilestones() {
      this.milestones = [
        { id: 1, date: '2023-05-20', title: 'First Date', desc: 'That coffee shop...', icon: 'ph-heart' },
        { id: 2, date: '2023-10-01', title: 'First Trip', desc: 'Yunnan Adventure', icon: 'ph-airplane-tilt' }
      ];
      this.saveData();
    },

    saveStartDate() {
      this.saveData();
      this.updateCountdown();
      this.showToast('Date saved!', 'ph-heart');
    },
    
    updateCountdown() {
      if (!this.startDate) {
        this.daysTogether = 0;
        this.nextAnniversaryDays = 0;
        this.formattedStartDate = '--';
        return;
      }
      
      const start = new Date(this.startDate + 'T00:00:00');
      const now = new Date();
      const diff = now - start;
      this.daysTogether = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      
      let nextAnniv = new Date(now.getFullYear(), start.getMonth(), start.getDate());
      if (now > nextAnniv) {
        nextAnniv.setFullYear(now.getFullYear() + 1);
      }
      
      const diffNext = nextAnniv - now;
      this.nextAnniversaryDays = Math.ceil(diffNext / (1000 * 60 * 60 * 24));
      
      this.formattedStartDate = start.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    refreshQuote() {
      const randomIndex = Math.floor(Math.random() * this.quotes.length);
      this.currentQuote = this.quotes[randomIndex];
    },
    
    async handleFileUpload(event) {
      const files = Array.from(event.target.files);
      if (files.length === 0) return;
      
      for (const file of files) {
        await this.uploadFile(file);
      }
      event.target.value = '';
    },
    
    handleDrop(event) {
      this.isDragging = false;
      const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      files.forEach(file => this.uploadFile(file));
    },
    
    async uploadFile(file) {
      this.isUploading = true;
      try {
        const compressedFile = await this.compressImage(file);
        const formData = new FormData();
        formData.append('image', compressedFile);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        this.photos.unshift({ url: data.url, uploadedAt: new Date().toISOString() });
        this.saveData(); 
        this.showToast('Photo uploaded!', 'ph-check-circle');
      } catch (error) {
        console.error('Upload error:', error);
        this.showToast('Upload failed', 'ph-x-circle');
      } finally {
        this.isUploading = false;
      }
    },
    
    compressImage(file) {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) return resolve(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressedFile);
            }, 'image/jpeg', 0.8);
          };
        };
      });
    },

    handleHeroImage(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.compressImage(file).then(compressedFile => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.heroImage = e.target.result;
          this.saveData();
          this.currentHeroIndex = 0;
          this.startCarousel();
          this.showToast('Cover updated!', 'ph-image');
        };
        reader.readAsDataURL(compressedFile);
      });
    },
    
    removeHeroImage() {
      this.heroImage = '';
      this.saveData();
      this.currentHeroIndex = 0;
      this.showCoverMenu = false;
      this.showToast('Restored default covers', 'ph-arrow-counter-clockwise');
    },
    
    deletePhoto(index) {
      this.photos.splice(index, 1);
      this.saveData();
      this.showToast('Photo deleted', 'ph-trash');
    },
    
    confirmDelete(photo) {
      if (confirm('是否删除这张照片？')) {
        const index = this.photos.indexOf(photo);
        if (index > -1) this.deletePhoto(index);
      }
    },
    
    openLightbox(photo) {
      this.lightboxImage = photo.url;
      this.lightboxOpen = true;
    },
    
    showToast(message, icon = 'ph-check') {
      this.toast = { show: true, message, icon };
      setTimeout(() => {
        this.toast.show = false;
      }, 2500);
    },
    
    saveMilestone() {
      if (!this.milestoneForm.title || !this.milestoneForm.date) {
        this.showToast('Please fill in title and date', 'ph-warning');
        return;
      }
      
      if (this.editingMilestoneId) {
        const index = this.milestones.findIndex(m => m.id === this.editingMilestoneId);
        if (index !== -1) {
          this.milestones[index] = { ...this.milestoneForm, id: this.editingMilestoneId };
        }
      } else {
        this.milestones.push({
          ...this.milestoneForm,
          id: Date.now()
        });
      }
      
      this.milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveData();
      this.showMilestoneModal = false;
      this.showToast('Milestone saved', 'ph-check');
      this.$nextTick(() => {
        const container = document.querySelector('.scroll-snap-x');
        if (container) container.scrollTo({ left: 0, behavior: 'smooth' });
      });
    },
    
    deleteMilestone() {
      if (!this.editingMilestoneId) return;
      if (confirm('Delete this milestone?')) {
        this.milestones = this.milestones.filter(m => m.id !== this.editingMilestoneId);
        this.saveData();
        this.showMilestoneModal = false;
        this.showToast('Milestone deleted', 'ph-trash');
      }
    },
    
    initDefaultMilestones() {
      this.milestones = [
        { id: 1, date: '2023-05-20', title: 'First Date', desc: 'That coffee shop...', icon: 'ph-heart' },
        { id: 2, date: '2023-10-01', title: 'First Trip', desc: 'Yunnan Adventure', icon: 'ph-airplane-tilt' }
      ];
      this.saveData();
    },
    
    initHearts() {
      this.hearts = Array.from({ length: 12 }).map(() => ({
        left: Math.random() * 100 + '%',
        animationDuration: 15 + Math.random() * 10 + 's',
        animationDelay: -Math.random() * 20 + 's',
        opacity: 0.1 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
        swayDuration: 3 + Math.random() * 2 + 's'
      }));
    },
    
    startCarousel() {
      if (this.heroTimer) clearInterval(this.heroTimer);
      this.heroTimer = setInterval(() => {
        this.currentHeroIndex = (this.currentHeroIndex + 1) % this.activeHeroImages.length;
      }, 6000);
    }
  };
}
