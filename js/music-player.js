/* ============================================================
   music-player.js — Anime Radio Music Player
   Supports: Built-in playlist, file upload, URL input
   ============================================================ */

const MusicPlayer = (() => {
  /* ──────────────────────────────────────────
     STATE
  ────────────────────────────────────────── */
  let audio = new Audio();
  let playlist = [];
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 'none'; // 'none' | 'one' | 'all'
  let isExpanded = false;
  let activeGenre = 'all';
  let progressInterval = null;
  let isDraggingProgress = false;

  const DEFAULT_TRACKS = [
    { id: 1, title: 'Rainy Tokyo Cafe',      artist: 'Lo-fi Studio',      genre: 'lofi',      src: '', cover: null },
    { id: 2, title: 'Cherry Blossom Dreams', artist: 'Chill Anime Beats', genre: 'lofi',      src: '', cover: null },
    { id: 3, title: 'Ghibli Afternoon',      artist: 'Acoustic Journey',  genre: 'lofi',      src: '', cover: null },
    { id: 4, title: 'Neon City Drive',       artist: 'Synthwave Network', genre: 'synthwave', src: '', cover: null },
    { id: 5, title: 'Digital Ghost',         artist: 'Cyber Pulse',       genre: 'synthwave', src: '', cover: null },
    { id: 6, title: 'Night Protocol',        artist: 'Neo Tokyo Beat',    genre: 'synthwave', src: '', cover: null },
    { id: 7, title: 'Will of Fire',          artist: 'Anime Orchestra',   genre: 'ost',       src: '', cover: null },
    { id: 8, title: 'Shiganshina Rising',    artist: 'Epic Anime',        genre: 'ost',       src: '', cover: null },
    { id: 9, title: 'Beyond the Horizon',    artist: 'Anime Symphonic',   genre: 'ost',       src: '', cover: null },
  ];

  const GENRE_LABELS = { all: 'All', lofi: '🌸 Lo-fi', synthwave: '⚡ Synth', ost: '🎌 OST' };
  const GENRE_EMOJIS = { lofi: '🌸', synthwave: '⚡', ost: '🎌', custom: '🎵' };

  /* ──────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────── */
  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('music-state') || '{}');
      const userTracks = JSON.parse(localStorage.getItem('music-user-tracks') || '[]');
      playlist = [...DEFAULT_TRACKS, ...userTracks];
      if (saved.volume !== undefined) audio.volume = saved.volume;
      if (saved.index !== undefined) currentIndex = Math.min(saved.index, playlist.length - 1);
      isShuffle = saved.shuffle || false;
      repeatMode = saved.repeat || 'none';
    } catch {
      playlist = [...DEFAULT_TRACKS];
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem('music-state', JSON.stringify({
        index: currentIndex, volume: audio.volume,
        shuffle: isShuffle, repeat: repeatMode
      }));
    } catch {}
  };

  /* ──────────────────────────────────────────
     PLAYBACK
  ────────────────────────────────────────── */
  const loadTrack = (index) => {
    const track = playlist[index];
    if (!track) return;
    currentIndex = index;

    if (track.src) {
      audio.src = track.src;
      audio.load();
    } else {
      audio.src = '';
    }

    updateMiniBar();
    updatePanelHeader();
    updatePlaylistUI();
    saveState();
  };

  const play = () => {
    if (!playlist[currentIndex]?.src) {
      showNoSrcWarning();
      return;
    }
    audio.play().then(() => {
      isPlaying = true;
      updatePlayBtns();
      startProgressUpdate();
      updateEQ();
    }).catch(() => {});
  };

  const pause = () => {
    audio.pause();
    isPlaying = false;
    updatePlayBtns();
    stopProgressUpdate();
    updateEQ();
  };

  const togglePlay = () => isPlaying ? pause() : play();

  const playNext = () => {
    if (repeatMode === 'one') { audio.currentTime = 0; play(); return; }
    let next;
    if (isShuffle) {
      do { next = Math.floor(Math.random() * playlist.length); }
      while (next === currentIndex && playlist.length > 1);
    } else {
      next = (currentIndex + 1) % playlist.length;
      if (next === 0 && repeatMode === 'none') { pause(); loadTrack(0); return; }
    }
    loadTrack(next);
    play();
  };

  const playPrev = () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    const prev = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(prev);
    play();
  };

  const showNoSrcWarning = () => {
    const mini = $('#player-track-name');
    if (mini) {
      const orig = mini.textContent;
      mini.textContent = '⚠ Upload or add a URL!';
      setTimeout(() => { mini.textContent = orig; }, 2000);
    }
  };

  /* ──────────────────────────────────────────
     PROGRESS
  ────────────────────────────────────────── */
  const startProgressUpdate = () => {
    stopProgressUpdate();
    progressInterval = setInterval(updateProgress, 500);
  };

  const stopProgressUpdate = () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = null;
  };

  const updateProgress = () => {
    if (isDraggingProgress || !audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    const fill = $('#panel-progress-fill');
    if (fill) fill.style.width = pct + '%';

    const curr = $('#panel-time-current');
    const total = $('#panel-time-total');
    if (curr) curr.textContent = fmt(audio.currentTime);
    if (total) total.textContent = fmt(audio.duration);
  };

  /* ──────────────────────────────────────────
     UI UPDATES
  ────────────────────────────────────────── */
  const updatePlayBtns = () => {
    const icon = isPlaying ? '⏸' : '▶';
    $$('.ctrl-btn-play, .player-mini-play').forEach(btn => { btn.textContent = icon; });
  };

  const updateEQ = () => {
    const eq = $('.player-eq');
    if (eq) eq.classList.toggle('paused', !isPlaying);
  };

  const updateMiniBar = () => {
    const track = playlist[currentIndex];
    if (!track) return;
    const nameEl = $('#player-track-name');
    const artistEl = $('#player-track-artist');
    if (nameEl) {
      const inner = nameEl.querySelector('.player-track-name-inner') || nameEl;
      inner.textContent = track.title;
      setTimeout(() => {
        if (inner.scrollWidth > nameEl.clientWidth) inner.classList.add('marquee');
        else inner.classList.remove('marquee');
      }, 100);
    }
    if (artistEl) artistEl.textContent = track.artist;
  };

  const updatePanelHeader = () => {
    const track = playlist[currentIndex];
    if (!track) return;
    const nameEl = $('#panel-track-name');
    const artistEl = $('#panel-track-artist');
    const genreEl = $('#panel-track-genre');
    const albumArt = $('#panel-album-art-icon');
    if (nameEl) nameEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (genreEl) genreEl.textContent = GENRE_LABELS[track.genre] || track.genre;
    if (albumArt) albumArt.textContent = GENRE_EMOJIS[track.genre] || '🎵';
  };

  const updatePlaylistUI = () => {
    const container = $('#playlist-items');
    if (!container) return;

    const filtered = activeGenre === 'all'
      ? playlist
      : playlist.filter(t => t.genre === activeGenre);

    container.innerHTML = filtered.map((track, idx) => {
      const realIdx = playlist.indexOf(track);
      const isActive = realIdx === currentIndex;
      return `
        <div class="playlist-item ${isActive ? 'active' : ''}" data-index="${realIdx}">
          <span class="playlist-item-num">${idx + 1}</span>
          <span class="playlist-item-icon">♪</span>
          <div class="playlist-item-info">
            <div class="playlist-item-name">${track.title}</div>
            <div class="playlist-item-artist">${track.artist}</div>
          </div>
          <span class="playlist-item-duration">${track.src ? '' : '—'}</span>
        </div>`;
    }).join('');

    container.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        loadTrack(idx);
        play();
      });
    });
  };

  const updateControlStates = () => {
    const shuffleBtn = $('#ctrl-shuffle');
    const repeatBtn = $('#ctrl-repeat');
    if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffle);
    if (repeatBtn) {
      repeatBtn.classList.toggle('active', repeatMode !== 'none');
      repeatBtn.textContent = repeatMode === 'one' ? '🔂' : '🔁';
    }
  };

  /* ──────────────────────────────────────────
     VOLUME
  ────────────────────────────────────────── */
  const setVolume = (val) => {
    audio.volume = Math.max(0, Math.min(1, val));
    const icon = $('#panel-volume-icon');
    if (icon) {
      icon.textContent = audio.volume === 0 ? '🔇' : audio.volume < 0.5 ? '🔉' : '🔊';
    }
    saveState();
  };

  /* ──────────────────────────────────────────
     ADD MUSIC
  ────────────────────────────────────────── */
  const addTrackFromFile = (file) => {
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    const track = {
      id: Date.now(),
      title: name,
      artist: 'My Music',
      genre: 'custom',
      src: url,
      cover: null
    };
    playlist.push(track);
    saveUserTracks();
    updatePlaylistUI();
    return playlist.length - 1;
  };

  const addTrackFromUrl = (url, title = '') => {
    if (!url) return;
    const track = {
      id: Date.now(),
      title: title || url.split('/').pop().replace(/\.[^.]+$/, '') || 'Online Track',
      artist: 'Online',
      genre: 'custom',
      src: url,
      cover: null
    };
    playlist.push(track);
    saveUserTracks();
    updatePlaylistUI();
  };

  const saveUserTracks = () => {
    try {
      const userTracks = playlist.filter(t => t.genre === 'custom' && !t.src.startsWith('blob:'));
      localStorage.setItem('music-user-tracks', JSON.stringify(userTracks));
    } catch {}
  };

  /* ──────────────────────────────────────────
     RENDER PLAYER HTML
  ────────────────────────────────────────── */
  const render = () => {
    const player = document.getElementById('music-player');
    if (!player) return;

    player.innerHTML = `
      <!-- Add Music Modal -->
      <div class="add-music-modal" id="add-music-modal">
        <h4>🎵 Add Music</h4>
        <div class="add-music-option">
          <div>
            <label>Upload from computer</label>
            <button class="add-music-file-btn" id="trigger-file-input">📁 Choose Audio File (.mp3, .ogg, .wav)</button>
            <input type="file" id="music-file-input" accept="audio/*" style="display:none">
          </div>
          <div>
            <label>Or paste a direct URL</label>
            <input type="url" class="add-music-input" id="music-url-input" placeholder="https://example.com/song.mp3">
            <input type="text" class="add-music-input" id="music-title-input" placeholder="Track title (optional)" style="margin-top:0.4rem">
          </div>
          <div class="add-music-actions">
            <button class="btn-add" id="confirm-add-url">Add Track</button>
            <button class="btn-cancel" id="cancel-add-music">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Expanded Panel -->
      <div class="player-panel" id="player-panel">
        <div class="panel-header">
          <div class="panel-album-art">
            <span id="panel-album-art-icon">🎵</span>
          </div>
          <div class="panel-track-info">
            <div class="panel-track-name" id="panel-track-name">Select a track</div>
            <div class="panel-track-artist" id="panel-track-artist">—</div>
            <span class="panel-track-genre" id="panel-track-genre">All</span>
          </div>
        </div>

        <div class="panel-progress-wrap">
          <div class="panel-progress-bar" id="panel-progress-bar">
            <div class="panel-progress-fill" id="panel-progress-fill" style="width:0%">
              <div class="panel-progress-thumb"></div>
            </div>
          </div>
          <div class="panel-time">
            <span id="panel-time-current">0:00</span>
            <span id="panel-time-total">0:00</span>
          </div>
        </div>

        <div class="panel-controls">
          <button class="ctrl-btn" id="ctrl-shuffle" title="Shuffle">🔀</button>
          <button class="ctrl-btn" id="ctrl-prev" title="Previous">⏮</button>
          <button class="ctrl-btn ctrl-btn-play" id="ctrl-play" title="Play/Pause">▶</button>
          <button class="ctrl-btn" id="ctrl-next" title="Next">⏭</button>
          <button class="ctrl-btn" id="ctrl-repeat" title="Repeat">🔁</button>
        </div>

        <div class="panel-volume">
          <span class="panel-volume-icon" id="panel-volume-icon">🔊</span>
          <input type="range" class="panel-volume-slider" id="panel-volume"
                 min="0" max="1" step="0.01" value="0.7">
        </div>

        <div class="panel-playlist-header">
          <div class="panel-playlist-tabs" id="genre-tabs">
            <button class="playlist-tab active" data-genre="all">All</button>
            <button class="playlist-tab" data-genre="lofi">🌸</button>
            <button class="playlist-tab" data-genre="synthwave">⚡</button>
            <button class="playlist-tab" data-genre="ost">🎌</button>
            <button class="playlist-tab" data-genre="custom">🎵</button>
          </div>
          <button class="panel-add-btn" id="open-add-modal" title="Add music">+</button>
        </div>

        <div class="panel-playlist" id="playlist-items"></div>
      </div>

      <!-- Mini Bar -->
      <div class="player-mini" id="player-mini-bar">
        <div class="player-album-art" id="mini-album-art">🎵</div>
        <div class="player-info">
          <div class="player-track-name">
            <span class="player-track-name-inner" id="player-track-name">Anime Radio</span>
          </div>
          <div class="player-track-artist" id="player-track-artist">Click to expand</div>
        </div>
        <div class="player-eq" id="player-eq">
          <div class="player-eq-bar"></div>
          <div class="player-eq-bar"></div>
          <div class="player-eq-bar"></div>
          <div class="player-eq-bar"></div>
          <div class="player-eq-bar"></div>
        </div>
        <button class="player-mini-play" id="mini-play-btn">▶</button>
      </div>
    `;
  };

  /* ──────────────────────────────────────────
     EVENT BINDING
  ────────────────────────────────────────── */
  const bindEvents = () => {
    // Mini bar toggle expand
    const miniBar = $('#player-mini-bar');
    const panel = $('#player-panel');
    miniBar?.addEventListener('click', (e) => {
      if (e.target.closest('#mini-play-btn')) return;
      isExpanded = !isExpanded;
      panel?.classList.toggle('open', isExpanded);
    });

    // Mini play button
    $('#mini-play-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });

    // Controls
    $('#ctrl-play')?.addEventListener('click', togglePlay);
    $('#ctrl-prev')?.addEventListener('click', playPrev);
    $('#ctrl-next')?.addEventListener('click', playNext);
    $('#ctrl-shuffle')?.addEventListener('click', () => {
      isShuffle = !isShuffle;
      updateControlStates();
      saveState();
    });
    $('#ctrl-repeat')?.addEventListener('click', () => {
      repeatMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
      updateControlStates();
      saveState();
    });

    // Volume
    const volSlider = $('#panel-volume');
    if (volSlider) {
      volSlider.value = audio.volume;
      volSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));
    }

    // Progress bar click
    const progressBar = $('#panel-progress-bar');
    progressBar?.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
      updateProgress();
    });

    // Genre tabs
    $$('.playlist-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.playlist-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeGenre = tab.dataset.genre;
        updatePlaylistUI();
      });
    });

    // Add music modal
    const addModal = $('#add-music-modal');
    $('#open-add-modal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      addModal?.classList.toggle('open');
    });
    $('#cancel-add-music')?.addEventListener('click', () => addModal?.classList.remove('open'));

    // File upload
    const fileInput = $('#music-file-input');
    $('#trigger-file-input')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const idx = addTrackFromFile(file);
      loadTrack(idx);
      play();
      addModal?.classList.remove('open');
    });

    // URL add
    $('#confirm-add-url')?.addEventListener('click', () => {
      const url = $('#music-url-input')?.value?.trim();
      const title = $('#music-title-input')?.value?.trim();
      if (!url) return;
      addTrackFromUrl(url, title);
      const idx = playlist.length - 1;
      loadTrack(idx);
      play();
      if ($('#music-url-input')) $('#music-url-input').value = '';
      if ($('#music-title-input')) $('#music-title-input').value = '';
      addModal?.classList.remove('open');
    });

    // Audio events
    audio.addEventListener('ended', playNext);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => {
      const totalEl = $('#panel-time-total');
      if (totalEl) totalEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener('error', () => {
      if (isPlaying) { isPlaying = false; updatePlayBtns(); updateEQ(); }
    });

    // Close modal on outside click
    document.addEventListener('click', (e) => {
      const modal = $('#add-music-modal');
      const btn = $('#open-add-modal');
      if (modal?.classList.contains('open') && !modal.contains(e.target) && e.target !== btn) {
        modal.classList.remove('open');
      }
    });

    // Autoplay after splash dismissed
    document.addEventListener('splashDismissed', () => {
      if (playlist[currentIndex]?.src) {
        setTimeout(() => play(), 500);
      }
    });
  };

  /* ──────────────────────────────────────────
     INIT
  ────────────────────────────────────────── */
  const init = () => {
    render();
    loadState();
    bindEvents();
    loadTrack(currentIndex);
    updateControlStates();
    setVolume(audio.volume || 0.7);
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', MusicPlayer.init);
