// ═══════════════════════════════════════════════════════
//  TimeKeeper — Main App Logic
// ═══════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────
let state = {
  dayStart: '06:00',
  tasks: [],          // { id, name, totalMs, spentMs, colorIndex, sessions: [{start, end}] }
  activeTaskId: null, // currently running task id
  sessionStart: null, // timestamp when current session started
  dayDate: null,      // date string when day was started (for midnight reset)
  started: false,
};

let tickInterval = null;

// ── Helpers ────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function pad(n) { return String(n).padStart(2, '0'); }
function msToHMS(ms) {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;
}
function msToHM(ms) {
  const total = Math.floor(ms / 60000);
  const h = Math.floor(total / 60), m = total % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}
function today() { return new Date().toDateString(); }

// ── Setup Screen ───────────────────────────────────────
const setupTasks = [];  // local draft tasks
let stepValue = 60;     // minutes in stepper

function initSetup() {
  renderSetupTasks();
  document.getElementById('add-task-btn').onclick = openModal;
  document.getElementById('start-btn').onclick = startDay;
  document.getElementById('nav-settings-btn').onclick = resetToSetup;
}

function renderSetupTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  let totalMin = 0;
  setupTasks.forEach((t, i) => {
    totalMin += Math.round(t.totalMs / 60000);
    const color = getColor(i);
    const div = document.createElement('div');
    div.className = 'setup-task-row';
    div.style.borderLeftColor = color.bg;
    div.innerHTML = `
      <div class="stask-dot" style="background:${color.bg}"></div>
      <span class="stask-name">${t.name}</span>
      <span class="stask-time">${msToHM(t.totalMs)}</span>
      <button class="stask-del" data-i="${i}">×</button>
    `;
    list.appendChild(div);
  });
  list.querySelectorAll('.stask-del').forEach(btn => {
    btn.onclick = () => { setupTasks.splice(+btn.dataset.i, 1); renderSetupTasks(); };
  });
  // hours summary
  const totalHours = totalMin / 60;
  document.getElementById('hours-used').textContent = msToHM(totalMin * 60000);
  const pct = Math.min(100, (totalHours / 24) * 100);
  document.getElementById('hours-bar').style.width = pct + '%';
  document.getElementById('hours-bar').style.background =
    totalHours > 24 ? '#FF6B6B' : 'linear-gradient(90deg,#4ECDC4,#A78BFA)';
}

// ── Modal ──────────────────────────────────────────────
let stepMinutes = 60;

function openModal() {
  stepMinutes = 60;
  document.getElementById('modal-task-name').value = '';
  updateStepper();
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('modal-task-name').focus();
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
function updateStepper() {
  document.getElementById('step-hours').textContent = Math.floor(stepMinutes / 60);
  document.getElementById('step-mins').textContent = stepMinutes % 60;
}

document.getElementById('step-up').onclick = () => { stepMinutes = Math.min(stepMinutes + 15, 24*60); updateStepper(); };
document.getElementById('step-down').onclick = () => { stepMinutes = Math.max(stepMinutes - 15, 15); updateStepper(); };
document.getElementById('modal-cancel').onclick = closeModal;
document.getElementById('modal-confirm').onclick = () => {
  const name = document.getElementById('modal-task-name').value.trim();
  if (!name) { document.getElementById('modal-task-name').focus(); return; }
  setupTasks.push({ id: uid(), name, totalMs: stepMinutes * 60000, spentMs: 0, sessions: [] });
  renderSetupTasks();
  closeModal();
};
document.getElementById('modal-task-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('modal-confirm').click();
});

// ── Start Day ──────────────────────────────────────────
function startDay() {
  if (setupTasks.length === 0) {
    alert('Add at least one time block to start.');
    return;
  }
  state = {
    dayStart: document.getElementById('day-start').value,
    tasks: setupTasks.map((t, i) => ({
      ...t, colorIndex: i, spentMs: 0, sessions: []
    })),
    activeTaskId: null,
    sessionStart: null,
    dayDate: today(),
    started: true,
  };
  Storage.save(state);
  showTracker();
}

// ── Tracker ────────────────────────────────────────────
function showTracker() {
  document.getElementById('setup-screen').classList.remove('active');
  document.getElementById('tracker-screen').classList.add('active');
  renderNav();
  renderBlocks();
  startTick();
}

