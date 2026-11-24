/* =========================================================
   PORTFOLIO — interactions & animations
   Everything here is progressive: the site works without it.
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Year in footer ---------- */
  $$('#year').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------- Theme toggle (remembered per visitor) ---------- */
  // Keep the phone's browser bar the same colour as the page.
  const syncThemeColor = () => {
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = root.dataset.theme === 'light' ? '#f5f5f0' : '#07090c';
  };
  syncThemeColor();
  $('#themeToggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    syncThemeColor();
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
  };
  menuBtn?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Nav state + scroll progress ---------- */
  const nav = $('.nav');
  const bar = $('.scroll-progress, .reading-progress');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
      const goingDown = y > lastY && y > 400 && !document.body.classList.contains('menu-open');
      nav.classList.toggle('is-hidden', goingDown);
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor glow ---------- */
  const glow = $('.cursor-glow');
  if (glow && finePointer && !reduceMotion) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, running = false;
    // Only runs while the glow is catching up with the pointer, then stops.
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
      if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) requestAnimationFrame(loop);
      else running = false;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add('has-pointer');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
  }

  /* ---------- Hero title: split into animated words ---------- */
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words
      .map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
      .join(' ');
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Number counters ---------- */
  const counters = $$('[data-count]');
  const runCounter = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const fmt = v => v.toFixed(dec) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach(el => co.observe(el));
  } else counters.forEach(runCounter);

  /* ---------- ECG heartbeat line in the hero ---------- */
  const ecg = $('.ecg');
  if (ecg) {
    const base = $('.ecg__base', ecg);
    const pulse = $('.ecg__pulse', ecg);
    let len = 0, seg = 220, visible = true, offset = 0, last = 0;

    const build = () => {
      const w = ecg.clientWidth, h = ecg.clientHeight, y = h * 0.62;
      const beat = Math.max(260, Math.min(360, w / 4));
      let d = `M0 ${y}`;
      for (let x = 0; x < w + beat; x += beat) {
        const b = s => x + s * beat;           // position inside one beat (0..1)
        d += ` L${b(.20)} ${y}`
          + ` Q${b(.25)} ${y - 14} ${b(.30)} ${y}`        // P wave
          + ` L${b(.36)} ${y}`
          + ` L${b(.385)} ${y + 12}`                       // Q
          + ` L${b(.42)} ${y - h * .55}`                   // R spike
          + ` L${b(.455)} ${y + h * .2}`                   // S
          + ` L${b(.48)} ${y}`
          + ` L${b(.56)} ${y}`
          + ` Q${b(.64)} ${y - 26} ${b(.72)} ${y}`         // T wave
          + ` L${b(1)} ${y}`;
      }
      base.setAttribute('d', d);
      pulse.setAttribute('d', d);
      len = pulse.getTotalLength();
      seg = Math.min(320, len * 0.12);
      pulse.style.strokeDasharray = `${seg} ${len}`;
      if (reduceMotion) pulse.style.strokeDashoffset = -len * 0.3;
    };
    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });

    if (!reduceMotion) {
      const speed = 0.38; // px per ms
      let raf = 0;
      const loop = now => {
        const dt = last ? Math.min(now - last, 50) : 16; last = now;
        if (len) {
          offset = (offset + speed * dt) % (len + seg);
          pulse.style.strokeDashoffset = seg - offset;
        }
        raf = visible ? requestAnimationFrame(loop) : 0;
      };
      const start = () => {
        new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
        }).observe(ecg);
      };
      // Wait until the page has loaded so the pulse doesn't compete with first paint.
      const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
      if (document.readyState === 'complete') idle(start);
      else addEventListener('load', () => idle(start), { once: true });
    }
  }

  /* ---------- Card spotlight (follows cursor) ---------- */
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- Project filters ---------- */
  const chips = $$('.chip[data-filter]');
  const cards = $$('.projects .card');
  const applyFilter = (f, animateIn) => {
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.tags.split(' ').includes(f);
      card.classList.toggle('is-filtered', !show);
      card.classList.remove('is-entering');
      if (show) {
        card.classList.add('is-in');
        if (animateIn) { void card.offsetWidth; card.classList.add('is-entering'); }
      }
    });
  };
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => {
      c.classList.toggle('is-active', c === chip);
      c.setAttribute('aria-pressed', String(c === chip));
    });
    const f = chip.dataset.filter;
    if (!document.startViewTransition || reduceMotion) return applyFilter(f, !reduceMotion);
    // Cards glide from their old place to their new one.
    cards.forEach((card, i) => (card.style.viewTransitionName = `card-${i}`));
    root.classList.add('is-filtering');
    document.startViewTransition(() => applyFilter(f, false)).finished.finally(() => {
      cards.forEach(card => (card.style.viewTransitionName = ''));
      root.classList.remove('is-filtering');
    });
  }));

  /* ---------- Card cover morphs into the project page's colour band ---------- */
  // The matching name on the project page is on .p-band (see style.css).
  addEventListener('pageswap', e => {
    const url = e.viewTransition && e.activation && e.activation.entry && e.activation.entry.url;
    if (!url) return;
    const path = new URL(url).pathname;
    const link = $$('.card__link').find(a => new URL(a.href).pathname === path);
    const media = link && $('.card__media', link.closest('.card'));
    if (!media) return;
    // Clear any name left over from an earlier visit (names must be unique).
    $$('.card__media').forEach(m => (m.style.viewTransitionName = ''));
    media.style.viewTransitionName = 'project-cover';
    e.viewTransition.finished.finally(() => (media.style.viewTransitionName = ''));
  });

  /* ---------- Timeline fill ---------- */
  const tl = $('.timeline');
  if (tl) {
    const fill = $('.timeline__fill', tl);
    const items = $$('.timeline__item', tl);
    const update = () => {
      const r = tl.getBoundingClientRect();
      const mid = innerHeight * 0.6;
      const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      fill.style.setProperty('--p', p);
      items.forEach(it => it.classList.toggle('is-lit', it.getBoundingClientRect().top < mid));
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Project page: build "On this page" from the article's h2s ---------- */
  const tocList = $('.toc ol');
  if (tocList && !tocList.children.length) {
    $$('.article section[id]').forEach(sec => {
      const h = $('h2', sec);
      if (!h) return;
      const label = [...h.childNodes].filter(n => !(n.classList && n.classList.contains('num'))).map(n => n.textContent).join('').trim();
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${sec.id}"></a>`;
      li.firstChild.textContent = label;
      tocList.appendChild(li);
    });
  }

  /* ---------- Scrollspy: nav links + project table of contents ---------- */
  const spyLinks = $$('.nav__links a[href^="#"], .toc a[href^="#"]');
  const spyTargets = spyLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (spyTargets.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        spyLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(t => so.observe(t));
  }

  /* ---------- Copy email ---------- */
  const toast = $('#toast');
  const showToast = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-show'), 2200);
  };
  $('#copyEmail')?.addEventListener('click', async e => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied ✓');
    } catch {
      location.href = `mailto:${email}`;
    }
  });
})();
