(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const PHI = 1.618;

  /* ---------- ROLLING LINKS ---------- */
  $$('.topnav a, .hh--nav a, .hero__social a, .hero__down, .foot__info dd a, .foot__legal a').forEach((a) => {
    const t = a.textContent;
    a.innerHTML = `<span class="roll"><span data-t="${t}">${t}</span></span>`;
  });

  /* ---------- LETTER SPANS (for the glitch, as on the live page) ---------- */
  function splitInto(el, text) {
    el.innerHTML = '';
    for (const c of text) {
      const span = document.createElement('span');
      span.className = 'gl';
      span.textContent = c;
      span.dataset.c = c;
      el.appendChild(span);
    }
  }
  $$('.glitch:not(.clock)').forEach((el) => splitInto(el, el.textContent));

  /* ---------- MALMÖ CLOCK ---------- */
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
  let shown = '';
  const tick = () => {
    const t = fmt.format(new Date());
    if (t === shown) return;
    shown = t;
    $$('.clock').forEach((c) => (c.classList.contains('glitch') ? splitInto(c, t) : (c.textContent = t)));
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- FIT: STUDIO MILAD fills the hero width (ink edge to ink edge) ---------- */
  const wordmark = $('.wordmark');
  const hero = $('.hero');
  const mctx = document.createElement('canvas').getContext('2d');
  function inkEdges() {
    const cs = wordmark.querySelectorAll('.ch');
    const first = cs[0], last = cs[cs.length - 1];
    mctx.font = `700 ${getComputedStyle(wordmark).fontSize} "Helvetica Now Display"`;
    const fr = first.getBoundingClientRect();
    const fm = mctx.measureText(first.textContent);
    const left = first.classList.contains('ch--flip')
      ? fr.left + fr.width - fm.actualBoundingBoxRight     // mirrored glyph
      : fr.left - fm.actualBoundingBoxLeft;
    const right = last.getBoundingClientRect().left + mctx.measureText(last.textContent).actualBoundingBoxRight;
    return { left, right };
  }
  function fitWordmark() {
    const pad = parseFloat(getComputedStyle(hero).paddingLeft);
    wordmark.style.translate = '0 0';
    wordmark.style.fontSize = '100px';
    let e = inkEdges();
    wordmark.style.fontSize = (100 * (innerWidth - 2 * pad)) / (e.right - e.left) + 'px';
    e = inkEdges();
    wordmark.style.translate = `${pad - e.left}px 0`;
  }
  // the footer name: same idea, simpler (box width)
  const fname = $('.foot__name');
  function fitFootName() {
    const avail = fname.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(fname.parentElement).paddingLeft);
    fname.style.fontSize = '100px';
    fname.style.width = 'max-content';
    const w = fname.getBoundingClientRect().width;
    fname.style.width = '';
    fname.style.fontSize = (100 * avail) / w + 'px';
  }
  const fitAll = () => { fitWordmark(); fitFootName(); };
  fitAll();
  addEventListener('resize', fitAll);
  document.fonts && document.fonts.ready.then(() => { fitAll(); window.ScrollTrigger && ScrollTrigger.refresh(); });

  if (!window.gsap) { root.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- SMOOTH SCROLL ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- DEAD LINKS + ANCHORS ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href');
    if (id === '#') return;                      // no projects or profiles yet
    const target = id === '#top' ? 0 : $(id);
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
  });

  /* ---------- GRADIENTS ---------- */
  const heroG = window.createGradient($('.hero__gl'), { scale: 0.5 });
  const footG = window.createGradient($('.foot__gl'), { scale: 0.4, variant: 'foot' });
  if (footG) footG.state.intro = 1;
  const t0 = performance.now();
  gsap.ticker.add(() => {
    const s = reduce ? 0 : (performance.now() - t0) / 1000;
    heroG && heroG.render(s);
    footG && footG.render(s + 30);
  });
  const movers = [heroG, footG].filter(Boolean).map((g) => ({
    x: gsap.quickTo(g.state, 'mouseX', { duration: 2.2, ease: 'power3.out' }),
    y: gsap.quickTo(g.state, 'mouseY', { duration: 2.2, ease: 'power3.out' }),
  }));
  addEventListener('pointermove', (e) => movers.forEach((m) => { m.x(e.clientX / innerWidth); m.y(e.clientY / innerHeight); }));

  /* ---------- WORD SPLIT ---------- */
  $$('[data-split]').forEach((el) => {
    const out = [];
    el.childNodes.forEach((n) => {
      const isEm = n.nodeName === 'EM';
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(' '); return; }
        out.push(`<span class="w">${isEm ? `<em>${part}</em>` : part}</span>`);
      });
    });
    el.innerHTML = out.join('');
  });

  const chars = $$('.wordmark .ch');
  // flipped glyphs keep their mirror while GSAP owns the transform
  chars.forEach((c) => gsap.set(c, { scaleX: c.classList.contains('ch--flip') ? -1 : 1 }));
  gsap.set(['.hero__head', '.wordmark', '.hero__bar'], { autoAlpha: 1 });

  if (reduce) {
    $$('.loader, .loader-trail').forEach((el) => el.remove());
    if (heroG) heroG.state.intro = 1;
    $$('.skills__group li').forEach((li) => li.classList.add('is-on'));
    return;
  }

  /* ---------- INTRO: same sequence as the live page ---------- */
  // loader counts up, panels wipe away, then the background breathes in
  // and STUDIO MILAD rises letter by letter from the centre, out of a blur
  lenis && lenis.stop();
  root.classList.add('is-loading');
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  if (heroG) intro.to(heroG.state, { intro: 1, duration: PHI, ease: 'power2.out' }, 0);
  intro
    .from(chars, {
      yPercent: 105,
      filter: 'blur(10px)',
      duration: PHI,
      stagger: { each: 0.1 / PHI, from: 'center' },
    }, 1 / PHI)
    .from('.tl__in', {
      yPercent: 110,
      rotate: 6,
      transformOrigin: '0% 100%',
      filter: 'blur(8px)',
      duration: PHI,
      stagger: 0.04,
    }, 1 / PHI ** 2)
    .from(['.hero__bar', '.hh--nav'], { autoAlpha: 0, duration: 1, ease: 'sine.out' }, PHI)
    .add(() => $$('.hero__bar .gl').forEach((g, i) => distort(g, 0.3 + i * 0.035)), PHI)
    .add(startIdle);

  runLoader(document.fonts ? document.fonts.ready : Promise.resolve(), () => {
    root.classList.remove('is-loading');
    lenis && lenis.start();
    intro.play();
  });

  function startIdle() {
    gsap.to('.grain', {
      x: () => gsap.utils.random(-80, 80), y: () => gsap.utils.random(-80, 80),
      duration: 0.08, repeat: -1, repeatRefresh: true, ease: 'steps(1)',
    });
    // now and then a few letters in the bar glitch
    (function glitch() {
      gsap.delayedCall(gsap.utils.random(0.8, 3), () => {
        const letters = $$('.hero__bar .gl').filter((g) => g.dataset.c.trim());
        const k = gsap.utils.random(1, 3, 1);
        for (let i = 0; i < k; i++) distort(gsap.utils.random(letters), gsap.utils.random(0.15, 0.45));
        glitch();
      });
    })();
  }

  /* ---------- LETTER DISTORTION (from the live page) ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=?';
  function distort(g, duration) {
    if (!g || g.dataset.busy) return;
    g.dataset.busy = '1';
    g.style.width = g.getBoundingClientRect().width + 'px';
    g.style.textAlign = 'center';
    const r = gsap.utils.random;
    const tl = gsap.timeline({
      onComplete() {
        g.textContent = g.dataset.c;
        gsap.set(g, { clearProps: 'transform' });
        g.style.width = '';
        delete g.dataset.busy;
      },
    });
    for (let t = 0; t < duration; t += 0.05) {
      tl.call(() => {
        if (g.dataset.c.trim()) g.textContent = r(GLYPHS.split(''));
        gsap.set(g, { scaleX: Math.random() < 0.3 ? -1 : 1, skewX: r(-20, 20), scaleY: r(0.7, 1.4) });
      }, null, t);
    }
    tl.call(() => {}, null, duration);
  }

  /* ---------- HERO OUT ---------- */
  // everything in the hero leaves together (no overlap with the bar), the gradient stays
  gsap.to(['.hero__head', '.wordmark', '.hero__bar'], {
    yPercent: -18, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  // the fixed nav takes over once the hero's own nav is gone
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom 20%',
    onToggle: (self) => $('.topnav').classList.toggle('is-on', self.isActive),
    end: () => '+=' + document.documentElement.scrollHeight,
  });

  /* ---------- ABOUT: the live page's portrait, painted in on scroll ---------- */
  const stage = $('.stage');
  const bg = $('.layer--bg'), pers = $('.layer--pers'), splash = $('.layer--splash');
  gsap.timeline({ defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: '.about', start: 'top 85%' } })
    .from(bg, { scale: 1 + 1 / PHI ** 3, autoAlpha: 0, filter: 'blur(21px)', duration: PHI })
    .from(pers, { autoAlpha: 0, yPercent: 3, filter: 'blur(13px)', duration: PHI ** 2, ease: 'sine.inOut' }, 1 / PHI ** 2)
    .fromTo(splash,
      { clipPath: 'inset(0 100% 0 0)', scale: 1 + 1 / PHI ** 4, rotate: -8, transformOrigin: '50% 50%' },
      { clipPath: 'inset(0 0% 0 0)', scale: 1, rotate: 0, duration: 1, ease: 'power4.inOut' }, 1)
    .add(() => gsap.to(splash, { rotate: 2.5, scale: 1.03, duration: 2 * PHI, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

  // pointer parallax per layer (Fibonacci depths)
  const depth = [[bg, 0], [pers, 13], [splash, 34]].map(([el, d]) => ({
    x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    d,
  }));
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    depth.forEach((l) => { l.x(nx * l.d); l.y(ny * l.d); });
  });
  stage.addEventListener('pointerleave', () => depth.forEach((l) => { l.x(0); l.y(0); }));
  // click repaints the splash
  stage.addEventListener('click', () => {
    gsap.timeline()
      .to(splash, { clipPath: 'inset(0 0 0 100%)', duration: 0.35, ease: 'power3.in' })
      .set(splash, { clipPath: 'inset(0 100% 0 0)' })
      .to(splash, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power4.out' });
  });

  // the portrait grows as it scrolls in (not full screen), photo eases from a closer crop
  gsap.timeline({ scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'center center', scrub: 1 } })
    .fromTo('.about__media', { scale: 0.62, y: 80 }, { scale: 1, y: 0, ease: 'power2.out' }, 0)
    .fromTo('.stage', { clipPath: 'inset(6% 6% 6% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out' }, 0)
    .fromTo('.about__text', { y: 120 }, { y: 0, ease: 'power2.out' }, 0);

  $$('[data-split]').forEach((el) => {
    gsap.fromTo($$('.w', el), { opacity: 0.15 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 60%', scrub: true },
    });
  });
  gsap.from('.about__body, .about__text .link-arrow', {
    y: 24, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.about__body', start: 'top 90%' },
  });

  /* ---------- WORK ---------- */
  gsap.from('.section-title, .work__empty-text', {
    y: 40, autoAlpha: 0, duration: PHI, ease: 'expo.out', stagger: 0.15,
    scrollTrigger: { trigger: '.work', start: 'top 80%' },
  });

  /* ---------- SKILLS ---------- */
  // the big title comes out of a blur as you scroll to it
  gsap.fromTo('.skills__title span', { filter: 'blur(24px)', autoAlpha: 0.4, yPercent: 20 }, {
    filter: 'blur(0px)', autoAlpha: 1, yPercent: 0, ease: 'none', stagger: 0.15,
    scrollTrigger: { trigger: '.skills__intro', start: 'top 85%', end: 'bottom 45%', scrub: true },
  });
  // each skill lights up while it passes the middle of the screen
  $$('.skills__group li').forEach((li) => {
    ScrollTrigger.create({ trigger: li, start: 'top 62%', end: 'bottom 38%', toggleClass: 'is-on' });
  });
  gsap.fromTo('.skills__paint', { rotate: -12, scale: 1.1 }, {
    rotate: 14, scale: 1.45, ease: 'none',
    scrollTrigger: { trigger: '.skills__body', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* ---------- FOOTER ---------- */
  gsap.from('.foot__sm, .foot__year', {
    yPercent: 30, autoAlpha: 0, duration: PHI, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.foot__main', start: 'top 80%' },
  });
  gsap.from('.foot__info > div', {
    y: 20, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.foot__info', start: 'top 85%' },
  });
  // the closing panel slides out from under the footer
  gsap.fromTo(['.foot__gl', '.foot__name'], { yPercent: -35 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.foot__end', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  /* ---------- LOADER (from the live page) ---------- */
  function runLoader(whenReady, onReveal) {
    const loader = $('.loader');
    const trail = $('.loader-trail');
    const count = $('.loader__count');
    const [top, next] = count.children;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const pad = (n) => ('  ' + n).slice(-3);
    const fill = (el, n) => { el.innerHTML = [...pad(n)].map((d) => `<span>${d}</span>`).join(''); };
    const jitter = (n) => n - 2 + Math.round(4 * Math.random());
    const a = jitter((2 + Math.ceil(2 * Math.random())) * 10);
    const b = jitter((6 + Math.ceil(3 * Math.random())) * 10);
    fill(top, 0);
    fill(next, 0);

    async function set(n) {
      fill(next, n);
      top.classList.toggle('max-top', n === 100);
      next.classList.toggle('max-val', n === 100);
      void count.offsetWidth;
      top.classList.add('flip');
      next.classList.add('flip');
      count.style.transform = `translate3d(0, calc(${n / 100} * (-100dvh + 2 * var(--s3) + 0.875em)), 0)`;
      await wait(1400);
      fill(top, n);
      top.classList.remove('flip');
      next.classList.remove('flip');
    }

    (async () => {
      await wait(500);
      await set(a);
      await wait(50);
      await set(b);
      await wait(50);
      await Promise.race([whenReady, wait(3000)]);
      await set(100);
      loader.classList.add('is-out');
      trail.classList.add('is-out');
      gsap.delayedCall(0.3, onReveal);
      await wait(1250 + 130 + 200);
      loader.remove();
      trail.remove();
    })();
  }
})();
