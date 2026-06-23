/* ============================================================
   animations.js — Scroll Animations & Page Effects
   ============================================================ */

const AnimationManager = (() => {

  /* ──────────────────────────────────────────
     INTERSECTION OBSERVER — Fade in on scroll
  ────────────────────────────────────────── */
  const initScrollAnimations = () => {
    const targets = document.querySelectorAll('.fade-in, .fade-left, .fade-right, .scale-in');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    targets.forEach(el => observer.observe(el));
  };

  /* ──────────────────────────────────────────
     SKILL BAR ANIMATIONS
  ────────────────────────────────────────── */
  const initSkillBars = () => {
    const bars = document.querySelectorAll('.skill-bar');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const target = bar.getAttribute('data-width') || '0%';
          setTimeout(() => { bar.style.width = target; }, 200);
          observer.unobserve(bar);
        }
      });
    }, { threshold: 0.5 });

    bars.forEach(bar => observer.observe(bar));
  };

  /* ──────────────────────────────────────────
     COUNTER ANIMATION (for stats)
  ────────────────────────────────────────── */
  const animateCounter = (el, target, duration = 1500) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
    }, 16);
  };

  const initCounters = () => {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCounter(el, parseInt(el.dataset.count), 1500);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  };

  /* ──────────────────────────────────────────
     TYPEWRITER EFFECT
  ────────────────────────────────────────── */
  const initTypewriter = () => {
    const el = document.getElementById('typewriter-text');
    if (!el) return;

    const phrases = el.dataset.phrases
      ? JSON.parse(el.dataset.phrases)
      : ['Developer', 'Designer', 'Creator'];

    let phraseIdx = 0, charIdx = 0, isDeleting = false;

    const type = () => {
      const current = phrases[phraseIdx];
      const text = isDeleting
        ? current.substring(0, charIdx--)
        : current.substring(0, charIdx++);

      el.textContent = text;

      let delay = isDeleting ? 60 : 100;

      if (!isDeleting && charIdx > current.length) {
        delay = 1800;
        isDeleting = true;
      } else if (isDeleting && charIdx < 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        delay = 400;
      }

      setTimeout(type, delay);
    };

    type();
  };

  /* ──────────────────────────────────────────
     NAVBAR SCROLL EFFECT
  ────────────────────────────────────────── */
  const initNavbarScroll = () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  };

  /* ──────────────────────────────────────────
     NAVBAR ACTIVE LINK
  ────────────────────────────────────────── */
  const initNavbarActive = () => {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a, .navbar-mobile a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  };

  /* ──────────────────────────────────────────
     HAMBURGER MENU
  ────────────────────────────────────────── */
  const initMobileMenu = () => {
    const hamburger = document.querySelector('.navbar-hamburger');
    const mobileMenu = document.querySelector('.navbar-mobile');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  };

  /* ──────────────────────────────────────────
     PROJECT FILTER
  ────────────────────────────────────────── */
  const initProjectFilter = () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        projectCards.forEach(card => {
          const category = card.dataset.category || 'all';
          const show = filter === 'all' || category.includes(filter);
          card.style.opacity = show ? '1' : '0.3';
          card.style.transform = show ? '' : 'scale(0.95)';
          card.style.pointerEvents = show ? '' : 'none';
        });
      });
    });
  };

  /* ──────────────────────────────────────────
     INIT ALL
  ────────────────────────────────────────── */
  const init = () => {
    initScrollAnimations();
    initSkillBars();
    initCounters();
    initTypewriter();
    initNavbarScroll();
    initNavbarActive();
    initMobileMenu();
    initProjectFilter();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', AnimationManager.init);
