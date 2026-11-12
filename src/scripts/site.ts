// Small, dependency-light client script for the whole site.
// GSAP and Lenis are loaded lazily and only when needed.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/* ---------- Nav ---------- */
const nav = $('#nav');
const onScroll = () => nav?.classList.toggle('is-scrolled', scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

const menuBtn = $('[data-menu-toggle]');
const menu = $('#menu');
menuBtn?.addEventListener('click', () => {
  const open = menu?.classList.toggle('hidden') === false;
  menuBtn.setAttribute('aria-expanded', String(open));
});
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => { menu?.classList.add('hidden'); menuBtn?.setAttribute('aria-expanded', 'false'); }));

/* ---------- Reveal on scroll ---------- */
const revealEls = $$('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (e.target as HTMLElement).classList.add('is-in');
      io.unobserve(e.target);
    }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealEls.forEach((el, i) => { (el as HTMLElement).style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el); });
}

/* ---------- Count-up numbers ---------- */
function format(el: HTMLElement, v: number) {
  const dec = Number(el.dataset.decimals ?? 0);
  const n = v.toLocaleString(el.dataset.locale ?? 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return `${el.dataset.prefix ?? ''}${n}${el.dataset.suffix ?? ''}`;
}
function countUp(el: HTMLElement) {
  const to = Number(el.dataset.to);
  const from = Number(el.dataset.from ?? 0);
  const t0 = performance.now(), dur = 1100;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = format(el, from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counters = $$('[data-count]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    countUp(e.target as HTMLElement);
  }), { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));
}

/* ---------- Lens switcher ---------- */
const lensRoot = $('[data-lens-root]');
if (lensRoot) {
  const valid = ['product', 'strategy', 'consulting', 'gm', 'ai'];
  const tabs = $$<HTMLButtonElement>('[data-lens-tab]', lensRoot);
  const bodies = $$('[data-lens-body]', lensRoot);
  const underline = $<HTMLElement>('[data-lens-underline]', lensRoot);
  const panel = $('[data-lens-panel]', lensRoot);

  const moveUnderline = (tab: HTMLElement) => {
    if (!underline) return;
    underline.style.width = `${tab.offsetWidth}px`;
    underline.style.height = `${tab.offsetHeight}px`;
    underline.style.top = `${tab.offsetTop}px`;
    underline.style.transform = `translateX(${tab.offsetLeft}px)`;
  };

  function setLens(id: string, { animate = true, push = true } = {}) {
    if (!valid.includes(id)) id = 'product';
    const tab = tabs.find((t) => t.dataset.lensTab === id)!;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel?.setAttribute('aria-labelledby', tab.id);
    moveUnderline(tab);

    const apply = () => lensRoot!.setAttribute('data-active-lens', id);
    if (animate && !reduceMotion) {
      bodies.forEach((b) => b.classList.add('is-swapping'));
      setTimeout(() => {
        apply();
        // Cards settle one after another.
        bodies.forEach((b, i) => { (b as HTMLElement).style.transitionDelay = `${i * 55}ms`; });
        requestAnimationFrame(() => bodies.forEach((b) => b.classList.remove('is-swapping')));
        setTimeout(() => bodies.forEach((b) => { (b as HTMLElement).style.transitionDelay = ''; }), 700);
      }, 170);
    } else apply();

    if (push) {
      const url = new URL(location.href);
      if (id === 'product') url.searchParams.delete('lens'); else url.searchParams.set('lens', id);
      history.replaceState(null, '', url);
    }
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setLens(t.dataset.lensTab!));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      let j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      tabs[j].focus();
      setLens(tabs[j].dataset.lensTab!);
    });
  });

  const initial = new URLSearchParams(location.search).get('lens') ?? 'product';
  setLens(initial, { animate: false, push: false });
  if (initial !== 'product' && valid.includes(initial) && location.hash === '') {
    // A shared lens link should land on the work section.
    requestAnimationFrame(() => $('#work')?.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }
  addEventListener('resize', () => moveUnderline(tabs.find((t) => t.getAttribute('aria-selected') === 'true')!));
  document.fonts?.ready.then(() => moveUnderline(tabs.find((t) => t.getAttribute('aria-selected') === 'true')!));
}

/* ---------- Copy email ---------- */
$$('[data-copy]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy') ?? '';
    try { await navigator.clipboard.writeText(text); } catch { return; }
    const label = btn.querySelector('[data-copy-label]') ?? btn;
    const old = label.textContent;
    label.textContent = 'Copied';
    setTimeout(() => (label.textContent = old), 1600);
  }),
);

/* ---------- Smooth scroll (desktop pointers only) ---------- */
if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
  import('lenis').then(({ default: Lenis }) => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // Keep in-page anchors smooth and keep scroll-padding for the sticky nav.
    document.addEventListener('click', (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72 });
      history.replaceState(null, '', url.hash);
    });
    (window as unknown as { __lenis: unknown }).__lenis = lenis;
  });
}

/* ---------- Section-specific motion, loaded only when present ---------- */
if (!reduceMotion) {
  // If a module fails to load, fall back to the plain, fully visible layout.
  if ($('[data-timeline]')) {
    import('./timeline.ts').catch(() => $$('[data-tl-item]').forEach((i) => i.classList.add('is-in')));
  }
  if ($('[data-travel]')) {
    import('./travel.ts').catch(() => $('[data-travel]')?.classList.add('is-drawn'));
  }
  import('./motion.ts').catch(() => $$('[data-rise]').forEach((e) => { e.style.opacity = '1'; }));
  if ($$('video[data-live]').length) import('./live-photos.ts').catch(() => {});
}
