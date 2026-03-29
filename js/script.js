'use strict';

let currFolder = 'songs';
let songs = [];
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users') || '{}') || {};
let currentSong = null;

const elements = {
  playBtn: null,
  prevBtn: null,
  nextBtn: null,
  volSlider: null,
  seekbar: null,
  seekbarProgress: null,
  seekbarThumb: null,
  searchInput: null,
  cardContainer: null,
  playlistSection: null,
  favoritesSection: null,
  favoriteList: null,
  likeBtn: null,
  authButtons: null,
  userInfo: null,
  userName: null,
  userAvatar: null
};

/* ─── Storage Helpers ────────────────────────────────────────────── */

function storeData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Unable to store', key, err);
  }
}

function getStoredData(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.warn('Unable to read', key, err);
    return null;
  }
}

/* ─── Auth UI Helpers ────────────────────────────────────────────── */

function showMessage(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.className = isError ? 'error-message' : 'success-message';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function clearAuthMessages() {
  ['loginError', 'loginSuccess', 'signupError', 'signupSuccess'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
}

function switchAuthTab(sectionId) {
  document.querySelectorAll('.auth-section').forEach((section) => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('onclick')?.includes(sectionId));
  });
  clearAuthMessages();
}

function openAuthScreen(tab = 'loginSection') {
  const authScreen = document.getElementById('authScreen');
  const container = document.querySelector('.container');
  if (authScreen) authScreen.classList.add('visible');
  if (container) container.classList.add('hidden');
  switchAuthTab(tab === 'signup' ? 'signupSection' : 'loginSection');
}

function hideLoginOverlay() {
  const authScreen = document.getElementById('authScreen');
  const container = document.querySelector('.container');
  if (authScreen) authScreen.classList.remove('visible');
  if (container) container.classList.remove('hidden');
}

function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.type = field.type === 'password' ? 'text' : 'password';
}

/* ─── Song / Album Fetching ─────────────────────────────────────── */

/**
 * Extract folder names from a raw HTML directory listing.
 * Works with Apache, Nginx, Python http.server, and live-server directory indexes.
 */
function parseFoldersFromHTML(html) {
  const folders = new Set();

  // Match href values that look like folder paths (end with / or are bare names without extension)
  const hrefRegex = /href="([^"#?]+)"/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    // Skip parent dir links and absolute URLs
    if (href.startsWith('/') || href.startsWith('http') || href === '../' || href === './') continue;
    // Accept trailing-slash folders or names that contain no dot (i.e., no extension)
    const clean = href.replace(/\/$/, '');
    if (clean && !clean.includes('.')) {
      folders.add(clean);
    }
  }
  return Array.from(folders);
}

/**
 * Extract .mp3 filenames from a raw HTML directory listing.
 */
function parseMP3sFromHTML(html) {
  const mp3s = [];
  const hrefRegex = /href="([^"]*\.mp3)"/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    // Keep only the filename, not the full path
    const filename = href.split('/').pop();
    if (filename) mp3s.push(filename);
  }
  return mp3s;
}

/**
 * Attempt to read a text response from a URL.
 * Returns null on any failure.
 */
async function safeFetch(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return resp;
  } catch {
    return null;
  }
}

/**
 * getSongs(albumFolder) — loads songs for a given folder.
 * Priority: info.json → directory listing.
 * NEVER throws; always returns an array (possibly empty).
 */
async function getSongs(albumFolder) {
  // Normalise the folder name: strip leading "songs/" and trailing slashes
  const folder = albumFolder.replace(/^songs\/+/, '').replace(/\/+$/, '');
  currFolder = folder;
  songs = [];

  // 1️⃣ Try info.json — songs array is REQUIRED in info.json
  try {
    const resp = await safeFetch(`./songs/${folder}/info.json`);
    if (resp) {
      const info = await resp.json();
      if (Array.isArray(info.songs) && info.songs.length > 0) {
        songs = info.songs.map(s => s.split('/').pop());
        return songs;
      }
      // info.json exists but has no songs array — warn the developer
      console.warn(
        `[Melofy] ⚠️  info.json for "${folder}" has no "songs" array.\n` +
        `Add a "songs": ["file1.mp3", "file2.mp3"] array to ./songs/${folder}/info.json`
      );
    }
  } catch { /* fall through */ }

  // 2️⃣ Fallback: directory listing (works on Apache/Nginx/Python http.server, NOT Live Server)
  try {
    const resp = await safeFetch(`./songs/${folder}/`);
    if (resp) {
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const html = await resp.text();
        const found = parseMP3sFromHTML(html);
        if (found.length) {
          songs = found;
          return songs;
        }
      }
    }
  } catch { /* fall through */ }

  // 3️⃣ Last resort: probe a folder listing via fetch of the folder URL with no trailing slash
  // This sometimes works with certain dev servers
  try {
    const resp = await safeFetch(`./songs/${folder}`);
    if (resp) {
      const text = await resp.text();
      const found = parseMP3sFromHTML(text);
      if (found.length) {
        songs = found;
        return songs;
      }
    }
  } catch { /* fall through */ }

  console.warn(
    `[Melofy] ❌ No songs found for "${folder}".\n` +
    `→ FIX: Add a "songs": [...] array to ./songs/${folder}/info.json`
  );
  return songs;
}

