/* ============================================================
   particles.js — Canvas Particle System
   🌸 Sakura petals (Sakura mode) | ⬡ Hex grid (Neon mode)
   ============================================================ */

const ParticleSystem = (() => {
  let canvas, ctx, particles = [], animId, currentTheme = 'sakura';
  let W, H;

  /* ──────────────────────────────────────────
     SAKURA PETAL PARTICLE
  ────────────────────────────────────────── */
  class SakuraPetal {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : -20;
      this.size = Math.random() * 10 + 5;
      this.speedY = Math.random() * 1.2 + 0.4;
      this.speedX = Math.random() * 1 - 0.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.04;
      this.opacity = Math.random() * 0.5 + 0.3;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.05 + 0.02;
      this.color = ['#ffb3c6', '#ff80ab', '#f48fb1', '#e91e8c', '#ffcdd2', '#ce93d8']
        [Math.floor(Math.random() * 6)];
    }

    update() {
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.7;
      this.y += this.speedY;
      this.rotation += this.rotSpeed;
      if (this.y > H + 20 || this.x < -20 || this.x > W + 20) this.reset();
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // Draw petal shape
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.8, this.size * 0.8, -this.size * 0.2, 0, 0);
      ctx.bezierCurveTo(-this.size * 0.8, -this.size * 0.2, -this.size * 0.6, -this.size * 0.8, 0, -this.size);
      ctx.fill();

      ctx.restore();
    }
  }

  /* ──────────────────────────────────────────
     NEON HEX / STAR PARTICLE
  ────────────────────────────────────────── */
  class NeonParticle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.size = Math.random() * 2 + 1;
      this.speedY = -(Math.random() * 0.8 + 0.2);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.life = 1;
      this.decay = Math.random() * 0.003 + 0.001;
      this.color = ['#ff006e', '#00f5ff', '#bf5af2', '#ff80ab', '#00d4ff']
        [Math.floor(Math.random() * 5)];
      this.twinkle = Math.random() * Math.PI * 2;
      this.twinkleSpeed = Math.random() * 0.05 + 0.02;

      // Some particles are "shooting stars"
      this.isStar = Math.random() < 0.15;
      if (this.isStar) {
        this.size = Math.random() * 1.5 + 0.5;
        this.speedY = -(Math.random() * 3 + 2);
        this.speedX = (Math.random() - 0.5) * 2;
        this.tail = [];
      }
    }

    update() {
      this.twinkle += this.twinkleSpeed;
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;

      if (this.isStar) {
        this.tail.unshift({ x: this.x, y: this.y });
        if (this.tail.length > 12) this.tail.pop();
      }

      if (this.life <= 0 || this.y < -20 || this.x < -20 || this.x > W + 20) this.reset();
    }

    draw(ctx) {
      const twinkleOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.twinkle)) * this.life;

      if (this.isStar && this.tail.length > 1) {
        // Draw tail
        for (let i = 0; i < this.tail.length - 1; i++) {
          const t = this.tail[i];
          const alpha = ((this.tail.length - i) / this.tail.length) * twinkleOpacity * 0.5;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, this.size * (1 - i / this.tail.length), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.globalAlpha = twinkleOpacity;
      ctx.fillStyle = this.color;

      // Glow
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.size * 4;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ──────────────────────────────────────────
     INIT & RESIZE
  ────────────────────────────────────────── */
  const resize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };

  const createParticles = (theme) => {
    particles = [];
    const count = theme === 'sakura' ? 35 : 80;
    const ParticleClass = theme === 'sakura' ? SakuraPetal : NeonParticle;
    for (let i = 0; i < count; i++) {
      particles.push(new ParticleClass());
    }
  };

  /* ──────────────────────────────────────────
     ANIMATION LOOP
  ────────────────────────────────────────── */
  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(ctx); });
    animId = requestAnimationFrame(loop);
  };

  /* ──────────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────────── */
  const init = (canvasId = 'particle-canvas') => {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', () => { resize(); });

    currentTheme = document.documentElement.getAttribute('data-theme') || 'sakura';
    createParticles(currentTheme);
    loop();

    document.addEventListener('themeChange', (e) => {
      currentTheme = e.detail.theme;
      createParticles(currentTheme);
    });
  };

  const destroy = () => {
    if (animId) cancelAnimationFrame(animId);
  };

  return { init, destroy };
})();

document.addEventListener('DOMContentLoaded', () => ParticleSystem.init());
