const DEFAULTS = Object.freeze({
  WORK_TIME: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 20 * 60,
  CYCLES: 4,
  STEP: 300
});

const SESSIONS = Object.freeze({
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
});

const LABELS = Object.freeze({
  BREAK: 'Отдых',
  TITLE_SUFFIX: ' - Таймер'
});

class Pomodoro {
  constructor() {
    this.el = {
      timeDisplay: document.querySelector('.timer__display'),
      playBtn: document.querySelector('.controls__btn'),
      skipBtn: document.getElementById('skip-btn'),
      playIcon: document.querySelector('.controls__play'),
      pauseIcon: document.querySelector('.controls__pause'),
      waves: [
        document.querySelector('.controls__wave--first'),
        document.querySelector('.controls__wave--second')
      ],
      breakText: document.querySelector('.timer__status'),
      notificationSound: document.getElementById('notification-sound'),
      modalSettings: document.getElementById('modalSettings'),
      settingsBtn: document.getElementById('settings-btn'),
      modalInfo: document.getElementById('modalInfo'),
      infoBtn: document.getElementById('info-btn'),
      overlay: document.getElementById('overlay'),
      closeModalTwo: document.getElementById('close-modal-two'),
      closeModalBtn: document.getElementById('close-modal-btn'),
      themeBtn: document.getElementById('theme-btn')
    };

    this.defaults = {
      workTime: DEFAULTS.WORK_TIME,
      shortBreak: DEFAULTS.SHORT_BREAK,
      longBreak: DEFAULTS.LONG_BREAK,
      cycles: DEFAULTS.CYCLES
    };

    this.state = {
      isRunning: false,
      timerId: null,
      currentSession: SESSIONS.WORK,
      pomodoroCount: 0,
      workTime: this.loadNumber('workTime', this.defaults.workTime),
      shortBreak: this.loadNumber('shortBreak', this.defaults.shortBreak),
      longBreak: this.loadNumber('longBreak', this.defaults.longBreak),
      cycles: this.loadNumber('cycles', this.defaults.cycles),
      timeLeft: null
    };

    this.state.timeLeft = this.state.workTime;
    this.init();
  }

  loadNumber(key, fallback) {
    const v = localStorage.getItem(key);
    return v ? parseInt(v, 10) : fallback;
  }

  saveNumber(key, value) {
    localStorage.setItem(key, String(value));
  }

  init() {
    this.updateDisplay(this.state.timeLeft);
    this.bindControls();
    this.setupTheme();
  }

