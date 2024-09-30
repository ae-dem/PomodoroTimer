const timeDisplay = document.querySelector('.time');
const playBtn = document.querySelector('.circle__btn');
const skipBtn = document.getElementById('skip-btn');
const play = document.querySelector('.play');
const pause = document.querySelector('.pause');
const wave1 = document.querySelector('.circle__back-1');
const wave2 = document.querySelector('.circle__back-2');
const breakText = document.querySelector('.time.text');

let isRunning = false;
let timer;
let currentSession = 'work';
let pomodoroCount = 0;

let workTime = localStorage.getItem('workTime') ? parseInt(localStorage.getItem('workTime')) : 25 * 60;
let shortBreak = localStorage.getItem('shortBreak') ? parseInt(localStorage.getItem('shortBreak')) : 5 * 60;
let longBreak = localStorage.getItem('longBreak') ? parseInt(localStorage.getItem('longBreak')) : 20 * 60;
let cycles = localStorage.getItem('cycles') ? parseInt(localStorage.getItem('cycles')) : 4;
let timeLeft = workTime;

const modal = document.getElementById('modalSettings');
const settingsBtn = document.getElementById('settings-btn');
const overlay = document.getElementById('overlay');
const closeModalTwo = document.getElementById('close-modal-two');

settingsBtn.addEventListener('click', () => {
  updateModalSettings();
  modal.classList.remove('hidden', 'modal-hidden');
  overlay.classList.remove('hidden', 'overlay-hidden');
});

closeModalTwo.addEventListener('click', () => {
  modal.classList.add('modal-hidden');
  overlay.classList.add('overlay-hidden');
  setTimeout(() => {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 500); 
});

function updateModalSettings() {
  document.getElementById('workTime').textContent = workTime / 60;
  document.getElementById('shortBreak').textContent = shortBreak / 60;
  document.getElementById('longBreak').textContent = longBreak / 60;
  document.getElementById('cycles').textContent = cycles;
}

document.querySelectorAll('.increase, .decrease').forEach(button => {
  button.addEventListener('click', function () {
    const type = this.getAttribute('data-type');
    const isIncrease = this.classList.contains('increase');
    adjustTime(type, isIncrease);
  });
});

function adjustTime(type, isIncrease) {
  let value;
  switch (type) {
    case 'workTime':
      value = isIncrease ? (workTime += 300) : (workTime = Math.max(workTime - 300, 25 * 60));
      localStorage.setItem('workTime', workTime);
      if (!isRunning) timeLeft = workTime;
      break;
    case 'shortBreak':
      value = isIncrease ? (shortBreak += 300) : (shortBreak = Math.max(shortBreak - 300, 5 * 60));
      localStorage.setItem('shortBreak', shortBreak);
      break;
    case 'longBreak':
      value = isIncrease ? (longBreak += 300) : (longBreak = Math.max(longBreak - 300, 15 * 60));
      localStorage.setItem('longBreak', longBreak);
      break;
    case 'cycles':
      value = isIncrease ? (cycles += 1) : (cycles = Math.max(cycles - 1, 2));
      localStorage.setItem('cycles', cycles); 
      break;
  }
  updateModalSettings();  
  updateTimeDisplay(timeLeft);
}

function toggleButton() {
  pause.classList.toggle('visibility');
  play.classList.toggle('visibility');
  playBtn.classList.toggle('shadow');
  wave1.classList.toggle('paused');
  wave2.classList.toggle('paused');
}

function showText() {
  if (currentSession === 'shortBreak' || currentSession === 'longBreak') {
    breakText.textContent = 'Отдых';
    breakText.style.display = 'block';
    breakText.classList.add('show');
  }
}

function hideText() {
  breakText.classList.remove('show');
}

function updateTimeDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  
  timeDisplay.textContent = timeString;
  document.title = `${timeString} - Таймер`;
}

function startTimer(duration) {
  let time = duration;
  updateTimeDisplay(time);
  timer = setInterval(() => {
    if (time <= 0) {
      clearInterval(timer);
      handleSessionEnd();
    } else {
      time--;
      timeLeft = time;
      updateTimeDisplay(time);
    }
  }, 1000);
}

const notificationSound = document.getElementById('notification-sound');

function playNotification() {
  notificationSound.play();
}

function handleSessionEnd() {
  playNotification(); 
  if (currentSession === 'work') {
    pomodoroCount++;
    if (pomodoroCount % cycles === 0) {
      currentSession = 'longBreak';
      timeLeft = longBreak;
      showText();
    } else {
      currentSession = 'shortBreak';
      timeLeft = shortBreak;
      showText();
    }
  } else {
    currentSession = 'work';
    timeLeft = workTime;
    hideText();
  }
  startTimer(timeLeft);
}

function toggleTimer() {
  if (!isRunning) {
    startTimer(timeLeft);
    toggleButton();
    isRunning = true;
  } else {
    clearInterval(timer);
    toggleButton();
    isRunning = false;
  }
}

function skipCurrentSession() {
  clearInterval(timer);
  handleSessionEnd();

  if (!isRunning) {
    toggleButton();
    isRunning = true;
  }
}

playBtn.addEventListener('click', toggleTimer);
skipBtn.addEventListener('click', skipCurrentSession);

updateTimeDisplay(timeLeft);

const closeModalBtn = document.getElementById('close-modal-btn');
const infoBtn = document.getElementById('info-btn');
const modalInfo = document.getElementById('modalInfo');

infoBtn.addEventListener('click', () => {
  modalInfo.classList.remove('hidden', 'modal-hidden');
  overlay.classList.remove('hidden', 'overlay-hidden');
});

closeModalBtn.addEventListener('click', () => {
  modalInfo.classList.add('modal-hidden');
  overlay.classList.add('overlay-hidden');
  setTimeout(() => {
    modalInfo.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 500);
});

overlay.addEventListener('click', () => {
  modal.classList.add('modal-hidden');
  modalInfo.classList.add('modal-hidden');
  overlay.classList.add('overlay-hidden');

  setTimeout(() => {
    modal.classList.add('hidden');
    modalInfo.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 500);
});