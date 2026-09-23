/* ===== Main App Module ===== */

const App = {
  // Current state
  state: {
    currentSection: 'hero',
    lang: 'en',
    occasion: null,
    relationship: null,
    customRelationship: '',
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

  // Section order (topic first, then person)
  sections: ['hero', 'occasion', 'relationship', 'customize', 'preview', 'share'],

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
    this.applyLang();
    this.showSection('hero');
    Animations.startHeroAnimation();
  },

  // Bind all event listeners
  bindEvents() {
    // Hero -> Topic
    document.getElementById('btn-start').addEventListener('click', () => {
      this.showSection('occasion');
    });

    // Topic selection
    document.getElementById('occasion-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      this.selectOccasion(card.dataset.occasion);
    });

    // Back from relationship to topic
    document.getElementById('btn-back-relationship').addEventListener('click', () => {
      this.showSection('occasion');
    });

    // Language toggle (creator flow)
    document.getElementById('lang-toggle').addEventListener('click', () => {
      this.state.lang = this.state.lang === 'ar' ? 'en' : 'ar';
      this.applyLang();
    });

    // Relationship selection
    document.getElementById('relationship-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      this.selectRelationship(card.dataset.relationship);
    });

    // Custom relationship continue + Enter key
    document.getElementById('btn-custom-continue').addEventListener('click', () => {
      this.confirmCustomRelationship();
    });
    document.getElementById('custom-relationship').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmCustomRelationship();
      }
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

    // Site gallery picker per slot (closest: clicks may land on the inner label span)
    document.querySelectorAll('.photo-gallery-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const el = e.target.closest ? e.target.closest('.photo-gallery-btn') : btn;
        this.openGalleryPicker(parseInt(el.dataset.slot));
      });
    });

    const galleryClose = document.getElementById('gallery-picker-close');
    if (galleryClose) {
      galleryClose.addEventListener('click', () => {
        document.getElementById('gallery-picker').style.display = 'none';
      });
    }

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
      this.showSection('relationship');
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
        const lang = this.state.lang || 'en';
        btn.textContent = success ? t('copiedBtn', lang) : 'Failed';
        setTimeout(() => { btn.textContent = t('copyBtn', this.state.lang); }, 2000);
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

    // Topic field inputs trigger message regeneration
    ['birthday-date', 'love-reason', 'thank-you-reason', 'years-together', 'anniversary-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.updateAutoMessage());
    });
  },

  // Apply current language to all tagged static text + page direction
  applyLang() {
    const lang = this.state.lang || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n, lang);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh, lang);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || '';
    });
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'ar' ? 'EN' : 'عربي';
    this.updateAutoMessage();
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

  // Select topic (first step after entering)
  selectOccasion(occasion) {
    this.state.occasion = occasion;

    // Update UI
    document.querySelectorAll('#occasion-grid .card').forEach(card => {
      card.classList.toggle('selected', card.dataset.occasion === occasion);
    });

    // Small delay for visual feedback
    setTimeout(() => {
      this.showSection('relationship');
    }, 300);
  },

  // Select relationship (person the gift is for)
  selectRelationship(relationship) {
    this.state.relationship = relationship;

    // Update UI
    document.querySelectorAll('#relationship-grid .card').forEach(card => {
      card.classList.toggle('selected', card.dataset.relationship === relationship);
    });

    // "Other" needs a custom label first
    const customWrap = document.getElementById('custom-relationship-wrap');
    if (relationship === 'other') {
      customWrap.style.display = 'block';
      const input = document.getElementById('custom-relationship');
      if (input) input.focus();
      return;
    }
    customWrap.style.display = 'none';

    // Show only the fields for the chosen topic, then message
    this.updateFormFields();
    this.updateAutoMessage();

    // Small delay for visual feedback
    setTimeout(() => {
      this.showSection('customize');
    }, 300);
  },

  // Show only the form fields that belong to the chosen topic
  updateFormFields() {
    const occ = this.state.occasion || 'birthday';
    document.querySelectorAll('.occasion-field').forEach(field => {
      field.style.display = field.dataset.for === occ ? '' : 'none';
    });
  },

  // Gather topic-specific field values
  occasionFields() {
    return {
      dob: document.getElementById('birthday-date')?.value || '',
      reason: document.getElementById('love-reason')?.value?.trim() ||
              document.getElementById('thank-you-reason')?.value?.trim() || '',
      anniversaryDate: document.getElementById('anniversary-date')?.value || '',
      years: document.getElementById('years-together')?.value || ''
    };
  },

  // Continue after typing a custom relationship (Other)
  confirmCustomRelationship() {
    const input = document.getElementById('custom-relationship');
    const label = input ? input.value.trim() : '';
    if (!label) {
      alert(t('alertLabel', this.state.lang));
      if (input) input.focus();
      return;
    }
    this.state.customRelationship = label;
    document.getElementById('custom-relationship-wrap').style.display = 'none';
    this.updateFormFields();
    this.updateAutoMessage();
    this.showSection('customize');
  },

  // Handle photo upload for specific slot
  handlePhotoFile(file, slot) {
    const lang = this.state.lang || 'en';
    if (!file.type.startsWith('image/')) {
      alert(t('alertNotImage', lang));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t('alertTooBig', lang));
      return;
    }
    if (/heic|heif/i.test(file.type) || /\.hei[c f]$/i.test(file.name || '')) {
      alert(t('alertHeic', lang));
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

  // Status line under a URL input (created on demand)
  urlStatusEl(slot) {
    const urlInput = document.querySelector(`.photo-url-input[data-slot="${slot}"]`);
    if (!urlInput) return null;
    let el = urlInput.parentNode.querySelector(`.photo-url-status[data-slot="${slot}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'photo-url-status';
      el.dataset.slot = slot;
      urlInput.parentNode.insertBefore(el, urlInput.nextSibling);
    }
    return el;
  },

  setUrlStatus(slot, ok, text) {
    const el = this.urlStatusEl(slot);
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = ok ? '#2e7d32' : '#c62828';
  },

  // Handle pasted URL - show live preview + clear OK / error feedback
  handlePhotoUrlInput(rawVal, slot) {
    const val = Share.normalizeImageUrl(rawVal);
    const img = document.getElementById(`photo-preview-img-${slot}`);
    const preview = document.getElementById(`photo-preview-${slot}`);
    const placeholder = document.getElementById(`photo-placeholder-${slot}`);
    if (!img || !preview || !placeholder) return;
    // If a file is selected, file preview wins - don't override
    if (this.state.photos[slot]) return;
    const lang = this.state.lang || 'en';
    if (val && (val.startsWith('http://') || val.startsWith('https://'))) {
      this.setUrlStatus(slot, true, t('statusChecking', lang));
      img.onerror = () => {
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
        this.setUrlStatus(slot, false, t('statusBad', lang));
      };
      img.onload = () => {
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        this.setUrlStatus(slot, true, t('statusOk', lang));
      };
      img.src = val;
      // Trigger load check for cached images
      if (img.complete && img.naturalWidth > 0) {
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        this.setUrlStatus(slot, true, t('statusOk', lang));
      }
    } else {
      preview.style.display = 'none';
      placeholder.style.display = 'flex';
      img.removeAttribute('src');
      this.setUrlStatus(slot, false, rawVal && rawVal.trim() ? t('statusNotLink', lang) : '');
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
    // If a URL is still pasted, restore its preview (and status);
    // otherwise clear any stale status text.
    const urlInput = document.querySelector(`.photo-url-input[data-slot="${slot}"]`);
    if (urlInput && urlInput.value.trim()) {
      this.handlePhotoUrlInput(urlInput.value.trim(), slot);
    } else {
      this.setUrlStatus(slot, false, '');
    }
  },

  // Open site gallery picker for a slot (photos stored in the repo)
  openGalleryPicker(slot) {
    this.siteGallery.pendingSlot = slot;
    const panel = document.getElementById('gallery-picker');
    const grid = document.getElementById('gallery-picker-grid');
    const status = document.getElementById('gallery-picker-status');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (this.siteGallery.cache) {
      this.renderGalleryPicker(this.siteGallery.cache);
      return;
    }

    status.textContent = t('galleryLoading', this.state.lang);
    grid.innerHTML = '';
    fetch('https://api.github.com/repos/' + this.siteGallery.repo + '/contents/' + this.siteGallery.path)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(files => {
        const imgs = (Array.isArray(files) ? files : []).filter(f =>
          f.type === 'file' && /\.(jpe?g|png|gif|webp)$/i.test(f.name));
        this.siteGallery.cache = imgs;
        this.renderGalleryPicker(imgs);
      })
      .catch(() => {
        status.textContent = t('galleryEmpty', this.state.lang);
      });
  },

  renderGalleryPicker(imgs) {
    const grid = document.getElementById('gallery-picker-grid');
    const status = document.getElementById('gallery-picker-status');
    if (!imgs.length) {
      status.textContent = t('galleryEmpty', this.state.lang);
      grid.innerHTML = '';
      return;
    }
    status.textContent = t('galleryTap', this.state.lang);
    grid.innerHTML = '';
    imgs.forEach(f => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-pick-item';
      btn.title = f.name;
      const img = document.createElement('img');
      img.src = f.download_url;
      img.alt = f.name;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      btn.appendChild(img);
      btn.addEventListener('click', () => this.pickGalleryPhoto(f.download_url));
      grid.appendChild(btn);
    });
  },

  pickGalleryPhoto(url) {
    const slot = this.siteGallery.pendingSlot;
    if (slot === null || slot === undefined) return;
    const urlInput = document.querySelector(`.photo-url-input[data-slot="${slot}"]`);
    if (urlInput) urlInput.value = url;
    this.handlePhotoUrlInput(url, slot);
    document.getElementById('gallery-picker').style.display = 'none';
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

    const data = {
      relationship: this.state.relationship,
      occasion: this.state.occasion || 'birthday',
      lang: this.state.lang,
      name: name,
      fields: this.occasionFields()
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

  // Site gallery config: photos uploaded to this folder in the repo
  // are listed for picking and always display in the final gift.
  siteGallery: {
    repo: 'Elhendawy-1/Surprise',
    path: 'assets/photos',
    cache: null,
    pendingSlot: null
  },

  // Get per-slot URL pasted by user (preserves slot index)
  getUrlForSlot(i) {
    const input = document.querySelector(`.photo-url-input[data-slot="${i}"]`);
    if (!input) return '';
    const val = Share.normalizeImageUrl(input.value);
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
    const fields = this.occasionFields();

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
        occasion: this.state.occasion || 'birthday',
        lang: this.state.lang,
        name: name,
        fields: fields
      });
    }

    return {
      relationship: this.state.relationship,
      lang: this.state.lang || 'en',
      customRelationship: this.state.relationship === 'other'
        ? (this.state.customRelationship || document.getElementById('custom-relationship')?.value.trim() || 'Loved One')
        : '',
      occasion: this.state.occasion || 'birthday',
      name: name,
      fields: fields,
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
        const localImg = document.getElementById(`photo-preview-img-${i}`);
        // hasAttribute guard: without a src attribute, .src returns the
        // page URL - never use that as a photo.
        const localSrc = (localImg && localImg.hasAttribute('src')) ? localImg.src : '';
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
      alert(t('alertName', this.state.lang));
      return;
    }

    const data = this.collectPreviewData();
    this.renderRecipientView('preview-content', data);
    this.showSection('preview');
  },

  setLoadingStatus(text) {
    const el = document.getElementById('loading-status');
    if (el) el.textContent = text || '';
  },

  // Generate share link
  async generateLink() {
    const lang = this.state.lang || 'en';
    // Show loading
    document.getElementById('loading-overlay').style.display = 'flex';
    this.setLoadingStatus(t('loadPreparing', lang));

    try {
      // Upload file-based photos (non-blocking - continue even if uploads fail)
      const uploadedUrls = [];
      const fileCount = this.state.photos.filter(Boolean).length;
      let done = 0;
      for (let i = 0; i < this.state.photos.length; i++) {
        if (this.state.photos[i]) {
          done++;
          this.setLoadingStatus(t('loadUploading', lang, { a: done, b: fileCount }));
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

      // Last resort for device photos that failed to upload:
      // embed thumbnails directly in the link (no hosting needed).
      // Tries bigger thumbnails first, then smaller ones, so that
      // EVERY photo gets in whenever the link budget allows.
      let embedded = 0;
      const skipped = [];
      let heicWarned = false;
      const tiers = [{ w: 384, q: 0.55 }, { w: 256, q: 0.5 }, { w: 192, q: 0.5 }];
      for (let i = 0; i < this.state.photos.length; i++) {
        if (this.state.photos[i] && !uploadedUrls[i]) {
          this.setLoadingStatus(t('loadPacking', lang, { a: i + 1 }));
          let placed = false;
          for (const t of tiers) {
            try {
              const thumb = await Share.makeThumbnailDataUrl(this.state.photos[i], t.w, t.q);
              if (!thumb) continue;
              uploadedUrls[i] = thumb;
              this.state.photoUrls_fromFiles = uploadedUrls;
              const trialLength = Share.generateFullUrl(this.collectData()).length;
              if (trialLength <= (Share.imageHost.maxEmbedLinkLength || 60000)) {
                embedded++;
                placed = true;
                console.log('Photo ' + (i + 1) + ' embedded at ' + t.w + 'px (' + thumb.length + ' chars)');
                break;
              }
              uploadedUrls[i] = null; // too big at this size - try smaller tier
            } catch (thumbErr) {
              console.warn('Photo ' + (i + 1) + ' embed failed:', thumbErr && thumbErr.message);
              if (!heicWarned && thumbErr && /HEIC/i.test(thumbErr.message || '')) {
                heicWarned = true;
                alert(t('alertHeic', lang));
              }
              break; // decode errors won't improve with smaller tiers
            }
          }
          if (!placed) {
            uploadedUrls[i] = null;
            skipped.push(i + 1);
            console.warn('Photo ' + (i + 1) + ' could not fit into the link, skipped');
          }
        }
      }
      this.state.photoUrls_fromFiles = uploadedUrls;

      // Re-collect data with uploaded / embedded URLs
      const finalData = this.collectData();
      console.log('Photo URLs for link:', finalData.photoUrls.length);

      const hadFiles = this.state.photos.some(Boolean);
      if (hadFiles && finalData.photoUrls.length === 0) {
        alert(t('alertNoPhotos', lang));
      }

      this.setLoadingStatus(t('loadCreating', lang));
      const fullUrl = Share.generateFullUrl(finalData);
      console.log('Full URL length:', fullUrl.length);

      const shortUrl = await Share.shortenUrl(fullUrl);

      // Update share section
      document.getElementById('share-link').value = shortUrl;
      const subtitle = document.querySelector('#section-share .section-subtitle');
      const photoCount = finalData.photoUrls.length;
      let note = t('noteDefault', lang);
      if (embedded > 0 && skipped.length === 0) {
        note = t('noteEmbedded', lang, { a: photoCount });
      } else if (skipped.length > 0) {
        note = t('noteSkipped', lang, { a: skipped.join(', ') });
        alert(t('alertSkipped', lang, { a: skipped.join(', ') }));
      }
      // QR codes only scan when the link is short. Huge links (packed photos)
      // produce codes no camera can read, so hide the code and say so.
      const qrBox = document.getElementById('share-qr');
      if (shortUrl.length <= 2000) {
        const qrUrl = Share.getQrCodeUrl(shortUrl);
        document.getElementById('qr-image').src = qrUrl;
        const qrDownload = document.getElementById('qr-download');
        if (qrDownload) {
          qrDownload.href = qrUrl;
          qrDownload.style.display = '';
        }
        qrBox.style.display = '';
      } else {
        qrBox.style.display = 'none';
        note += t('noteLong', lang);
      }
      subtitle.textContent = note;

      this.showSection('share');
    } catch (err) {
      console.error('Error generating link:', err);
      alert(t('alertError', lang, { a: err.message }));
    } finally {
      this.setLoadingStatus('');
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
    const greeting = this.escapeHtml(Generator.getGreeting(data));
    const footer = this.escapeHtml(Generator.getFooter(data));
    const details = this.escapeHtml(Generator.getOccasionDetails(data));
    const safeMessage = this.escapeHtml(data.message);
    const photos = data.photoUrls || [];
    const photoTexts = data.photoTexts || [];

    let html = '';
    html += '<div style="text-align:center; padding: 2rem;">';

    // Greeting
    html += `<div class="recipient-greeting" style="font-family: var(--font-script); font-size: 2.5rem; margin-bottom: 1.5rem; opacity: 0; animation: fadeInUp 0.8s ease 0.3s forwards;">${greeting}</div>`;

    // Birthday details
    if (details) {
      html += `<div style="font-size: 1rem; color: var(--text-light); margin-bottom: 1.5rem; opacity: 0; animation: fadeInUp 0.6s ease 0.5s forwards;">${details}</div>`;
    }

    // Chosen photos with captions, right before the message
    if (photos.length > 0) {
      html += '<div style="font-family: var(--font-script); font-size: 1.8rem; margin-bottom: 1rem; opacity: 0; animation: fadeInUp 0.6s ease 0.5s forwards;">' + this.escapeHtml(t('galleryHeading', this.state.lang)) + '</div>';
      html += '<div style="display: flex; flex-direction: column; gap: 1.25rem; align-items: center; margin-bottom: 2rem;">';
      for (let i = 0; i < photos.length; i++) {
        if (!photos[i]) continue;
        html += `<div style="opacity: 0; animation: scaleIn 0.5s ease ${0.5 + i * 0.2}s forwards; max-width: 280px; width: 100%;">`;
        html += `<img src="${photos[i]}" alt="Memory ${i + 1}" referrerpolicy="no-referrer" style="width: 100%; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 15px var(--shadow);" onerror="this.parentNode.style.display='none'">`;
        if (photoTexts[i]) {
          html += `<div style="font-size: 0.85rem; color: var(--text-light); font-style: italic; margin-top: 0.4rem;">${this.escapeHtml(photoTexts[i])}</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += '<div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px dashed var(--card-border); border-radius: 12px; color: var(--text-light); font-size: 0.9rem;">' + this.escapeHtml(t('previewNoPhotos', this.state.lang)) + '</div>';
    }

    // Message
    html += `<div style="font-family: var(--font-body); font-size: 1.1rem; line-height: 1.8; color: var(--text); max-width: 500px; margin: 0 auto 2rem; white-space: pre-wrap; opacity: 0; animation: fadeInUp 0.8s ease 0.6s forwards;">${safeMessage}</div>`;

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

    // Apply gift language. The toggle stays visible on the gift page too,
    // so the birthday person can switch languages (their own words stay
    // exactly as the sender wrote them).
    this.lastRecipientData = data;
    this.state.lang = data.lang === 'ar' ? 'ar' : 'en';
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.style.display = '';
      langToggle.onclick = () => {
        this.state.lang = this.state.lang === 'ar' ? 'en' : 'ar';
        this.applyLang();
        this.refreshRecipientLang();
      };
    }
    this.applyLang();

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

    // Greeting
    document.getElementById('recipient-greeting').textContent = greeting;

    // Photo memories lane - ALL chosen photos with captions,
    // placed right before the birthday message
    if (photos.length > 0) {
      document.getElementById('recipient-gallery').style.display = 'block';
      const galleryGrid = document.getElementById('recipient-gallery-grid');
      let galleryHtml = '';

      for (let i = 0; i < photos.length; i++) {
        if (!photos[i]) continue;
        const delay = i * 140;
        galleryHtml += `<div class="recipient-gallery-item" data-index="${i}" style="transition-delay:${delay}ms">`;
        galleryHtml += `<img src="${photos[i]}" alt="Memory ${i + 1}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.style.display='none'">`;
        if (photoTexts[i]) {
          galleryHtml += `<div class="gallery-item-text">${this.escapeHtml(photoTexts[i])}</div>`;
        }
        galleryHtml += '</div>';
      }

      galleryGrid.innerHTML = galleryHtml;
    }

    // Cake only suits birthdays + anniversaries - hide it for other topics
    const cakeSection = document.getElementById('recipient-cake');
    const showCake = data.occasion === 'birthday' || data.occasion === 'anniversary';
    if (cakeSection) cakeSection.style.display = showCake ? '' : 'none';
    // Interactive birthday cake (tap candles to blow them out)
    if (showCake) this.setupCake();

    // Smooth scroll-triggered reveals for the whole gift page
    setTimeout(() => {
      this.setupScrollReveals();
      // Safety fallback so nothing ever stays invisible
      setTimeout(() => {
        document.querySelectorAll('#recipient-view .recipient-gallery-item, #recipient-view .recipient-message-card, #recipient-view .recipient-details-card, #recipient-view .recipient-closing, #recipient-view .reveal').forEach(el => el.classList.add('visible'));
      }, 3000);
    }, 100);

    // Message
    document.getElementById('recipient-message').textContent = data.message;
    document.getElementById('recipient-footer').textContent = Generator.getFooter(data);

    // Birthday details with a live ticking countdown
    this.renderRecipientDetails(data);

    // Music: browsers block autoplay, so show a clear tap-to-play
    // prompt. The first tap starts the song for sure.
    if (data.music !== false) {
      const musicEl = document.getElementById('bg-music');
      const prompt = document.getElementById('music-prompt');
      const hideMusicUi = () => {
        document.getElementById('music-controls').style.display = 'none';
        if (prompt) prompt.style.display = 'none';
      };
      // If the audio file is missing (404), keep music UI hidden
      const audioSource = musicEl.querySelector('source');
      if (audioSource) {
        audioSource.addEventListener('error', hideMusicUi, { once: true });
      }
      musicEl.addEventListener('error', hideMusicUi, { once: true });

      const startMusic = () => {
        if (!musicEl.paused) return;
        musicEl.play().then(() => {
          if (prompt) prompt.style.display = 'none';
          document.getElementById('music-controls').style.display = 'block';
          const toggle = document.getElementById('btn-music-toggle');
          toggle.textContent = '\u266B';
          toggle.classList.remove('play-hint');
        }).catch(() => {});
      };

      if (prompt) {
        prompt.style.display = 'block';
        prompt.onclick = startMusic;
      } else {
        document.getElementById('music-controls').style.display = 'block';
      }
      document.getElementById('btn-music-toggle').classList.add('play-hint');
      // Fallback: any first tap anywhere also starts the music
      document.addEventListener('click', startMusic, { once: true });
    }

    // Opening celebration: heart + flower burst, petal shower,
    // then calm ambient drift while scrolling
    setTimeout(() => {
      Animations.startCelebration(recipientView);
    }, 500);

    // Phones often throttle timers while the tab is in the background,
    // which can silently eat the celebration. Restart the ambient
    // hearts + petals whenever the gift tab becomes visible again.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && recipientView.style.display === 'block') {
        Animations.stopFloatingHearts();
        Animations.startFloatingHearts(recipientView, 1400);
        Animations.startPetalDrift(recipientView, 2800);
        Animations.startBalloonDrift(recipientView, 5200);
      }
    });
  },

  // Re-render translatable gift content after a language switch
  // on the gift page (sender-written texts stay untouched).
  refreshRecipientLang() {
    const data = this.lastRecipientData;
    if (!data) return;
    data.lang = this.state.lang;
    document.getElementById('recipient-greeting').textContent = Generator.getGreeting(data);
    document.getElementById('recipient-footer').textContent = Generator.getFooter(data);
    this.renderRecipientDetails(data);
  },

  // Birthday details block (countdown or plain text)
  renderRecipientDetails(data) {
    data.lang = this.state.lang || data.lang || 'en';
    const details = Generator.getOccasionDetails(data);
    const dob = data.fields && data.fields.dob;
    if (dob && !isNaN(new Date(dob).getTime())) {
      const info = Generator.getBirthdayInfo(dob);
      const lang = this.state.lang || 'en';
      const turning = lang === 'ar'
        ? `${t('turningWord', lang)} ${info ? info.age + 1 : ''} سنوات`
        : `${t('turningWord', lang)} ${info ? info.age + 1 : ''}`;
      document.getElementById('recipient-details').style.display = 'block';
      document.getElementById('recipient-details-content').innerHTML = `
        <div class="detail-label">${t('cdLabel', lang)}</div>
        <div class="detail-value">${turning}</div>
        <div class="countdown-grid">
          <div class="countdown-box"><div class="countdown-num" id="cd-d">--</div><div class="countdown-label">${t('cdDays', lang)}</div></div>
          <div class="countdown-box"><div class="countdown-num" id="cd-h">--</div><div class="countdown-label">${t('cdHours', lang)}</div></div>
          <div class="countdown-box"><div class="countdown-num" id="cd-m">--</div><div class="countdown-label">${t('cdMins', lang)}</div></div>
          <div class="countdown-box"><div class="countdown-num" id="cd-s">--</div><div class="countdown-label">${t('cdSecs', lang)}</div></div>
        </div>
      `;
      this.startBirthdayCountdown(dob);
    } else if (details) {
      document.getElementById('recipient-details').style.display = 'block';
      document.getElementById('recipient-details-content').innerHTML = `
        <div class="detail-label">${t('specialDetails', this.state.lang)}</div>
        <div class="detail-value"></div>
      `;
      document.querySelector('#recipient-details-content .detail-value').textContent = details;
    }
  },

  // Live ticking countdown to the next birthday (updates every second)
  startBirthdayCountdown(dob) {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v).padStart(2, '0');
    };
    const update = () => {
      const now = new Date();
      let target = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const isToday = target.getMonth() === now.getMonth() && target.getDate() === now.getDate();
      if (!isToday && target <= now) {
        target = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      }
      const diff = target - new Date();
      if (diff <= 0) {
        set('cd-d', 0); set('cd-h', 0); set('cd-m', 0); set('cd-s', 0);
        const label = document.querySelector('#recipient-details-content .detail-label');
        if (label) label.textContent = t('todayText', this.state.lang);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        return;
      }
      const s = Math.floor(diff / 1000);
      set('cd-d', Math.floor(s / 86400));
      set('cd-h', Math.floor(s % 86400 / 3600));
      set('cd-m', Math.floor(s % 3600 / 60));
      set('cd-s', s % 60);
    };
    this.countdownTimer = setInterval(update, 1000);
    update();
  },

  // Interactive birthday cake: tap a candle (or the button)
  // to blow it out with a smoke puff. All out = wish + confetti.
  setupCake() {
    const row = document.getElementById('candles-row');
    if (!row || row.dataset.wired) return;
    row.dataset.wired = '1';
    const candles = Array.from(row.querySelectorAll('.candle'));
    const wish = document.getElementById('wish-text');
    const blowBtn = document.getElementById('btn-blow');
    const relightBtn = document.getElementById('btn-relight');
    const host = document.getElementById('recipient-view');

    const blowOne = (c) => {
      if (c.classList.contains('out')) return;
      c.classList.add('out');
      if (row.querySelectorAll('.candle:not(.out)').length === 0) {
        wish.style.display = 'block';
        blowBtn.style.display = 'none';
        relightBtn.style.display = 'inline-block';
        Animations.confettiShower(host, 70, 3500);
        Animations.celebrationBurst(host, 24);
      }
    };

    candles.forEach(c => c.addEventListener('click', () => blowOne(c)));
    blowBtn.addEventListener('click', () => {
      candles.forEach((c, i) => setTimeout(() => blowOne(c), i * 200));
    });
    relightBtn.addEventListener('click', () => {
      candles.forEach(c => c.classList.remove('out'));
      wish.style.display = 'none';
      relightBtn.style.display = 'none';
      blowBtn.style.display = 'inline-block';
    });
  },

  // Smooth scroll-triggered reveals for the gift page:
  // photos, message card, details card and closing all glide in
  // as the recipient scrolls to them.
  setupScrollReveals() {
    const root = document.getElementById('recipient-view');
    if (!root) return;
    const items = root.querySelectorAll('.recipient-gallery-item, .recipient-message-card, .recipient-details-card, .recipient-closing, .reveal');
    if (!items.length) return;

    // If IntersectionObserver unavailable, show all immediately
    if (!('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: root, threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(item => observer.observe(item));
    this.enableGalleryTilt();
  },

  // Gentle 3D tilt following the pointer over gift photos.
  // Desktop pointers only; touch devices use the tap (:active) styles.
  enableGalleryTilt() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    if (Animations.calmMode()) return;
    const root = document.getElementById('recipient-view');
    if (!root || root.dataset.tiltOn) return;
    root.dataset.tiltOn = '1';
    const resetAll = () => {
      root.querySelectorAll('.recipient-gallery-item').forEach(el => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };
    root.addEventListener('mousemove', (e) => {
      const card = e.target.closest ? e.target.closest('.recipient-gallery-item') : null;
      root.querySelectorAll('.recipient-gallery-item').forEach(el => {
        if (el === card && el.classList.contains('visible')) {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
          el.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
        } else {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
        }
      });
    });
    root.addEventListener('mouseleave', resetAll);
  },

  // Toggle music
  toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('btn-music-toggle');

    if (music.paused) {
      music.play().then(() => {
        btn.textContent = '\u266B';
        btn.classList.remove('play-hint');
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
      lang: 'en',
      occasion: null,
      relationship: null,
      customRelationship: '',
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
    document.getElementById('custom-relationship-wrap').style.display = 'none';
    document.getElementById('custom-relationship').value = '';
    document.querySelectorAll('.theme-swatch.active').forEach(s => {
      s.classList.remove('active');
      if (s.dataset.theme === 'classic') s.classList.add('active');
    });
    document.getElementById('recipient-name').value = '';
    ['birthday-date', 'anniversary-date', 'years-together', 'thank-you-reason', 'love-reason'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.occasion-field').forEach(f => { f.style.display = 'none'; });

    // Reset all photo slots
    for (let i = 0; i < 5; i++) {
      this.removePhoto(i);
      const textInput = document.querySelector('.photo-text-input[data-slot="' + i + '"]');
      if (textInput) textInput.value = '';
      const urlInput = document.querySelector('.photo-url-input[data-slot="' + i + '"]');
      if (urlInput) urlInput.value = '';
      this.setUrlStatus(i, false, '');
    }

    this.setMessageMode('auto');
    document.getElementById('custom-message').value = '';
    document.getElementById('music-toggle').checked = true;

    // Reset recipient view sections
    document.getElementById('recipient-gallery').style.display = 'none';
    document.getElementById('recipient-details').style.display = 'none';
    document.getElementById('recipient-main-photo').style.display = 'none';

    // Remove any dynamically added captions
    const mainCaption = document.getElementById('recipient-main-caption');
    if (mainCaption) mainCaption.remove();

    // Restore default theme on the page
    document.documentElement.setAttribute('data-theme', 'classic');

    // Hide gallery picker and restore base language
    document.getElementById('gallery-picker').style.display = 'none';
    this.applyLang();

    Animations.startHeroAnimation();
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
