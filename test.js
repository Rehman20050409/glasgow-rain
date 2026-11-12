// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const { rightNow, mergeDays, yearStats } = require('./rain.js');

test('rightNow says yes for rain and drizzle, no for dry, fog and snow', () => {
  const at = (weather_code, precipitation = 0) => rightNow({ weather_code, precipitation, temperature_2m: 8.6 });
  assert.deepEqual(at(61, 0.4), { raining: true, sky: 'Light rain', temperature: 9 });
  assert.equal(at(51).raining, true, 'drizzle counts even when the gauge reads zero');
  assert.equal(at(3, 0.2).raining, true, 'water is falling, whatever the sky code says');
  assert.equal(at(3).raining, false);
  assert.equal(at(45).raining, false);
  assert.equal(at(73, 1.2).raining, false, 'snow is not rain');
  assert.equal(at(1234).sky, 'Unknown weather');
});

test('mergeDays prefers the fresher list and drops days with no reading', () => {
  const year = { time: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'], precipitation_sum: [1, 2, 0, null] };
  const recent = { time: ['2026-01-03', '2026-01-04', '2026-01-05'], precipitation_sum: [5, 0.5, null] };
  assert.deepEqual(mergeDays(year, recent), [
    { date: '2026-01-01', mm: 1 }, { date: '2026-01-02', mm: 2 }, { date: '2026-01-03', mm: 5 }, { date: '2026-01-04', mm: 0.5 },
  ]);
});

test('yearStats counts wet days, streaks and the wettest day', () => {
  const mm = [0, 0.9, 3, 12.4, 1, 0, 0, 0.2, 0, 5, 2]; // wet means 1 mm or more
  const days = mm.map((value, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, mm: value }));
  assert.deepEqual(yearStats(days), {
    days: 11,
    wetDays: 5,
    wetShare: 45,
    totalMm: 25,
    wettest: { date: '2026-01-04', mm: 12.4 },
    longestDry: { days: 4, from: '2026-01-06', to: '2026-01-09' },
    longestWet: { days: 3, from: '2026-01-03', to: '2026-01-05' },
    current: { wet: true, days: 2 },
  });
});

test('yearStats copes with a single day and with a year that never changes', () => {
  assert.deepEqual(yearStats([{ date: '2026-01-01', mm: 0 }]).current, { wet: false, days: 1 });
  const soaked = yearStats(Array.from({ length: 30 }, (_, i) => ({ date: `d${i}`, mm: 4 })));
  assert.equal(soaked.longestDry, null);
  assert.equal(soaked.longestWet.days, 30);
  assert.deepEqual(soaked.current, { wet: true, days: 30 });
  assert.equal(soaked.wetShare, 100);
});
