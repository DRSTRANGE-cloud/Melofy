# 🎵 Melofy — Modern Web Music Player

🔗 **Live Demo:** https://melofy1.netlify.app/

Melofy is a sleek, responsive, and interactive web-based music player built using **vanilla HTML, CSS, and JavaScript**. It delivers a Spotify-inspired UI with dynamic album loading, smooth playback controls, and a polished user experience.

---

# 🚀 Features

## 🎧 Core Music Functionality
- ▶️ Play / Pause / Next / Previous controls  
- 🔁 Autoplay next track (loop support for playlists)  
- 🎚️ Seekbar with real-time progress tracking  
- 🔊 Volume control with mute/unmute toggle  
- 🎵 Dynamic song loading from local directory  

---

## 📀 Album & Playlist System
- Albums dynamically loaded from `/songs` directory  
- Each album contains:
  - `info.json` (metadata)
  - `.mp3` files
  - cover image  
- Sidebar song list updates per selected album  
- Displays:
  - Song name  
  - Artist  
  - Duration  

---

## ❤️ Favorites (Liked Songs)
- Add/remove songs to favorites  
- Dedicated **Liked Songs section**  
- Persistent UI state (session-based)  
- Smooth hover + glow effects  

---

## 🔐 Authentication (Frontend Simulation)
- Login / Signup UI system  
- In-memory user handling  
- Seamless UI transitions between states  

---

## 🔍 Search & Filtering
- Search albums by:
  - Title  
  - Description  
- Real-time filtering  

---

## 🎨 UI/UX Enhancements (Recent Improvements)
- Glassmorphism-based UI  
- Spotify-inspired layout  
- Fully aligned grid system (no overflow issues)  
- Equal-sized album cards  
- Animated play button with glow effects  
- Improved volume slider alignment  
- Responsive layout (desktop-first)  
- Golden + green hover interactions  
- Clean typography and spacing  

---

## ⚡ Performance Improvements
- Faster album rendering  
- Optimized DOM updates  
- Reduced layout shifts  
- Efficient event handling  

---

# 🛠 How It Works

1. Albums are fetched dynamically from the `/songs` directory  
2. Each album contains metadata (`info.json`)  
3. Clicking an album:
   - Loads songs into sidebar  
   - Updates UI  
4. Clicking a song:
   - Plays audio using HTML5 Audio API  
5. Player controls manage playback state globally  

---

# 📄 License

MIT License — free to use, modify, and distribute.

---

# 🙌 Author

Deepak Yadav
GitHub: @DRSTRANGE-cloud
