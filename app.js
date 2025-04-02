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
const timerProgressCircle = document.querySelector(".progress-circle .progress");

const stopwatchDisplay = document.getElementById("stopwatchDisplay");
const startStopwatchBtn = document.getElementById("startStopwatchBtn");
const stopStopwatchBtn = document.getElementById("stopStopwatchBtn");
const resetStopwatchBtn = document.getElementById("resetStopwatchBtn");

const timeZoneSelect = document.getElementById("timeZoneSelect");
const worldClockDisplay = document.getElementById("worldClockDisplay");
const toggleHourFormat = document.getElementById("toggleHourFormat");

const snoozeBtn = document.getElementById("snoozeBtn");
const stopAlarmBtn = document.getElementById("stopAlarmBtn");
const alarmControls = document.getElementById("alarmControls");

let activeAlarm = null;
let snoozeTimeout = null;
let alarms = [];

toggleHourFormat?.addEventListener("change", () => {
  localStorage.setItem("hourFormat", toggleHourFormat.checked ? "12" : "24");
  updateWorldClock();
});

function loadHourFormatPreference() {
  const savedFormat = localStorage.getItem("hourFormat");
  if (savedFormat === "12") {
    toggleHourFormat.checked = true;
  } else {
    toggleHourFormat.checked = false;
  }
}

function unlockAudio() {
  // Attempt to play a short audio after a user gesture so mobile browsers allow future .play()
  const test = document.createElement("audio");
  test.src = "audio/alarm1.mp3";
  test.play().then(() => {
    test.pause();
    test.currentTime = 0;
  }).catch(() => {});
}

// Dark Mode Theme
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
    // If user chose custom file, read as Base64
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
    // Use backticks so the HTML actually parses correctly:
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

// Delete alarm must be globally accessible for onclick to work
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
  alarmAudio.play().catch(() => { /* handle play errors */ });

  alarmControls.style.display = "flex";

  setTimeout(() => {
    // Stop alarm automatically after 'alarm.duration' seconds
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

  // Snooze 5 minutes
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

testSoundBtn.addEventListener("click", () => {
  const file = soundFileInput.files[0];
  const soundVal = soundDropdown.value;

  // Stop any currently playing audio
  alarmAudio.pause();
  alarmAudio.currentTime = 0;

  let stopTimeout;
  let endedHandler;

  const playForFiveSeconds = (src) => {
    alarmAudio.src = src;

    endedHandler = () => {
      // If audio ends before 5 seconds, restart it
      alarmAudio.currentTime = 0;
      alarmAudio.play().catch(() => {});
    };

    alarmAudio.addEventListener("ended", endedHandler);

    alarmAudio.play().catch(() => {});

    // After 5 seconds, stop everything
    stopTimeout = setTimeout(() => {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio.removeEventListener("ended", endedHandler);
    }, 5000);
  };

  if (soundVal === "custom" && file) {
    const reader = new FileReader();
    reader.onload = e => playForFiveSeconds(e.target.result);
    reader.readAsDataURL(file);
  } else {
    playForFiveSeconds(soundVal);
  }
});

// Timer
let timerInterval;
let timerStartSeconds = 0;
let timerRemaining = 0;
let timerRunning = false;  // Are we actively counting down?
let timerPaused = false;   // Did the user pause?

startTimerBtn.addEventListener("click", () => {
  const min = parseInt(timerMinutesInput.value) || 0;
  const sec = parseInt(timerSecondsInput.value) || 0;
  timerStartSeconds = min * 60 + sec;
  if (timerStartSeconds <= 0) {
    alert("Set time > 0");
    return;
  }

  timerRemaining = timerStartSeconds;
  timerRunning = true;
  timerPaused = false;

  stopTimerBtn.textContent = "Pause";
  clearInterval(timerInterval);
  startCountdown(timerStartSeconds);
});


function startCountdown(totalSeconds) {
  let remaining = totalSeconds;
  updateTimerDisplay(remaining);
  updateProgressCircle(remaining, totalSeconds);

  timerInterval = setInterval(() => {
    if (timerPaused) return; // If paused, do nothing

    remaining--;
    timerRemaining = remaining;
    updateTimerDisplay(remaining);
    updateProgressCircle(remaining, totalSeconds);

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerEnd();
    }
  }, 1000);
}

// Toggle pause/resume
stopTimerBtn.addEventListener("click", () => {
  if (!timerRunning) return; // If the timer hasn't been started yet, do nothing

  if (!timerPaused) {
    // Pause it
    timerPaused = true;
    stopTimerBtn.textContent = "Resume";
  } else {
    // Resume
    timerPaused = false;
    stopTimerBtn.textContent = "Pause";
  }
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerPaused = false;
  stopTimerBtn.textContent = "Pause"; // Reset its label
  // Reset visuals
  const defMin = timerMinutesInput.value || 0;
  const defSec = timerSecondsInput.value || 30;
  timerDisplay.textContent = `${String(defMin).padStart(2,"0")}:${String(defSec).padStart(2,"0")}`;
  timerProgressCircle.style.strokeDashoffset = 565.48;
});

function updateTimerDisplay(secs) {
  if (secs < 0) secs = 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  timerDisplay.textContent = `${mm}:${ss}`;
}

function updateProgressCircle(current, total) {
  const ratio = (total - current) / total;
  const length = 2 * Math.PI * 90; // circumference for r=90
  timerProgressCircle.style.strokeDashoffset = length * (1 - ratio);
}

function timerEnd() {
  timerDisplay.textContent = "00:00";
  // Play short ring
  alarmAudio.src = "audio/alarm1.mp3";
  alarmAudio.loop = false;
  alarmAudio.play().catch(() => {});

  // Stop after 3 seconds
  setTimeout(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }, 3000);
}

// Stopwatch
let stopwatchInterval = null;
let stopwatchSeconds = 0;

startStopwatchBtn.addEventListener("click", () => {
  if (stopwatchInterval) return; // Already running
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
    // Fallback if Intl.supportedValuesOf not supported
    ["UTC", "America/New_York", "Europe/London"].forEach(tz => {
      const opt = document.createElement("option");
      opt.value = tz;
      opt.textContent = tz;
      timeZoneSelect.appendChild(opt);
    });
  }
}

timeZoneSelect?.addEventListener("change", updateWorldClock);

let worldClockInterval;

function updateWorldClock() {
  clearInterval(worldClockInterval);
  const tz = timeZoneSelect.value;
  const use12Hour = document.getElementById("toggleHourFormat")?.checked;

  const updateTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: tz,
      hour12: use12Hour
    });
    worldClockDisplay.textContent = formatter.format(now);
  };

  updateTime();
  worldClockInterval = setInterval(updateTime, 1000);
}

// Init
window.addEventListener("load", () => {
  loadAlarms();
  populateTimeZones();
  checkAlarms();
  loadHourFormatPreference(); 
  updateWorldClock(); 
});

// Unlock audio on first user interaction (helps iOS / mobile)
document.body.addEventListener("click", unlockAudio, { once: true });
