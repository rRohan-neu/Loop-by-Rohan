// popup.js — Loop by Rohan

let state = {};

// ── HELPERS ──────────────────────────────────────────────────────────
function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function getDatesForCalendar(days = 70) {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    dates.push(str);
  }
  return dates;
}

function totalForDay(counts) {
  if (!counts) return 0;
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function heatLevel(count, maxCount) {
  if (!count || count === 0) return 0;
  if (maxCount <= 0) return 1;
  const ratio = count / maxCount;
  if (ratio < 0.2) return 1;
  if (ratio < 0.4) return 2;
  if (ratio < 0.6) return 3;
  if (ratio < 0.8) return 4;
  return 5;
}

// ── RENDER ───────────────────────────────────────────────────────────
function render() {
  const platform    = state.currentPlatform || 'linkedin';
  const dailyCounts = state.dailyCounts || { linkedin: 0, x: 0, instagram: 0 };
  const allTime     = state.allTimeCounts || { linkedin: 0, x: 0, instagram: 0 };
  const streak      = state.currentStreak || 0;
  const longest     = state.longestStreak || 0;
  const goal        = state.dailyGoal || 10;
  const streakHist  = state.streakHistory || {};
  const today       = getTodayStr();

  // Header streak
  document.getElementById('hdr-streak').textContent = streak;

  // Platform tabs
  document.querySelectorAll('.plat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === platform);
  });

  // Today stats
  const todayCount   = dailyCounts[platform] || 0;
  const allTimeTotal = Object.values(allTime).reduce((a, b) => a + b, 0);
  document.getElementById('today-count').textContent   = todayCount;
  document.getElementById('today-alltime').textContent = allTimeTotal;
  document.getElementById('today-longest').textContent = longest;

  // Goal progress
  document.getElementById('goal-current').textContent = todayCount;
  document.getElementById('goal-target').textContent  = goal;
  document.getElementById('goal-display').textContent = goal;
  const pct = Math.min((todayCount / goal) * 100, 100);
  const fill = document.getElementById('goal-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('met', todayCount >= goal);

  // Breakdown bars
  const totalToday = Object.values(dailyCounts).reduce((a, b) => a + b, 0) || 1;
  ['linkedin', 'x', 'instagram'].forEach(p => {
    const cnt = dailyCounts[p] || 0;
    document.getElementById(`cnt-${p}`).textContent = cnt;
    document.getElementById(`bk-${p}`).style.width = ((cnt / totalToday) * 100) + '%';
  });

  // Calendar heatmap (last 70 days = 10 cols × 7 rows)
  const dates   = getDatesForCalendar(70);
  const grid    = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Add today's current data into history lookup
  const histWithToday = { ...streakHist, [today]: dailyCounts };
  const maxCount = Math.max(...dates.map(d => totalForDay(histWithToday[d])), 1);

  dates.forEach(dateStr => {
    const cell  = document.createElement('div');
    cell.className = 'cal-day';
    const cnt   = totalForDay(histWithToday[dateStr]);
    const level = heatLevel(cnt, maxCount);
    if (level > 0) cell.classList.add(`level-${level}`);
    if (dateStr === today) cell.classList.add('today');
    cell.title = `${dateStr}: ${cnt} comment${cnt !== 1 ? 's' : ''}`;
    grid.appendChild(cell);
  });

  // Settings
  document.getElementById('default-platform-select').value = state.defaultPlatform || 'linkedin';
}

// ── EVENTS ───────────────────────────────────────────────────────────
async function attachEvents() {
  // Platform tabs
  document.querySelectorAll('.plat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.currentPlatform = btn.dataset.platform;
      await chrome.storage.local.set({ currentPlatform: state.currentPlatform });
      render();
    });
  });

  // Goal stepper
  document.getElementById('goal-minus').addEventListener('click', async () => {
    const newGoal = Math.max(1, (state.dailyGoal || 10) - 1);
    state.dailyGoal = newGoal;
    await chrome.storage.local.set({ dailyGoal: newGoal });
    render();
  });

  document.getElementById('goal-plus').addEventListener('click', async () => {
    const newGoal = Math.min(100, (state.dailyGoal || 10) + 1);
    state.dailyGoal = newGoal;
    await chrome.storage.local.set({ dailyGoal: newGoal });
    render();
  });

  // Default platform
  document.getElementById('default-platform-select').addEventListener('change', async (e) => {
    state.defaultPlatform = e.target.value;
    await chrome.storage.local.set({ defaultPlatform: e.target.value });
  });
}

// ── INIT ─────────────────────────────────────────────────────────────
async function init() {
  state = await chrome.storage.local.get(null);

  // Fallback defaults if storage is empty
  if (!state.dailyCounts)    state.dailyCounts    = { linkedin: 0, x: 0, instagram: 0 };
  if (!state.allTimeCounts)  state.allTimeCounts  = { linkedin: 0, x: 0, instagram: 0 };
  if (!state.streakHistory)  state.streakHistory  = {};
  if (!state.dailyGoal)      state.dailyGoal      = 10;
  if (!state.currentStreak)  state.currentStreak  = 0;
  if (!state.longestStreak)  state.longestStreak  = 0;
  if (!state.currentPlatform) state.currentPlatform = 'linkedin';
  if (!state.defaultPlatform) state.defaultPlatform = 'linkedin';

  render();
  attachEvents();
}

document.addEventListener('DOMContentLoaded', init);
