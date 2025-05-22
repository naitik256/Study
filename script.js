let xp = 0;
let level = 1;
let todaySeconds = 0;
let goalHours = 8;
let goalSeconds = 28800;

const xpKey = "xp";
const levelKey = "level";
const todayKey = new Date().toISOString().slice(0, 10);
const goalKey = "goalHours";

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("reset").addEventListener("click", resetTimer);
  document.getElementById("goalInput").addEventListener("change", setGoal);
  setInterval(trackTime, 1000);
});

function trackTime() {
  todaySeconds++;
  xp++;
  level = Math.floor(Math.sqrt(xp / 10)) + 1;
  updateDisplays();
  saveData();
  checkGoalCompletion();
}

function resetTimer() {
  todaySeconds = 0;
  updateDisplays();
  saveData();
}

function updateDisplays() {
  // Timer
  const h = String(Math.floor(todaySeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((todaySeconds % 3600) / 60)).padStart(2, "0");
  const s = String(todaySeconds % 60).padStart(2, "0");
  document.getElementById("stopwatch").textContent = `${h}:${m}:${s}`;

  // XP + Level
  document.getElementById("xp").textContent = "XP: " + xp;
  document.getElementById("level").textContent = "Level: " + level;

  // Goal Progress
  const percent = Math.min(100, (todaySeconds / goalSeconds) * 100);
  document.getElementById("goalProgress").style.width = percent + "%";
  const gh = goalHours;
  const tmh = Math.floor(todaySeconds / 3600);
  const tmm = Math.floor((todaySeconds % 3600) / 60);
  document.getElementById("goalText").textContent = `${tmh}h ${tmm}m / ${gh}h`;

  // XP breakdown
  const xpBreakdown = document.getElementById("xp-breakdown-list");
  xpBreakdown.innerHTML = `<li>${todaySeconds} seconds studied = ${xp} XP</li>`;

  // Daily report
  updateDailyReport();
}

function setGoal() {
  const input = parseInt(document.getElementById("goalInput").value);
  if (input >= 8) {
    goalHours = input;
    goalSeconds = goalHours * 3600;
    localStorage.setItem(goalKey, goalHours);
  } else {
    document.getElementById("goalInput").value = 8;
  }
  updateDisplays();
}

function checkGoalCompletion() {
  if (todaySeconds === goalSeconds) {
    alert("You did it! Exam Goal Completed!");
  }
}

function saveData() {
  localStorage.setItem(todayKey, todaySeconds);
  localStorage.setItem(xpKey, xp);
  localStorage.setItem(levelKey, level);
}

function loadData() {
  todaySeconds = parseInt(localStorage.getItem(todayKey)) || 0;
  xp = parseInt(localStorage.getItem(xpKey)) || 0;
  level = parseInt(localStorage.getItem(levelKey)) || 1;
  goalHours = parseInt(localStorage.getItem(goalKey)) || 8;
  goalSeconds = goalHours * 3600;
  document.getElementById("goalInput").value = goalHours;
  updateDisplays();
}

function updateDailyReport() {
  const report = document.getElementById("daily-report");
  report.innerHTML = "";
  Object.keys(localStorage).forEach(key => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const sec = parseInt(localStorage.getItem(key));
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const li = document.createElement("li");
      li.textContent = `${key}: ${h}h ${m}m`;
      report.appendChild(li);
    }
  });
}
