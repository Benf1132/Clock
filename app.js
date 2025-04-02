// DOM Elements
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".page-section");
const alarmTimeInput = document.getElementById("alarmTime");
const alarmDurationInput = document.getElementById("alarmDuration");
const daysCheckboxes = document.querySelectorAll("#daysCheckboxes input[type='checkbox']");
const soundFileInput = document.getElementById("soundFile");
const setAlarmBtn = document.getElementById("setAlarmBtn");
const soundDropdown = document.getElementById("soundDropdown");
const customFileLabel = document.getElementById("customFileLabel");
const testSoundBtn = document.getElementById("testSoundBtn");
const alarmsTbody = document.getElementById("alarmsTbody");
const alarmAudio = document.getElementById("alarmAudio");
const darkModeToggle = document.getElementById("darkModeToggle");

const timerMinutesInput = document.getElementById("timerMinutes");
const timerSecondsInput = document.getElementById("timerSeconds");
const startTimerBtn = document.getElementById("startTimerBtn");
const stopTimerBtn = document.getElementById("stopTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const timerDisplay = document.getElementById("timerDisplay");
const pieSlice = document.getElementById("pieSlice");

const stopwatchDisplay = document.getElementById("stopwatchDisplay");
const startStopwatchBtn = document.getElementById("startStopwatchBtn");
const stopStopwatchBtn = document.getElementById("stopStopwatchBtn");
const resetStopwatchBtn = document.getElementById("resetStopwatchBtn");

const timeZoneSelect = document.getElementById("timeZoneSelect");
const worldClockDisplay = document.getElementById("worldClockDisplay");

const snoozeBtn = document.getElementById("snoozeBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");
const alarmControls = document.getElementById("alarmControls");

let activeAlarm = null;
let snoozeTimeout = null;
let alarms = [];

function unlockAudio() {
  const test = document.createElement("audio");
  test.src = "audio/alarm1.mp3";
  test.play().then(() => {
    test.pause();
    test.currentTime = 0;
  }).catch(() => {});
}

// Dark Mode
function applyTheme(theme) {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}
function loadTheme() {
  const savedTheme = localStorage.getItem("clockTheme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}
darkModeToggle?.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("clockTheme", isDark ? "dark" : "light");
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
  const newTheme = e.matches ? "dark" : "light";
  applyTheme(newTheme);
  localStorage.setItem("clockTheme", newTheme);
});
loadTheme();

// Navigation
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    sections.forEach(sec => {
      sec.classList.remove("active");
      if (sec.matches(target)) sec.classList.add("active");
    });
  });
});

