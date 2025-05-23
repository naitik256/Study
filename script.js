/*********************************************************************
 * Study Stopwatch — Posture-Aware Version
 *  • Face visible & head slightly down  →  studying
 *  • Only hair/top-head visible (writing) →  studying
 *  • Face small & high in frame (standing) →  pause
 *  • Face close & eyes steep-down (phone)  →  pause
 *********************************************************************/

const video = document.createElement('video');
video.autoplay = true;
video.muted = true;
video.playsInline = true;
document.body.appendChild(video);

// DOM refs
const statusEl   = document.getElementById('status');
const timeEl     = document.getElementById('stopwatch');
const resetBtn   = document.getElementById('reset');
const reportUL   = document.getElementById('daily-report');

// timer vars
let startTime = 0, elapsed = 0, interval = null, studying = false;
let lastStudyTS = 0;

// persistence keys
const todayKey = new Date().toISOString().slice(0,10);

// Wake-Lock to keep screen on
let wakeLock = null;
async function keepAwake(){
  try{ if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }
  catch(e){ console.log('Wake-Lock error',e); }
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') keepAwake(); });
}

/* ---------- Face-API setup ---------- */
async function loadModels(){
  statusEl.textContent='Loading models…';
  await faceapi.nets.tinyFaceDetector.loadFromUri('models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('models');
  statusEl.textContent='Models ready';
}

/* ---------- Camera ---------- */
async function startCam(){
  const stream=await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject=stream;
  video.onloadedmetadata=()=>video.play();
}

/* ---------- Timer helpers ---------- */
function fmt(sec){
  const h=String(Math.floor(sec/3600)).padStart(2,'0');
  const m=String(Math.floor(sec%3600/60)).padStart(2,'0');
  const s=String(sec%60).padStart(2,'0');
  return `${h}:${m}:${s}`;
}
function updateDisplay(){ timeEl.textContent = fmt(Math.floor(elapsed/1000)); }

/* ---------- Timer control ---------- */
function startTimer(){
  if(studying) return;
  studying = true; lastStudyTS = Date.now();
  startTime = Date.now() - elapsed;
  interval = setInterval(()=>{
    elapsed = Date.now()-startTime;
    updateDisplay();
  },1000);
}
function pauseTimer(){
  if(!studying) return;
  studying=false; clearInterval(interval);
  saveTodaySeconds(); updateDailyReport();
}

/* ---------- Storage ---------- */
function saveTodaySeconds(){
  localStorage.setItem(todayKey, Math.floor(elapsed/1000));
}
function loadTodaySeconds(){
  const sec = parseInt(localStorage.getItem(todayKey))||0;
  elapsed = sec*1000; updateDisplay();
}

/* ---------- Daily report list ---------- */
function updateDailyReport(){
  reportUL.innerHTML='';
  Object.keys(localStorage)
    .filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort().reverse()
    .forEach(k=>{
      const li=document.createElement('li');
      li.textContent = `${k}: ${fmt(parseInt(localStorage.getItem(k)))}`;
      reportUL.appendChild(li);
    });
}

/* ---------- Posture classification ---------- */
function classifyPose(det){
  const box = det.box;
  const h   = box.height;
  const top = box.top;

  const lm  = det.landmarks;
  const nose = lm.getNose()[3];
  const leftEye = lm.getLeftEye()[3];
  const eyeDiffY = nose.y - leftEye.y; // how far nose is below eye

  // Reading-screen pose
  const readingPose = (eyeDiffY > 5 && eyeDiffY < 30) && (h > 120) && (top > 40);

  // Standing / far pose
  const standingPose = (h < 100 && top < 100);

  // Phone-close pose (face very large + eyes steep down)
  const phonePose = (h > 180 && eyeDiffY > 25);

  if(readingPose) return 'reading';
  if(phonePose)   return 'phone';
  if(standingPose) return 'standing';
  return 'unknown';
}

/* ---------- Detection loop ---------- */
async function detectLoop(){
  const det = await faceapi.detectSingleFace(video,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

  if(det){
    const pose = classifyPose(det);

    if(pose==='reading'){                    // screen study
      statusEl.textContent='Reading — Studying';
      startTimer();
    }
    else if(pose==='phone' || pose==='standing'){ // distraction
      statusEl.textContent = pose==='phone' ? 'Phone detected — Paused' : 'Standing — Paused';
      pauseTimer();
    }
    else{                                    // uncertain (maybe slight head down)
      statusEl.textContent='Uncertain pose';
      pauseTimer();
    }
  }else{
    /* No face visible — maybe writing?
       Allow up to 180 s grace if user was just studying */
    if(Date.now()-lastStudyTS < 180000){
      statusEl.textContent='Writing — Studying';
      startTimer();
    }else{
      statusEl.textContent='No Face — Paused';
      pauseTimer();
    }
  }
  requestAnimationFrame(detectLoop);
}

/* ---------- Main ---------- */
document.addEventListener('DOMContentLoaded',async()=>{
  await keepAwake();
  loadTodaySeconds(); updateDailyReport();

  await loadModels();
  await startCam();

  resetBtn.addEventListener('click',()=>{
    pauseTimer();
    elapsed=0; updateDisplay();
    localStorage.removeItem(todayKey);
    updateDailyReport();
  });

  detectLoop(); // start detection
});
