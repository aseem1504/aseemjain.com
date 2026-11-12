import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.querySelector<HTMLElement>('[data-travel]');
if (root) {
  const world = root.querySelector<HTMLElement>('[data-panel="world"]')!;
  const india = root.querySelector<HTMLElement>('[data-panel="india"]')!;

  // India: the states fade in one after another when the map scrolls into view.
  const st = root.querySelectorAll('.st');
  gsap.set(st, { opacity: 0 });
  gsap.to(st, { opacity: 1, duration: 0.5, stagger: { each: 0.012, from: 'random' }, ease: 'power1.out', scrollTrigger: { trigger: india, start: 'top 78%', once: true } });

  // Abroad: routes draw from Southeast Asia to Europe the first time the tab opens.
  const order = ['sea', 'europe'];
  const routes = (g: string) => [...root.querySelectorAll<SVGPathElement>(`.route[data-group="${g}"]`)];
  const pins = (g: string) => [...root.querySelectorAll<SVGGElement>(`.pin[data-group="${g}"]`)];
  gsap.set(root.querySelectorAll('.route'), { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(root.querySelectorAll('.pin .spot'), { scale: 0, transformOrigin: 'center' });
  const tl = gsap.timeline({ paused: true });
  order.forEach((g, i) => {
    tl.to(routes(g), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.07 }, i === 0 ? 0 : '>-0.35');
    tl.to(pins(g).map((p) => p.querySelector('.spot')), { scale: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.05 }, '<0.35');
  });
  let played = false;
  document.addEventListener('travel:world-shown', () => { if (!played && !world.hidden) { played = true; tl.play(); } });
}
