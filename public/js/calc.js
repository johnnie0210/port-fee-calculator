/* Fee calculation — same rules as the 'Calculator' sheet of port-fee-calculator-en.xlsx */
(function (root) {
  'use strict';

  var DAY_MS = 86400000;

  // 'YYYY-MM-DDTHH:mm' -> epoch ms on a fixed clock (no time zone / DST shift, like Excel serial dates)
  function parseDateTime(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s || '');
    if (!m) { return null; }
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  }

  // Stay days rounded up in 24-hour units, 0 when a value is missing or the order is reversed
  function stayDays(from, to) {
    var a = parseDateTime(from);
    var b = parseDateTime(to);
    if (a === null || b === null || b <= a) { return 0; }
    return Math.ceil((b - a) / DAY_MS);
  }

  function holidaySet(holidays) {
    var set = {};
    (holidays || []).forEach(function (h) { set[typeof h === 'string' ? h : h.date] = true; });
    return set;
  }

  // dow : 0 = Mon ... 6 = Sun, type : 'holiday' > 'weekend' > 'weekday'
  function dayInfo(dateTime, holidays) {
    var t = parseDateTime(dateTime);
    if (t === null) { return null; }
    var iso = dateTime.slice(0, 10);
    var dow = (new Date(t).getUTCDay() + 6) % 7;
    var type = holidaySet(holidays)[iso] ? 'holiday' : (dow >= 5 ? 'weekend' : 'weekday');
    return { iso: iso, dow: dow, type: type };
  }

  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * input    : { loa, exempt, anchArr, anchDep, berthArr, berthDep,
   *              anchCat: 'cargo'|'fishing'|'none', berthCat: 'general'|'barge'|'small'|'none',
   *              manual: { r6emg, r8, r10, r11, r12 ... r18 } }
   * items    : PortFeeData.ITEMS
   * rates    : { key: rate }
   * gstRate  : e.g. 0.15
   * holidays : ['YYYY-MM-DD'] or [{ date }]
   */
  function compute(input, items, rates, gstRate, holidays) {
    var loa = num(input.loa);
    var manual = input.manual || {};
    var anchorDays = stayDays(input.anchArr, input.anchDep);
    var berthDays = stayDays(input.berthArr, input.berthDep);
    var laterDays = Math.max(0, berthDays - 1);
    var day = dayInfo(input.berthArr, holidays);
    var type = day ? day.type : '';
    var general = input.berthCat === 'general';
    var barge = input.berthCat === 'barge';
    var small = input.berthCat === 'small';
    var berthed = berthDays >= 1;

    var band = loa > 100 ? '3' : (loa >= 50 ? '4' : (loa >= 20 ? '5' : ''));
    var letter = { weekday: 'a', weekend: 'b', holiday: 'c' }[type] || '';

    var auto = {
      r1: input.anchCat === 'cargo' ? anchorDays : 0,
      r2: input.anchCat === 'fishing' ? anchorDays : 0,
      r6first: barge && berthed ? 1 : 0,
      r6next: barge ? laterDays : 0,
      r7first: small && berthed ? 1 : 0,
      r7next: small ? laterDays : 0,
      r9: general ? laterDays : 0
    };
    ['3', '4', '5'].forEach(function (b) {
      ['a', 'b', 'c'].forEach(function (l) {
        auto['r' + b + l] = general && berthed && band === b && letter === l ? 1 : 0;
      });
    });

    var subtotal = 0;
    var lines = items.map(function (it) {
      var qty = it.auto ? (auto[it.key] || 0) : num(manual[it.key]);
      var rate = num(rates[it.key]);
      var amount = (it.kind === 'loa' ? loa : 1) * rate * qty;
      subtotal += amount;
      return { key: it.key, no: it.no, kind: it.kind, unit: it.unit, auto: !!it.auto, tbc: !!it.tbc,
        rate: rate, qty: qty, amount: amount };
    });

    var gst = input.exempt ? 0 : subtotal * num(gstRate);

    var appliedRow = '-';
    if (berthed) {
      if (barge) { appliedRow = '6'; }
      else if (small) { appliedRow = '7'; }
      else if (general && band && letter) { appliedRow = band + letter; }
    }

    var warnings = [];
    var a1 = parseDateTime(input.anchArr), a2 = parseDateTime(input.anchDep);
    var b1 = parseDateTime(input.berthArr), b2 = parseDateTime(input.berthDep);
    if (a1 !== null && a2 !== null && a2 <= a1) { warnings.push({ code: 'anchorOrder' }); }
    if (b1 !== null && b2 !== null && b2 <= b1) { warnings.push({ code: 'berthOrder' }); }
    if (general && berthed && loa > 0 && loa < 20) { warnings.push({ code: 'generalUnder20' }); }
    if (small && berthed && loa >= 20) { warnings.push({ code: 'smallOver20' }); }
    if (day && general && berthed) {
      var year = day.iso.slice(0, 4);
      var covered = Object.keys(holidaySet(holidays)).some(function (d) { return d.slice(0, 4) === year; });
      if (!covered) { warnings.push({ code: 'holidayYear', year: year }); }
    }
    if (lines.some(function (l) { return l.tbc && l.amount > 0; })) { warnings.push({ code: 'tbcRate' }); }

    return {
      loa: loa, anchorDays: anchorDays, berthDays: berthDays, laterDays: laterDays,
      dow: day ? day.dow : null, dayType: type, appliedRow: appliedRow,
      lines: lines, subtotal: subtotal, gst: gst, total: subtotal + gst, warnings: warnings
    };
  }

  var api = { parseDateTime: parseDateTime, stayDays: stayDays, dayInfo: dayInfo, compute: compute };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.PortFeeCalc = api;
})(typeof self !== 'undefined' ? self : this);
