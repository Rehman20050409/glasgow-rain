// Is it raining in Glasgow? The sums behind the page.
// No DOM and no network in here, so the same file runs in the browser and in Node for the tests.
'use strict';

const WET_DAY_MM = 1; // the Met Office calls a day "wet" at 1 mm of rain or more

// Weather codes are the WMO standard that the weather feed uses.
const WEATHER = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Violent showers', 85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
};
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

// current: { precipitation (mm in the last 15 minutes), weather_code, temperature_2m }
function rightNow(current) {
  const code = current.weather_code;
  // snow is not rain, even though it counts as precipitation
  const snowing = [71, 73, 75, 77, 85, 86].includes(code);
  return {
    raining: RAIN_CODES.has(code) || (current.precipitation > 0 && !snowing),
    sky: Object.hasOwn(WEATHER, code) ? WEATHER[code] : 'Unknown weather',
    temperature: Math.round(current.temperature_2m),
  };
}

// The year's record lags a few days behind, so the last fortnight comes from a second, fresher
// list. Where both have a day, the fresher one wins. Days with no reading yet are dropped.
function mergeDays(year, recent) {
  const byDate = new Map();
  for (const list of [year, recent]) {
    list.time.forEach((date, i) => {
      const mm = list.precipitation_sum[i];
      if (typeof mm === 'number') byDate.set(date, mm);
    });
  }
  return [...byDate].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, mm]) => ({ date, mm }));
}

// The longest unbroken run of days that pass `test`: { days, from, to }, or null if there is none.
function longestRun(days, test) {
  let best = null, start = -1;
  days.forEach((day, i) => {
    if (!test(day)) {
      start = -1;
      return;
    }
    if (start < 0) start = i;
    if (!best || i - start + 1 > best.days) best = { days: i - start + 1, from: days[start].date, to: day.date };
  });
  return best;
}

// days: [{ date: "2026-01-31", mm }], oldest first, at least one day.
function yearStats(days) {
  const wet = (day) => day.mm >= WET_DAY_MM;
  const last = days[days.length - 1];
  let streak = 0; // how many days in a row, ending today, match today
  for (let i = days.length - 1; i >= 0 && wet(days[i]) === wet(last); i--) streak++;

  const wetDays = days.filter(wet).length;
  return {
    days: days.length,
    wetDays,
    wetShare: Math.round(wetDays / days.length * 100),
    totalMm: Math.round(days.reduce((sum, day) => sum + day.mm, 0)),
    wettest: days.reduce((a, b) => (b.mm > a.mm ? b : a)),
    longestDry: longestRun(days, (day) => !wet(day)),
    longestWet: longestRun(days, wet),
    current: { wet: wet(last), days: streak },
  };
}

if (typeof module !== 'undefined') module.exports = { rightNow, mergeDays, yearStats, WET_DAY_MM };
