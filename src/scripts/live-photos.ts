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
  if (matchMedia('(hover: hover)').matches) {
    // Desktop: play while the pointer is over the tile.
    videos.forEach((v) => {
      const tile = v.closest('li');
      tile?.addEventListener('pointerenter', () => play(v));
      tile?.addEventListener('pointerleave', () => stop(v));
    });
  } else if ('IntersectionObserver' in window) {
    // Phones: play when a tile is mostly in view.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play(e.target as HTMLVideoElement) : stop(e.target as HTMLVideoElement)));
    }, { threshold: 0.65 });
    videos.forEach((v) => io.observe(v));
  }
}
