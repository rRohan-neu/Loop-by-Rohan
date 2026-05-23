// background.js — Loop by Rohan
// Handles midnight daily reset via Chrome alarms

chrome.runtime.onInstalled.addListener(async () => {
  // Initialize storage if first install
  const data = await chrome.storage.local.get(['initialized']);
  if (!data.initialized) {
    const today = getTodayStr();
    await chrome.storage.local.set({
      initialized: true,
      defaultPlatform: 'linkedin',
      dailyGoal: 10,
      sessionActive: false,
      pillHidden: false,
      currentPlatform: 'linkedin',
      lastCommentTime: 0,
      todayStr: today,
      dailyCounts: { linkedin: 0, x: 0, instagram: 0 },
      allTimeCounts: { linkedin: 0, x: 0, instagram: 0 },
      streakHistory: {},   // { "2024-01-15": { linkedin: 3, x: 2, instagram: 0 } }
      currentStreak: 0,
      longestStreak: 0,
    });
  }

  // Schedule midnight reset alarm
  scheduleMidnightAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'midnightReset') {
    await performDailyReset();
    scheduleMidnightAlarm(); // reschedule for next midnight
  }
});

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function scheduleMidnightAlarm() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // next midnight
  const msUntilMidnight = midnight.getTime() - now.getTime();

  chrome.alarms.create('midnightReset', {
    delayInMinutes: msUntilMidnight / 60000
  });
}

async function performDailyReset() {
  const data = await chrome.storage.local.get([
    'dailyCounts', 'streakHistory', 'todayStr', 'currentStreak', 'longestStreak', 'dailyGoal'
  ]);

  const yesterday = data.todayStr;
  const today = getTodayStr();

  // Save yesterday's counts to streak history
  const streakHistory = data.streakHistory || {};
  if (yesterday && data.dailyCounts) {
    streakHistory[yesterday] = { ...data.dailyCounts };
  }

  // Calculate streak
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
    todayStr: today,
    streakHistory,
    currentStreak,
    longestStreak,
    sessionActive: false,
    lastCommentTime: 0,
  });
}

// Listen for messages from content/popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TODAY_STR') {
    sendResponse({ todayStr: getTodayStr() });
  }
  return true;
});
