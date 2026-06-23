/* ============================================================
   splash.js — "Click to Enter" Splash Screen
   ============================================================ */

const SplashManager = (() => {
  const SHOWN_KEY = 'portfolio-splash-shown';

  const init = () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // Run splash every visit (remove SHOWN_KEY check for always-show)
    const loader = splash.querySelector('.splash-loader-bar');
    const enterBtn = splash.querySelector('.splash-enter-btn');
    const subtitle = splash.querySelector('.splash-subtitle');

    // Animate loader bar
    let progress = 0;
    const messages = ['Initializing...', 'Loading assets...', 'Preparing world...', 'Ready ✓'];
    let msgIdx = 0;

    const loadingInterval = setInterval(() => {
      progress += Math.random() * 18 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        showEnterBtn();
      }
      if (loader) loader.style.width = Math.min(progress, 100) + '%';

      if (subtitle && msgIdx < messages.length) {
        const threshold = (msgIdx + 1) * 25;
        if (progress >= threshold) {
          subtitle.textContent = messages[msgIdx];
          msgIdx++;
        }
      }
    }, 120);

    const showEnterBtn = () => {
      const loaderWrap = splash.querySelector('.splash-loader');
      if (loaderWrap) loaderWrap.style.display = 'none';
      if (enterBtn) {
        enterBtn.classList.add('show');
        enterBtn.addEventListener('click', dismiss);
      }
    };

    const dismiss = () => {
      splash.classList.add('hidden');

      // Trigger music autoplay after user interaction
      document.dispatchEvent(new CustomEvent('splashDismissed'));

      // Remove from DOM after transition
      setTimeout(() => splash.remove(), 900);
    };
  };

  // Splash canvas particles (simple stars)
  const initSplashCanvas = () => {
    const canvas = document.getElementById('splash-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.3 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      color: ['#ff006e', '#00f5ff', '#bf5af2', '#ffffff'][Math.floor(Math.random() * 4)]
    }));

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.twinkle += 0.03;
        s.y -= s.speed;
        if (s.y < -5) { s.y = H + 5; s.x = Math.random() * W; }

        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(s.twinkle));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = s.r * 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(loop);
    };

    loop();
    window.addEventListener('resize', () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });
  };

  return { init, initSplashCanvas };
})();

document.addEventListener('DOMContentLoaded', () => {
  SplashManager.initSplashCanvas();
  SplashManager.init();
});