/* ─── Song List Rendering ────────────────────────────────────────── */

function cleanSongName(filename) {
  return decodeURIComponent(filename)
    .replace(/\.mp3$/i, '')
    .replace(/%20/g, ' ')
    .replace(/_/g, ' ')
    .trim();
}

function renderSongList() {
  const songlist = document.querySelector('.songlist ul');
  if (!songlist) return;
  songlist.innerHTML = '';

  if (songs.length === 0) {
    songlist.innerHTML = '<li style="padding:8px;opacity:.6;">No songs found in this album.</li>';
    return;
  }

  songs.forEach((song, idx) => {
    const name = cleanSongName(song);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="song-row">
        <img src="Images/music.svg" alt="music" />
        <div class="info"><div class="songName">${name}</div></div>
      </div>
      <div class="actions">
        <button class="favorite-toggle" title="Like">♥</button>
        <button class="playnow" title="Play">▶</button>
      </div>
    `;

    li.addEventListener('click', () => playMusic(song));
    li.querySelector('.playnow').addEventListener('click', (e) => {
      e.stopPropagation();
      playMusic(song);
    });
    li.querySelector('.favorite-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(song);
    });

    songlist.appendChild(li);
  });
}

/* ─── Playback ───────────────────────────────────────────────────── */

function playMusic(trackFilename, autoPlay = true) {
  if (!trackFilename || !currentSong) return;
  if (!currentUser) {
    openAuthScreen('loginSection');
    return;
  }

  // trackFilename should be just the filename (basename)
  const filename = trackFilename.split('/').pop();
  currentSong.src = `./songs/${currFolder}/${filename}`;

  const info = document.querySelector('.songinfo');
  const time = document.querySelector('.songtime');
  if (info) info.textContent = cleanSongName(filename);
  if (time) time.textContent = '0:00 / 0:00';

  if (autoPlay) {
    currentSong.play().catch((err) => console.warn('[Melofy] play() error:', err));
    const playBtn = document.getElementById('play');
    if (playBtn) playBtn.src = 'Images/pause.svg';
  }
  updateLikeBtn();
}

function getCurrentSongIndex() {
  if (!currentSong || !currentSong.src) return -1;
  const currentFile = decodeURIComponent(currentSong.src.split('/').pop());
  return songs.findIndex(s => decodeURIComponent(s.split('/').pop()) === currentFile);
}

document.querySelectorAll('.songbuttons img').forEach(btn => {
  btn.addEventListener('click', () => {
    // remove active from all
    document.querySelectorAll('.songbuttons img').forEach(b => b.classList.remove('active'));

    // add to clicked
    btn.classList.add('active');
  });
});

/* ─── Seekbar & Volume ───────────────────────────────────────────── */

function updateSeekbar() {
  if (!currentSong) return;
  const duration = currentSong.duration;
  if (!duration || isNaN(duration) || duration === 0) return;

  const percent = (currentSong.currentTime / duration) * 100;
  const progress = document.querySelector('.seekbar-progress');
  const thumb = document.querySelector('.seekbar-thumb');
  if (progress) progress.style.width = `${percent}%`;
  if (thumb) thumb.style.left = `${percent}%`;

  const time = document.querySelector('.songtime');
  if (time) {
    const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    time.textContent = `${fmt(currentSong.currentTime)} / ${fmt(duration)}`;
  }
}
function updateVolumeGradient() {
  const slider = document.getElementById('volSlider');
  if (!slider) return;
  updateVolumeBarColor(Number(slider.value), slider);
}

function updateVolumeBarColor(val, slider) {
  const s = slider || document.getElementById('volSlider');
  if (!s) return;
  s.style.background = `linear-gradient(to right, rgb(40, 204, 98) ${val}%, #aaa ${val}%)`;

  const volImg = document.querySelector('.volume > img');
  if (volImg) {
    if (val > 0) {
      volImg.src = volImg.src.replace('mute.svg', 'volume.svg');
    } else {
      volImg.src = volImg.src.replace('volume.svg', 'mute.svg');
    }
  }
}
/* ─── Favorites ──────────────────────────────────────────────────── */

let favoriteSongs = new Set(getStoredData('favorites') || []);

function renderFavorites() {
  const list = document.querySelector('.favoriteList');
  const emptyState = document.querySelector('.empty-state');
  if (!list) return;
  list.innerHTML = '';

  const favorited = Array.from(favoriteSongs);
  if (favorited.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  favorited.forEach((entry) => {
    const filename = entry.split('/').pop();
    const name = cleanSongName(filename);
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `<div class="info">${name}</div><button class="favorite-toggle active" title="Unlike">♥</button>`;

    div.querySelector('.favorite-toggle').onclick = (e) => {
      e.stopPropagation();
      favoriteSongs.delete(entry);
      storeData('favorites', Array.from(favoriteSongs));
      renderFavorites();
    };
    div.onclick = () => {
      // Try to find which folder this belongs to from the stored path
      // Path format: ./songs/<folder>/<filename>
      const parts = entry.split('/');
      if (parts.length >= 3) {
        // Reconstruct folder from path: ./songs/<folder>/filename
        // parts: ['.', 'songs', '<folder>', '<filename>']  or ['./songs', '<folder>', '<filename>']
        const folderIdx = parts.findIndex(p => p === 'songs');
        if (folderIdx !== -1 && parts[folderIdx + 1]) {
          currFolder = parts[folderIdx + 1];
        }
      }
      playMusic(filename);
    };
    list.appendChild(div);
  });
}

function toggleFavorite(trackFilename) {
  const filename = trackFilename.split('/').pop();
  const fullPath = `./songs/${currFolder}/${filename}`;
  if (favoriteSongs.has(fullPath)) favoriteSongs.delete(fullPath);
  else favoriteSongs.add(fullPath);
  storeData('favorites', Array.from(favoriteSongs));
  renderFavorites();
  updateLikeBtn();
}

function updateLikeBtn() {
  const likeBtn = document.getElementById('currentLike');
  if (!likeBtn || !currentSong) return;
  const filename = currentSong.src.split('/').pop();
  const currentPath = `./songs/${currFolder}/${filename}`;
  likeBtn.classList.toggle('active', favoriteSongs.has(currentPath));
}

/* ─── Album Display ──────────────────────────────────────────────── */

/**
 * Attempt to discover album folders.
 * Strategy 1: songs/songs.json  { "albums": ["folder1", "folder2", ...] }
 * Strategy 2: Directory listing of songs/
 */
async function discoverAlbumFolders() {
  // Strategy 1: songs.json  { "albums": ["folder1", "folder2", ...] }
  try {
    const resp = await safeFetch('./songs/songs.json');
    if (resp) {
      const data = await resp.json();
      if (Array.isArray(data.albums) && data.albums.length > 0) {
        return data.albums;
      }
    }
  } catch { /* fall through */ }

  // Strategy 2: Directory listing (Apache/Nginx/Python http.server only — NOT Live Server)
  try {
    const resp = await safeFetch('./songs/');
    if (resp) {
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const html = await resp.text();
        const folders = parseFoldersFromHTML(html);
        if (folders.length > 0) return folders;
      }
    }
  } catch { /* fall through */ }

  // Nothing worked — log a clear actionable message
  console.error(
    '[Melofy] ❌ Could not discover albums.\n\n' +
    '→ You are likely using VS Code Live Server which does NOT serve directory listings.\n\n' +
    'FIX: Create the file  songs/songs.json  with this content:\n\n' +
    '{\n  "albums": [\n    "Bruno_Mars",\n    "Chill_(mood)",\n    "Classical_Songs"\n  ]\n}\n\n' +
    'Then add a "songs": [...] array to each album\'s info.json.\n' +
    'See console warnings per-album for details.'
  );
  return [];
}

async function displayAlbums() {
  const container = document.querySelector('.cardContainer');
  if (!container) return;
  container.innerHTML = '<p style="padding:16px;opacity:.6;">Loading albums…</p>';

  const folders = await discoverAlbumFolders();

  if (folders.length === 0) {
    container.innerHTML = `<div style="padding:24px;line-height:1.8;font-family:monospace;font-size:13px;color:#ff6b6b;background:#1a0000;border:1px solid #ff6b6b33;border-radius:8px;max-width:620px;"><strong style="font-size:15px;">No albums found — 2 files needed</strong><br><br><strong>Step 1:</strong> Create <code>songs/songs.json</code> listing your album folders.<br><strong>Step 2:</strong> Add a <code>"songs": [...]</code> array to each album's <code>info.json</code>.<br><br>Check the browser console for the exact JSON templates to copy.</div>`;
    return;
  }

  container.innerHTML = '';

  // Load each album card — failures are isolated so one bad album won't block others
  const cardPromises = folders.map(async (folder) => {
    let info = {
      title: folder.replace(/-/g, ' ').replace(/_/g, ' '),
      description: 'No description available',
      songs: []
    };

    // Try fetching info.json — gracefully fall back if missing
    try {
      const resp = await safeFetch(`./songs/${folder}/info.json`);
      if (resp) {
        const fetched = await resp.json();
        if (fetched.title) info.title = fetched.title;
        if (fetched.description) info.description = fetched.description;
        if (Array.isArray(fetched.songs)) info.songs = fetched.songs;
      }
    } catch { /* use fallback info */ }

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.folder = folder;
    card.innerHTML = `
    <div class="play"><img src="Images/play.svg" alt="Play" width="10" height="10" /></div>
      <img src="./songs/${folder}/cover.jpg" alt="${info.title}" onerror="this.src='Images/music.svg'">
      <h2>${info.title}</h2>
      <p>${info.description}</p>
      ${info.songs.length ? `<small>${info.songs.length} songs</small>` : ''}
    `;

    card.onclick = async () => {
      await getSongs(folder);
      renderSongList();
      if (songs.length > 0) playMusic(songs[0]);
    };

    return card;
  });

  const cards = await Promise.allSettled(cardPromises);
  cards.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      container.appendChild(result.value);
    }
  });

  // Re-apply any active search filter
  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value) {
    filterCards(searchInput.value);
  }
}

