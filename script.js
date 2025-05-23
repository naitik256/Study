const video = document.createElement('video');
video.setAttribute('autoplay', '');
video.setAttribute('muted', '');
video.setAttribute('playsinline', '');
document.body.appendChild(video);

const statusText = document.getElementById('status');
const stopwatchDisplay = document.getElementById('stopwatch');
const resetBtn = document.getElementById('reset');

let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let todaySeconds = 0;
let wakeLock = null;

const todayKey = new Date().toISOString().slice(0, 10);

document.addEventListener('DOMContentLoaded', async () => {
  await requestWakeLock();
  loadStoredTimes();
  await loadModels();
  startCamera();
  resetBtn.addEventListener('click', resetTimer);
});

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {}
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  });
}

async function loadModels() {
  statusText.textContent = 'Loading models...';
  await faceapi.nets.tinyFaceDetector.loadFromUri('models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('models');
  statusText.textContent = 'Ready';
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      detectFace();
    };
  } catch (err) {
    statusText.textContent = 'Camera error: ' + err.message;
  }
}

function detectFace() {
  setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detection) {
      statusText.textContent = 'Face Detected — Studying';
      if (!isRunning) startTimer();
    } else {
      // Fallback: Check if top head/hair region is visible
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const topStrip = ctx.getImageData(0, 0, canvas.width, canvas.height * 0.15).data;
      let darkPixelCount = 0;
      for (let i = 0; i < topStrip.length; i += 4) {
        const r = topStrip[i];
        const g = topStrip[i + 1];
        const b = topStrip[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness < 60) darkPixelCount++;
      }
      const darkRatio = darkPixelCount / (topStrip.length / 4);

      if (darkRatio > 0.15) {
        statusText.textContent = 'Head Down — Writing Mode';
        if (!isRunning) startTimer();
      } else {
        statusText.textContent = 'No Face — Paused';
        if (isRunning) pauseTimer();
      }
    }
  }, 1000);
}

function startTimer() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(updateTime, 1000);
  isRunning = true;
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  saveTimes();
}

function resetTimer() {
  pauseTimer();
  todaySeconds = 0;
  elapsedTime = 0;
  updateDisplay();
  localStorage.removeItem(todayKey);
  updateDailyReport();
}

function updateTime() {
  elapsedTime = Date.now() - startTime;
  todaySeconds = Math.floor(elapsedTime / 1000);
  updateDisplay();
}

function updateDisplay() {
  stopwatchDisplay.textContent = formatTime(todaySeconds);
}

function formatTime(sec) {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const secs = String(sec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function saveTimes() {
  localStorage.setItem(todayKey, todaySeconds);
  updateDailyReport();
}

function loadStoredTimes() {
  const saved = localStorage.getItem(todayKey);
  if (saved) {
    todaySeconds = parseInt(saved);
    elapsedTime = todaySeconds * 1000;
    updateDisplay();
  }
  updateDailyReport();
}

function updateDailyReport() {
  const report = document.getElementById('daily-report');
  if (!report) return;
  report.innerHTML = '';
  const sortedKeys = Object.keys(localStorage)
    .filter(k => /^\\d{4}-\\d{2}-\\d{2}$/.test(k))
    .sort()
    .reverse();
  sortedKeys.forEach(key => {
    const sec = parseInt(localStorage.getItem(key));
    const time = formatTime(sec);
    const li = document.createElement('li');
    li.textContent = `${key}: ${time}`;
    report.appendChild(li);
  });
}
