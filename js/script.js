let currFolder = "";
let songs = [];
let currentUser = null;
let users = {};

let currentSong = new Audio();
currentSong.preload = "metadata";

async function getSongs(folder = "songs") {
  currFolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];

  for (let element of as) {
    if (element.href.endsWith(".mp3")) {
      let fileName = decodeURIComponent(element.href.split(`/${folder}/`)[1]);
      songs.push(`/${folder}/` + fileName);
    }
  }

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;

  if (!pause) {
    currentSong.play();
    document.getElementById("play").src = "Images/pause.svg";
  } else {
    document.getElementById("play").src = "Images/play.svg";
  }

  let songName = decodeURIComponent(track.split("/").pop()).replace(
    /\.mp3$/,
    ""
  );
  document.querySelector(".songinfo").innerHTML = songName;
  document.querySelector(".songtime").innerHTML = "0:00 / 0:00";
};

async function displayAlbums() {
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  for (let e of anchors) {
    if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
      let folder = e.href.split("/").filter(Boolean).pop();
      if (!folder || folder === "..") continue;

      try {
        let res = await fetch(`/songs/${folder}/info.json`);
        let meta = await res.json();

        cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                  stroke-linejoin="round" />
            </svg>
          </div>
          <img src="/songs/${folder}/cover.jpg" alt="cover">
          <h2>${meta.title}</h2>
          <p>${meta.description}</p>
        </div>`;
      } catch (err) {
        console.warn(`Could not load info.json for ${folder}`, err);
      }
    }
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      let folder = card.dataset.folder;
      songs = await getSongs(`songs/${folder}`);

      // List songs
      let ul = document.querySelector(".songlist ul");
      ul.innerHTML = "";
      for (let song of songs) {
        let name = decodeURIComponent(song.split("/").pop());
        ul.innerHTML += `
        <li>
          <img class="invert" src="Images/music.svg" />
          <div class="info">
            <div class="songName">${name.replace(/\.mp3$/, "")}</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="Images/play.svg" />
          </div>
        </li>`;
      }

      // Add click to play
      document.querySelectorAll(".songlist ul li").forEach((li, idx) => {
        li.addEventListener("click", () => {
          playMusic(songs[idx].split("/").pop());
        });
      });

      if (songs.length) playMusic(songs[0].split("/").pop());
    });
  });
}

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

// Seekbar and time update
currentSong.addEventListener("timeupdate", () => {
  if (!isNaN(currentSong.duration)) {
    const percent = (currentSong.currentTime / currentSong.duration) * 100;
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left = percent + "%";
    document.querySelector(
      ".seekbar"
    ).style.background = `linear-gradient(to right, pink ${percent}%, black ${percent}%)`;
  }
});

// Seekbar click
document.querySelector(".seekbar").addEventListener("click", (e) => {
  const percent = (e.offsetX / e.target.clientWidth) * 100;
  currentSong.currentTime = (currentSong.duration * percent) / 100;
  document.querySelector(".circle").style.left = percent + "%";
});

// Hamburger toggle
document.querySelector(".hamburger").addEventListener("click", () => {
  document.querySelector(".left").style.left = "0";
});
document.querySelector(".close").addEventListener("click", () => {
  document.querySelector(".left").style.left = "-120%";
});

// Volume slider
const volSlider = document.querySelector(".volrange input[type='range']");
volSlider.addEventListener("input", (e) => {
  const val = parseInt(e.target.value);
  currentSong.volume = val / 100;
  updateVolumeBarColor(val);
  if (currentSong.volume > 0) {
    const volImg = document.querySelector(".volume>img");
    volImg.src = volImg.src.replace("mute.svg", "volume.svg");
  }
});
function updateVolumeBarColor(val) {
  volSlider.style.background = `linear-gradient(to right, pink ${val}%, #aaa ${val}%)`;
}
updateVolumeBarColor(volSlider.value);

// Next/Previous
function getCurrentFilename() {
  return decodeURIComponent(currentSong.src.split("/").pop());
}
document.getElementById("previous").addEventListener("click", () => {
  const current = getCurrentFilename();
  const index = songs.findIndex((s) => s.endsWith(current));
  if (index > 0) playMusic(songs[index - 1].split("/").pop());
});
document.getElementById("next").addEventListener("click", () => {
  const current = getCurrentFilename();
  const index = songs.findIndex((s) => s.endsWith(current));
  if (index < songs.length - 1) playMusic(songs[index + 1].split("/").pop());
});
//Mute/Unmute
document.querySelector(".volume>img").addEventListener("click", () => {
  if (currentSong.volume > 0) {
    currentSong.volume = 0;
    document.querySelector(".volrange input[type='range']").value = 0;
    updateVolumeBarColor(0);
    document.querySelector(".volume>img").src = "Images/mute.svg";
  } else {
    currentSong.volume = 1;
    document.querySelector(".volrange input[type='range']").value = 100;
    updateVolumeBarColor(100);
    document.querySelector(".volume>img").src = "Images/volume.svg";
  }
});
document.getElementById("searchInput").addEventListener("input", function () {
  let input = this.value.toLowerCase();
  let cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    let title = card.querySelector("h2").textContent.toLowerCase();
    let desc = card.querySelector("p").textContent.toLowerCase();

    if (title.includes(input) || desc.includes(input)) {
      card.style.display = ""; // Resets to default (e.g., flex)
    } else {
      card.style.display = "none";
    }
  });
});

//Autoplay next song
currentSong.removeEventListener("ended", () => { });
currentSong.addEventListener("ended", () => {
  const current = getCurrentFilename();
  const index = songs.findIndex((s) => s.endsWith(current));
  if (index < songs.length - 1) {
    playMusic(songs[index + 1].split("/").pop());
  } else {
    playMusic(songs[0].split("/").pop());
  }
});

// Main
window.onload = async function () {
  document.getElementById("play").addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      document.getElementById("play").src = "Images/pause.svg";
    } else {
      currentSong.pause();
      document.getElementById("play").src = "Images/play.svg";
    }
  });

  await displayAlbums();
  songs = await getSongs();
  if (songs.length > 0) playMusic(songs[0].split("/").pop(), true);
};

