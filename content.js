// content.js — Loop by Rohan
// Floating pill injected into LinkedIn, X, Instagram

const COOLDOWN_MS = 90 * 1000; // 90 seconds
const RING_CIRCUMFERENCE = 2 * Math.PI * 9; // radius 9

const PLATFORMS = {
  linkedin:  { label: 'LinkedIn', short: 'LI',  color: '#7EB8C9' },
  x:         { label: 'X',        short: 'X',   color: '#7EB8C9' },
  instagram: { label: 'IG',       short: 'IG',  color: '#7EB8C9' },
};

function detectCurrentSite() {
  const host = window.location.hostname;
  if (host.includes('linkedin.com'))  return 'linkedin';
  if (host.includes('twitter.com') || host.includes('x.com')) return 'x';
  if (host.includes('instagram.com')) return 'instagram';
  return null;
}

let state = {};
let cooldownInterval = null;

// ── BUILD THE PILL HTML ──────────────────────────────────────────────
function buildPill() {
  const container = document.createElement('div');
  container.id = 'loop-pill-container';

  container.innerHTML = `
    <!-- Restore dot (collapsed state) -->
    <div id="loop-restore-dot" title="Show Loop">
      <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
    </div>

    <!-- Main pill -->
    <div id="loop-pill">

      <!-- Header -->
      <div id="loop-header">
        <div id="loop-brand">Loop <span>by Rohan</span></div>
        <button id="loop-hide-btn" title="Hide pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Platform tabs -->
      <div id="loop-platforms">
        <button class="loop-platform-btn" data-platform="linkedin">LinkedIn</button>
        <button class="loop-platform-btn" data-platform="x">X</button>
        <button class="loop-platform-btn" data-platform="instagram">IG</button>
      </div>

      <!-- Progress bar -->
      <div id="loop-progress-wrap">
        <div id="loop-progress-label">
          <span>Today</span>
          <span><strong id="loop-count-num">0</strong> / <span id="loop-goal-num">10</span></span>
        </div>
        <div id="loop-progress-track">
          <div id="loop-progress-fill" style="width: 0%"></div>
        </div>
      </div>

      <!-- Session toggle -->
      <div id="loop-session-row">
        <span id="loop-session-label">Session off</span>
        <button id="loop-session-toggle" title="Toggle session"></button>
      </div>

      <!-- Comment button -->
      <div id="loop-comment-btn-wrap">
        <button id="loop-comment-btn" disabled class="session-off">
          <span id="loop-btn-text">Start session first</span>
        </button>
        <div id="loop-cooldown-ring">
          <svg viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="9" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="0"/>
            <circle class="ring-progress" cx="11" cy="11" r="9"
              stroke-dasharray="${RING_CIRCUMFERENCE}"
              stroke-dashoffset="${RING_CIRCUMFERENCE}"/>
          </svg>
        </div>
      </div>

      <!-- Goal met badge -->
      <div id="loop-goal-badge">🎉 Daily goal smashed!</div>

      <!-- Footer streak -->
      <div id="loop-footer">
        <span id="loop-streak-fire">🔥</span>
        <span id="loop-streak-count">0</span>
        <span>day streak</span>
      </div>

    </div>
  `;

  return container;
}

// ── RENDER STATE INTO DOM ────────────────────────────────────────────
function renderPill() {
  const platform   = state.currentPlatform || 'linkedin';
  const daily      = (state.dailyCounts || {})[platform] || 0;
  const goal       = state.dailyGoal || 10;
  const session    = state.sessionActive || false;
  const streak     = state.currentStreak || 0;
  const lastTime   = state.lastCommentTime || 0;
  const hidden     = state.pillHidden || false;
  const now        = Date.now();
  const inCooldown = (now - lastTime) < COOLDOWN_MS;

  // Hidden state
  const container = document.getElementById('loop-pill-container');
  if (!container) return;
  container.classList.toggle('collapsed', hidden);

  // Platform tabs
  document.querySelectorAll('.loop-platform-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === platform);
  });

  // Count + progress
  document.getElementById('loop-count-num').textContent = daily;
  document.getElementById('loop-goal-num').textContent  = goal;
  const pct = Math.min((daily / goal) * 100, 100);
  const fill = document.getElementById('loop-progress-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('goal-met', daily >= goal);

  // Session toggle
  const toggleBtn = document.getElementById('loop-session-toggle');
  const sessionLabel = document.getElementById('loop-session-label');
  toggleBtn.classList.toggle('on', session);
  sessionLabel.textContent = session ? '● Session active' : 'Session off';
  sessionLabel.classList.toggle('active', session);

  // Comment button
  const btn     = document.getElementById('loop-comment-btn');
  const btnText = document.getElementById('loop-btn-text');

  if (!session) {
    btn.disabled = true;
    btn.classList.add('session-off');
    btnText.textContent = 'Start session first';
    stopCooldownRing();
  } else if (inCooldown) {
    btn.disabled = true;
    btn.classList.remove('session-off');
    startCooldownRing(lastTime);
  } else {
    btn.disabled = false;
    btn.classList.remove('session-off');
    btnText.textContent = '✓ Just commented';
    stopCooldownRing();
  }

  // Goal badge
  const badge = document.getElementById('loop-goal-badge');
  badge.classList.toggle('visible', daily >= goal);

  // Streak
  document.getElementById('loop-streak-count').textContent = streak;
}

