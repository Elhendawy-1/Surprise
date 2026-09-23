/* ===== Share Module ===== */

const Share = {
  imageHost: {
    // CORS proxies tried in order (catbox has no CORS headers,
    // so browser uploads must go through a proxy)
    corsProxies: [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest='
    ],
    // Hard cap: embedded thumbnails must keep the full link under this length
    maxEmbedLinkLength: 60000,
    services: {
      picrd: {
        uploadUrl: 'https://picrd.com/api/upload',
        fieldName: 'file',
        getResponseUrl: (data) => {
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch(e) { return null; }
          }
          return data.image_url || data.url || null;
        }
      },
      catbox: {
        uploadUrl: 'https://catbox.moe/user/api.php',
        formData: { reqtype: 'fileupload' },
        fieldName: 'fileToUpload',
        getResponseUrl: (data) => {
          if (typeof data === 'string') return data.trim();
          return data.url || null;
        }
      }
    }
  },

  async uploadImage(file) {
    if (!file) return null;

    let compressedFile;
    try {
      compressedFile = await this.compressImage(file);
    } catch (e) {
      compressedFile = file;
    }

    const services = ['picrd', 'catbox'];
    for (const serviceName of services) {
      try {
        const url = await this.uploadToService(serviceName, compressedFile);
        if (url) return url;
      } catch (err) {
        console.warn(`${serviceName} upload failed:`, err.message);
      }
    }

    return null;
  },

  async compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  // Build a small thumbnail data-URL for embedding directly in the link.
  // Last resort when every upload host fails - no network needed.
  async makeThumbnailDataUrl(file, maxWidth = 384, quality = 0.55) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    const dims = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height, src: dataUrl });
      img.onerror = () => reject(new Error('Cannot decode image (HEIC photos are not supported - use JPEG or a screenshot)'));
      img.src = dataUrl;
    });
    let width = dims.w;
    let height = dims.h;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Cannot decode image'));
      img.src = dims.src;
    });
  },

  async uploadToService(serviceName, file) {
    const service = this.imageHost.services[serviceName];

    // Build the multipart body fresh for every attempt
    // (a used FormData cannot always be re-sent reliably)
    const buildBody = () => {
      const formData = new FormData();
      if (service.formData) {
        Object.entries(service.formData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      formData.append(service.fieldName, file, file.name || 'photo.jpg');
      return formData;
    };

    const method = service.method || 'POST';
    const targets = [service.uploadUrl].concat(
      this.imageHost.corsProxies.map(p => p + encodeURIComponent(service.uploadUrl))
    );

    for (const target of targets) {
      try {
        const url = await this.doFetch(target, method, buildBody(), service);
        if (url) return url;
      } catch (err) {
        console.warn(`Upload via ${target} failed:`, err.message);
      }
    }

    throw new Error(`${serviceName} upload failed`);
  },

  doFetch(url, method, body, service) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, 15000);

      fetch(url, { method, body, signal: controller.signal })
        .then(response => {
          if (!response.ok) {
            clearTimeout(timeoutId);
            reject(new Error('HTTP ' + response.status));
            return;
          }
          const ct = response.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            return response.json().then(data => ({ data, timeoutId }));
          }
          return response.text().then(data => ({ data, timeoutId }));
        })
        .then(({ data, timeoutId }) => {
          clearTimeout(timeoutId);
          if (!data) { reject(new Error('Empty response')); return; }
          
          // Try to extract URL using service's getResponseUrl
          if (service && service.getResponseUrl) {
            const resultUrl = service.getResponseUrl(data);
            if (resultUrl) {
              resolve(resultUrl);
              return;
            }
          }
          
          // Fallback: try common response formats
          if (typeof data === 'string' && data.startsWith('http')) {
            resolve(data);
          } else if (data && data.url) {
            resolve(data.url);
          } else if (data && data.image && data.image.url) {
            resolve(data.image.url);
          } else if (data && data.data && data.data.url) {
            resolve(data.data.url);
          } else if (data && data.image_url) {
            resolve(data.image_url);
          } else {
            console.warn('Could not extract URL from response:', data);
            resolve(null);
          }
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  },

  // Convert share-page links into direct image links that render in <img>
  normalizeImageUrl(url) {
    if (!url) return '';
    // Strip query string and hash (e.g. ?raw=true) before matching
    let u = url.trim().split('?')[0].split('#')[0];
    let m;
    // https://github.com/OWNER/REPO/blob/BRANCH/PATH -> raw link
    m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+\/[^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (m) return 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3];
    // https://github.com/OWNER/REPO/raw/BRANCH/PATH -> raw link
    m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+\/[^/]+)\/raw\/([^/]+)\/(.+)$/);
    if (m) return 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3];
    // Google Drive share link -> direct thumbnail link
    // https://drive.google.com/file/d/FILEID/view...
    m = u.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
    // https://drive.google.com/open?id=FILEID
    m = url.trim().match(/^https?:\/\/drive\.google\.com\/open\?[^#]*\bid=([^&#]+)/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
    // Dropbox share link -> direct download link
    // https://www.dropbox.com/s/..../photo.jpg -> dl.dropboxusercontent.com
    m = u.match(/^https?:\/\/(?:www\.)?dropbox\.com\/(.+)$/);
    if (m) return 'https://dl.dropboxusercontent.com/' + m[1];
    return url.trim();
  },

  encodeData(data) {
    const jsonStr = JSON.stringify(data);
    try {
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (err) {
      console.error('Encode error:', err);
      return '';
    }
  },

  decodeData(hash) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(hash)));
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to decode data:', err);
      return null;
    }
  },

  generateFullUrl(data) {
    // Use href (not origin+pathname) so links also work from file:// and any host
    const baseUrl = window.location.href.split('#')[0];
    const encoded = this.encodeData(data);
    return baseUrl + '#' + encoded;
  },

  async shortenUrl(longUrl) {
    if (longUrl.length < 200) return longUrl;

    try {
      return await new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longUrl), {
          signal: controller.signal
        })
          .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
          })
          .then(shortUrl => {
            if (shortUrl && shortUrl.startsWith('http')) {
              resolve(shortUrl);
            } else {
              resolve(longUrl);
            }
          })
          .catch(err => {
            clearTimeout(timeoutId);
            resolve(longUrl);
          });
      });
    } catch (err) {
      return longUrl;
    }
  },

  getQrCodeUrl(url) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch (e) {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }
};

window.Share = Share;
