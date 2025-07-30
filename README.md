# 🎵 Melofy - Web Music Player

Melofy is a web-based music player application that allows users to browse music albums, play songs, and enjoy an interactive music listening experience. The player supports features such as play, pause, next/previous track navigation, volume control, and autoplay of the next song.

## 🚀 Features

- Browse music albums and playlists dynamically loaded from the `songs/` directory.
- Play, pause, and navigate between songs.
- Autoplay the next song when the current song ends.
- Volume control with mute/unmute functionality.
- Search and filter albums by title or description.
- User login and signup system (in-memory simulation).
- Responsive UI with album cover art and song information display.
- Seekbar to navigate within the current song.

## 📁 Project Structure

- `index.html` - Main HTML page for the music player UI.
- `css/` - Contains stylesheets for the application.
- `js/script.js` - Main JavaScript file handling music playback, UI interactions, and user authentication.
- `Images/` - Contains icons and images used in the UI.
- `songs/` - Directory containing music albums, each with MP3 files, cover images, and metadata (`info.json`).

## 🛠 How to Use

1. Open `index.html` in a modern web browser.
2. Browse available albums and click on an album to view its songs.
3. Click on a song to play it, or use the play/pause and next/previous controls.
4. Adjust volume using the slider or mute/unmute button.
5. The player will automatically play the next song when the current one finishes.
6. Use the search bar to filter albums by title or description.
7. Use the login/signup modals to simulate user authentication.

## 🔁 Autoplay Next Song

The player automatically plays the next song in the current playlist when the current song ends. If the last song finishes, playback loops back to the first song.

## Dependencies

- No external dependencies. The project uses vanilla JavaScript, HTML, and CSS.

## Notes

- The user login system is simulated in-memory and does not persist data beyond the session.
- Songs and albums are dynamically loaded from the `songs/` directory structure.
- Ensure your browser supports the HTML5 Audio API for full functionality.

## 📄 License

This project is licensed under the MIT License – free to use, modify, and distribute.
