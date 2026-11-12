// Scroll and pointer motion. Loaded only when the visitor has not asked for reduced motion.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* 1. Reading progress, a thin line across the top. */
const bar = document.querySelector<HTMLElement>('[data-progress]');
if (bar) {
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; } });
}

/* 2. The portrait drifts slower than the page. */
$$('[data-parallax]').forEach((img) => {
  const frame = img.closest('.portrait');
  if (!frame) return;
  gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* 3. Section headings rise word by word. */
function splitWords(el: Element) {
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      (node.textContent ?? '').split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const mask = document.createElement('span');
        mask.className = 'w-mask';
        const word = document.createElement('span');
        word.className = 'w-in';
        word.textContent = part;
        mask.append(word);
        frag.append(mask);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1) {
      splitWords(node as Element);
    }
  }
}
$$('[data-split]').forEach((h) => {
  splitWords(h);
  gsap.fromTo(h.querySelectorAll('.w-in'), { yPercent: 110 }, {
    yPercent: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: h, start: 'top 90%', once: true },
  });
});

/* 4. Cards rise in together, one after another. */
const rise = $$('[data-rise]');
if (rise.length) {
  gsap.set(rise, { opacity: 0, y: 40 });
  ScrollTrigger.batch(rise, {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1 }),
  });
}

if (finePointer) {
  /* 5. Work cards lean toward the pointer. */
  $$('.case').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: x * 5, rotateX: -y * 4, transformPerspective: 900, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' }));
  });

  /* 6. Primary buttons pull slightly toward the pointer. */
  $$('.btn-primary').forEach((btn) => {
    const qx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const qy = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.18);
      qy((e.clientY - (r.top + r.height / 2)) * 0.28);
    });
    btn.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
}

/* 7. The ticker speeds up while you scroll, then settles. */
const marquee = document.querySelector('.marquee-track');
const anim = marquee?.getAnimations()[0];
if (anim) {
  let rate = 1;
  ScrollTrigger.create({ onUpdate: (self) => { rate = 1 + Math.min(6, Math.abs(self.getVelocity()) / 350); } });
  gsap.ticker.add(() => {
    rate += (1 - rate) * 0.06;
    anim.playbackRate = rate;
  });
}
