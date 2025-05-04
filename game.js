if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

const gameArea = document.getElementById('game-area');
const startButton = document.getElementById('start-button');
const muteToggle = document.getElementById('mute-toggle');
const timerDisplay = document.getElementById('timer');
const killCountDisplay = document.getElementById('kill-count');
const spawnRateIndicator = document.getElementById('spawn-rate-indicator');
const internetStatus = document.getElementById('internet-status');
const installButton = document.getElementById('install-button');

let spawnInterval = 2000; // initial spawn interval in ms
let spawnTimerId = null;
let gameTimerId = null;
let gameTime = 0;
let killCount = 0;
let isMuted = false;
let cockroachSpeed = 1;
let spawnRateIncreaseInterval = 10000; // 10 seconds
let spawnRateIncreaseTimerId = null;
let cockroaches = [];
let bgMusic = new Audio('sounds/bgmusic.wav');
bgMusic.loop = true;
bgMusic.volume = 0.3;

let every10SecondsSound = new Audio('sounds/every 10 seconds.mp3');
let squishSound = new Audio('sounds/squish.mp3');

let deferredPrompt = null;

// Custom cursor movement
const customCursor = document.getElementById('custom-cursor');
if (customCursor) {
  gameArea.addEventListener('mousemove', (e) => {
    const rect = gameArea.getBoundingClientRect();
    const x = e.clientX - rect.left - customCursor.width / 2;
    const y = e.clientY - rect.top - customCursor.height / 2;
    customCursor.style.left = `${x}px`;
    customCursor.style.top = `${y}px`;
  });
}

// Utility function to create a cockroach element
function createCockroach() {
  const cockroach = document.createElement('img');
  cockroach.src = 'images/alive.gif';
  cockroach.classList.add('cockroach');
  cockroach.style.top = Math.random() * (gameArea.clientHeight - 60) + 'px';
  cockroach.style.left = Math.random() * (gameArea.clientWidth - 60) + 'px';
  cockroach.dataset.alive = 'true';
  gameArea.appendChild(cockroach);

  // Move cockroach randomly every 500ms
  let moveInterval = setInterval(() => {
    if (cockroach.dataset.alive === 'false') {
      clearInterval(moveInterval);
      return;
    }
    let newTop = Math.min(Math.max(0, parseFloat(cockroach.style.top) + (Math.random() * 2 - 1) * 20 * cockroachSpeed), gameArea.clientHeight - 60);
    let newLeft = Math.min(Math.max(0, parseFloat(cockroach.style.left) + (Math.random() * 2 - 1) * 20 * cockroachSpeed), gameArea.clientWidth - 60);
    cockroach.style.top = newTop + 'px';
    cockroach.style.left = newLeft + 'px';
  }, 500);

  cockroach.addEventListener('click', () => {
    if (cockroach.dataset.alive === 'true') {
      cockroach.dataset.alive = 'false';
      cockroach.src = 'images/dead.png';
      cockroach.classList.add('dead');
      killCount++;
      killCountDisplay.innerHTML = `<img src="images/dead.png" alt="dead cockroach" style="width:20px; height:20px; vertical-align:middle;" /> Dead Cockroaches: ${killCount} <img src="images/dead.png" alt="dead cockroach" style="width:20px; height:20px; vertical-align:middle;" />`;
      if (!isMuted) {
        squishSound.currentTime = 0;
        squishSound.play();
      }
      clearInterval(moveInterval);
      setTimeout(() => {
        if (cockroach.parentElement) {
          gameArea.removeChild(cockroach);
        }
      }, 2000);
    }
  });

  cockroaches.push(cockroach);
}

// Spawn cockroach at intervals
function startSpawning() {
  spawnTimerId = setInterval(() => {
    createCockroach();
  }, spawnInterval);
}

// Increase spawn rate every 10 seconds
function increaseSpawnRate() {
  spawnRateIncreaseTimerId = setInterval(() => {
    if (spawnInterval > 400) {
      spawnInterval = Math.max(400, spawnInterval - 300);
      clearInterval(spawnTimerId);
      startSpawning();
      spawnRateIndicator.style.visibility = 'visible';
      if (!isMuted) {
        every10SecondsSound.currentTime = 0;
        every10SecondsSound.play();
      }
      setTimeout(() => {
        spawnRateIndicator.style.visibility = 'hidden';
      }, 3000);
    }
  }, spawnRateIncreaseInterval);
}

// Timer update with count up and game over
function startTimer() {
  gameTime = 0;
  timerDisplay.textContent = `⏰ ${gameTime}s`;
  gameTimerId = setInterval(() => {
    gameTime++;
    timerDisplay.textContent = `⏰ ${gameTime}s`;
    if (gameTime >= 90) {
      clearInterval(gameTimerId);
      clearInterval(spawnTimerId);
      clearInterval(spawnRateIncreaseTimerId);
      bgMusic.pause();
      startButton.disabled = false;
      showGameOver();
      // Hide custom cursor
      const customCursor = document.getElementById('custom-cursor');
      if (customCursor) {
        customCursor.style.display = 'none';
      }
    }
  }, 1000);
}

// Mute/unmute toggle
muteToggle.addEventListener('click', () => {
  isMuted = !isMuted;
  muteToggle.textContent = isMuted ? '🔇' : '🔈';
  if (isMuted) {
    bgMusic.pause();
  } else {
    bgMusic.play();
  }
});

// Internet connection detection
function updateInternetStatus() {
  if (navigator.onLine) {
    internetStatus.textContent = '🌐';
  } else {
    internetStatus.textContent = '❌';
  }
}
window.addEventListener('online', updateInternetStatus);
window.addEventListener('offline', updateInternetStatus);
updateInternetStatus();

startButton.addEventListener('click', () => {
  startButton.disabled = true;
  killCount = 0;
  killCountDisplay.textContent = `Dead Cockroaches: 0 🪳`;
  gameTime = 0;
  timerDisplay.textContent = `⏰ ${gameTime}s`;
  spawnInterval = 2000;
  spawnRateIndicator.style.visibility = 'hidden';
  cockroaches.forEach(c => {
    if (c.parentElement) {
      gameArea.removeChild(c);
    }
  });
  cockroaches = [];
  bgMusic.currentTime = 0;
  if (!isMuted) {
    bgMusic.play();
  }
  startSpawning();
  increaseSpawnRate();
  startTimer();
  hideGameOver();
  // Show custom cursor
  const customCursor = document.getElementById('custom-cursor');
  if (customCursor) {
    customCursor.style.display = 'block';
  }
});

// PWA install button handling
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
  console.log('Install button clicked');
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log('User choice:', choiceResult.outcome);
    if (choiceResult.outcome === 'accepted') {
      installButton.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      installButton.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

function showGameOver() {
  let highScore = localStorage.getItem('highScore') || 0;
  if (killCount > highScore) {
    highScore = killCount;
    localStorage.setItem('highScore', highScore);
  }
  const gameOverBox = document.getElementById('game-over-box');
  const finalScore = document.getElementById('final-score');
  const highScoreElem = document.getElementById('high-score');
  finalScore.textContent = `Your Score: ${killCount}`;
  highScoreElem.textContent = `High Score: ${highScore}`;
  gameOverBox.classList.remove('hidden');
}

function hideGameOver() {
  const gameOverBox = document.getElementById('game-over-box');
  gameOverBox.classList.add('hidden');
}

const restartButton = document.getElementById('restart-button');
restartButton.addEventListener('click', () => {
  hideGameOver();
  startButton.click();
});

// On page load, hide spawn rate indicator
spawnRateIndicator.style.visibility = 'hidden';