function filterCards(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ─── Auth ──  */

function setLoggedInUI() {
  const authButtons = document.getElementById('authButtons');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  if (authButtons) authButtons.style.display = 'none';
  if (userInfo) userInfo.style.display = 'flex';

  // Extract name from email: "deepakyadav887900@gmail.com" → "Deepakyadav887900"
  const namePart = currentUser.split('@')[0];
  const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  if (userName) userName.textContent = displayName;
  if (userAvatar) userAvatar.textContent = displayName[0].toUpperCase();
}

function setLoggedOutUI() {
  const authButtons = document.getElementById('authButtons');
  const userInfo = document.getElementById('userInfo');
  if (authButtons) authButtons.style.display = 'flex';
  if (userInfo) userInfo.style.display = 'none';
}

function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showMessage('loginError', 'Fill all fields', true);
  const user = users[email];
  if (!user || user.password !== password) return showMessage('loginError', 'Invalid credentials', true);
  currentUser = email;
  storeData('currentUser', currentUser);
  showMessage('loginSuccess', 'Logged in!');
  hideLoginOverlay();
  setLoggedInUI();
}

function signupUser(e) {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  if (!email || !password) return showMessage('signupError', 'Fill all fields', true);
  if (password.length < 6 || !email.includes('@')) return showMessage('signupError', 'Valid email & 6+ char password', true);
  if (users[email]) return showMessage('signupError', 'Email already registered', true);
  users[email] = { password };
  storeData('users', users);
  showMessage('signupSuccess', 'Account created! Please log in.');
  switchAuthTab('loginSection');
}

