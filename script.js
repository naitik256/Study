let todaySeconds = 0;
let xp = 0;
let level = 1;
let goalHours = 8;
let goalSeconds = 28800;

const todayKey = new Date().toISOString().slice(0, 10);
const xpKey = 'xp';
const levelKey = 'level';
const goalKey = 'goal';

document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  updateXPDisplay();
  document.getElementById('reset').addEventListener('click', resetTimer);
  document.getElementById('goalInput').addEventListener('change', setGoal);
  startTracking();
});

function startTracking() {
  setInterval(() => {
    todaySeconds++;
    updateStopwatch();
    updateXP();
    updateGoalProgress();
  }, 1000);
}

function resetTimer() {
  todaySeconds = 0;
  updateStopwatch();
  updateGoalProgress();
  updateXPBreakdown();
}

function updateStopwatch() {
  const hrs = String(Math.floor(todaySeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((todaySeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(todaySeconds % 60).padStart(2, '0');
  document.getElementById('stopwatch').textContent = `${hrs}:${mins}:${secs}`;
  localStorage.setItem(todayKey, todaySeconds);
  updateDailyReport();
}

function updateXP() {
  xp++;
  level = Math.floor(Math.sqrt(xp / 10)) + 1;
  localStorage.setItem(xpKey, xp);
  localStorage.setItem(levelKey, level);
  updateXPDisplay();
  updateXPBreakdown();
}

function updateXPDisplay() {
  document.getElementById('xp').textContent = 'XP = ' + xp;
  document.getElementById('level').textContent = 'Level = ' + level;
}

function setGoal() {
  let input = parseInt(document.getElementById('goalInput').value);
  if (input >= 8) {
    goalHours = input;
    goalSeconds = goalHours * 3600;
    localStorage.setItem(goalKey, goalHours);
  } else {
    document.getElementById('goalInput').value = 8;
  }
}

function updateGoalProgress() {
  const percent = Math.min(100, (todaySeconds / goalSeconds) * 100);
  document.getElementById('goalProgress').style.width = percent + '%';
  document.getElementById('goalStatus').textContent = `Progress: ${formatTime(todaySeconds)} / ${goalHours}h`;
  if (todaySeconds >= goalSeconds) {
    alert('You did it! Exam Goal Completed!');
  }
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

function loadStoredData() {
  todaySeconds = parseInt(localStorage.getItem(todayKey)) || 0;
  xp = parseInt(localStorage.getItem(xpKey)) || 0;
  level = parseInt(localStorage.getItem(levelKey)) || 1;
  goalHours = parseInt(localStorage.getItem(goalKey)) || 8;
  goalSeconds = goalHours * 3600;
  document.getElementById('goalInput').value = goalHours;
  updateStopwatch();
  updateXPDisplay();
  updateGoalProgress();
  updateDailyReport();
  updateXPBreakdown();
}

function updateDailyReport() {
  const list = document.getElementById('daily-report');
  list.innerHTML = '';
  Object.keys(localStorage).forEach(key => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const time = formatTime(parseInt(localStorage.getItem(key)));
      const li = document.createElement('li');
      li.textContent = `${key}: ${time}`;
      list.appendChild(li);
    }
  });
}

function updateXPBreakdown() {
  const list = document.getElementById('xp-breakdown-list');
  list.innerHTML = '';
  list.innerHTML += `<li>${todaySeconds} seconds studied = ${xp} XP</li>`;
}