function renderNav() {
  const navTasks = document.getElementById('nav-tasks');
  navTasks.innerHTML = '';
  state.tasks.forEach(t => {
    const color = getColor(t.colorIndex);
    const remaining = Math.max(0, t.totalMs - t.spentMs);
    const pct = Math.round((remaining / t.totalMs) * 100);
    const chip = document.createElement('div');
    chip.className = 'nav-chip' + (t.id === state.activeTaskId ? ' nav-chip-active' : '');
    chip.style.setProperty('--chip-color', color.bg);
    chip.innerHTML = `
      <span class="chip-dot" style="background:${color.bg}"></span>
      <span class="chip-name">${t.name}</span>
      <span class="chip-pct">${pct}%</span>
    `;
    chip.onclick = () => toggleTask(t.id);
    navTasks.appendChild(chip);
  });
}

function renderBlocks() {
  const container = document.getElementById('blocks-container');
  container.innerHTML = '';
  const totalMs = state.tasks.reduce((s, t) => s + t.totalMs, 0);

  state.tasks.forEach(t => {
    const color = getColor(t.colorIndex);
    const spentNow = t.id === state.activeTaskId && state.sessionStart
      ? t.spentMs + (Date.now() - state.sessionStart)
      : t.spentMs;
    const remaining = Math.max(0, t.totalMs - spentNow);
    const pct = remaining / t.totalMs; // 1 = full, 0 = empty
    const heightPct = (t.totalMs / totalMs) * 100;

    const block = document.createElement('div');
    block.className = 'time-block' + (t.id === state.activeTaskId ? ' block-active' : '');
    block.id = 'block-' + t.id;
    block.style.setProperty('--block-color', color.bg);
    block.style.setProperty('--block-glow', color.glow);
    block.style.setProperty('--text-color', color.text);
    block.style.height = heightPct + '%';
    block.style.minHeight = '60px';

    const bgColor = getFadedColor(color.bg, pct);
    block.style.background = bgColor;

    // Fill overlay showing remaining
    const fillPct = pct * 100;

    block.innerHTML = `
      <div class="block-fill" style="width:${fillPct}%; background:${color.bg};"></div>
      <div class="block-content">
        <div class="block-left">
          <div class="block-name" style="color:${color.text}">${t.name}</div>
          <div class="block-remaining" style="color:${color.text}">${msToHM(remaining)} left</div>
        </div>
        <div class="block-right">
          <div class="block-pct" style="color:${color.text}">${Math.round(fillPct)}%</div>
          <button class="block-toggle" data-id="${t.id}" style="border-color:${color.bg};color:${color.bg}">
            ${t.id === state.activeTaskId ? '⏸' : '▶'}
          </button>
        </div>
      </div>
      ${remaining === 0 ? '<div class="block-exhausted">EXHAUSTED</div>' : ''}
    `;
    block.querySelector('.block-toggle').onclick = (e) => {
      e.stopPropagation();
      toggleTask(t.id);
    };
    block.onclick = () => toggleTask(t.id);
    container.appendChild(block);
  });
}

function toggleTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const now = Date.now();

  // Stop current if any
  if (state.activeTaskId) {
    const active = state.tasks.find(t => t.id === state.activeTaskId);
    if (active && state.sessionStart) {
      const elapsed = now - state.sessionStart;
      active.spentMs += elapsed;
      active.sessions.push({ start: state.sessionStart, end: now });
      // Check if exhausted
      if (active.spentMs >= active.totalMs) {
        active.spentMs = active.totalMs;
        if (active.id !== taskId) showWarning(active.name, 'exhausted');
      }
    }
    state.activeTaskId = null;
    state.sessionStart = null;
  }

  // If clicking a different (or same) task to start
  if (task.id !== (state.activeTaskId) && taskId !== state.activeTaskId) {
    if (task.spentMs >= task.totalMs) {
      showWarning(task.name, 'already_exhausted');
    } else {
      state.activeTaskId = task.id;
      state.sessionStart = now;
    }
  }

  Storage.save(state);
  renderNav();
  renderBlocks();
  updateTicker();
}

// ── Ticker ─────────────────────────────────────────────
function startTick() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(tick, 1000);
}

function tick() {
  if (!state.activeTaskId || !state.sessionStart) return;
  const task = state.tasks.find(t => t.id === state.activeTaskId);
  if (!task) return;

  const elapsed = Date.now() - state.sessionStart;
  const totalSpent = task.spentMs + elapsed;

  // Exhaustion check
  if (totalSpent >= task.totalMs) {
    // Auto-stop
    task.spentMs = task.totalMs;
    task.sessions.push({ start: state.sessionStart, end: Date.now() });
    state.activeTaskId = null;
    state.sessionStart = null;
    Storage.save(state);
    renderNav();
    renderBlocks();
    updateTicker();
    showWarning(task.name, 'just_exhausted');
    return;
  }

  updateTicker();
  updateBlockLive(task, elapsed);
}

