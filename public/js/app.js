/* Screen behaviour */
(function () {
  'use strict';

  var D = window.PortFeeData;
  var C = window.PortFeeCalc;
  var TEXT = window.PortFeeText;
  var STORE_KEY = 'portfee.v1';
  var INPUT_IDS = ['name', 'loa', 'anchCat', 'anchArr', 'anchDep', 'berthCat', 'berthArr', 'berthDep'];

  function emptyInput() {
    return { name: '', loa: '', exempt: false, anchCat: 'cargo', anchArr: '', anchDep: '',
      berthCat: 'general', berthArr: '', berthDep: '', manual: {} };
  }

  var state = {
    lang: 'ko',
    view: 'calc',
    showAll: false,
    rates: D.defaultRates(),
    gstRate: D.GST_RATE,
    holidays: D.HOLIDAYS.map(function (h) { return Object.assign({}, h); }),
    input: emptyInput()
  };

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!saved) { return; }
      if (saved.lang === 'ko' || saved.lang === 'en') { state.lang = saved.lang; }
      if (saved.rates) { Object.assign(state.rates, saved.rates); }
      if (typeof saved.gstRate === 'number') { state.gstRate = saved.gstRate; }
      if (Array.isArray(saved.holidays)) { state.holidays = saved.holidays; }
      if (saved.input) { state.input = Object.assign(emptyInput(), saved.input); }
      state.showAll = !!saved.showAll;
    } catch (e) { /* storage unavailable — defaults are used */ }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        lang: state.lang, rates: state.rates, gstRate: state.gstRate,
        holidays: state.holidays, input: state.input, showAll: state.showAll
      }));
    } catch (e) { /* ignore */ }
  }

  function $(id) { return document.getElementById(id); }
  function t(key) { return TEXT[state.lang][key]; }
  function name(obj) { return obj[state.lang] || obj.name || ''; }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') { node.className = attrs[k]; }
      else if (k === 'text') { node.textContent = attrs[k]; }
      else if (k.slice(0, 2) === 'on') { node.addEventListener(k.slice(2), attrs[k]); }
      else { node.setAttribute(k, attrs[k]); }
    });
    (children || []).forEach(function (c) { if (c) { node.appendChild(c); } });
    return node;
  }

  function money(v) {
    return '$' + (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function plain(v) {
    return (Math.round(v * 1000) / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 });
  }

  /* ---------- static text ---------- */
  function applyText() {
    document.documentElement.lang = state.lang;
    document.title = t('appTitle');
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
  }

  /* ---------- calculator ---------- */
  function fillInputs() {
    INPUT_IDS.forEach(function (id) { $('in-' + id).value = state.input[id]; });
    $('in-exempt').checked = !!state.input.exempt;
    $('in-showAll').checked = state.showAll;
  }

  function renderManual() {
    var box = $('manualList');
    box.textContent = '';
    D.ITEMS.filter(function (it) { return !it.auto; }).forEach(function (it) {
      var input = el('input', { type: 'number', inputmode: 'decimal', min: '0', step: 'any', placeholder: '0',
        'aria-label': name(it),
        oninput: function (e) { state.input.manual[it.key] = e.target.value; save(); renderResult(); } });
      input.value = state.input.manual[it.key] || '';
      box.appendChild(el('div', { class: 'manual-row' }, [
        el('div', { class: 'manual-name' }, [
          el('span', { class: 'no', text: it.no }),
          el('span', {}, [
            el('b', { text: name(it) }),
            it.tbc ? el('em', { class: 'badge', text: t('tbc') }) : null,
            el('small', { text: (it.kind === 'loa' ? 'LOA × ' : '') + money(state.rates[it.key]) + ' × ' + t('unit_' + it.unit) })
          ])
        ]),
        el('label', { class: 'qty' }, [input, el('span', { text: t('unit_' + it.unit) })])
      ]));
    });
  }

  function renderResult() {
    var r = C.compute(state.input, D.ITEMS, state.rates, state.gstRate, state.holidays);

    var auto = $('autoList');
    auto.textContent = '';
    var dayText = r.dow === null ? t('none') : t('dow')[r.dow] + ' · ' + t(r.dayType);
    [[t('autoAnchorDays'), r.anchorDays + t('days')],
      [t('autoBerthDays'), r.berthDays + t('days')],
      [t('autoDayType'), dayText],
      [t('autoRow'), r.appliedRow],
      [t('autoLater'), r.laterDays + t('days')]].forEach(function (p) {
      auto.appendChild(el('div', {}, [el('dt', { text: p[0] }), el('dd', { text: p[1] })]));
    });

    var warn = $('warnings');
    warn.textContent = '';
    r.warnings.forEach(function (w) {
      warn.appendChild(el('p', { class: 'warn', text: t('warn_' + w.code).replace('{year}', w.year || '') }));
    });

    var lines = $('lines');
    lines.textContent = '';
    var shown = r.lines.filter(function (l) { return state.showAll || l.amount > 0; });
    if (!shown.length) { lines.appendChild(el('p', { class: 'empty', text: t('noLines') })); }
    shown.forEach(function (l) {
      var it = D.ITEMS.filter(function (i) { return i.key === l.key; })[0];
      var formula = (l.kind === 'loa' ? 'LOA ' + plain(r.loa) + ' × ' : '') + money(l.rate) + ' × ' + plain(l.qty) +
        (l.unit === 'apply' ? '' : ' ' + t('unit_' + l.unit));
      lines.appendChild(el('div', { class: 'line' + (l.amount > 0 ? '' : ' zero') }, [
        el('span', { class: 'no', text: l.no }),
        el('span', { class: 'line-name' }, [
          el('b', { text: name(it) }),
          l.tbc ? el('em', { class: 'badge', text: t('tbc') }) : null,
          el('small', { text: formula })
        ]),
        el('span', { class: 'amount', text: money(l.amount) })
      ]));
    });

    $('outSubtotal').textContent = money(r.subtotal);
    $('gstLabel').textContent = t('gst') + ' (' + (state.input.exempt ? t('gstExempt') : plain(state.gstRate * 100) + '%') + ')';
    $('outGst').textContent = money(r.gst);
    $('outTotal').textContent = money(r.total);
    $('barTotal').textContent = money(r.total);
    $('printVessel').textContent = [state.input.name, r.loa ? 'LOA ' + plain(r.loa) + ' m' : ''].filter(Boolean).join(' · ');
  }

  /* ---------- rates ---------- */
  function renderRates() {
    var box = $('rateList');
    box.textContent = '';
    D.ITEMS.forEach(function (it) {
      var input = el('input', { type: 'number', inputmode: 'decimal', min: '0', step: 'any', 'aria-label': name(it),
        oninput: function (e) {
          var v = parseFloat(e.target.value);
          state.rates[it.key] = isFinite(v) && v >= 0 ? v : 0;
          save(); renderManual(); renderResult();
        } });
      input.value = state.rates[it.key];
      var note = state.lang === 'ko' ? it.noteKo : it.noteEn;
      box.appendChild(el('div', { class: 'rate-row' + (state.rates[it.key] !== it.rate ? ' changed' : '') }, [
        el('span', { class: 'no', text: it.no }),
        el('span', { class: 'line-name' }, [
          el('b', { text: name(it) }),
          it.tbc ? el('em', { class: 'badge', text: t('tbc') }) : null,
          el('small', { text: (it.kind === 'loa' ? t('perLoa') : t('perFlat')) + ' × ' + t('unit_' + it.unit) + (note ? ' — ' + note : '') })
        ]),
        el('label', { class: 'qty' }, [el('span', { text: '$' }), input])
      ]));
    });
    $('in-gst').value = Math.round(state.gstRate * 100000) / 1000;
  }

  /* ---------- holidays ---------- */
  function renderHolidays() {
    var list = $('holidayList');
    list.textContent = '';
    state.holidays.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    state.holidays.forEach(function (h) {
      var info = C.dayInfo(h.date, []);
      list.appendChild(el('li', {}, [
        el('span', { class: 'hol-date', text: h.date + ' (' + t('dow')[info.dow] + ')' }),
        el('span', { class: 'grow', text: name(h) }),
        el('button', { class: 'btn small', text: t('btnDelete'), onclick: function () {
          state.holidays = state.holidays.filter(function (x) { return x !== h; });
          save(); renderHolidays(); renderResult();
        } })
      ]));
    });
  }

  function renderAnchorages() {
    var list = $('anchList');
    list.textContent = '';
    D.ANCHORAGES.forEach(function (a) {
      list.appendChild(el('li', {}, [el('span', {}, [el('b', { text: a.name }), el('small', { text: a[state.lang] })])]));
    });
  }

  function renderAll() {
    applyText();
    fillInputs();
    renderManual();
    renderRates();
    renderHolidays();
    renderAnchorages();
    renderResult();
  }

  function showView(view) {
    state.view = view;
    ['calc', 'rates', 'holidays', 'anch'].forEach(function (v) { $('view-' + v).hidden = v !== view; });
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-view') === view);
    });
    $('totalBar').hidden = view !== 'calc';
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  function bind() {
    INPUT_IDS.forEach(function (id) {
      $('in-' + id).addEventListener('input', function (e) { state.input[id] = e.target.value; save(); renderResult(); });
    });
    $('in-exempt').addEventListener('change', function (e) { state.input.exempt = e.target.checked; save(); renderResult(); });
    $('in-showAll').addEventListener('change', function (e) { state.showAll = e.target.checked; save(); renderResult(); });

    $('btnLang').addEventListener('click', function () { state.lang = state.lang === 'ko' ? 'en' : 'ko'; save(); renderAll(); });
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
    });

    $('btnExample').addEventListener('click', function () {
      state.input = Object.assign(emptyInput(), { name: 'Example Vessel', loa: '120',
        anchArr: '2026-11-14T09:00', anchDep: '2026-11-16T09:00',
        berthArr: '2026-11-16T09:00', berthDep: '2026-11-19T09:00' });
      save(); fillInputs(); renderManual(); renderResult();
    });
    $('btnClear').addEventListener('click', function () {
      if (!confirm(t('confirmClear'))) { return; }
      state.input = emptyInput();
      save(); fillInputs(); renderManual(); renderResult();
    });
    $('btnPrint').addEventListener('click', function () { window.print(); });

    $('in-gst').addEventListener('input', function (e) {
      var v = parseFloat(e.target.value);
      state.gstRate = isFinite(v) && v >= 0 ? v / 100 : 0;
      save(); renderResult();
    });
    $('btnResetRates').addEventListener('click', function () {
      if (!confirm(t('confirmReset'))) { return; }
      state.rates = D.defaultRates();
      state.gstRate = D.GST_RATE;
      save(); renderRates(); renderManual(); renderResult();
    });

    $('btnAddHoliday').addEventListener('click', function () {
      var date = $('hol-date').value;
      if (!date) { $('hol-date').focus(); return; }
      state.holidays = state.holidays.filter(function (h) { return h.date !== date; });
      state.holidays.push({ date: date, name: $('hol-name').value.trim() });
      $('hol-date').value = '';
      $('hol-name').value = '';
      save(); renderHolidays(); renderResult();
    });
    $('btnResetHolidays').addEventListener('click', function () {
      if (!confirm(t('confirmReset'))) { return; }
      state.holidays = D.HOLIDAYS.map(function (h) { return Object.assign({}, h); });
      save(); renderHolidays(); renderResult();
    });

    var installEvent = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      installEvent = e;
      $('btnInstall').hidden = false;
    });
    $('btnInstall').addEventListener('click', function () {
      if (!installEvent) { return; }
      installEvent.prompt();
      installEvent = null;
      $('btnInstall').hidden = true;
    });
    window.addEventListener('appinstalled', function () { $('btnInstall').hidden = true; });
  }

  load();
  bind();
  renderAll();
  showView('calc');

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
