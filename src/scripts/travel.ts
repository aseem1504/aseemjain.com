import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.querySelector<HTMLElement>('[data-travel]');
if (root) {
  const order = ['india', 'sea', 'europe'];
  const routes = (g: string) => [...root.querySelectorAll<SVGPathElement>(`.route[data-group="${g}"]`)];
  const pins = (g: string) => [...root.querySelectorAll<SVGGElement>(`.pin[data-group="${g}"]`)];

  // Start hidden, then draw India first, then Southeast Asia, then Europe as the map scrolls into view.
  gsap.set(root.querySelectorAll('.route'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(root.querySelectorAll('.pin .spot'), { scale: 0, transformOrigin: 'center', svgOrigin: undefined });

  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 72%', once: true } });
  order.forEach((g, i) => {
    tl.to(routes(g), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.07 }, i === 0 ? 0 : '>-0.35');
    tl.to(pins(g).map((p) => p.querySelector('.spot')), { scale: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.05 }, '<0.35');
  });

  // Hovering a place chip lights its pin on the map.
  root.querySelectorAll<HTMLElement>('[data-chip]').forEach((chip) => {
    const pin = root.querySelector(`.pin[data-place="${chip.dataset.chip}"]`);
    const on = () => pin?.classList.add('is-hot');
    const off = () => pin?.classList.remove('is-hot');
    chip.addEventListener('pointerenter', on);
    chip.addEventListener('pointerleave', off);
    chip.addEventListener('focus', on);
    chip.addEventListener('blur', off);
  });
}
