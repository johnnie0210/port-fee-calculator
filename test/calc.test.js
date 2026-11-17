const test = require('node:test');
const assert = require('node:assert');
const data = require('../public/js/data.js');
const { compute, stayDays, dayInfo } = require('../public/js/calc.js');

const run = (input, rates) =>
  compute(Object.assign({ anchCat: 'none', berthCat: 'none', manual: {} }, input),
    data.ITEMS, rates || data.defaultRates(), data.GST_RATE, data.HOLIDAYS);
const qty = (r, key) => r.lines.find(l => l.key === key).qty;
const amt = (r, key) => r.lines.find(l => l.key === key).amount;

test('excel example: 120 m cargo vessel = 21,600 / 3,240 / 24,840', () => {
  const r = run({ loa: 120, anchCat: 'cargo', berthCat: 'general',
    anchArr: '2026-11-14T09:00', anchDep: '2026-11-16T09:00',
    berthArr: '2026-11-16T09:00', berthDep: '2026-11-19T09:00' });
  assert.equal(r.anchorDays, 2);
  assert.equal(r.berthDays, 3);
  assert.equal(r.dow, 0);
  assert.equal(r.dayType, 'weekday');
  assert.equal(r.appliedRow, '3a');
  assert.equal(amt(r, 'r1'), 4800);
  assert.equal(amt(r, 'r3a'), 12000);
  assert.equal(amt(r, 'r9'), 4800);
  assert.equal(r.subtotal, 21600);
  assert.equal(r.gst, 3240);
  assert.equal(r.total, 24840);
  assert.deepEqual(r.warnings, []);
});

test('stay days round up in 24-hour units', () => {
  assert.equal(stayDays('2026-11-14T09:00', '2026-11-15T09:00'), 1);
  assert.equal(stayDays('2026-11-14T09:00', '2026-11-15T10:00'), 2);
  assert.equal(stayDays('2026-11-14T09:00', '2026-11-14T09:01'), 1);
  assert.equal(stayDays('2026-11-14T09:00', '2026-11-14T09:00'), 0);
  assert.equal(stayDays('2026-11-14T09:00', '2026-11-13T09:00'), 0);
  assert.equal(stayDays('', '2026-11-13T09:00'), 0);
});

test('day type: holiday beats weekend, weekend on Sat/Sun', () => {
  assert.equal(dayInfo('2026-11-14T09:00', data.HOLIDAYS).type, 'weekend');
  assert.equal(dayInfo('2026-11-15T23:59', data.HOLIDAYS).type, 'weekend');
  assert.equal(dayInfo('2026-11-13T00:00', data.HOLIDAYS).type, 'weekday');
  assert.equal(dayInfo('2026-12-25T10:00', data.HOLIDAYS).type, 'holiday');
  assert.equal(dayInfo('2026-12-26T10:00', data.HOLIDAYS).type, 'holiday'); // Saturday holiday
});

test('LOA bands at 20 / 50 / 100 m', () => {
  const at = loa => run({ loa, berthCat: 'general', berthArr: '2026-11-16T09:00', berthDep: '2026-11-16T12:00' });
  assert.equal(at(100.5).appliedRow, '3a');
  assert.equal(at(100).appliedRow, '4a');
  assert.equal(at(50).appliedRow, '4a');
  assert.equal(at(49.9).appliedRow, '5a');
  assert.equal(at(20).appliedRow, '5a');
  assert.equal(at(100).subtotal, 5500);
  assert.equal(at(20).subtotal, 600);
  const under = at(19.9);
  assert.equal(under.subtotal, 0);
  assert.equal(under.appliedRow, '-');
  assert.ok(under.warnings.some(w => w.code === 'generalUnder20'));
});

test('weekend and holiday first-day rates, item 9 from second day', () => {
  const we = run({ loa: 80, berthCat: 'general', berthArr: '2026-11-14T09:00', berthDep: '2026-11-16T10:00' });
  assert.equal(qty(we, 'r4b'), 1);
  assert.equal(qty(we, 'r9'), 2);
  assert.equal(we.subtotal, 80 * 60 + 80 * 20 * 2);
  const ho = run({ loa: 30, berthCat: 'general', berthArr: '2026-12-25T09:00', berthDep: '2026-12-25T18:00' });
  assert.equal(qty(ho, 'r5c'), 1);
  assert.equal(ho.subtotal, 30 * 37);
});

test('barge and small craft', () => {
  const b = run({ loa: 40, berthCat: 'barge', berthArr: '2026-11-16T09:00', berthDep: '2026-11-19T09:00', manual: { r6emg: 2 } });
  assert.equal(b.subtotal, 40 * 30 + 40 * 20 * 2 + 40 * 7 * 2);
  assert.equal(qty(b, 'r9'), 0);
  assert.ok(b.warnings.some(w => w.code === 'tbcRate'));
  const s = run({ loa: 15, berthCat: 'small', berthArr: '2026-11-16T09:00', berthDep: '2026-11-17T09:00' });
  assert.equal(s.subtotal, 15 * 30);
  assert.equal(s.appliedRow, '7');
  const big = run({ loa: 25, berthCat: 'small', berthArr: '2026-11-16T09:00', berthDep: '2026-11-17T09:00' });
  assert.ok(big.warnings.some(w => w.code === 'smallOver20'));
});

test('fishing anchorage, manual items, GST exemption', () => {
  const r = run({ loa: 30, exempt: true, anchCat: 'fishing',
    anchArr: '2026-11-14T09:00', anchDep: '2026-11-15T09:00',
    manual: { r8: 3, r10: 1, r11: 2, r12: 1, r13: 1, r14: 1, r15: 1, r16: 1, r17: 2, r18: 1.5 } });
  const expected = 30 * 7 + 30 * 6 * 3 + 30 * 100 + 30 * 20 * 2 + 1000 + 1000 + 1500 + 2000 + 100000 + 700 + 1500;
  assert.equal(r.subtotal, expected);
  assert.equal(r.gst, 0);
  assert.equal(r.total, expected);
});

test('edited rate is used, reversed dates give 0 with a warning, uncovered holiday year warns', () => {
  const rates = data.defaultRates();
  rates.r18 = 350;
  assert.equal(run({ manual: { r18: 2 } }, rates).subtotal, 700);
  const rev = run({ loa: 120, anchCat: 'cargo', anchArr: '2026-11-16T09:00', anchDep: '2026-11-14T09:00' });
  assert.equal(rev.subtotal, 0);
  assert.ok(rev.warnings.some(w => w.code === 'anchorOrder'));
  const y = run({ loa: 120, berthCat: 'general', berthArr: '2028-01-03T09:00', berthDep: '2028-01-03T12:00' });
  assert.ok(y.warnings.some(w => w.code === 'holidayYear' && w.year === '2028'));
});