  bindControls() {
    if (this.el.playBtn) this.el.playBtn.addEventListener('click', () => this.toggleTimer());
    if (this.el.skipBtn) this.el.skipBtn.addEventListener('click', () => this.skipSession());

    document.querySelectorAll('.settings__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const isIncrease = btn.classList.contains('increase');
        this.adjustTime(type, isIncrease);
      });
    });

    if (this.el.infoBtn) this.el.infoBtn.addEventListener('click', () => this.openModal(this.el.modalInfo));
    if (this.el.settingsBtn) this.el.settingsBtn.addEventListener('click', () => { this.updateModalSettings(); this.openModal(this.el.modalSettings); });
    if (this.el.closeModalTwo) this.el.closeModalTwo.addEventListener('click', () => this.closeModal(this.el.modalSettings));
    if (this.el.closeModalBtn) this.el.closeModalBtn.addEventListener('click', () => this.closeModal(this.el.modalInfo));
    if (this.el.overlay) this.el.overlay.addEventListener('click', () => { this.closeModal(this.el.modalInfo); this.closeModal(this.el.modalSettings); });

    [this.el.modalInfo, this.el.modalSettings].forEach(m => {
      if (m) m.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  setupTheme() {
    const btn = this.el.themeBtn;
    const root = document.documentElement;
    const body = document.body;
    const saved = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', saved);
    if (saved === 'dark') body.classList.add('dark-theme');
    if (btn) btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      body.classList.toggle('dark-theme', next === 'dark');
    });
  }

  openModal(modal) {
    if (!modal || !this.el.overlay) return;
    modal.classList.remove('hidden', 'modal-hidden');
    this.el.overlay.classList.remove('hidden', 'overlay-hidden');
  }

  closeModal(modal) {
    if (!modal || !this.el.overlay) return;
    modal.classList.add('modal-hidden');
    this.el.overlay.classList.add('overlay-hidden');
    setTimeout(() => {
      modal.classList.add('hidden');
      this.el.overlay.classList.add('hidden');
    }, 500);
  }

  updateModalSettings() {
    const w = Math.floor(this.state.workTime / 60);
    const s = Math.floor(this.state.shortBreak / 60);
    const l = Math.floor(this.state.longBreak / 60);
    const c = this.state.cycles;
    const el = (id) => document.getElementById(id);
    if (el('workTime')) el('workTime').textContent = w;
    if (el('shortBreak')) el('shortBreak').textContent = s;
    if (el('longBreak')) el('longBreak').textContent = l;
    if (el('cycles')) el('cycles').textContent = c;
  }

  adjustTime(type, increase) {
    const step = DEFAULTS.STEP;
    switch (type) {
      case 'workTime':
        this.state.workTime = increase ? this.state.workTime + step : Math.max(this.state.workTime - step, this.defaults.workTime);
        this.saveNumber('workTime', this.state.workTime);
        if (!this.state.isRunning) this.state.timeLeft = this.state.workTime;
        break;
      case 'shortBreak':
        this.state.shortBreak = increase ? this.state.shortBreak + step : Math.max(this.state.shortBreak - step, this.defaults.shortBreak);
        this.saveNumber('shortBreak', this.state.shortBreak);
        break;
      case 'longBreak':
        this.state.longBreak = increase ? this.state.longBreak + step : Math.max(this.state.longBreak - step, 15 * 60);
        this.saveNumber('longBreak', this.state.longBreak);
        break;
      case 'cycles':
        this.state.cycles = increase ? this.state.cycles + 1 : Math.max(this.state.cycles - 1, 2);
        this.saveNumber('cycles', this.state.cycles);
        break;
    }
    this.updateModalSettings();
    this.updateDisplay(this.state.timeLeft);
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  updateDisplay(seconds) {
    const t = this.formatTime(seconds);
    if (this.el.timeDisplay) this.el.timeDisplay.textContent = t;
    document.title =`${t}${LABELS.TITLE_SUFFIX}`;
  }

  toggleUI() {
    if (!this.el.playBtn) return;
    this.el.pauseIcon.classList.toggle('visibility');
    this.el.playIcon.classList.toggle('visibility');
    this.el.playBtn.classList.toggle('shadow');
    this.el.waves.forEach(w => w && w.classList.toggle('paused'));
  }

  startTimer(duration) {
    this.clearTimer();
    let time = duration;
    this.updateDisplay(time);
    this.state.timerId = setInterval(() => {
      if (time <= 0) {
        this.clearTimer();
        this.handleSessionEnd();
      } else {
        time--;
        this.state.timeLeft = time;
        this.updateDisplay(time);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.state.timerId) {
      clearInterval(this.state.timerId);
      this.state.timerId = null;
    }
  }

  playNotification() {
    const s = this.el.notificationSound;
    if (s && typeof s.play === 'function') s.play();
  }

  showBreakText() {
    if (!this.el.breakText) return;
    if (this.state.currentSession === SESSIONS.SHORT_BREAK || this.state.currentSession === SESSIONS.LONG_BREAK) {
      this.el.breakText.textContent = LABELS.BREAK;
      this.el.breakText.style.display = 'block';
      requestAnimationFrame(() => this.el.breakText.classList.add('show'));
    }
  }

  hideBreakText() {
    if (!this.el.breakText) return;
    this.el.breakText.classList.remove('show');
    setTimeout(() => { this.el.breakText.style.display = 'none'; }, 360);
  }

  handleSessionEnd() {
    this.playNotification();
    if (this.state.currentSession === SESSIONS.WORK) {
      this.state.pomodoroCount++;
      if (this.state.pomodoroCount % this.state.cycles === 0) {
        this.state.currentSession = SESSIONS.LONG_BREAK;
        this.state.timeLeft = this.state.longBreak;
      } else {
        this.state.currentSession = SESSIONS.SHORT_BREAK;
        this.state.timeLeft = this.state.shortBreak;
      }
      this.showBreakText();
    } else {
      this.state.currentSession = SESSIONS.WORK;
      this.state.timeLeft = this.state.workTime;
      this.hideBreakText();
    }
    this.startTimer(this.state.timeLeft);
  }

  toggleTimer() {
    if (!this.state.isRunning) {
      this.startTimer(this.state.timeLeft);
      this.toggleUI();
      this.state.isRunning = true;
    } else {
      this.clearTimer();
      this.toggleUI();
      this.state.isRunning = false;
    }
  }

  skipSession() {
    this.clearTimer();
    this.handleSessionEnd();
    if (!this.state.isRunning) {
      this.toggleUI();
      this.state.isRunning = true;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Pomodoro();
});