// Initialize the login system
function initLoginSystem() {
  // Check if user is already logged in
  const loggedInUser = getStoredData('currentUser');
  if (loggedInUser) {
    currentUser = loggedInUser;
    showUserInfo();
  }

  // Load users from memory (simulating localStorage functionality)
  const storedUsers = getStoredData('users');
  if (storedUsers) {
    users = storedUsers;
  } else {
    // Add default user
    users['Deepak'] = '123456';
  }
}

// Memory storage functions (replacing localStorage for compatibility)
function storeData(key, value) {
  // In a real environment, this would use localStorage
  // For compatibility, we store in memory
  if (!window.appStorage) {
    window.appStorage = {};
  }
  window.appStorage[key] = JSON.stringify(value);
}

function getStoredData(key) {
  if (!window.appStorage) {
    return null;
  }
  const data = window.appStorage[key];
  return data ? JSON.parse(data) : null;
}

// Show/Hide modal functions
function showLogin() {
  document.getElementById("loginModal").style.display = "block";
  clearMessages();
}

function showSignup() {
  document.getElementById("signupModal").style.display = "block";
  clearMessages();
}

function closeLogin() {
  document.getElementById("loginModal").style.display = "none";
  clearForm('login');
}

function closeSignup() {
  document.getElementById("signupModal").style.display = "none";
  clearForm('signup');
}

// Clear form inputs
function clearForm(type) {
  if (type === 'login') {
    document.getElementById("loginUsername").value = '';
    document.getElementById("loginPassword").value = '';
  } else {
    document.getElementById("signupUsername").value = '';
    document.getElementById("signupPassword").value = '';
  }
  clearMessages();
}

