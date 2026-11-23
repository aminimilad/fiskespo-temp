/* DJUPT — animations. GSAP 3 + ScrollTrigger. Respects prefers-reduced-motion. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Cart buttons (works without GSAP too) ---------- */
  const cart = $('.cart');
  let count = 0;
  $$('.add').forEach(btn => btn.addEventListener('click', () => {
    count += 1;
    cart.textContent = count;
    btn.textContent = 'Tillagd ✓';
    btn.classList.add('is-added');
    if (window.gsap && !reduce) gsap.fromTo(cart, { scale: 1.6 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  }));

  if (!window.gsap || reduce) {
    $$('.stat__n').forEach(n => { n.textContent = Number(n.dataset.count).toLocaleString('sv-SE'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Split headings into words/characters ---------- */
  $$('.split').forEach(h => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const wd = document.createElement('span'); wd.className = 'wd';
            [...part].forEach(c => { const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = c; wd.append(ch); });
            frag.append(wd);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
    gsap.from($$('.ch', h), {
      yPercent: 110, rotate: 6, duration: .9, ease: 'power4.out', stagger: .018,
      scrollTrigger: { trigger: h, start: 'top 85%' }
    });
  });

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  if (matchMedia('(hover: hover)').matches) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('pointermove', e => { gsap.set(cursor, { opacity: 1 }); xTo(e.clientX); yTo(e.clientY); });
    $$('a, button, .rod-card, .lure').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-big'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
    });
  }

  /* ---------- Hero intro ---------- */
  const line = $('.hero__line');
  const lineLen = line.getTotalLength();
  gsap.set(line, { strokeDasharray: lineLen, strokeDashoffset: lineLen });
  const bob = '.hero__bob';                                          // float + intro drop
  const bobInner = ['.hero__bobber', '.hero__leader', '.hero__hooklure']; // nibbles

  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('.nav', { y: -90, duration: 1 })
    .from('.hero__title .word', { yPercent: 115, duration: 1.1, stagger: .12 }, '<.1')
    .from('.hero__sun', { attr: { cy: 620 }, duration: 1.8, ease: 'power2.out' }, '<')
    .from('.hero__glow', { opacity: 0, duration: 2 }, '<')
    .from('.hero__rod', { rotate: 14, transformOrigin: '0% 100%', opacity: 0, duration: 1.4 }, '<.2')
    .to(line, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, '-=.6')
    .from(bob, { y: -260, opacity: 0, duration: .9, ease: 'bounce.out' }, '-=.3')
    .from('.hero__lead, .hero__ctas, .hero__scroll', { y: 30, opacity: 0, duration: .8, stagger: .1 }, '-=.6');

  // Bobber floats, ripples spread, now and then a nibble
  gsap.to(bob, { y: 6, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 4 });
  $$('.hero__ripples ellipse').forEach((el, i) => {
    gsap.fromTo(el, { attr: { rx: 20, ry: 4 }, opacity: .8 },
      { attr: { rx: 120, ry: 18 }, opacity: 0, duration: 3.6, ease: 'power1.out', repeat: -1, delay: 2.8 + i * 1.2 });
  });
  const nibble = gsap.timeline({ repeat: -1, repeatDelay: 4, delay: 6 })
    .to(bobInner, { y: 22, duration: .14, ease: 'power2.in' })
    .to(bobInner, { y: 0, duration: .5, ease: 'elastic.out(1.2, .4)' })
    .to('.hero__rod', { rotate: 1.4, transformOrigin: '0% 100%', duration: .14, yoyo: true, repeat: 1 }, 0);

  // Waves drift, the fish patrols, stars twinkle softly (no flashing)
  gsap.to('.hero__waves', { x: -120, duration: 6, ease: 'none', repeat: -1 });
  gsap.set('.hero__fish', { x: 1500, y: 660 });
  gsap.to('.hero__fish', { x: -300, duration: 22, ease: 'none', repeat: -1, delay: 1 });
  gsap.to('.hero__fish', { y: 690, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.hero__hooklure', { rotate: 8, transformOrigin: '50% 0%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  $$('.hero__stars circle').forEach(s => gsap.to(s, { opacity: .25, duration: gsap.utils.random(1.5, 3.5), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 2 }));

  // Pointer parallax on the scene
  const hero = $('.hero');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    gsap.to('.hero__sun, .hero__glow', { x: px * 30, y: py * 20, duration: 1.2, ease: 'power3' });
    gsap.to('.hero__forest', { x: px * -14, duration: 1.2, ease: 'power3' });
  });

  // Scroll out: title lifts, sun sinks
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__copy', { yPercent: -30, opacity: 0, ease: 'none' }, 0)
    .to('.hero__sun', { attr: { cy: 640 }, ease: 'none' }, 0)
    .to('.hero__rod', { rotate: -6, transformOrigin: '0% 100%', ease: 'none' }, 0);

  /* ---------- Ticker: speed follows scroll velocity ---------- */
  const track = $('.ticker__track');
  const tick = gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({
    onUpdate: self => {
      const v = self.getVelocity();
      dir = v < 0 ? -1 : 1;
      gsap.to(tick, { timeScale: dir * gsap.utils.clamp(1, 6, Math.abs(v) / 200), duration: .2, overwrite: true });
      gsap.to(tick, { timeScale: dir, duration: 1.2, delay: .25, overwrite: false });
    }
  });

  /* ---------- Rod cards ---------- */
  ScrollTrigger.batch('.rod-card', {
    start: 'top 88%',
    onEnter: batch => {
      gsap.from(batch, { y: 80, rotate: () => gsap.utils.random(-4, 4), opacity: 0, duration: .9, ease: 'power3.out', stagger: .12 });
      gsap.from(batch.map(c => $('.rod-card__img svg', c)), { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'power3.inOut', stagger: .12, delay: .2 });
    },
    once: true
  });
  $$('.rod-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      gsap.to(card, { rotateY: px * 8, rotateX: py * -8, transformPerspective: 900, duration: .5, ease: 'power3' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: .8, ease: 'elastic.out(1, .5)' }));
  });

  /* ---------- Waters: horizontal scroll on large screens ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const wtrack = $('.waters__track');
    const dist = () => wtrack.scrollWidth - window.innerWidth;
    const h = gsap.to(wtrack, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.waters', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
    $$('.water:not(.water--intro)').forEach(panel => {
      gsap.from($('.water__art', panel), { scale: .85, rotate: -3, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: h, start: 'left right', end: 'center center', scrub: true } });
      gsap.from($$('.water__text > *', panel), { y: 60, opacity: 0, stagger: .1, ease: 'power3.out', duration: .8,
        scrollTrigger: { trigger: panel, containerAnimation: h, start: 'left 60%' } });
    });
  });
  mm.add('(max-width: 760px)', () => {
    $$('.water').forEach(panel => gsap.from(panel.children, { y: 50, opacity: 0, stagger: .12, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 80%' } }));
  });
  // Living details inside the scenes
  $$('.swim').forEach((f, i) => gsap.to(f, { x: i % 2 ? -60 : 70, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  gsap.to('.flow path', { x: 40, opacity: 0, duration: 2.2, ease: 'none', stagger: { each: .3, repeat: -1 } });
  gsap.to('.jump', { y: -26, rotate: 6, transformOrigin: '50% 50%', duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.sea-waves', { x: 60, duration: 3, ease: 'none', repeat: -1 });
  gsap.to('.pimpel', { y: -28, duration: .9, ease: 'power2.inOut', yoyo: true, repeat: -1 });

  /* ---------- Reel: pinned exploded view ---------- */
  mm.add('(min-width: 761px)', () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.reel', start: 'top top', end: '+=140%', pin: '.reel__pin', scrub: 1 } });
    tl.from('.part--handle', { x: 300, ease: 'power2.out' }, 0)
      .from('.part--body', { x: 120, ease: 'power2.out' }, 0)
      .from('.part--rotor', { x: -60, ease: 'power2.out' }, 0)
      .from('.part--spool', { x: -200, ease: 'power2.out' }, 0)
      .from('.part--drag', { x: -330, ease: 'power2.out' }, 0)
      .from('.lbl', { y: 40, opacity: 0, stagger: .08 }, .3)
      .to('.part--spool', { rotate: 360, transformOrigin: '50% 50%', ease: 'none' }, .2)
      .to('.part--handle', { rotate: -25, transformOrigin: '100% 50%' }, .2);
  });
  mm.add('(max-width: 760px)', () => {
    gsap.from('.part', { x: (i) => (2 - i) * 60, opacity: 0, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.reel__svg', start: 'top 80%' } });
    gsap.from('.lbl', { y: 30, opacity: 0, stagger: .08, duration: .7, scrollTrigger: { trigger: '.reel__labels', start: 'top 90%' } });
  });

  /* ---------- Lures: drop in, then swing; swing harder with scroll ---------- */
  const hangs = $$('.lure__hang');
  gsap.from(hangs, { y: -260, duration: 1.2, ease: 'bounce.out', stagger: .1, scrollTrigger: { trigger: '.lures__row', start: 'top 80%' } });
  const swings = hangs.map((h, i) => gsap.fromTo(h, { rotate: -5 }, { rotate: 5, duration: 1.6 + i * .2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  ScrollTrigger.create({
    trigger: '.lures', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const s = gsap.utils.clamp(1, 3, 1 + Math.abs(self.getVelocity()) / 1500);
      swings.forEach(t => gsap.to(t, { timeScale: s, duration: .3, overwrite: true }));
    }
  });

  /* ---------- Stats count up ---------- */
  $$('.stat__n').forEach(n => {
    const end = Number(n.dataset.count), o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: n, start: 'top 85%' },
      onUpdate: () => { n.textContent = Math.round(o.v).toLocaleString('sv-SE'); } });
  });

  /* ---------- CTA + footer ---------- */
  gsap.from('.cta__big span', { xPercent: i => (i ? 40 : -40), opacity: 0, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 85%', end: 'top 30%', scrub: 1 } });
  gsap.fromTo('.foot__word', { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
