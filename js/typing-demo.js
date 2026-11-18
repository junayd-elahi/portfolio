/* =========================================================
   Live keystroke-dynamics demo (Parkinson's project page).
   Computes the same kind of timing features the models used:
   hold time, flight time, latency and left/right-hand transitions.
   Runs entirely in the browser. Nothing is stored or sent.
   ========================================================= */
(() => {
  const root = document.getElementById('typingDemo');
  if (!root) return;

  const input = root.querySelector('.td__input');
  const out = name => root.querySelector(`[data-out="${name}"]`);
  const bars = root.querySelector('.td__bars');
  const resetBtn = root.querySelector('.td__reset');
  const touchNote = root.querySelector('.td__touch');

  // Physical key positions (e.code), so it works on any keyboard layout
  const LEFT = new Set(['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'Tab']);
  const RIGHT = new Set(['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal',
    'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash',
    'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma',
    'Period', 'Slash', 'Backspace', 'Enter']);
  const IGNORE = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft',
    'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const PAUSE_MS = 2000; // gaps longer than this are pauses, not typing rhythm
  const MAX_BARS = 48;

  const hand = code => LEFT.has(code) ? 'L' : RIGHT.has(code) ? 'R' : null;

  let down, events, last;
  const reset = () => {
    down = new Map();     // code -> keydown time
    events = [];          // completed keystrokes {code, hand, hold, flight, latency, dir}
    last = null;          // previous completed keystroke {code, hand, downT, upT}
    input.value = '';
    render();
  };

  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
  const sd = a => {
    if (a.length < 2) return NaN;
    const m = mean(a);
    return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
  };
  const fmt = v => Number.isFinite(v) ? Math.round(v) : '–';

  input.addEventListener('keydown', e => {
    if (e.repeat || IGNORE.has(e.code) || !e.code) return;
    if (!down.has(e.code)) down.set(e.code, e.timeStamp);
  });

  input.addEventListener('keyup', e => {
    if (!down.has(e.code)) return;
    const downT = down.get(e.code);
    down.delete(e.code);
    const upT = e.timeStamp;
    const h = hand(e.code);
    const ev = { code: e.code, hand: h, hold: upT - downT, flight: NaN, latency: NaN, dir: null };

    if (last) {
      const flight = downT - last.upT;
      const latency = downT - last.downT;
      if (latency < PAUSE_MS) {
        ev.flight = flight;
        ev.latency = latency;
        if (last.hand && h) ev.dir = last.hand + h;
      }
    }
    if (ev.hold > 0 && ev.hold < PAUSE_MS) events.push(ev);
    last = { code: e.code, hand: h, downT, upT };
    render();
  });

  // Touch keyboards don't report reliable key timings
  input.addEventListener('focus', () => {
    if (window.matchMedia('(pointer: coarse)').matches) touchNote.hidden = false;
  });
  resetBtn.addEventListener('click', () => { reset(); input.focus(); });

  function render() {
    const holds = events.map(e => e.hold);
    const flights = events.map(e => e.flight).filter(Number.isFinite);
    const lats = events.map(e => e.latency).filter(Number.isFinite);

    out('keys').textContent = events.length;
    out('hold').textContent = fmt(mean(holds));
    out('holdsd').textContent = fmt(sd(holds));
    out('flight').textContent = fmt(mean(flights));
    out('flightsd').textContent = fmt(sd(flights));
    out('latency').textContent = fmt(mean(lats));

    for (const dir of ['LL', 'LR', 'RL', 'RR']) {
      const l = events.filter(e => e.dir === dir).map(e => e.latency);
      out(dir).textContent = fmt(mean(l));
      out(dir + 'n').textContent = l.length;
    }

    const lh = events.filter(e => e.hand === 'L').map(e => e.hold);
    const rh = events.filter(e => e.hand === 'R').map(e => e.hold);
    out('asym').textContent = (lh.length && rh.length) ? fmt(mean(lh) - mean(rh)) : '–';

    // Live bar chart of the most recent hold times
    const recent = events.slice(-MAX_BARS);
    const max = Math.max(250, ...recent.map(e => e.hold));
    bars.innerHTML = '';
    for (const e of recent) {
      const b = document.createElement('span');
      b.className = 'td__bar' + (e.hand === 'L' ? ' is-left' : e.hand === 'R' ? ' is-right' : '');
      b.style.height = `${Math.max(4, (e.hold / max) * 100)}%`;
      b.title = `${Math.round(e.hold)} ms`;
      bars.appendChild(b);
    }
    root.classList.toggle('has-data', events.length > 0);
  }

  reset();
})();