// Clear success/error messages
function clearMessages() {
  const messages = document.querySelectorAll('.success-message, .error-message');
  messages.forEach(msg => {
    msg.style.display = 'none';
    msg.textContent = '';
  });
}

// Show message function
function showMessage(elementId, message, isSuccess = true) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = 'block';

  // Auto hide after 3 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 3000);
}

// Enhanced signup function
function signupUser(event) {
  event.preventDefault();

  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!username || !password) {
    showMessage('signupError', 'Please enter both username and password.', false);
    return;
  }

  if (username.length < 3) {
    showMessage('signupError', 'Username must be at least 3 characters long.', false);
    return;
  }

  if (password.length < 6) {
    showMessage('signupError', 'Password must be at least 6 characters long.', false);
    return;
  }

  if (users[username]) {
    showMessage('signupError', 'Username already exists. Please choose another.', false);
    return;
  }

  // Store new user
  users[username] = password;
  storeData('users', users);

  showMessage('signupSuccess', 'Account created successfully! You can now login.');

  // Clear form after successful signup
  setTimeout(() => {
    closeSignup();
    showLogin();
  }, 1500);
}

// Enhanced login function
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!username || !password) {
    showMessage('loginError', 'Please enter both username and password.', false);
    return;
  }

  // Check credentials
  if (users[username] && users[username] === password) {
    currentUser = username;
    storeData('currentUser', currentUser);

    showMessage('loginSuccess', `Welcome back, ${username}!`);

    setTimeout(() => {
      closeLogin();
      showUserInfo();
      showPlaylists();
    }, 1500);
  } else {
    showMessage('loginError', 'Invalid username or password.', false);
  }
}

// Show user info after login
function showUserInfo() {
  if (!currentUser) return;

  // Hide auth buttons
  document.getElementById("authButtons").style.display = "none";

  // Show user info
  const userInfo = document.getElementById("userInfo");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");

  userName.textContent = `Welcome, ${currentUser}`;
  userAvatar.textContent = currentUser.charAt(0).toUpperCase();

  userInfo.style.display = "flex";
}

// Enhanced logout function
function logout() {
  currentUser = null;
  storeData('currentUser', null);

  // Show auth buttons
  document.getElementById("authButtons").style.display = "flex";

  // Hide user info
  document.getElementById("userInfo").style.display = "none";

  // Hide playlists if they exist
  const playlistSection = document.querySelector(".melofy-playlist");
  if (playlistSection) {
    playlistSection.style.display = "none";
  }
}

// Enhanced showPlaylists function
function showPlaylists() {
  const playlistSection = document.querySelector(".melofy-playlist");
  if (playlistSection) {
    playlistSection.style.display = "block";
  }
}

// Close modal when clicking outside
window.addEventListener('click', function (event) {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  if (event.target === loginModal) {
    closeLogin();
  }
  if (event.target === signupModal) {
    closeSignup();
  }
});

// Initialize the login system when the page loads
// Add this to your existing window.onload function or create one if it doesn't exist
const originalOnLoad = window.onload;
window.onload = function () {
  // Call existing onload function if it exists
  if (originalOnLoad) {
    originalOnLoad();
  }

  // Initialize login system
  initLoginSystem();
};

// Legacy function support - keep these for backward compatibility
function signup() {
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  if (username && password) {
    users[username] = password;
    storeData('users', users);
    alert("Signup successful! Please login.");
    closeSignup();
  } else {
    alert("Please enter username and password.");
  }
}

function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  // Hardcoded default
  if (username === "Deepak" && password === "123456") {
    currentUser = username;
    storeData('currentUser', currentUser);
    alert("Login successful!");
    closeLogin();
    showUserInfo();
    showPlaylists();
    return;
  }

  // Check stored users
  if (users[username] && users[username] === password) {
    currentUser = username;
    storeData('currentUser', currentUser);
    alert("Login successful!");
    closeLogin();
    showUserInfo();
    showPlaylists();
  } else {
    alert("Invalid username or password.");
  }
}