// Alarm Setup
setAlarmBtn?.addEventListener("click", () => {
  const timeVal = alarmTimeInput.value;
  const ringDuration = parseInt(alarmDurationInput.value) || 30;
  const selectedDays = Array.from(daysCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
  const file = soundFileInput.files[0];
  const soundVal = soundDropdown.value;

  if (!timeVal || selectedDays.length === 0) {
    alert("Please set a valid time and select at least one day.");
    return;
  }

  if (soundVal === "custom" && file) {
    const reader = new FileReader();
    reader.onload = e => saveAlarm(timeVal, ringDuration, selectedDays, e.target.result);
    reader.readAsDataURL(file);
  } else {
    saveAlarm(timeVal, ringDuration, selectedDays, soundVal);
  }
});

function saveAlarm(time, duration, days, sound) {
  const alarm = {
    id: Date.now(),
    time,
    duration,
    days,
    sound,
    lastTriggerDate: null
  };
  alarms.push(alarm);
  localStorage.setItem("alarms", JSON.stringify(alarms));
  renderAlarms();
}

function loadAlarms() {
  alarms = JSON.parse(localStorage.getItem("alarms")) || [];
  renderAlarms();
}

function renderAlarms() {
  alarmsTbody.innerHTML = "";
  alarms.forEach(alarm => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${alarm.time}</td>
      <td>${alarm.days.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}</td>
      <td>${alarm.duration}s</td>
      <td>${alarm.sound.includes("data:") ? "Custom" : alarm.sound.split("/").pop()}</td>
      <td><button onclick="deleteAlarm(${alarm.id})">🗑️</button></td>
    `;
    alarmsTbody.appendChild(row);
  });
}

window.deleteAlarm = function(id) {
  alarms = alarms.filter(a => a.id !== id);
  localStorage.setItem("alarms", JSON.stringify(alarms));
  renderAlarms();
};

function checkAlarms() {
  setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.getDay();
    const dateStr = now.toISOString().slice(0, 10);

    alarms.forEach(alarm => {
      if (
        alarm.time === currentTime &&
        alarm.days.includes(currentDay) &&
        alarm.lastTriggerDate !== dateStr
      ) {
        triggerAlarm(alarm);
        alarm.lastTriggerDate = dateStr;
        localStorage.setItem("alarms", JSON.stringify(alarms));
      }
    });
  }, 1000);
}

function triggerAlarm(alarm) {
  activeAlarm = alarm;
  alarmAudio.src = alarm.sound;
  alarmAudio.loop = true;
  alarmAudio.play().catch(() => {});
  alarmControls.style.display = "flex";

  setTimeout(() => {
    alarmAudio.loop = false;
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmControls.style.display = "none";
  }, alarm.duration * 1000);
}

// Snooze & Stop
snoozeBtn.addEventListener("click", () => {
  alarmAudio.loop = false;
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  alarmControls.style.display = "none";

  if (snoozeTimeout) clearTimeout(snoozeTimeout);
  snoozeTimeout = setTimeout(() => {
    if (activeAlarm) triggerAlarm(activeAlarm);
  }, 5 * 60 * 1000);
});

stopAlarmBtn.addEventListener("click", () => {
  alarmAudio.loop = false;
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  activeAlarm = null;
  alarmControls.style.display = "none";
  if (snoozeTimeout) clearTimeout(snoozeTimeout);
});

// Test Sound Button — 5 seconds only
let testAudioTimeout = null;
testSoundBtn.addEventListener("click", () => {
  clearTimeout(testAudioTimeout);
  alarmAudio.pause();
  alarmAudio.currentTime = 0;

  const selectedSound = soundDropdown.value;

  if (selectedSound === "custom") {
    const file = soundFileInput.files[0];
    if (!file) {
      alert("Please select a custom audio file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      alarmAudio.src = e.target.result;
      playTestAudio();
    };
    reader.readAsDataURL(file);
  } else {
    alarmAudio.src = selectedSound;
    playTestAudio();
  }
});

function playTestAudio() {
  alarmAudio.loop = true;
  alarmAudio.play().catch(console.error);
  testAudioTimeout = setTimeout(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio.loop = false;
  }, 5000);
}

// Timer with Pie-Slice Progress
let timerInterval = null;
let timerStartSeconds = 0;
let timerRemaining = 0;
let timerPaused = false;

startTimerBtn.addEventListener("click", () => {
  const min = parseInt(timerMinutesInput.value) || 0;
  const sec = parseInt(timerSecondsInput.value) || 0;
  timerStartSeconds = min * 60 + sec;
  if (timerStartSeconds <= 0) return alert("Set time > 0");

  timerRemaining = timerStartSeconds;
  updateTimerDisplay(timerRemaining);
  updatePieSlice(0);

  clearInterval(timerInterval);
  timerPaused = false;
  stopTimerBtn.textContent = "Pause";

  timerInterval = setInterval(() => {
    if (timerPaused) return;
    timerRemaining--;
    updateTimerDisplay(timerRemaining);
    updatePieSlice((timerStartSeconds - timerRemaining) / timerStartSeconds);
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerEnd();
    }
  }, 1000);
});

stopTimerBtn.addEventListener("click", () => {
  timerPaused = !timerPaused;
  stopTimerBtn.textContent = timerPaused ? "Resume" : "Pause";
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerPaused = false;
  stopTimerBtn.textContent = "Pause";
  const defMin = timerMinutesInput.value || 0;
  const defSec = timerSecondsInput.value || 30;
  timerDisplay.textContent = `${String(defMin).padStart(2, "0")}:${String(defSec).padStart(2, "0")}`;
  updatePieSlice(0);
});

function updateTimerDisplay(secs) {
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  timerDisplay.textContent = `${mm}:${ss}`;
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function updatePieSlice(progress) {
  const angle = progress * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const start = polarToCartesian(16, 16, 16, 0);
  const end = polarToCartesian(16, 16, 16, angle);
  const d = [
    "M", 16, 16,
    "L", start.x, start.y,
    "A", 16, 16, 0, largeArc, 1, end.x, end.y,
    "Z"
  ].join(" ");
  pieSlice.setAttribute("d", progress === 0 ? "" : d);
}

function timerEnd() {
  timerDisplay.textContent = "00:00";
  alarmAudio.src = "audio/alarm1.mp3";
  alarmAudio.loop = false;
  alarmAudio.play().catch(() => {});
  setTimeout(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }, 3000);
}

// Stopwatch
let stopwatchInterval = null;
let stopwatchSeconds = 0;

startStopwatchBtn.addEventListener("click", () => {
  if (stopwatchInterval) return;
  stopwatchInterval = setInterval(() => {
    stopwatchSeconds++;
    updateStopwatchDisplay();
  }, 1000);
});

stopStopwatchBtn.addEventListener("click", () => {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
});

resetStopwatchBtn.addEventListener("click", () => {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
  stopwatchSeconds = 0;
  updateStopwatchDisplay();
});

function updateStopwatchDisplay() {
  const d = Math.floor(stopwatchSeconds / 86400);
  const h = Math.floor((stopwatchSeconds % 86400) / 3600);
  const m = Math.floor((stopwatchSeconds % 3600) / 60);
  const s = stopwatchSeconds % 60;
  stopwatchDisplay.textContent = `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

// World Clock
function populateTimeZones() {
  timeZoneSelect.innerHTML = "";
  try {
    const zones = Intl.supportedValuesOf("timeZone");
    zones.forEach(tz => {
      const opt = document.createElement("option");
      opt.value = tz;
      opt.textContent = tz;
      timeZoneSelect.appendChild(opt);
    });
  } catch {
    ["UTC", "America/New_York", "Europe/London"].forEach(tz => {
      const opt = document.createElement("option");
      opt.value = tz;
      opt.textContent = tz;
      timeZoneSelect.appendChild(opt);
    });
  }
}

timeZoneSelect?.addEventListener("change", updateWorldClock);

function updateWorldClock() {
  const tz = timeZoneSelect.value;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: tz,
    hour12: false
  });
  worldClockDisplay.textContent = formatter.format(now);
}

// Init
window.addEventListener("load", () => {
  loadAlarms();
  populateTimeZones();
  checkAlarms();
});

document.body.addEventListener("click", unlockAudio, { once: true });
