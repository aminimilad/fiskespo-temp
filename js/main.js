(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const PHI = 1.618;

  /* ---------- ROLLING LINKS ---------- */
  $$('.topnav__links a, .hh--nav a, .hero > .hero__bar .hero__social a, .hero > .hero__bar .hero__down, .foot__info dd a, .foot__nav a').forEach((a) => {
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

  /* ---------- CHAR SPLIT (keeps <em>, words never break) ---------- */
  function splitChars(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'word';
            for (const c of part) {
              const ch = document.createElement('span');
              ch.className = 'char';
              ch.textContent = c;
              w.appendChild(ch);
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }
  $$('[data-chars], [data-letters], .shuf').forEach(splitChars);
  // the S of "Studio" is mirrored, like the logo
  $$('.name').forEach((n) => n.querySelector('.char').classList.add('flip'));

  /* ---------- FIT: STUDIO MILAD fills the width (one line), or two centred lines on a phone ---------- */
  function fitName(el) {
    const box = el.parentElement;
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
    const w = el.getBoundingClientRect().width;
    el.style.width = '';
    el.style.fontSize = (100 * avail * 0.995) / w + 'px';
  }
  const fitAll = () => $$('.name').forEach(fitName);
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
  const footG = window.createDance($('.foot__gl'), { scale: 0.22 });
  const t0 = performance.now();
  gsap.ticker.add(() => {
    const s = reduce ? 0 : (performance.now() - t0) / 1000;
    heroG && heroG.render(s);
    footG && footG.render(s + 12);
  });
  const movers = [heroG].filter(Boolean).map((g) => ({
    x: gsap.quickTo(g.state, 'mouseX', { duration: 2.2, ease: 'power3.out' }),
    y: gsap.quickTo(g.state, 'mouseY', { duration: 2.2, ease: 'power3.out' }),
  }));
  addEventListener('pointermove', (e) => movers.forEach((m) => { m.x(e.clientX / innerWidth); m.y(e.clientY / innerHeight); }));

  const chars = $$('.hero .name .char');
  // mirrored glyphs keep their mirror while GSAP owns the transform
  $$('.name .char.flip').forEach((c) => gsap.set(c, { scaleX: -1 }));
  gsap.set(['.hero > .hero__head', '.wordmark', '.hero > .hero__bar', '.hero > .rule'], { autoAlpha: 1 });
  // phones get art-yakushev's mobile intro: whole lines rise instead of single letters
  const phone = matchMedia('(max-width: 860px)').matches;

  if (reduce) {
    window.__introStarted = true;
    $$('.loader, .loader-trail').forEach((el) => el.remove());
    if (heroG) heroG.state.intro = 1;
    $$('.shuf .char').forEach((c) => (c.style.opacity = 1));
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
  if (phone) intro.from('.hero .name .word', { yPercent: 130, duration: 1.8, stagger: { each: 0.12 }, ease: 'expo.inOut' }, 0.2);
  else intro.from(chars, {
    yPercent: 105,
    filter: 'blur(10px)',
    duration: PHI,
    stagger: { each: 0.1 / PHI, from: 'center' },
  }, 1 / PHI);
  intro
    .from('.hero .tl__in', {
      yPercent: 110,
      rotate: 6,
      transformOrigin: '0% 100%',
      filter: 'blur(8px)',
      duration: PHI,
      stagger: 0.04,
    }, 1 / PHI ** 2)
    .from(['.hero > .hero__bar > *', '.hero .hh--nav a'], { autoAlpha: 0, duration: 1, ease: 'sine.out' }, PHI)
    .fromTo('.hero > .rule', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, PHI + 0.2)
    .add(() => $$('.hero > .hero__bar .gl').forEach((g, i) => distort(g, 0.3 + i * 0.035)), PHI)
    .add(startIdle);

  window.__introStarted = true;
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
        const letters = $$('.hero > .hero__bar .gl').filter((g) => g.dataset.c.trim());
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
  gsap.fromTo(['.hero > .hero__head', '.wordmark', '.hero > .rule', '.hero > .hero__bar'], { yPercent: 0, autoAlpha: 1 }, {
    yPercent: -18, autoAlpha: 0, ease: 'none', immediateRender: false,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  // the fixed nav takes over once the hero's own nav is gone
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom 20%',
    // ...and steps aside again on the closing screen, which has its own copy of the hero nav
    onToggle: (self) => $('.topnav').classList.toggle('is-on', self.isActive),
    endTrigger: '.foot__end', end: 'top 40%',
  });

  /* ---------- ABOUT (art-yakushev, same values) ---------- */
  const mm = gsap.matchMedia();
  // the statement: letter by letter out of a blur, scrubbed
  // (desktop: per letter with blur, as art-yakushev; phones: per word, opacity only,
  //  since 100+ blurred layers can make iOS Safari run out of memory and reload)
  mm.add('(min-width: 861px) and (hover: hover)', () => {
    const titleChars = $$('.about__title .char');
    gsap.fromTo(titleChars, { opacity: 0, filter: 'blur(10px)' }, {
      opacity: 1, filter: 'blur(0px)', ease: 'power1.out', duration: 1, stagger: { amount: 0.8 },
      scrollTrigger: { trigger: '.about__title', start: 'top 80%', end: 'bottom 20%', scrub: 0.15 },
    });
  });
  mm.add('(max-width: 860px), (hover: none)', () => {
    gsap.fromTo($$('.about__title .word'), { opacity: 0.08 }, {
      opacity: 1, ease: 'none', stagger: { amount: 0.8 },
      scrollTrigger: { trigger: '.about__title', start: 'top 85%', end: 'bottom 45%', scrub: 0.15 },
    });
  });
  mm.add('(min-width: 861px)', () => {
    // info: out of a heavy blur
    gsap.fromTo('.about__info', { filter: 'blur(20px)', opacity: 0 }, {
      filter: 'blur(0px)', opacity: 1, ease: 'power1.out',
      scrollTrigger: { trigger: '.about__info', start: 'top 95%', end: 'bottom 90%', scrub: true },
    });
    // the photo drifts down slower than the page, the picture inside even slower
    gsap.timeline({ scrollTrigger: { trigger: '.about', start: 'top 90%', end: 'bottom -20%', scrub: 0.5 } })
      .to('.about__photo', { y: () => innerHeight * 0.32, ease: 'none' })
      .to('.about__img', { y: () => innerHeight * 0.22, ease: 'none' }, '<');
  });
  mm.add('(max-width: 860px)', () => {
    gsap.fromTo('.about__info', { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, ease: 'power1.out',
      scrollTrigger: { trigger: '.about__info', start: 'top 100%', end: 'top 75%', scrub: true },
    });
    gsap.to('.about__img', {
      y: () => innerHeight * 0.08, ease: 'none',
      scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    });
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
  gsap.from('.foot__info > div, .foot__nav, .foot__copy', {
    y: 24, autoAlpha: 0, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.foot__content', start: 'top 85%' },
  });

  // closing screen, as on art-yakushev: the name rises from the centre out,
  // then the small texts shuffle in letter by letter
  function shuffleIn(el, speed = 1, shuffleFor = 0.4) {
    const cs = $$('.char', el);
    const orig = cs.map((c) => c.textContent);
    let iv = null;
    const putBack = () => { clearInterval(iv); iv = null; cs.forEach((c, i) => (c.textContent = orig[i])); };
    const tl = gsap.timeline({ onComplete: putBack });
    tl.call(() => {
      putBack();
      iv = setInterval(() => {
        const s = orig.slice();
        for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
        cs.forEach((c, i) => (c.textContent = s[i]));
      }, 100);
    }, null, 0);
    cs.forEach((c, i) => tl.call(() => (c.style.opacity = '1'), null, i * 0.04 * speed));
    tl.call(putBack, null, Math.max(shuffleFor, cs.length * 0.04 * speed));
    tl.to({}, { duration: 0.3 });
    return tl;
  }
  const endChars = $$('.foot__name .char');
  const end = gsap.timeline({ paused: true });
  end
    .from(phone ? $$('.foot__name .word') : endChars, phone
      ? { yPercent: 130, duration: 1.8, delay: 0.2, ease: 'expo.inOut', stagger: { each: 0.12 } }
      : { yPercent: 150, duration: 1.5, ease: 'expo.inOut', stagger: { from: 'center', each: 0.03 } }, 0)
    .fromTo('.foot__end .rule', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', immediateRender: true }, 1.3)
    .from('.foot__head .tl__in', {
      yPercent: 110, rotate: 6, transformOrigin: '0% 100%', filter: 'blur(8px)',
      duration: PHI, ease: 'expo.out', stagger: 0.04,
    }, 0.2)
    .from('.foot__head .hh--nav', { autoAlpha: 0, duration: 1, ease: 'sine.out' }, 0.8)
    .from('.foot__bar .clock', { autoAlpha: 0, duration: 0.6 }, 1.4);
  const shufs = $$('.foot__bar .shuf');
  [[0, 1.0, 0.6, 1.2], [1, 0.5, 0.7, 1.5], [2, 0.5, 0.7, 1.6], [3, 0.5, 0.7, 1.7], [4, 1.3, 0.7, 1.9]].forEach(([i, sp, d, at]) => {
    if (shufs[i]) end.add(() => shuffleIn(shufs[i], sp, d), at);
  });
  ScrollTrigger.create({
    trigger: '.foot__name', start: 'top 100%',
    onEnter: () => end.restart(),
    onLeaveBack: () => {
      end.pause(0);
      $$('.foot__bar .shuf .char').forEach((c) => (c.style.opacity = ''));
    },
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
