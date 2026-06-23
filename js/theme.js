/* ============================================================
   theme.js — Theme Toggle (Sakura ↔ Neon)
   ============================================================ */

const ThemeManager = (() => {
  const STORAGE_KEY = 'portfolio-theme';
  const DEFAULT_THEME = 'sakura';

  const getTheme = () => localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update toggle button
    const thumb = document.querySelector('.theme-toggle-thumb');
    if (thumb) {
      thumb.textContent = theme === 'neon' ? '⚡' : '🌸';
    }

    // Notify other modules
    document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
  };

  const toggle = () => {
    const current = getTheme();
    setTheme(current === 'sakura' ? 'neon' : 'sakura');
  };

  const init = () => {
    const savedTheme = getTheme();
    setTheme(savedTheme);

    // Bind toggle button
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
  };

  return { init, toggle, getTheme, setTheme };
})();

// Init on DOM ready
document.addEventListener('DOMContentLoaded', ThemeManager.init);
