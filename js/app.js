/* ===== Main App Module ===== */

const App = {
  // Current state
  state: {
    currentSection: 'hero',
    relationship: null,
    occasion: null,
    name: '',
    fields: {},
    messageMode: 'auto',
    customMessage: '',
    theme: 'classic',
    musicEnabled: true,
    photos: [null, null, null, null, null],
    photoTexts: ['', '', '', '', ''],
    photoUrls_fromFiles: [],
    photoUrls_fromInput: ['', '', '', '', ''],
    selectedTheme: 'classic'
  },

  // Section order
  sections: ['hero', 'relationship', 'occasion', 'customize', 'preview', 'share'],

  // Initialize the app
  init() {
    // Check if this is a recipient view (URL has hash data)
    if (window.location.hash && window.location.hash.length > 1) {
      const hash = window.location.hash.substring(1);
      const data = Share.decodeData(hash);
      if (data) {
        this.showRecipientView(data);
        return;
      }
    }

    // Normal creator flow
    this.bindEvents();
    this.showSection('hero');
    Animations.startHeroAnimation();
  },

  // Bind all event listeners
  bindEvents() {
    // Hero -> Start
    document.getElementById('btn-start').addEventListener('click', () => {
      this.showSection('relationship');
    });

    // Relationship selection
    document.getElementById('relationship-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      this.selectRelationship(card.dataset.relationship);
    });

    // Occasion selection
    document.getElementById('occasion-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      this.selectOccasion(card.dataset.occasion);
    });

    // Photo uploads - multiple slots
    document.querySelectorAll('.photo-file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        const file = e.target.files[0];
        if (file) this.handlePhotoFile(file, slot);
      });
    });

    // Pasted image URLs - live preview per slot
    document.querySelectorAll('.photo-url-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const slot = parseInt(e.target.dataset.slot);
        this.handlePhotoUrlInput(e.target.value.trim(), slot);
      });
    });

    document.querySelectorAll('.photo-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const slot = parseInt(e.target.dataset.slot);
        this.removePhoto(slot);
      });
    });

    // Drag and drop for each slot
    document.querySelectorAll('.photo-upload-area').forEach(area => {
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--primary)';
      });
      area.addEventListener('dragleave', () => {
        area.style.borderColor = '';
      });
      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = '';
        const slot = parseInt(area.closest('.photo-slot').dataset.slot);
        if (e.dataTransfer.files.length) {
          this.handlePhotoFile(e.dataTransfer.files[0], slot);
        }
      });
    });

    // Message mode toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setMessageMode(btn.dataset.mode);
      });
    });

    // Theme selection
    document.getElementById('theme-grid').addEventListener('click', (e) => {
      const swatch = e.target.closest('.theme-swatch');
      if (!swatch) return;
      e.preventDefault();
      this.selectTheme(swatch.dataset.theme);
    });

    // Back buttons
    document.getElementById('btn-back-customize').addEventListener('click', () => {
      this.showSection('occasion');
    });

    // Preview button
    document.getElementById('btn-preview').addEventListener('click', () => {
      this.generatePreview();
    });

    // Back from preview
    document.getElementById('btn-back-preview').addEventListener('click', () => {
      this.showSection('customize');
    });

    // Generate link
    document.getElementById('btn-generate').addEventListener('click', () => {
      this.generateLink();
    });

    // Copy link
    document.getElementById('btn-copy').addEventListener('click', () => {
      const linkInput = document.getElementById('share-link');
      Share.copyToClipboard(linkInput.value).then(success => {
        const btn = document.getElementById('btn-copy');
        btn.textContent = success ? 'Copied!' : 'Failed';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });

    // Open link
    document.getElementById('btn-open-link').addEventListener('click', () => {
      window.open(document.getElementById('share-link').value, '_blank');
    });

    // New gift
    document.getElementById('btn-new-gift').addEventListener('click', () => {
      this.reset();
      this.showSection('hero');
    });

    // Music controls
    document.getElementById('btn-music-toggle').addEventListener('click', () => {
      this.toggleMusic();
    });

    // Name input triggers message regeneration
    document.getElementById('recipient-name').addEventListener('input', () => {
      this.updateAutoMessage();
    });

    // Occasion-specific inputs trigger message regeneration
    ['thank-you-reason', 'appreciation-reason', 'years-together'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.updateAutoMessage());
    });
  },

  // Show a section
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => {
      s.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById('section-' + sectionId);
    if (target) {
      target.classList.add('active');
      this.state.currentSection = sectionId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // Select relationship
  selectRelationship(relationship) {
    this.state.relationship = relationship;

    // Update UI
    document.querySelectorAll('#relationship-grid .card').forEach(card => {
      card.classList.toggle('selected', card.dataset.relationship === relationship);
    });

    // Small delay for visual feedback
    setTimeout(() => {
      this.showSection('occasion');
    }, 300);
  },

  // Select occasion
  selectOccasion(occasion) {
    this.state.occasion = occasion;

    // Update UI
    document.querySelectorAll('#occasion-grid .card').forEach(card => {
      card.classList.toggle('selected', card.dataset.occasion === occasion);
    });

    // Update dynamic form fields
    this.updateFormFields();

    // Generate auto message
    this.updateAutoMessage();

    setTimeout(() => {
      this.showSection('customize');
    }, 300);
  },

  // Update form fields based on occasion
  updateFormFields() {
    // Hide all occasion-specific fields
    document.querySelectorAll('.occasion-field').forEach(field => {
      field.style.display = 'none';
    });

    // Show fields for selected occasion
    document.querySelectorAll(`.occasion-field[data-for="${this.state.occasion}"]`).forEach(field => {
      field.style.display = 'block';
    });
  },

  // Handle photo upload for specific slot
  handlePhotoFile(file, slot) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB.');
      return;
    }

    this.state.photos[slot] = file;
    // Clear any uploaded URL cache for this slot so fresh upload happens
    if (this.state.photoUrls_fromFiles) {
      this.state.photoUrls_fromFiles[slot] = null;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(`photo-preview-img-${slot}`).src = e.target.result;
      document.getElementById(`photo-preview-${slot}`).style.display = 'block';
      document.getElementById(`photo-placeholder-${slot}`).style.display = 'none';
    };
    reader.readAsDataURL(file);
  },

  // Handle pasted URL - show live preview
  handlePhotoUrlInput(val, slot) {
    const img = document.getElementById(`photo-preview-img-${slot}`);
    const preview = document.getElementById(`photo-preview-${slot}`);
    const placeholder = document.getElementById(`photo-placeholder-${slot}`);
    if (!img || !preview || !placeholder) return;
    // If a file is selected, file preview wins - don't override
    if (this.state.photos[slot]) return;
    if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      img.src = val;
      img.onerror = () => {
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
      };
      img.onload = () => {
        preview.style.display = 'block';
        placeholder.style.display = 'none';
      };
      // Trigger load check for cached images
      if (img.complete && img.naturalWidth > 0) {
        preview.style.display = 'block';
        placeholder.style.display = 'none';
      }
    } else {
      preview.style.display = 'none';
      placeholder.style.display = 'flex';
      img.removeAttribute('src');
    }
  },

  // Remove photo from specific slot
  removePhoto(slot) {
    this.state.photos[slot] = null;
    if (this.state.photoUrls_fromFiles) {
      this.state.photoUrls_fromFiles[slot] = null;
    }
    const input = document.querySelector(`.photo-file-input[data-slot="${slot}"]`);
    if (input) input.value = '';
    const img = document.getElementById(`photo-preview-img-${slot}`);
    if (img) img.removeAttribute('src');
    document.getElementById(`photo-preview-${slot}`).style.display = 'none';
    document.getElementById(`photo-placeholder-${slot}`).style.display = 'flex';
    // If a URL is still pasted, restore its preview
    const urlInput = document.querySelector(`.photo-url-input[data-slot="${slot}"]`);
    if (urlInput && urlInput.value.trim()) {
      this.handlePhotoUrlInput(urlInput.value.trim(), slot);
    }
  },

  // Set message mode
  setMessageMode(mode) {
    this.state.messageMode = mode;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.getElementById('auto-message-group').style.display = mode === 'auto' ? 'block' : 'none';
    document.getElementById('custom-message-group').style.display = mode === 'custom' ? 'block' : 'none';
  },

  // Update auto-generated message preview
  updateAutoMessage() {
    if (this.state.messageMode !== 'auto') return;

    const name = document.getElementById('recipient-name').value || 'their name';
    const reason = document.getElementById('thank-you-reason')?.value ||
                   document.getElementById('appreciation-reason')?.value || '';
    const years = document.getElementById('years-together')?.value || '';
    const dob = document.getElementById('birthday-date')?.value || '';

    const data = {
      relationship: this.state.relationship,
      occasion: this.state.occasion,
      name: name,
      fields: { reason, years, dob }
    };

    const message = Generator.generateMessage(data);
    document.getElementById('auto-message-preview').textContent = message;
  },

  // Select theme
  selectTheme(theme) {
    this.state.selectedTheme = theme;

    document.querySelectorAll('.theme-swatch').forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.theme === theme);
    });
  },

  // Get per-slot URL pasted by user (preserves slot index)
  getUrlForSlot(i) {
    const input = document.querySelector(`.photo-url-input[data-slot="${i}"]`);
    if (!input) return '';
    const val = input.value.trim();
    if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      return val;
    }
    return '';
  },

  getCaptionForSlot(i) {
    const input = document.querySelector(`.photo-text-input[data-slot="${i}"]`);
    return input ? input.value.trim() : '';
  },

  // Collect form data - keeps URL + caption aligned per slot
  collectData() {
    const name = document.getElementById('recipient-name').value.trim();
    const reason = document.getElementById('thank-you-reason')?.value?.trim() ||
                   document.getElementById('appreciation-reason')?.value?.trim() || '';
    const years = document.getElementById('years-together')?.value || '';
    const dob = document.getElementById('birthday-date')?.value || '';
    const anniversaryDate = document.getElementById('anniversary-date')?.value || '';

    // Build aligned pairs per slot: file-upload URL wins, else pasted URL
    const allPhotoUrls = [];
    const allPhotoTexts = [];
    for (let i = 0; i < 5; i++) {
      let url = '';
      if (this.state.photoUrls_fromFiles[i]) {
        url = this.state.photoUrls_fromFiles[i];
      } else {
        url = this.getUrlForSlot(i);
      }
      if (url) {
        allPhotoUrls.push(url);
        allPhotoTexts.push(this.getCaptionForSlot(i));
      }
    }

    let message;
    if (this.state.messageMode === 'custom') {
      message = document.getElementById('custom-message').value.trim();
    } else {
      message = Generator.generateMessage({
        relationship: this.state.relationship,
        occasion: this.state.occasion,
        name: name,
        fields: { reason, years, dob }
      });
    }

    return {
      relationship: this.state.relationship,
      occasion: this.state.occasion,
      name: name,
      fields: { reason, years, dob, anniversaryDate },
      message: message,
      theme: this.state.selectedTheme,
      music: document.getElementById('music-toggle').checked,
      photoUrls: allPhotoUrls,
      photoTexts: allPhotoTexts
    };
  },

  // Build preview photo data using local file previews (instant, no upload needed)
  collectPreviewData() {
    const data = this.collectData();
    // For slots with a local file selected but not yet uploaded,
    // use the local preview dataURL so preview shows instantly
    const previewUrls = [];
    const previewTexts = [];
    for (let i = 0; i < 5; i++) {
      const caption = this.getCaptionForSlot(i);
      if (this.state.photos[i]) {
        const localSrc = document.getElementById(`photo-preview-img-${i}`)?.src;
        if (localSrc) {
          previewUrls.push(localSrc);
          previewTexts.push(caption);
          continue;
        }
      }
      const pasted = this.getUrlForSlot(i);
      if (pasted) {
        previewUrls.push(pasted);
        previewTexts.push(caption);
        continue;
      }
      if (this.state.photoUrls_fromFiles[i]) {
        previewUrls.push(this.state.photoUrls_fromFiles[i]);
        previewTexts.push(caption);
      }
    }
    data.photoUrls = previewUrls;
    data.photoTexts = previewTexts;
    return data;
  },

  // Generate preview
  async generatePreview() {
    const name = document.getElementById('recipient-name').value.trim();
    if (!name) {
      alert('Please enter the recipient\'s name.');
      return;
    }

    const data = this.collectPreviewData();
    this.renderRecipientView('preview-content', data);
    this.showSection('preview');
  },

  // Generate share link
  async generateLink() {
    const data = this.collectData();

    // Show loading
    document.getElementById('loading-overlay').style.display = 'flex';

    try {
      // Upload file-based photos (non-blocking - continue even if uploads fail)
      const uploadedUrls = [];
      for (let i = 0; i < this.state.photos.length; i++) {
        if (this.state.photos[i]) {
          try {
            console.log('Uploading photo ' + (i + 1) + '...');
            const url = await Share.uploadImage(this.state.photos[i]);
            if (url) {
              uploadedUrls[i] = url;
              console.log('Photo ' + (i + 1) + ' uploaded:', url);
            } else {
              console.warn('Photo ' + (i + 1) + ' upload returned null');
            }
          } catch (photoErr) {
            console.warn('Photo ' + (i + 1) + ' upload failed:', photoErr);
          }
        }
      }
      this.state.photoUrls_fromFiles = uploadedUrls;

      // Re-collect data with uploaded URLs
      const finalData = this.collectData();
      console.log('Photo URLs for link:', finalData.photoUrls);

      const hadFiles = this.state.photos.some(Boolean);
      if (hadFiles && finalData.photoUrls.length === 0) {
        alert('Photo upload failed (browser blocked the hosting service).\n\nPlease paste an image URL instead:\n1. Upload at imgur.com or postimages.org\n2. Copy the direct image link\n3. Paste it in "Or paste image URL here"\n\nYour link will still be created without photos.');
      }

      console.log('Generating URL...');
      const fullUrl = Share.generateFullUrl(finalData);
      console.log('Full URL length:', fullUrl.length);

      const shortUrl = await Share.shortenUrl(fullUrl);
      console.log('Short URL:', shortUrl);

      // Update share section
      document.getElementById('share-link').value = shortUrl;
      document.getElementById('qr-image').src = Share.getQrCodeUrl(shortUrl);

      this.showSection('share');
    } catch (err) {
      console.error('Error generating link:', err);
      alert('Error: ' + err.message + '. Please try again.');
    } finally {
      document.getElementById('loading-overlay').style.display = 'none';
    }
  },

  // Escape HTML to avoid breaking markup
  escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  // Render recipient view into a container (used for Preview)
  renderRecipientView(containerId, data) {
    const container = document.getElementById(containerId);
    const greeting = Generator.getGreeting(data);
    const footer = Generator.getFooter(data);
    const details = Generator.getOccasionDetails(data);
    const photos = data.photoUrls || [];
    const photoTexts = data.photoTexts || [];

    let html = '';
    html += '<div style="text-align:center; padding: 2rem;">';

    // Main photo (first one) + caption
    if (photos.length > 0) {
      html += '<div style="margin-bottom: 2rem; opacity: 0; animation: scaleIn 0.6s ease 0.1s forwards;">';
      html += `<img src="${photos[0]}" alt="${this.escapeHtml(data.name)}" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid var(--accent); box-shadow: 0 5px 25px var(--shadow-lg);" onerror="this.style.display='none'">`;
      if (photoTexts[0]) {
        html += `<div style="font-style: italic; color: var(--text-light); margin-top: 0.75rem;">${this.escapeHtml(photoTexts[0])}</div>`;
      }
      html += '</div>';
    } else {
      html += '<div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px dashed var(--card-border); border-radius: 12px; color: var(--text-light); font-size: 0.9rem;">No photos added yet — add a file or paste an image URL above to see it here.</div>';
    }

    // Greeting
    html += `<div class="recipient-greeting" style="font-family: var(--font-script); font-size: 2.5rem; margin-bottom: 1.5rem; opacity: 0; animation: fadeInUp 0.8s ease 0.3s forwards;">${greeting}</div>`;

    // Occasion details
    if (details) {
      html += `<div style="font-size: 1rem; color: var(--text-light); margin-bottom: 1.5rem; opacity: 0; animation: fadeInUp 0.6s ease 0.5s forwards;">${details}</div>`;
    }

    // Additional photos (if more than 1) + captions
    if (photos.length > 1) {
      html += '<div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 2rem;">';
      for (let i = 1; i < photos.length; i++) {
        html += `<div style="opacity: 0; animation: scaleIn 0.5s ease ${0.5 + i * 0.2}s forwards; max-width: 160px;">`;
        html += `<img src="${photos[i]}" alt="" style="width: 150px; height: 150px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 15px var(--shadow);" onerror="this.parentNode.style.display='none'">`;
        if (photoTexts[i]) {
          html += `<div style="font-size: 0.8rem; color: var(--text-light); font-style: italic; margin-top: 0.4rem;">${this.escapeHtml(photoTexts[i])}</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }

    // Message
    html += `<div style="font-family: var(--font-body); font-size: 1.1rem; line-height: 1.8; color: var(--text); max-width: 500px; margin: 0 auto 2rem; white-space: pre-wrap; opacity: 0; animation: fadeInUp 0.8s ease 0.6s forwards;">${data.message}</div>`;

    // Footer
    html += `<div style="font-size: 0.95rem; color: var(--text-light); font-style: italic; opacity: 0; animation: fadeIn 0.8s ease 1s forwards;">${footer}</div>`;

    // Decorative hearts
    html += '<div style="margin-top: 2rem; font-size: 1.5rem; opacity: 0; animation: fadeIn 0.8s ease 1.2s forwards;">&#10084; &#10084; &#10084;</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  // Show recipient view (scrolling page when link is opened)
  showRecipientView(data) {
    document.body.style.background = 'none';

    // Hide all creator sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

    // Show recipient view
    const recipientView = document.getElementById('recipient-view');
    recipientView.style.display = 'block';

    // Apply theme
    document.documentElement.setAttribute('data-theme', data.theme || 'classic');

    // Set background
    const bg = document.getElementById('recipient-bg');
    const themes = {
      classic: 'linear-gradient(135deg, #fff5f5, #ffffff)',
      soft: 'linear-gradient(135deg, #fff5f5, #fce4ec)',
      deep: 'linear-gradient(135deg, #1a0000, #2d0a0a)',
      dark: 'linear-gradient(135deg, #0d0000, #1a0a0a)',
      elegant: 'linear-gradient(135deg, #fafafa, #f5f5f5)',
      warm: 'linear-gradient(135deg, #fefae0, #faedcd)'
    };
    bg.style.background = themes[data.theme] || themes.classic;

    // Get data
    const greeting = Generator.getGreeting(data);
    const photos = data.photoUrls || [];
    const photoTexts = data.photoTexts || [];

    // Main photo (first one)
    if (photos.length > 0 && photos[0]) {
      const mainPhoto = document.getElementById('recipient-main-photo');
      const mainPhotoImg = document.getElementById('recipient-main-photo-img');
      mainPhoto.style.display = 'block';
      mainPhotoImg.onerror = () => { mainPhoto.style.display = 'none'; };
      mainPhotoImg.src = photos[0];

      // Add text under main photo if exists
      let mainCaption = document.getElementById('recipient-main-caption');
      if (photoTexts[0]) {
        if (!mainCaption) {
          mainCaption = document.createElement('div');
          mainCaption.id = 'recipient-main-caption';
          mainCaption.className = 'photo-caption';
          mainPhoto.parentNode.insertBefore(mainCaption, mainPhoto.nextSibling);
        }
        mainCaption.textContent = photoTexts[0];
        mainCaption.style.display = 'block';
      } else if (mainCaption) {
        mainCaption.style.display = 'none';
      }
    }

    // Greeting
    document.getElementById('recipient-greeting').innerHTML = greeting;

    // Gallery section (if more than 1 photo)
    if (photos.length > 1) {
      document.getElementById('recipient-gallery').style.display = 'block';
      const galleryGrid = document.getElementById('recipient-gallery-grid');
      let galleryHtml = '';

      for (let i = 1; i < photos.length; i++) {
        if (!photos[i]) continue;
        const isFullWidth = (i === 1 && photos.length === 2);
        galleryHtml += `<div class="recipient-gallery-item ${isFullWidth ? 'full-width' : ''}" data-index="${i}">`;
        galleryHtml += `<img src="${photos[i]}" alt="Memory ${i}" loading="lazy" onerror="this.parentNode.style.display='none'">`;
        if (photoTexts[i]) {
          galleryHtml += `<div class="gallery-item-text">${this.escapeHtml(photoTexts[i])}</div>`;
        }
        galleryHtml += '</div>';
      }

      galleryGrid.innerHTML = galleryHtml;

      // Animate gallery items on scroll (with fallback so they never stay invisible)
      setTimeout(() => {
        this.setupGalleryScrollAnimation();
        setTimeout(() => {
          document.querySelectorAll('.recipient-gallery-item').forEach(el => el.classList.add('visible'));
        }, 2500);
      }, 100);
    }

    // Message
    document.getElementById('recipient-message').innerHTML = data.message;
    document.getElementById('recipient-footer').innerHTML = Generator.getFooter(data);

    // Occasion details
    const details = Generator.getOccasionDetails(data);
    if (details) {
      document.getElementById('recipient-details').style.display = 'block';
      document.getElementById('recipient-details-content').innerHTML = `
        <div class="detail-label">Special Details</div>
        <div class="detail-value">${details}</div>
      `;
    }

    // Show music controls if music enabled
    if (data.music !== false) {
      document.getElementById('music-controls').style.display = 'block';
      // Auto-play after user interaction
      document.addEventListener('click', () => {
        const music = document.getElementById('bg-music');
        if (music && music.paused) {
          music.play().catch(() => {});
          document.getElementById('btn-music-toggle').textContent = '\u266B';
        }
      }, { once: true });
    }

    // Start floating hearts
    setTimeout(() => {
      Animations.startFloatingHearts(recipientView, 1200);
    }, 500);
  },

  // Setup gallery scroll animation
  setupGalleryScrollAnimation() {
    const items = document.querySelectorAll('.recipient-gallery-item');
    if (!items.length) return;

    // If IntersectionObserver unavailable, show all immediately
    if (!('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('visible'));
      return;
    }

    const scrollRoot = document.getElementById('recipient-view') || null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: scrollRoot, threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    items.forEach(item => observer.observe(item));
  },

  // Toggle music
  toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('btn-music-toggle');

    if (music.paused) {
      music.play().then(() => {
        btn.textContent = '\u266B';
      }).catch(() => {});
    } else {
      music.pause();
      btn.textContent = '\u2664';
    }
  },

  // Reset state
  reset() {
    this.state = {
      currentSection: 'hero',
      relationship: null,
      occasion: null,
      name: '',
      fields: {},
      messageMode: 'auto',
      customMessage: '',
      theme: 'classic',
      musicEnabled: true,
      photos: [null, null, null, null, null],
      photoTexts: ['', '', '', '', ''],
      photoUrls_fromFiles: [],
      photoUrls_fromInput: ['', '', '', '', ''],
      selectedTheme: 'classic'
    };

    // Reset UI
    document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.theme-swatch.active').forEach(s => {
      s.classList.remove('active');
      if (s.dataset.theme === 'classic') s.classList.add('active');
    });
    document.getElementById('recipient-name').value = '';
    document.getElementById('birthday-date').value = '';
    document.getElementById('anniversary-date').value = '';
    document.getElementById('years-together').value = '';
    document.getElementById('thank-you-reason').value = '';
    document.getElementById('appreciation-reason').value = '';

    // Reset all photo slots
    for (let i = 0; i < 5; i++) {
      this.removePhoto(i);
      const textInput = document.querySelector('.photo-text-input[data-slot="' + i + '"]');
      if (textInput) textInput.value = '';
      const urlInput = document.querySelector('.photo-url-input[data-slot="' + i + '"]');
      if (urlInput) urlInput.value = '';
    }

    this.setMessageMode('auto');
    document.getElementById('custom-message').value = '';
    document.getElementById('music-toggle').checked = true;

    // Hide all occasion fields
    document.querySelectorAll('.occasion-field').forEach(f => f.style.display = 'none');

    // Reset recipient view sections
    document.getElementById('recipient-gallery').style.display = 'none';
    document.getElementById('recipient-details').style.display = 'none';
    document.getElementById('recipient-main-photo').style.display = 'none';

    // Remove any dynamically added captions
    const mainCaption = document.getElementById('recipient-main-caption');
    if (mainCaption) mainCaption.remove();

    Animations.startHeroAnimation();
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
