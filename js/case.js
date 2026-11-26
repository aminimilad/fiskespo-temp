(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* rolling links, as on the front page */
  $$('.topnav__links a, .case__back, .case__visit').forEach((a) => {
    const t = a.textContent;
    a.innerHTML = `<span class="roll"><span data-t="${t}">${t}</span></span>`;
  });

  /* phone menu */
  const burger = $('.burger');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $('.menu').addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* gallery (luke-baffait): wheel or drag moves the strip; the thumbnail nearest the middle
     grows, lights up and fills the big frame */
  const strip = $('.case__thumbs');
  const inner = $('.case__thumbs-in');
  const thumbs = $$('button', inner);
  const [selA, selB] = $$('.case__sel img');
  let y = 0, target = 0, min = 0, max = 0, active = -1, front = selA, back = selB;

  function measure() {
    const h = strip.clientHeight;
    const first = thumbs[0].offsetHeight;
    const last = thumbs[thumbs.length - 1];
    inner.style.paddingBlock = `${h / 2 - first / 2}px`;
    max = 0;
    min = -(last.offsetTop + last.offsetHeight / 2 - thumbs[0].offsetTop - first / 2);
    target = Math.min(max, Math.max(min, target));
  }

  function show(i) {
    if (i === active) return;
    active = i;
    thumbs.forEach((t, k) => t.classList.toggle('is-on', k === i));
    const src = thumbs[i].querySelector('img').src;
    if (front.src === src) return;
    back.src = src;
    back.alt = front.alt;
    [front, back] = [back, front];
    if (reduce || !window.gsap) { front.style.opacity = 1; back.style.opacity = 0; return; }
    gsap.set(front, { zIndex: 2 });
    gsap.set(back, { zIndex: 1 });
    gsap.fromTo(front, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', overwrite: true });
  }

  function frame() {
    y += (target - y) * (reduce ? 1 : 0.1);
    inner.style.transform = `translate3d(0, ${y}px, 0)`;
    const box = strip.getBoundingClientRect();
    const mid = box.top + box.height / 2;
    let best = 0, bestD = Infinity;
    thumbs.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
      const k = Math.max(0, 1 - d / (box.height * 0.45)) ** 3;
      t.style.width = `${72 + k * 28}%`;
    });
    show(best);
    requestAnimationFrame(frame);
  }

  const desktop = matchMedia('(min-width: 861px)');
  if (strip && thumbs.length) {
    measure();
    addEventListener('resize', measure);
    $$('img', inner).forEach((img) => img.complete || img.addEventListener('load', measure, { once: true }));
    const move = (dy) => { target = Math.min(max, Math.max(min, target - dy)); };
    // wheel anywhere over the gallery side moves the strip
    addEventListener('wheel', (e) => {
      if (!desktop.matches || e.target.closest('.case__info')) return;
      e.preventDefault();
      move(e.deltaY * 0.6);
    }, { passive: false });
    let dragY = null;
    strip.addEventListener('pointerdown', (e) => { dragY = e.clientY; strip.setPointerCapture(e.pointerId); });
    strip.addEventListener('pointermove', (e) => { if (dragY === null) return; move(dragY - e.clientY); dragY = e.clientY; });
    strip.addEventListener('pointerup', () => { dragY = null; });
    thumbs.forEach((t, i) => t.addEventListener('click', () => {
      target = Math.min(max, Math.max(min, -(t.offsetTop - thumbs[0].offsetTop)));
      show(i);
    }));
    requestAnimationFrame(frame);
  }

  /* arrival: fade in, then the title rises */
  const go = () => {
    window.pageArrive && window.pageArrive();
    if (reduce || !window.gsap) return;
    gsap.from('.case__mask > span', { yPercent: 110, duration: 1.4, ease: 'expo.out', delay: 0.15 });
    gsap.from(['.case__year', '.case__lede', '.case__meta', '.case__story', '.case__visit', '.case__back'], {
      autoAlpha: 0, y: 20, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.3,
    });
    gsap.from(['.case__sel', '.case__thumbs', '.case__stack'], { autoAlpha: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 });
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(go);
})();
