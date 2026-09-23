/* ===== Share Module ===== */

const Share = {
  imageHost: {
    corsProxy: 'https://corsproxy.io/?url=',
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

  async uploadToService(serviceName, file) {
    const service = this.imageHost.services[serviceName];
    const formData = new FormData();

    if (service.formData) {
      Object.entries(service.formData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    formData.append(service.fieldName, file);

    // Try direct upload
    try {
      const url = await this.doFetch(service.uploadUrl, service.method || 'POST', formData, service);
      if (url) return url;
    } catch (err) {
      console.warn(`Direct ${serviceName} failed:`, err.message);
    }

    // Try via CORS proxy
    try {
      const proxyUrl = this.imageHost.corsProxy + encodeURIComponent(service.uploadUrl);
      const url = await this.doFetch(proxyUrl, service.method || 'POST', formData, service);
      if (url) return url;
    } catch (err) {
      console.warn(`Proxy ${serviceName} failed:`, err.message);
    }

    throw new Error(`${serviceName} upload failed`);
  },

  doFetch(url, method, body, service) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, 30000);

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
    const baseUrl = window.location.origin + window.location.pathname;
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