function updateTicker() {
  const ticker = document.getElementById('running-ticker');
  if (!state.activeTaskId) {
    ticker.style.display = 'none';
    return;
  }
  const task = state.tasks.find(t => t.id === state.activeTaskId);
  if (!task) { ticker.style.display = 'none'; return; }
  const elapsed = state.sessionStart ? Date.now() - state.sessionStart : 0;
  ticker.style.display = 'flex';
  document.getElementById('ticker-label').textContent = task.name;
  document.getElementById('ticker-elapsed').textContent = msToHMS(elapsed);
  const color = getColor(task.colorIndex);
  ticker.style.setProperty('--ticker-color', color.bg);
}

function updateBlockLive(task, elapsed) {
  const block = document.getElementById('block-' + task.id);
  if (!block) return;
  const color = getColor(task.colorIndex);
  const totalSpent = task.spentMs + elapsed;
  const remaining = Math.max(0, task.totalMs - totalSpent);
  const pct = remaining / task.totalMs;
  const fillPct = pct * 100;
  const bgColor = getFadedColor(color.bg, pct);

  block.style.background = bgColor;
  const fill = block.querySelector('.block-fill');
  if (fill) fill.style.width = fillPct + '%';
  const rem = block.querySelector('.block-remaining');
  if (rem) rem.textContent = msToHM(remaining) + ' left';
  const pctEl = block.querySelector('.block-pct');
  if (pctEl) pctEl.textContent = Math.round(fillPct) + '%';

  // update nav chip
  const chip = document.querySelector(`.nav-chip:nth-child(${state.tasks.findIndex(t => t.id === task.id) + 1}) .chip-pct`);
  if (chip) chip.textContent = Math.round(fillPct) + '%';
}

// ── Warning ────────────────────────────────────────────
function showWarning(taskName, type) {
  const overlay = document.getElementById('warning-overlay');
  const title = document.getElementById('warning-title');
  const msg = document.getElementById('warning-msg');
  if (type === 'just_exhausted') {
    title.textContent = '⏰ Time Exhausted!';
    msg.textContent = `Your "${taskName}" block has run out. The clock has stopped.`;
  } else if (type === 'already_exhausted') {
    title.textContent = '⚠ Already Empty';
    msg.textContent = `"${taskName}" has no time remaining. Find another block.`;
  } else {
    title.textContent = '⚠ Time Used Up';
    msg.textContent = `"${taskName}" is fully spent.`;
  }
  overlay.style.display = 'flex';
  // vibrate if supported
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

document.getElementById('warning-close').onclick = () => {
  document.getElementById('warning-overlay').style.display = 'none';
};

// ── Reset ──────────────────────────────────────────────
function resetToSetup() {
  if (state.activeTaskId) {
    // stop active session first
    const task = state.tasks.find(t => t.id === state.activeTaskId);
    if (task && state.sessionStart) {
      task.spentMs += Date.now() - state.sessionStart;
      state.activeTaskId = null;
      state.sessionStart = null;
    }
  }
  if (!confirm('Reset and go back to setup? Your current session will be lost.')) return;
  clearInterval(tickInterval);
  Storage.clear();
  setupTasks.length = 0;
  state = { dayStart: '06:00', tasks: [], activeTaskId: null, sessionStart: null, dayDate: null, started: false };
  document.getElementById('tracker-screen').classList.remove('active');
  document.getElementById('setup-screen').classList.add('active');
  renderSetupTasks();
}

// ── Init ───────────────────────────────────────────────
function init() {
  initSetup();

  const saved = Storage.load();
  if (saved && saved.started) {
    // If same day, restore
    if (saved.dayDate === today()) {
      state = saved;
      // If there was an active session, it means app was closed mid-session
      // We leave it paused (don't accumulate time while app was closed)
      if (state.activeTaskId && state.sessionStart) {
        // add time from last session start to now (background time)
        const task = state.tasks.find(t => t.id === state.activeTaskId);
        if (task) {
          const bgElapsed = Date.now() - state.sessionStart;
          task.spentMs = Math.min(task.totalMs, task.spentMs + bgElapsed);
          task.sessions.push({ start: state.sessionStart, end: Date.now() });
        }
        state.activeTaskId = null;
        state.sessionStart = null;
        Storage.save(state);
      }
      // populate setupTasks for potential reset
      state.tasks.forEach(t => setupTasks.push(t));
      showTracker();
    } else {
      // New day — clear storage
      Storage.clear();
    }
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
