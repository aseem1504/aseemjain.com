
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  // Theme
  $('#theme').onclick = () => { const l = document.documentElement.dataset.theme === 'light'; document.documentElement.dataset.theme = l ? 'dark' : 'light'; };

  // Reveal + spotlight
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); e.target.querySelectorAll('[data-n]').forEach(count); if (e.target.querySelector('.bars')) setBars(); } }), { threshold: .12 });
  $$('.tile').forEach((t, i) => { t.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(t); t.addEventListener('pointermove', e => { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px'); }); });
  function count(el) { const n = +el.dataset.n, d = n % 1 ? 1 : 0, t0 = performance.now(); (function s(now) { const p = Math.min(1, (now - t0) / 1500); el.textContent = (n * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }); if (p < 1) requestAnimationFrame(s); })(t0); }

  // Nav highlight
  const secs = ['hero', 'work', 'travel', 'photo', 'poetry', 'beats', 'contact'].map(id => $('#' + id));
  addEventListener('scroll', () => { let cur = 'hero'; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; }); $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur)); }, { passive: true });

  // Magnetic buttons
  $$('.mag').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; }); b.addEventListener('pointerleave', () => b.style.transform = ''); });

  // Typing roles
  const roles = ['Senior Product Manager', 'Data & AI builder', 'Fintech & payments', 'Poet & percussionist'];
  let ri = 0, ci = 0, del = false; const rEl = $('#roles');
  (function type() { const w = roles[ri]; ci += del ? -1 : 1; rEl.innerHTML = `<b>${w.slice(0, ci)}</b><span class="caret"></span>`; let t = del ? 35 : 70; if (!del && ci === w.length) { del = true; t = 1400; } else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; t = 300; } setTimeout(type, t); })();

  // Clock
  const clock = () => $('#clock').textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }); clock(); setInterval(clock, 15000);

  // Experience tabs
  const XP = [
    ['WheelsEye · Sr PM', 'Senior Product Manager · FASTag & payments · 2022–2025', ['Owned <b>₹3,600 Cr</b> annual volume and 1.5M active vehicles; led a 12-person pod.', 'Launched <b>postpaid credit in 60 days</b>; ₹2.5 Cr ARR by month 3.', 'Lifted <b>payment success from 72% to 87%</b> with dynamic routing.']],
    ['PCL Health', 'Product Manager · London · 2021–2022', ['Ran <b>remote-care pilots</b> across 10 NHS-affiliated hospitals.', 'Built an <b>OCR device reader</b> on Google Vision.', 'Introduced scrum; <b>delivery cycles 35% faster</b>.']],
    ['WheelsEye · Ops', 'Product Manager · Devices & operations · 2020–2021', ['Geo-based allocation engine for <b>2,800 daily orders</b>.', 'Cut cost per order by <b>22%</b> and churn by <b>22%</b>.', 'Saved <b>₹28L/month</b> in network and pilferage costs.']],
    ['Data & IoT', 'Analyst & engineer · 2018–2020', ['Signal-loss model at <b>96.7% accuracy</b> across 200K trucks.', 'Risk analytics POC that <b>onboarded two lenders</b>.', 'Behavioural features for borrowers with <b>no credit history</b>.']]
  ];
  $('#tabs').innerHTML = XP.map((x, i) => `<button class="${i ? '' : 'on'}" data-i="${i}">${x[0]}</button>`).join('');
  const showXp = i => { const x = XP[i]; $('#xp').innerHTML = `<div class="xp"><h3>${x[0]}</h3><small>${x[1]}</small><ul>${x[2].map(l => `<li>${l}</li>`).join('')}</ul></div>`; };
  $$('#tabs button').forEach(b => b.onclick = () => { $$('#tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); showXp(+b.dataset.i); }); showXp(0);

  // Map
  const ell = [[-100,45,40,22],[-42,72,14,8],[-60,-15,17,28],[15,52,22,12],[20,5,25,32],[90,45,50,22],[78,22,10,12],[110,10,14,12],[135,-25,20,12],[138,37,4,8]];
  const cities = { Delhi: [77.2, 28.6], London: [-0.1, 51.5], Copenhagen: [12.6, 55.7], Zurich: [8.5, 47.4], Tokyo: [139.7, 35.7], Dubai: [55.3, 25.2] };
  const px = ([lo, la]) => [lo + 180, 90 - la]; let dots = '';
  for (let lo = -178; lo < 180; lo += 4) for (let la = 84; la > -60; la -= 4) if (ell.some(([cx, cy, rx, ry]) => ((lo - cx) / rx) ** 2 + ((la - cy) / ry) ** 2 <= 1)) { const [x, y] = px([lo, la]); dots += `<circle cx="${x}" cy="${y}" r="1.1" fill="currentColor" opacity=".22"/>`; }
  const map = $('#map'); map.innerHTML = dots + Object.entries(cities).map(([n, c]) => { const [x, y] = px(c); return `<circle data-c="${n}" cx="${x}" cy="${y}" r="3.4" fill="#fbbf24" style="cursor:pointer"/>`; }).join('');
  $('#chips').innerHTML = Object.keys(cities).map(n => `<span class="chip" data-c="${n}">${n}</span>`).join('');
  const tip = $('#tip');
  function showTip(n) { const card = $('#travel').getBoundingClientRect(), d = map.querySelector(`circle[data-c="${n}"]`).getBoundingClientRect(); tip.textContent = n; tip.style.left = d.left - card.left + d.width / 2 + 'px'; tip.style.top = d.top - card.top + 'px'; tip.style.opacity = 1; }
  $$('[data-c]').forEach(el => { el.addEventListener('pointerenter', () => showTip(el.dataset.c)); el.addEventListener('pointerleave', () => tip.style.opacity = 0); });

  // Photos
  const G = [['#ff9a8b', '#ff6a88', 150, 'Old city'], ['#a1c4fd', '#c2e9fb', 110, 'Harbour'], ['#fbc2eb', '#a6c1ee', 130, 'Terrace rain'], ['#f6d365', '#fda085', 100, 'Desert road'], ['#84fab0', '#8fd3f4', 150, 'Canal'], ['#cfd9df', '#667eea', 120, 'Night market'], ['#fccb90', '#d57eeb', 110, 'Rooftop'], ['#e0c3fc', '#8ec5fc', 140, 'Skyline']];
  $('#mason').innerHTML = G.map((g, i) => `<div class="ph" data-i="${i}" style="height:${g[2]}px;background:linear-gradient(135deg,${g[0]},${g[1]})"><span>${g[3]}</span></div>`).join('');
  $$('.ph').forEach(p => p.onclick = () => { const g = G[p.dataset.i]; $('#lbi').style.background = `linear-gradient(135deg,${g[0]},${g[1]})`; $('#lbc').textContent = g[3] + ' · sample'; $('#lb').classList.add('open'); });
  $('#lb').onclick = () => $('#lb').classList.remove('open'); addEventListener('keydown', e => e.key === 'Escape' && $('#lb').classList.remove('open'));

  // Poetry
  const P = ['Between the rain and the train,\nthe city keeps its own time.\nI count the beats of passing wheels\nand call it a rhythm of mine.', 'Maps are only promises\nthe road has yet to keep.\nI fold mine small, put it away,\nand walk until I sleep.', 'Some songs are only footsteps\nthat learned to keep a beat.\nI tap them on the window\nof every moving seat.'];
  let pi = 0, pt; function typePoem() { clearInterval(pt); const el = $('#poem'), t = P[pi]; let i = 0; pt = setInterval(() => { el.innerHTML = t.slice(0, ++i).replace(/</g, '&lt;') + '<span class="caret" style="background:var(--violet)"></span>'; if (i >= t.length) clearInterval(pt); }, 32); }
  $('#pNext').onclick = () => { pi = (pi + 1) % P.length; typePoem(); }; $('#pPrev').onclick = () => { pi = (pi + P.length - 1) % P.length; typePoem(); }; typePoem();

  // Percussion pads + visualiser
  const PADS = [['Kick', 'A', '#fb7185'], ['Snare', 'S', '#fbbf24'], ['Hat', 'D', '#2dd4bf'], ['Clap', 'F', '#a78bfa'], ['Tom', 'J', '#60a5fa'], ['Conga', 'K', '#f97316'], ['Bell', 'L', '#c8ff3d'], ['Shaker', ';', '#e879f9']];
  $('#pads').innerHTML = PADS.map((p, i) => `<button class="pad" data-i="${i}" style="--c:${p[2]}">${p[0]}<kbd>${p[1]}</kbd></button>`).join('');
  let ac, an, buf; const noise = (d) => { const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length); return b; };
  function audio() { if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 128; an.connect(ac.destination); buf = new Uint8Array(an.frequencyBinCount); draw(); }
  function osc(f0, f1, dur, type = 'sine', vol = .8) { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(an); o.start(t); o.stop(t + dur + .02); }
  function nz(dur, vol, hp) { const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = noise(dur); f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); s.connect(f); f.connect(g); g.connect(an); s.start(t); }
  const SND = [() => osc(150, 40, .28), () => { nz(.16, .6, 1200); osc(220, 120, .1, 'triangle', .3); }, () => nz(.05, .35, 7000), () => { nz(.04, .6, 1500); setTimeout(() => nz(.12, .5, 1500), 25); }, () => osc(180, 90, .3, 'sine', .8), () => osc(420, 280, .18, 'triangle', .7), () => { osc(880, 880, .6, 'sine', .35); osc(1320, 1320, .5, 'sine', .2); }, () => nz(.12, .3, 5000)];
  function play(i) { audio(); if (ac.state === 'suspended') ac.resume(); SND[i](); const el = $$('.pad')[i]; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
  $$('.pad').forEach(p => p.addEventListener('pointerdown', () => play(+p.dataset.i)));
  addEventListener('keydown', e => { if (e.repeat) return; const i = PADS.findIndex(p => p[1].toLowerCase() === e.key.toLowerCase()); if (i > -1) play(i); });
  const cv = $('#viz'), cx = cv.getContext('2d');
  function draw() { requestAnimationFrame(draw); an.getByteFrequencyData(buf); cx.clearRect(0, 0, cv.width, cv.height); const w = cv.width / buf.length; buf.forEach((v, i) => { const h = v / 255 * cv.height; cx.fillStyle = `hsl(${340 - i * 3},90%,65%)`; cx.fillRect(i * w + 2, cv.height - h, w - 4, h); }); }

  // Skills
  const S = { Product: [['Strategy', 90], ['Roadmapping', 88], ['Experimentation', 84]], 'Data & AI': [['Python / SQL', 85], ['ML modelling', 78], ['Analytics', 90]], Fintech: [['Payments', 92], ['Credit & risk', 80], ['KYC / compliance', 82]] };
  $('#stabs').innerHTML = Object.keys(S).map((k, i) => `<button class="${i ? '' : 'on'}" data-k="${k}">${k}</button>`).join('');
  let barsOn = false;
  function showBars(k) { $('#bars').innerHTML = S[k].map(([n, v]) => `<div class="bar"><div><span>${n}</span><span>${v}</span></div><i><b data-w="${v}"></b></i></div>`).join(''); if (barsOn) setBars(); }
  function setBars() { barsOn = true; requestAnimationFrame(() => requestAnimationFrame(() => $$('.bar b').forEach(b => b.style.width = b.dataset.w + '%'))); }
  $$('#stabs button').forEach(b => b.onclick = () => { $$('#stabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); showBars(b.dataset.k); }); showBars('Product');

  // Copy email
  $('#copy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText('x26aseemj@iima.ac.in'); const t = $('#toast'); t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1600); };
})();
