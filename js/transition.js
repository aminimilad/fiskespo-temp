/* Page transitions like art-yakushev: the page fades out to the background colour, the next one fades in.
   - Links to another page: veil in, then navigate. The next page starts under the veil ('is-arriving',
     set in its <head> from sessionStorage) and fades in once it is ready.
   - Links within the page (#work, ...): main.js calls pageVeil(jump) to fade out, jump and fade back in. */
(() => {
  const root = document.documentElement;
  const veil = document.createElement('div');
  veil.className = 'veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);
  const LEAVE = 600;

  const store = (v) => { try { v ? sessionStorage.setItem('ms-nav', '1') : sessionStorage.removeItem('ms-nav'); } catch (e) {} };

  // fade in: the page sets window.pageReady (a promise) when it wants to wait for something first
  window.pageArrive = () => {
    store(false);
    if (!root.classList.contains('is-arriving')) return;
    void veil.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-arriving')));
  };

  // fade out, run mid() (a jump), fade in
  window.pageVeil = (mid) => {
    root.classList.add('is-leaving');
    setTimeout(() => {
      mid();
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-leaving')));
    }, LEAVE);
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    store(true);
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, LEAVE);
  });

  // back/forward from the cache: never stay behind the veil
  addEventListener('pageshow', (e) => {
    if (e.persisted) root.classList.remove('is-leaving', 'is-arriving');
  });
})();
