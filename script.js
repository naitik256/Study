const video = document.createElement('video');
video.setAttribute('autoplay', '');
video.setAttribute('muted', '');
video.setAttribute('playsinline', '');
video.style.display = 'none';
document.body.appendChild(video);

const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status');
const todayDisplay = document.getElementById('today');
const totalDisplay = document.getElementById('total');
const stopwatchDisplay = document.getElementById('stopwatch');
const resetBtn = document.getElementById('reset');

let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let todaySeconds = 0;
let totalSeconds = 0;
const todayKey = new Date().toISOString().slice(0, 10);

document.addEventListener('DOMContentLoaded', async () => {
  loadStoredTimes();
  await loadModels();
  startCamera();
  resetBtn.addEventListener('click', resetTimer);
});

async function loadModels() {
  statusText.textContent = 'Loading...';
  await faceapi.nets.tinyFaceDetector.loadFromUri('models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('models');
  statusText.textContent = 'Ready';
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      detectFace();
    })
    .catch(err => {
      console.error(err);
      statusText.textContent = 'Camera access blocked';
    });
}

function detectFace() {
  const canvas = faceapi.createCanvasFromMedia(video);
  overlay.replaceWith(canvas);
  canvas.id = 'overlay';
  faceapi.matchDimensions(canvas, { width: video.width, height: video.height });

  setInterval(async () => {
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (detection) {
      statusText.textContent = 'Face Detected';
      if (!isRunning) startTimer();
    } else {
      statusText.textContent = 'No Face';
      if (isRunning) pauseTimer();
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
}

function updateTime() {
  elapsedTime = Date.now() - startTime;
  todaySeconds = Math.floor(elapsedTime / 1000);
  totalSeconds = todaySeconds;
  updateDisplay();
}

function updateDisplay() {
  stopwatchDisplay.textContent = formatTime(todaySeconds);
  todayDisplay.textContent = formatTime(todaySeconds);
  totalDisplay.textContent = formatTime(totalSeconds);
}

function formatTime(sec) {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const secs = String(sec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function saveTimes() {
  localStorage.setItem(todayKey, todaySeconds);
}

function loadStoredTimes() {
  const saved = localStorage.getItem(todayKey);
  if (saved) {
    todaySeconds = parseInt(saved, 10);
    updateDisplay();
  }
}
