// app.js

/* --------------------------------------------------
   GLOBALS / DOM GETTERS
----------------------------------------------------*/
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".page-section");

// ALARM SELECTORS
const alarmTimeInput = document.getElementById("alarmTime");
const alarmDurationInput = document.getElementById("alarmDuration");
const daysCheckboxes = document.querySelectorAll("#daysCheckboxes input[type='checkbox']");
const soundFileInput = document.getElementById("soundFile");
const setAlarmBtn = document.getElementById("setAlarmBtn");
const alarmsTableBody = document.getElementById("alarmsTbody");

// TIMER SELECTORS
const timerMinutesInput = document.getElementById("timerMinutes");
const timerSecondsInput = document.getElementById("timerSeconds");
const startTimerBtn = document.getElementById("startTimerBtn");
const stopTimerBtn = document.getElementById("stopTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const timerDisplay = document.getElementById("timerDisplay");

// STOPWATCH SELECTORS
const stopwatchDisplay = document.getElementById("stopwatchDisplay");
const startStopwatchBtn = document.getElementById("startStopwatchBtn");
const stopStopwatchBtn = document.getElementById("stopStopwatchBtn");
const resetStopwatchBtn = document.getElementById("resetStopwatchBtn");

// WORLD CLOCK SELECTORS
const timeZoneSelect = document.getElementById("timeZoneSelect");
const worldClockDisplay = document.getElementById("worldClockDisplay");

// AUDIO
const alarmAudio = document.getElementById("alarmAudio");

/* --------------------------------------------------
   NAVIGATION LOGIC
----------------------------------------------------*/
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    sections.forEach(sec => {
      sec.classList.remove("active");
      if (sec.matches(target)) {
        sec.classList.add("active");
      }
    });
  });
});

/* --------------------------------------------------
   ALARM CLOCK LOGIC
----------------------------------------------------*/
let alarms = []; // In-memory array of alarms

window.addEventListener("load", () => {
  loadAlarmsFromStorage();
  renderAlarms();

  // Start the repeated check for alarm triggers
  startAlarmCheckLoop();

  // Request Notification permission if needed
  if (Notification && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Start separate intervals for Timer, Stopwatch, and World Clock updates
  updateWorldClock();
  setInterval(updateWorldClock, 1000);
});

setAlarmBtn.addEventListener("click", createAlarm);

function createAlarm() {
  const timeVal = alarmTimeInput.value; // e.g., "07:30"
  if (!timeVal) {
    alert("Please select a valid time");
    return;
  }

  const ringDuration = parseInt(alarmDurationInput.value, 10) || 30;
  // Collect selected days
  const selectedDays = [];
  daysCheckboxes.forEach((cb) => {
    if (cb.checked) {
      selectedDays.push(parseInt(cb.value, 10));
    }
  });
  if (selectedDays.length === 0) {
    alert("Please select at least one day.");
    return;
  }

  // Handle custom sound
  let customSoundDataUrl = "";
  const file = soundFileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      customSoundDataUrl = evt.target.result;
      saveAlarm(timeVal, ringDuration, selectedDays, customSoundDataUrl);
    };
    reader.readAsDataURL(file);
  } else {
    // No custom file
    saveAlarm(timeVal, ringDuration, selectedDays, "");
  }
}

function saveAlarm(timeVal, duration, days, soundDataUrl) {
  // Store a lastTriggerDate to prevent multiple triggers the same day
  const alarmObj = {
    id: Date.now(),
    time: timeVal,           // "HH:MM" (24hr format)
    duration: duration,
    days: days,
    customSound: soundDataUrl,
    lastTriggerDate: null    // e.g. "YYYY-MM-DD" when triggered
  };

  alarms.push(alarmObj);
  updateLocalStorage();
  renderAlarms();
  clearAlarmForm();
}

function renderAlarms() {
  alarmsTableBody.innerHTML = "";
  alarms.forEach(alarm => {
    const row = document.createElement("tr");

    // Time
    const timeTd = document.createElement("td");
    timeTd.textContent = alarm.time;
    row.appendChild(timeTd);

    // Days
    const daysTd = document.createElement("td");
    daysTd.textContent = alarm.days.join(", ");
    row.appendChild(daysTd);

    // Duration
    const durationTd = document.createElement("td");
    durationTd.textContent = alarm.duration + "s";
    row.appendChild(durationTd);

    // Sound
    const soundTd = document.createElement("td");
    soundTd.textContent = alarm.customSound ? "Custom" : "Default";
    row.appendChild(soundTd);

    // Delete
    const deleteTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      deleteAlarm(alarm.id);
    });
    deleteTd.appendChild(delBtn);
    row.appendChild(deleteTd);

    alarmsTableBody.appendChild(row);
  });
}

function deleteAlarm(id) {
  alarms = alarms.filter(a => a.id !== id);
  updateLocalStorage();
  renderAlarms();
}

function clearAlarmForm() {
  alarmTimeInput.value = "";
  alarmDurationInput.value = "30";
  daysCheckboxes.forEach(cb => cb.checked = false);
  soundFileInput.value = "";
}

function loadAlarmsFromStorage() {
  const stored = localStorage.getItem("pwaAlarms");
  if (stored) {
    alarms = JSON.parse(stored);
  }
}

