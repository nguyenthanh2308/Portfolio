/* ============================================================
   cursor.js — Custom Cursor
   ============================================================ */

const CursorManager = (() => {
  let dot, ring;
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let animId;

  const lerp = (a, b, t) => a + (b - a) * t;

  const moveCursor = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  };

  const animateRing = () => {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    animId = requestAnimationFrame(animateRing);
  };

  const onHoverEnter = () => {
    dot.classList.add('cursor-hover');
    ring.classList.add('cursor-hover');
  };

  const onHoverLeave = () => {
    dot.classList.remove('cursor-hover');
    ring.classList.remove('cursor-hover');
  };

  const init = () => {
    dot = document.getElementById('cursor-dot');
    ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.addEventListener('mousemove', moveCursor);
    animateRing();

    // Hover on interactive elements
    const hoverTargets = 'a, button, .btn, .card, .project-card, .contact-card, .tech-icon-item, .filter-btn, .playlist-item, .ctrl-btn, .player-mini, [role="button"]';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) onHoverEnter();
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) onHoverLeave();
    });

    // Click effect
    document.addEventListener('mousedown', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(0.7)';
    });

    document.addEventListener('mouseup', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', CursorManager.init);
