const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const statusText = document.getElementById('status');
const todayDisplay = document.getElementById('today');
const totalDisplay = document.getElementById('total');
const stopwatchDisplay = document.getElementById('stopwatch');

let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let isPersonPresent = false;

const todayKey = new Date().toISOString().slice(0, 10);
let totalSeconds = 0;
let todaySeconds = 0;

document.addEventListener('DOMContentLoaded', async () => {
  loadStoredTimes();
  await loadModels();
  startCamera();
});

async function loadModels() {
  statusText.textContent = 'Loading models...';
  await faceapi.nets.tinyFaceDetector.loadFromUri('models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('models');
  statusText.textContent = 'Models loaded';
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      detectFaces();
    })
    .catch(err => {
      console.error('Camera access error:', err);
      statusText.textContent = 'Camera error';
    });
}

function detectFaces() {
  const displaySize = { width: video.width, height: video.height };
  const canvas = faceapi.createCanvasFromMedia(video);
  overlay.replaceWith(canvas);
  canvas.id = 'overlay';

  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (detections) {
      statusText.textContent = 'Face Detected';
      isPersonPresent = true;
      if (!isRunning) startTimer();
    } else {
      statusText.textContent = 'No Face';
      isPersonPresent = false;
      if (isRunning) pauseTimer();
    }
  }, 1000);
}

function startTimer() {
  if (!isRunning) {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTime, 1000);
    isRunning = true;
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    saveTimes();
  }
}

function resetTimer() {
  pauseTimer();
  elapsedTime = 0;
  todaySeconds = 0;
  updateDisplay();
  localStorage.removeItem(todayKey);
}

function updateTime() {
  elapsedTime = Date.now() - startTime;
  const seconds = Math.floor(elapsedTime / 1000);
  todaySeconds = seconds;
  totalSeconds = seconds; // Adjust if storing lifetime data separately
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

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
