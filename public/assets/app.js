// FRQ page behaviour. No libraries. Numbers come from results.js (ours) and board.js (other models).
(function () {
  'use strict';

  var CONFIG = window.FRQ_CONFIG || {};
  var RESULTS = window.FRQ_RESULTS || null;
  var BOARD = window.FRQ_BOARD || null;
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- the example decisions in the hero (illustrations, not model output) ----------

  var EXAMPLES = [
    { state: 'message: "I was charged twice for my October invoice."',
      question: 'Which team should handle this?',
      options: [['Billing', 94], ['Technical support', 3], ['Sales', 2], ['Account and login', 1]] },
    { state: 'user: "What\'s the weather in Lisbon tomorrow?"\ntools: get_forecast(city, date)',
      question: 'What should the assistant do next?',
      options: [['Call a tool', 91], ['Ask a follow-up question', 5], ['Answer directly', 3], ['Decline', 1]] },
    { state: 'source: "Parts are covered for 24 months. Labour is covered for the first 12."\nanswer: "Parts and labour are both covered for two years."',
      question: 'Is every claim in the answer supported by the source?',
      options: [['No', 88], ['Yes', 12]] }
  ];

  function showExample(index) {
    var example = EXAMPLES[index];
    var best = Math.max.apply(null, example.options.map(function (o) { return o[1]; }));
    $('demo-state').textContent = example.state;
    $('demo-question').textContent = example.question;
    var list = $('demo-options');
    list.textContent = '';
    var fills = [];
    example.options.forEach(function (option) {
      var row = el('li', 'option' + (option[1] === best ? ' is-chosen' : ''));
      row.appendChild(el('span', 'option-name', option[0]));
      row.appendChild(el('span', 'option-pct', option[1] + '%'));
      var bar = el('span', 'option-bar');
      var fill = el('i');
      fill.style.width = '0%';
      bar.appendChild(fill);
      row.appendChild(bar);
      list.appendChild(row);
      fills.push([fill, option[1]]);
    });
    // Reading the width makes the browser lay the empty bars out first, so they grow from nothing
    // instead of appearing at full width (and they are right even where no animation frame is drawn).
    void list.offsetWidth;
    fills.forEach(function (pair) { pair[0].style.width = pair[1] + '%'; });
    document.querySelectorAll('#demo .tab').forEach(function (tab) {
      tab.setAttribute('aria-pressed', String(Number(tab.dataset.example) === index));
    });
  }

  document.querySelectorAll('#demo .tab').forEach(function (tab) {
    tab.addEventListener('click', function () { showExample(Number(tab.dataset.example)); });
  });

  // ---------- what the three letters stand for ----------

  var MEANINGS = [
    { rows: ['a', 'u', ''],
      caption: 'FRQ is Faruq without its vowels. Faruq, said fa-rook, is an Arabic name for the one who distinguishes. Its root, f-r-q, means to separate, to tell apart, to decide.' },
    { rows: ['ast', 'outing &', 'uantification'],
      caption: 'What it does: sends whatever arrives to the right place, and puts a probability on every option it was given.' },
    { rows: ['lag', 'oute', 'uantify'],
      caption: 'The three answers it gives: a yes or a no, one option out of many, and how sure it is of each.' },
    { rows: ['ast', 'anking', 'ueries'],
      caption: 'Give it a long list of candidates, such as tools or documents, and it rates how well each one fits.' },
    // Founder, 14 October 2026: listed while the model is still in training. Before the site goes live,
    // remove this one (and its button in index.html) if Faruq cannot deliver it.
    { rows: ['ast', 'easoning', 'ueries'],
      caption: 'What we are training towards: questions that need a step of thinking before the answer. Not there yet.' },
    { rows: ['aruq', 'untime', 'uery'],
      caption: 'How you use it: one question to Faruq while your workflow is running, one answer back.' }
  ];
  var FLIP_MS = 260, STAGGER_MS = 90, HOLD_MS = 4200;

  (function () {
    var band = $('frq');
    var flips = band.querySelectorAll('.frq-flip');
    var caption = $('frq-caption');
    var chips = band.querySelectorAll('.frq-dot');
    var pause = $('frq-pause');
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0, timer = null, stopped = still, hovering = false;

    function show(index, animate) {
      var meaning = MEANINGS[index];
      current = index;
      chips.forEach(function (chip) { chip.setAttribute('aria-pressed', String(Number(chip.dataset.meaning) === index)); });
      if (!animate) {
        flips.forEach(function (flip, row) { flip.textContent = flip.dataset.text = meaning.rows[row]; });
        caption.textContent = meaning.caption;
        return;
      }
      // dataset.text is the text a row is on its way to; a timer that finds another text there has been overtaken.
      flips.forEach(function (flip, row) {
        var text = meaning.rows[row];
        if (flip.dataset.text === text) {                     // "Fast" stays "Fast": nothing to flip
          flip.textContent = text;
          flip.classList.remove('is-out', 'is-pre');
          return;
        }
        flip.dataset.text = text;
        setTimeout(function () {
          if (flip.dataset.text !== text) return;
          flip.classList.add('is-out');
          setTimeout(function () {
            if (flip.dataset.text !== text) return;
            flip.textContent = text;
            flip.classList.remove('is-out');
            flip.classList.add('is-pre');
            void flip.offsetWidth;                          // start the second half from the far side
            flip.classList.remove('is-pre');
          }, FLIP_MS);
        }, row * STAGGER_MS);
      });
      caption.classList.add('is-out');
      setTimeout(function () {
        if (current !== index) return;
        caption.textContent = meaning.caption;
        caption.classList.remove('is-out');
      }, FLIP_MS);
    }

    function schedule() {
      clearTimeout(timer);
      if (stopped || hovering) return;
      timer = setTimeout(function () { show((current + 1) % MEANINGS.length, true); schedule(); }, HOLD_MS);
    }

    function setStopped(value) {
      stopped = value;
      pause.textContent = stopped ? 'Play' : 'Pause';
      schedule();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        show(Number(chip.dataset.meaning), !still);
        setStopped(true);                                   // a reader who picks one keeps it
      });
    });
    pause.addEventListener('click', function () { setStopped(!stopped); });
    band.addEventListener('mouseenter', function () { hovering = true; schedule(); });
    band.addEventListener('mouseleave', function () { hovering = false; schedule(); });
    band.addEventListener('focusin', function () { hovering = true; schedule(); });
    band.addEventListener('focusout', function () { hovering = false; schedule(); });

    flips.forEach(function (flip) { flip.dataset.text = flip.textContent; });
    pause.hidden = still;
    schedule();
  })();

  // ---------- the request and the response, as JSON ----------

  var REQUEST = {
    state: { message: 'I was charged twice for my October invoice.' },
    questions: {
      team: {
        type: 'choice',
        instructions: 'Which team should handle this?',
        options: {
          billing: 'Invoices, charges and refunds',
          support: 'The product is not working',
          sales: 'Buying or upgrading a plan',
          account: 'Login and account access'
        }
      },
      urgent: { type: 'yes_no', instructions: 'Is an answer needed today?' }
    }
  };
  var RESPONSE = {
    answers: {
      team: { choice: 'billing', probabilities: { billing: 0.94, support: 0.03, sales: 0.02, account: 0.01 } },
      urgent: { choice: 'no', probabilities: { yes: 0.31, no: 0.69 } }
    }
  };

  function paintJson(target, value) {
    var text = JSON.stringify(value, null, 2);
    var pattern = /("(?:[^"\\]|\\.)*")(\s*:)?|-?\d+(?:\.\d+)?/g;
    var last = 0, match;
    target.textContent = '';
    while ((match = pattern.exec(text))) {
      if (match.index > last) target.appendChild(document.createTextNode(text.slice(last, match.index)));
      if (match[1]) {
        target.appendChild(el('span', match[2] ? 'k' : 's', match[1]));
        if (match[2]) target.appendChild(document.createTextNode(match[2]));
      } else {
        target.appendChild(el('span', 'n', match[0]));
      }
      last = pattern.lastIndex;
    }
    target.appendChild(document.createTextNode(text.slice(last)));
  }

  paintJson($('code-request'), REQUEST);
  paintJson($('code-response'), RESPONSE);

  // ---------- our measured numbers ----------

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(iso) {
    var parts = iso.split('-').map(Number);
    return parts[2] + ' ' + MONTHS[parts[1] - 1] + ' ' + parts[0];
  }
  function points(share) { return Math.round(share * 100); }
  function trainedMark() {
    var mark = el('span', 'trained-mark');
    mark.setAttribute('role', 'img');
    mark.setAttribute('aria-label', 'trained on this benchmark\'s public training set');
    mark.title = 'Faruq trained on this benchmark\'s public training set';
    return mark;
  }

  var TOP = 12;
  var view = { area: 'all', all: false };

  function drawBench() {
    var rows = RESULTS.benchmarks.filter(function (b) { return view.area === 'all' || b.area === view.area; });
    var shown = view.area === 'all' && !view.all ? rows.slice(0, TOP) : rows;
    var list = $('bench');
    list.textContent = '';
    shown.forEach(function (b) {
      var row = el('li', points(b.skill) === 0 ? 'is-zero' : '');
      var name = el('div', 'bench-name', b.name);
      if (b.trainedOnItsTrainingSet) name.appendChild(trainedMark());
      if (b.asks) name.appendChild(el('span', 'bench-asks', b.asks));
      var bar = el('div', 'bench-bar');
      var fill = el('i');
      fill.style.width = points(b.skill) + '%';
      bar.appendChild(fill);
      row.appendChild(name);
      row.appendChild(bar);
      row.appendChild(el('div', 'bench-value', String(points(b.skill))));
      list.appendChild(row);
    });
    var more = $('bench-more');
    more.hidden = view.area !== 'all' || rows.length <= TOP;
    more.textContent = view.all ? 'Show the top ' + TOP : 'Show all ' + rows.length;
    more.setAttribute('aria-expanded', String(view.all));
  }

  function drawFilters() {
    var box = $('filters');
    var areas = [['all', 'All']].concat(Object.keys(RESULTS.areas).map(function (key) { return [key, RESULTS.areas[key]]; }));
    areas.forEach(function (area) {
      var chip = el('button', 'chip', area[1]);
      chip.type = 'button';
      chip.setAttribute('aria-pressed', String(area[0] === view.area));
      chip.addEventListener('click', function () {
        view.area = area[0];
        box.querySelectorAll('.chip').forEach(function (other) { other.setAttribute('aria-pressed', String(other === chip)); });
        drawBench();
      });
      box.appendChild(chip);
    });
  }

  function drawResults() {
    var never = RESULTS.neverTrained;
    $('measured-on').textContent = ', measured on ' + longDate(RESULTS.measured);
    $('tile-index').textContent = RESULTS.index.toFixed(2);
    $('tile-index').appendChild(el('small', '', '/ 100'));
    $('tile-index-sub').textContent = 'Our own run on ' + RESULTS.benchmarksInIndex + ' of its ' + RESULTS.boardBenchmarks +
      ' public benchmarks. 0 is guessing, 100 is perfect.';
    $('tile-unseen').textContent = points(never.score) + '%';
    $('tile-unseen-sub').textContent = never.sources + ' task sets kept out of training entirely. The best blind guess gets ' +
      points(never.floor) + '%.';
    $('reading-trained').textContent = 'Faruq trained on the public training sets of ' + RESULTS.trainedOnTrainingSets + ' of these ' +
      RESULTS.benchmarksInIndex + ' benchmarks (the marked ones). Their scores show what it learned, not how it copes with something new.';

    document.querySelectorAll('.use[data-bench]').forEach(function (card) {
      var bench = RESULTS.benchmarks.filter(function (b) { return b.id === Number(card.dataset.bench); })[0];
      var line = card.querySelector('.use-score');
      if (!bench) { line.remove(); return; }
      line.appendChild(el('strong', '', String(points(bench.skill))));
      line.appendChild(el('span', 'of', ' / 100 on ' + bench.name));
      if (bench.trainedOnItsTrainingSet) line.appendChild(trainedMark());
    });

    var weak = RESULTS.benchmarks.filter(function (b) { return b.skill < 0.05; }).map(function (b) { return b.name; });
    if (weak.length) $('limits-list').textContent = 'At or near chance today: ' + weak.join(', ') + '.';

    drawFilters();
    drawBench();
    $('bench-more').addEventListener('click', function () { view.all = !view.all; drawBench(); });
  }

  // ---------- next to other models (off until the final numbers exist) ----------

  function size(params) {
    if (params == null) return 'not published';
    return params >= 1e9 ? (params / 1e9).toFixed(1) + 'B' : Math.round(params / 1e6) + 'M';
  }

  function drawComparison() {
    var body = $('compare-rows');
    function addRow(model, ours) {
      var row = el('tr', ours ? 'is-ours' : '');
      var head = el('th', '', model.name);
      head.scope = 'row';
      if (model.note) head.appendChild(el('span', 'sub', model.note));
      row.appendChild(head);
      row.appendChild(el('td', '', model.size));
      row.appendChild(el('td', '', model.kind));
      row.appendChild(el('td', 'num', model.publicIndex));
      row.appendChild(el('td', 'num' + (model.full === 'not submitted' ? ' dim' : ''), model.full));
      body.appendChild(row);
    }
    addRow({ name: 'Faruq', note: 'development build, our own run on a sample', size: '150M', kind: 'encoder',
             publicIndex: RESULTS.index.toFixed(2) + '*', full: 'not submitted' }, true);
    BOARD.models.forEach(function (model) {
      addRow({ name: model.name, note: model.note, size: size(model.params), kind: model.kind,
               publicIndex: model.publicIndex.toFixed(2), full: model.full.toFixed(2) }, false);
    });
    $('compare-lead').textContent = 'Jev, the reference of the Decision Index, and the ten highest-ranked models under one billion parameters among its ' +
      BOARD.entries + ' entries.';
    $('compare-note').textContent = '* Other models: official figures from ' + BOARD.edition + ', read on ' + longDate(BOARD.read) +
      '. Faruq: our own run on a sample of ' + RESULTS.benchmarksInIndex + ' of the ' + RESULTS.boardBenchmarks +
      ' public benchmarks, measured on ' + longDate(RESULTS.measured) + ' and not yet submitted. The two are not measured the same way, and Faruq has no Full score until the board runs it.';
    $('compare').hidden = false;
  }

  if (RESULTS) {
    drawResults();
    var preview = /[?&]compare=1\b/.test(window.location.search);
    if (BOARD && (CONFIG.showComparison || preview)) drawComparison();
  }

  // ---------- early access ----------

  var form = $('access-form');
  var statusLine = $('form-status');

  function say(text, kind) {
    statusLine.textContent = text;
    statusLine.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = form.elements.email;
    var use = form.elements.use.value.trim();
    var target = CONFIG.earlyAccess || {};
    var valid = email.value.trim() !== '' && email.checkValidity();
    email.setAttribute('aria-invalid', String(!valid));
    if (!valid) { say('Please enter a valid email address.', 'error'); email.focus(); return; }
    if (form.elements.website.value) { say('Thank you. We will be in touch.', 'done'); return; }   // filled only by robots

    if (target.endpoint) {
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      say('Sending…');
      fetch(target.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          form.reset();
          say('Thank you. We will write to you when there is something to try.', 'done');
        })
        .catch(function () { say('That did not go through. Please try again in a moment.', 'error'); })
        .then(function () { button.disabled = false; });
    } else if (target.email) {
      var where = Array.prototype.map.call(form.querySelectorAll('input[name="where"]:checked'), function (box) { return box.value; });
      var body = 'Email: ' + email.value.trim() + '\n\nWhere I would use it: ' + (where.join(', ') || '(not said)') +
        '\n\nDecisions a month: ' + (form.elements.volume.value || '(not said)') +
        '\n\nThe decision I would hand to it:\n' + (use || '(not said)');
      window.location.href = 'mailto:' + target.email + '?subject=' + encodeURIComponent('Early access to Faruq') +
        '&body=' + encodeURIComponent(body);
      say('Your mail program should have opened with a message ready to send.', 'done');
    } else {
      say('Sign-up is not open yet. Nothing was sent.', 'error');
    }
  });

  $('year').textContent = String(new Date().getFullYear());
})();
