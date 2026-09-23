/* ===== Animations Module ===== */

const Animations = {
  hearts: [],
  particles: [],

  // Create a floating heart
  createHeart(container) {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.innerHTML = ['&#10084;', '&#128151;', '&#128150;', '&#128149;', '&#128152;'][Math.floor(Math.random() * 5)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
    heart.style.animationDuration = (Math.random() * 4 + 4) + 's';
    heart.style.opacity = Math.random() * 0.7 + 0.3;
    heart.style.color = `hsl(${Math.random() * 30 + 330}, 80%, 65%)`;

    (container || document.body).appendChild(heart);

    heart.addEventListener('animationend', () => {
      heart.remove();
    });

    return heart;
  },

  // Start continuous floating hearts
  startFloatingHearts(container, interval = 800) {
    const id = setInterval(() => {
      this.createHeart(container);
    }, interval);
    this.hearts.push(id);
    return id;
  },

  // Stop floating hearts
  stopFloatingHearts() {
    this.hearts.forEach(id => clearInterval(id));
    this.hearts = [];
  },

  // Create particle burst
  createParticleBurst(container, x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const angle = (Math.PI * 2 * i) / count;
      const velocity = Math.random() * 100 + 50;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;
      const size = Math.random() * 4 + 2;
      const hue = Math.random() * 60 + 330;

      particle.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: hsl(${hue}, 80%, 65%);
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        border-radius: 50%;
        transition: all 1s ease-out;
        opacity: 1;
      `;

      document.body.appendChild(particle);

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${dx}px, ${dy}px)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => particle.remove(), 1000);
    }
  },

  // Create canvas particles background
  createParticlesBackground(container, count = 50) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    container.style.position = 'relative';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let w, h, particlesArr = [];

    function resize() {
      w = canvas.width = container.offsetWidth;
      h = canvas.height = container.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() * 60 + 330,
      };
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particlesArr.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }

    resize();
    for (let i = 0; i < count; i++) {
      particlesArr.push(createParticle());
    }
    animate();

    window.addEventListener('resize', resize);

    return {
      destroy() {
        canvas.remove();
        window.removeEventListener('resize', resize);
      }
    };
  },

  // Animate text word by word
  animateTextReveal(element, text, speed = 50) {
    return new Promise(resolve => {
      const words = text.split(' ');
      element.innerHTML = '';

      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.style.cssText = `
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
          animation: wordReveal 0.3s ease ${i * speed}ms forwards;
        `;
        element.appendChild(span);
      });

      setTimeout(resolve, words.length * speed + 300);
    });
  },

  // Hero hearts animation
  startHeroAnimation() {
    const heroHearts = document.getElementById('hero-hearts');
    if (heroHearts) {
      // Stop any previous heart loops first (e.g. after "Create Another Gift")
      // so intervals don't pile up.
      this.stopFloatingHearts();
      this.startFloatingHearts(heroHearts, 600);
    }
  },

  // True on devices asking for reduced motion - celebration stays calm
  calmMode() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  flowers() {
    return ['🌸', '🌷', '🌹', '🌺', '💮', '🏵️', '💐'];
  },

  hearts() {
    return ['❤️', '💖', '💕', '💗', '💝', '❣️'];
  },

  // One falling petal drifting down the screen
  dropPetal(container) {
    const petal = document.createElement('span');
    petal.className = 'falling-petal';
    petal.textContent = Math.random() < 0.6 ? this.pick(this.flowers()) : this.pick(this.hearts());
    const fallTime = Math.random() * 4 + 7; // 7-11s gentle fall
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.fontSize = (Math.random() * 1.1 + 0.9) + 'rem';
    petal.style.opacity = (Math.random() * 0.4 + 0.55).toFixed(2);
    petal.style.animationDuration = fallTime + 's,' + (Math.random() * 1.5 + 2.4).toFixed(2) + 's';

    (container || document.body).appendChild(petal);
    petal.addEventListener('animationend', (e) => {
      if (e.animationName === 'fallDown') petal.remove();
    });
    // Safety cleanup in case animationend is missed
    setTimeout(() => petal.remove(), (fallTime + 1) * 1000);
    return petal;
  },

  // Gentle ongoing petal drift (slow, sparse - stays smooth while scrolling)
  startPetalDrift(container, interval = 2600) {
    const id = setInterval(() => this.dropPetal(container), interval);
    this.hearts.push(id);
    return id;
  },

  // Festive shower right when the gift opens
  petalShower(container, durationMs = 6000, interval = 320) {
    if (this.calmMode()) return null;
    const id = setInterval(() => this.dropPetal(container), interval);
    setTimeout(() => clearInterval(id), durationMs);
    return id;
  },

  // Fountain burst of hearts + flowers from screen center
  celebrationBurst(container, count = 42) {
    if (this.calmMode()) return;
    const host = container || document.body;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.42;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const piece = document.createElement('span');
        piece.className = 'burst-piece';
        piece.textContent = Math.random() < 0.55 ? this.pick(this.flowers()) : this.pick(this.hearts());
        piece.style.left = cx + 'px';
        piece.style.top = cy + 'px';
        piece.style.fontSize = (Math.random() * 1.2 + 0.9) + 'rem';
        piece.style.setProperty('--dx', Math.round((Math.random() - 0.5) * window.innerWidth * 0.85) + 'px');
        piece.style.setProperty('--dy', -Math.round(Math.random() * window.innerHeight * 0.55 + 90) + 'px');
        host.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
        setTimeout(() => piece.remove(), 2200);
      }, i * 28);
    }
  },

  // Full opening celebration for the gift page:
  // burst + petal shower, then calm ambient hearts + drifting petals
  startCelebration(container) {
    this.celebrationBurst(container);
    this.petalShower(container, 6500, 300);
    this.startFloatingHearts(container, 1400);
    this.startPetalDrift(container, 2800);
  }
};

// Make available globally
window.Animations = Animations;