function logout() {
  currentUser = null;
  storeData('currentUser', null);
  setLoggedOutUI();
}

/* ─── Init ───────────────────────────────────────────────────────── */

async function init() {
  currentSong = document.getElementById('currentSong');

  elements.playBtn = document.getElementById('play');
  elements.prevBtn = document.getElementById('previous');
  elements.nextBtn = document.getElementById('next');
  elements.volSlider = document.getElementById('volSlider');
  elements.seekbar = document.querySelector('.seekbar');
  elements.likeBtn = document.getElementById('currentLike');
  elements.searchInput = document.getElementById('searchInput');
  elements.cardContainer = document.querySelector('.cardContainer');

  // Restore users & session
  users = getStoredData('users') || {};
  const savedUser = getStoredData('currentUser');
  if (savedUser) {
    currentUser = savedUser;
    setLoggedInUI();
  } else {
    setLoggedOutUI();
  }

  // ── Play / Pause ──
  if (elements.playBtn) {
    elements.playBtn.onclick = () => {
      if (!currentSong) return;
      if (currentSong.paused) {
        currentSong.play()
          .then(() => { elements.playBtn.src = 'Images/pause.svg'; })
          .catch(console.warn);
      } else {
        currentSong.pause();
        elements.playBtn.src = 'Images/play.svg';
      }
    };
  }

  // ── Previous ──
  if (elements.prevBtn) {
    elements.prevBtn.onclick = () => {
      const idx = getCurrentSongIndex();
      if (idx > 0) playMusic(songs[idx - 1]);
    };
  }

  // ── Next ──
  if (elements.nextBtn) {
    elements.nextBtn.onclick = () => {
      const idx = getCurrentSongIndex();
      if (idx !== -1 && idx < songs.length - 1) playMusic(songs[idx + 1]);
    };
  }

  // ── Volume ──
  if (elements.volSlider) {
    elements.volSlider.oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      if (currentSong) currentSong.volume = val / 100;
      updateVolumeBarColor(val, elements.volSlider);
    };

    const volImg = document.querySelector('.volume > img');
    if (volImg) {
      volImg.addEventListener('click', () => {
        if (currentSong.volume > 0) {
          elements.volSlider._savedVol = elements.volSlider.value;
          elements.volSlider.value = 0;
          currentSong.volume = 0;
        } else {
          const restored = elements.volSlider._savedVol || 100;
          elements.volSlider.value = restored;
          currentSong.volume = restored / 100;
        }
        updateVolumeBarColor(Number(elements.volSlider.value), elements.volSlider);
      });
    }
  }
  updateVolumeGradient();

  // ── Seekbar ──
  if (elements.seekbar) {
    let isDragging = false;

    elements.seekbar.addEventListener('mousedown', (e) => {
      isDragging = true;
      scrubTo(e);
    });
    document.addEventListener('mousemove', (e) => {
      if (isDragging) scrubTo(e);
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    elements.seekbar.addEventListener('click', scrubTo);

    function scrubTo(e) {
      if (!currentSong || !currentSong.duration || isNaN(currentSong.duration)) return;
      const rect = elements.seekbar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      currentSong.currentTime = ratio * currentSong.duration;
      updateSeekbar();
    }
  }

  // ── Like button ──
  if (elements.likeBtn) {
    elements.likeBtn.onclick = () => {
      if (!currentSong || !currentSong.src) return;
      const filename = currentSong.src.split('/').pop();
      if (filename) toggleFavorite(filename);
    };
  }

  // ── Search ──
  if (elements.searchInput) {
    elements.searchInput.oninput = (e) => filterCards(e.target.value);
  }

  // ── Audio events ──
  if (currentSong) {
    currentSong.ontimeupdate = updateSeekbar;
    currentSong.onpause = () => {
      if (elements.playBtn) elements.playBtn.src = 'Images/play.svg';
    };
    currentSong.onplay = () => {
      if (elements.playBtn) elements.playBtn.src = 'Images/pause.svg';
    };
    currentSong.onended = () => {
      if (elements.playBtn) elements.playBtn.src = 'Images/play.svg';
      const idx = getCurrentSongIndex();
      if (idx !== -1 && idx < songs.length - 1) {
        playMusic(songs[idx + 1]);
      }
    };
  }

  // ── View toggle (Playlists / Liked) ──
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.dataset.view;
      const playlistSection = document.querySelector('.melofy-playlist');
      const favoritesSection = document.querySelector('.favorites-section');

      if (view === 'favorites') {
        if (playlistSection) playlistSection.style.display = 'none';
        if (favoritesSection) favoritesSection.classList.remove('hidden');
      } else {
        if (playlistSection) playlistSection.style.display = 'block';
        if (favoritesSection) favoritesSection.classList.add('hidden');
      }
    };
  });

  // ── Hamburger menu ──
  const hamburger = document.querySelector('.hamburger');
  const closeBtn = document.querySelector('.close img');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.querySelector('.left').classList.add('open');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.left').classList.remove('open');
    });
  }

  // ── Load albums & favorites ──
  await displayAlbums();
  renderFavorites();
}

window.addEventListener('DOMContentLoaded', init);

// Expose globals for inline HTML handlers
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.openAuthScreen = openAuthScreen;
window.switchAuthTab = switchAuthTab;
window.hideLoginOverlay = hideLoginOverlay;
window.togglePassword = togglePassword;