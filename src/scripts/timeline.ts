import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.querySelector<HTMLElement>('[data-timeline]');
const fill = root?.querySelector<HTMLElement>('[data-tl-fill]');
const items = [...document.querySelectorAll<HTMLElement>('[data-tl-item]')];

if (root && fill) {
  // The line draws itself as you scroll through the timeline.
  gsap.set(fill, { scaleY: 0 });
  gsap.to(fill, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top 65%', end: 'bottom 70%', scrub: 0.35 },
  });
}

// Each role pops in when the line reaches it.
items.forEach((item) =>
  ScrollTrigger.create({ trigger: item, start: 'top 78%', once: true, onEnter: () => item.classList.add('is-in') }),
);
