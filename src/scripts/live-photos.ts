// Live Photo clips: short, silent loops. They load only when they are about to play.
const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-live]')];

function load(v: HTMLVideoElement) {
  if (v.dataset.loaded) return;
  for (const [type, src] of [['video/webm', v.dataset.webm], ['video/mp4', v.dataset.mp4]] as const) {
    if (!src) continue;
    const s = document.createElement('source');
    s.src = src;
    s.type = type;
    v.append(s);
  }
  v.load();
  v.dataset.loaded = '1';
}

async function play(v: HTMLVideoElement) {
  load(v);
  try {
    await v.play();
    v.classList.add('is-playing');
  } catch {
    /* Autoplay can be blocked. The still image stays. */
  }
}

function stop(v: HTMLVideoElement) {
  v.pause();
  v.currentTime = 0;
  v.classList.remove('is-playing');
}

if (!saveData) {
  // The hero clip plays by itself, once the page has finished loading so it never delays the photo.
  const hero = videos.filter((v) => v.hasAttribute('data-autoplay'));
  const start = () => hero.forEach((v) => play(v));
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });

  // Gallery clips: on hover for mouse users, when mostly in view on phones.
  const gallery = videos.filter((v) => !v.hasAttribute('data-autoplay'));
  if (matchMedia('(hover: hover)').matches) {
    gallery.forEach((v) => {
      const tile = v.closest('li');
      tile?.addEventListener('pointerenter', () => play(v));
      tile?.addEventListener('pointerleave', () => stop(v));
    });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play(e.target as HTMLVideoElement) : stop(e.target as HTMLVideoElement)));
    }, { threshold: 0.65 });
    gallery.forEach((v) => io.observe(v));
  }
}