// ── COOLDOWN RING ────────────────────────────────────────────────────
function startCooldownRing(lastTime) {
  const ring    = document.getElementById('loop-cooldown-ring');
  const btnText = document.getElementById('loop-btn-text');
  ring.classList.add('visible');

  if (cooldownInterval) clearInterval(cooldownInterval);

  cooldownInterval = setInterval(() => {
    const elapsed  = Date.now() - lastTime;
    const remaining = COOLDOWN_MS - elapsed;

    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
      ring.classList.remove('visible');
      renderPill();
      return;
    }

    const secs = Math.ceil(remaining / 1000);
    btnText.textContent = `Wait ${secs}s`;

    // Update ring progress
    const progress = elapsed / COOLDOWN_MS;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    const ringEl = ring.querySelector('.ring-progress');
    if (ringEl) ringEl.style.strokeDashoffset = offset;

  }, 250);
}

function stopCooldownRing() {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
  const ring = document.getElementById('loop-cooldown-ring');
  if (ring) ring.classList.remove('visible');
}

// ── CONFETTI ─────────────────────────────────────────────────────────
function fireConfetti() {
  const colors = ['#7EB8C9', '#E8DCC8', '#A8C5A0', '#FAF7F2', '#5A9AAD'];
  const container = document.getElementById('loop-pill-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();

  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'loop-confetti';
    el.style.cssText = `
      left: ${rect.left + Math.random() * rect.width}px;
      top:  ${rect.top  - 10}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${1.2 + Math.random() * 0.6}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// ── EVENT HANDLERS ───────────────────────────────────────────────────
function attachEvents() {
  // Hide pill
  document.getElementById('loop-hide-btn').addEventListener('click', async () => {
    state.pillHidden = true;
    await chrome.storage.local.set({ pillHidden: true });
    renderPill();
  });

  // Restore dot
  document.getElementById('loop-restore-dot').addEventListener('click', async () => {
    state.pillHidden = false;
    await chrome.storage.local.set({ pillHidden: false });
    renderPill();
  });

  // Platform tabs
  document.querySelectorAll('.loop-platform-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.currentPlatform = btn.dataset.platform;
      await chrome.storage.local.set({ currentPlatform: state.currentPlatform });
      renderPill();
    });
  });

  // Session toggle
  document.getElementById('loop-session-toggle').addEventListener('click', async () => {
    state.sessionActive = !state.sessionActive;
    await chrome.storage.local.set({ sessionActive: state.sessionActive });
    renderPill();
  });

  // "Just Commented" button
  document.getElementById('loop-comment-btn').addEventListener('click', async () => {
    const now     = Date.now();
    const lastTime = state.lastCommentTime || 0;
    if (now - lastTime < COOLDOWN_MS) return; // double-guard
    if (!state.sessionActive) return;

    const platform = state.currentPlatform || 'linkedin';

    // Increment counts
    state.dailyCounts = state.dailyCounts || { linkedin: 0, x: 0, instagram: 0 };
    state.allTimeCounts = state.allTimeCounts || { linkedin: 0, x: 0, instagram: 0 };
    state.dailyCounts[platform]   = (state.dailyCounts[platform]   || 0) + 1;
    state.allTimeCounts[platform] = (state.allTimeCounts[platform] || 0) + 1;
    state.lastCommentTime = now;

    await chrome.storage.local.set({
      dailyCounts:    state.dailyCounts,
      allTimeCounts:  state.allTimeCounts,
      lastCommentTime: now,
    });

    // Check goal crossed
    const total = state.dailyCounts[platform];
    const goal  = state.dailyGoal || 10;
    if (total === goal) {
      fireConfetti();
    }

    renderPill();
  });
}

// ── INIT ─────────────────────────────────────────────────────────────
async function init() {
  // Check we're on a supported platform
  const site = detectCurrentSite();
  if (!site) return;

  // Load state
  const data = await chrome.storage.local.get(null);

  // Check if date has changed since last visit (manual reset fallback)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  if (data.todayStr && data.todayStr !== todayStr) {
    // Day has rolled over — reset daily counts
    const streakHistory = data.streakHistory || {};
    streakHistory[data.todayStr] = { ...(data.dailyCounts || {}) };

    const totalYesterday = Object.values(data.dailyCounts || {}).reduce((a, b) => a + b, 0);
    const goalMet = totalYesterday >= (data.dailyGoal || 10);
    let currentStreak = data.currentStreak || 0;
    let longestStreak = data.longestStreak || 0;
    if (goalMet) {
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    await chrome.storage.local.set({
      dailyCounts: { linkedin: 0, x: 0, instagram: 0 },
      todayStr,
      streakHistory,
      currentStreak,
      longestStreak,
      lastCommentTime: 0,
      sessionActive: false,
    });

    state = await chrome.storage.local.get(null);
  } else {
    state = data;
  }

  // Auto-select current platform if it matches
  if (site && !state.currentPlatform) {
    state.currentPlatform = state.defaultPlatform || site;
    await chrome.storage.local.set({ currentPlatform: state.currentPlatform });
  }

  // Build and inject pill
  if (document.getElementById('loop-pill-container')) return; // already injected
  const pill = buildPill();
  document.body.appendChild(pill);
  attachEvents();
  renderPill();

  // Listen for storage changes (e.g. popup changes settings)
  chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach(key => {
      state[key] = changes[key].newValue;
    });
    renderPill();
  });
}

// Wait for body to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