function updateLocalStorage() {
  localStorage.setItem("pwaAlarms", JSON.stringify(alarms));
}

// Alarm Checking
function startAlarmCheckLoop() {
  setInterval(() => {
    const now = new Date();
    const currentDayIndex = now.getDay();     // 0=Sun, 1=Mon, ... 6=Sat
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const currentDateString = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    alarms.forEach(alarm => {
      if (alarm.days.includes(currentDayIndex)) {
        if (alarm.time === currentTime) {
          // Check if we already triggered today
          if (alarm.lastTriggerDate === currentDateString) {
            return; // skip if triggered already
          }
          ringAlarm(alarm);
          // Mark triggered
          alarm.lastTriggerDate = currentDateString;
          updateLocalStorage();
        }
      }
    });
  }, 1000);
}

let alarmTimeoutId = null;
function ringAlarm(alarm) {
  // Stop any existing alarm
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }

  // Set audio source (if user gave customSound, use it; else default to alarm1.mp3)
  if (alarm.customSound) {
    alarmAudio.src = alarm.customSound;
  } else {
    alarmAudio.src = "audio/alarm1.mp3"; // your default alarm sound
  }

  // Play alarm
  alarmAudio.play().catch(err => console.log("Audio play error:", err));

  // Stop after alarm.duration seconds
  alarmTimeoutId = setTimeout(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmTimeoutId = null;
  }, alarm.duration * 1000);

  // Show Notification if possible
  if (Notification.permission === "granted") {
    new Notification("Alarm!", {
      body: `Time: ${alarm.time}`
      // icon: "icons/clock1.png" // optional icon
    });
  }

  // Vibration if supported
  if (navigator.vibrate) {
    navigator.vibrate(alarm.duration * 1000);
  }
}

/* --------------------------------------------------
   COUNTDOWN TIMER LOGIC
----------------------------------------------------*/
let timerInterval = null;
let timerRemainingSeconds = 0;

startTimerBtn.addEventListener("click", () => {
  const minutes = parseInt(timerMinutesInput.value, 10) || 0;
  const seconds = parseInt(timerSecondsInput.value, 10) || 0;
  timerRemainingSeconds = minutes * 60 + seconds;

  if (timerRemainingSeconds <= 0) {
    alert("Please enter a valid time > 0");
    return;
  }

  startTimer();
});

stopTimerBtn.addEventListener("click", () => {
  stopTimer();
});

resetTimerBtn.addEventListener("click", () => {
  resetTimer();
});

function startTimer() {
  stopTimer(); // in case it's running
  updateTimerDisplay(timerRemainingSeconds);

  timerInterval = setInterval(() => {
    timerRemainingSeconds--;
    if (timerRemainingSeconds <= 0) {
      stopTimer();
      timerEnd();
    } else {
      updateTimerDisplay(timerRemainingSeconds);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  timerMinutesInput.value = "0";
  timerSecondsInput.value = "30";
  timerDisplay.textContent = "00:30";
  timerRemainingSeconds = 0;
}

function updateTimerDisplay(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  timerDisplay.textContent = `${mm}:${ss}`;
}

function timerEnd() {
  // Play a short beep
  alarmAudio.src = "audio/alarm1.mp3"; // or another beep
  alarmAudio.currentTime = 0;
  alarmAudio.play().catch(err => console.log(err));

  setTimeout(() => {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }, 5000); // beep for 5 seconds

  // Optional Notification
  if (Notification.permission === "granted") {
    new Notification("Timer Done!", {
      body: "Countdown finished"
    });
  }

  // Optional Vibration
  if (navigator.vibrate) {
    navigator.vibrate(3000); // vibrate for 3s
  }
}

/* --------------------------------------------------
   STOPWATCH LOGIC
----------------------------------------------------*/
let stopwatchInterval = null;
let stopwatchElapsedSeconds = 0; // store total elapsed time

startStopwatchBtn.addEventListener("click", startStopwatch);
stopStopwatchBtn.addEventListener("click", stopStopwatch);
resetStopwatchBtn.addEventListener("click", resetStopwatch);

function startStopwatch() {
  if (stopwatchInterval) return; // already running

  stopwatchInterval = setInterval(() => {
    stopwatchElapsedSeconds++;
    updateStopwatchDisplay();
  }, 1000);
}

function stopStopwatch() {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
}

function resetStopwatch() {
  stopStopwatch();
  stopwatchElapsedSeconds = 0;
  updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
  const hours = Math.floor(stopwatchElapsedSeconds / 3600);
  const mins = Math.floor((stopwatchElapsedSeconds % 3600) / 60);
  const secs = stopwatchElapsedSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  stopwatchDisplay.textContent = `${hh}:${mm}:${ss}`;
}

/* --------------------------------------------------
   WORLD CLOCK LOGIC
----------------------------------------------------*/
timeZoneSelect.addEventListener("change", updateWorldClock);

function updateWorldClock() {
  const tz = timeZoneSelect.value;
  try {
    const now = new Date();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    };
    const formatter = new Intl.DateTimeFormat([], options);
    const formatted = formatter.format(now);
    worldClockDisplay.textContent = formatted;
  } catch (err) {
    console.warn("TimeZone formatting not supported, fallback to UTC.");
    worldClockDisplay.textContent = new Date().toUTCString();
  }
}
