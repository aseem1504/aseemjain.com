
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const vp = $('#viewport'), world = $('#world'), linksSvg = $('#links');
  const frames = $$('.frame');
  let X = 0, Y = 0, Z = 1, tool = 'move', spaceDown = false, selected = null;

  // ---- Camera ----
  function apply() {
    world.style.transform = `translate(${X}px,${Y}px) scale(${Z})`;
    vp.style.backgroundPosition = `${X}px ${Y}px`;
    vp.style.backgroundSize = `${24 * Z}px ${24 * Z}px`;
    $('#zVal').textContent = Math.round(Z * 100) + '%';
    drawMini();
  }
  function zoomAt(cx, cy, f) {
    const nz = Math.min(2.5, Math.max(0.15, Z * f)); f = nz / Z;
    X = cx - (cx - X) * f; Y = cy - (cy - Y) * f; Z = nz; apply();
  }
  let anim;
  function tween(tx, ty, tz, ms = 650) {
    cancelAnimationFrame(anim);
    const sx = X, sy = Y, sz = Z, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    (function step(now) {
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      X = sx + (tx - sx) * e; Y = sy + (ty - sy) * e; Z = sz + (tz - sz) * e; apply();
      if (t < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  const rect = f => ({ x: f.offsetLeft, y: f.offsetTop, w: f.offsetWidth, h: f.offsetHeight });
  function flyTo(f) {
    const r = rect(f), w = vp.clientWidth, h = vp.clientHeight;
    const z = Math.min(1.4, Math.min(w * 0.8 / r.w, h * 0.8 / r.h));
    tween(w / 2 - (r.x + r.w / 2) * z, h / 2 - (r.y + r.h / 2) * z, z);
  }
  function fit() {
    const rs = frames.map(rect);
    const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y - 24));
    const x1 = Math.max(...rs.map(r => r.x + r.w)), y1 = Math.max(...rs.map(r => r.y + r.h));
    const w = vp.clientWidth, h = vp.clientHeight, z = Math.min(1, Math.min(w * 0.9 / (x1 - x0), h * 0.9 / (y1 - y0)));
    tween(w / 2 - ((x0 + x1) / 2) * z, h / 2 - ((y0 + y1) / 2) * z, z, 800);
  }

  // ---- Selection ----
  function select(f) {
    selected = f;
    frames.forEach(fr => fr.classList.toggle('sel', fr === f));
    $$('.layer').forEach(l => l.classList.toggle('sel', f && l.dataset.name === f.dataset.name));
    if (f) { const r = rect(f); f.querySelector('.hd em').textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`; }
    drawMini();
  }

  // ---- Layers panel ----
  const lay = $('#layers');
  const ico = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#a8a8a8"><path d="M4 1v12M10 1v12M1 4h12M1 10h12"/></svg>';
  lay.innerHTML = '<h4>Layers</h4>' + frames.map(f => `<div class="layer" data-name="${f.dataset.name}">${ico}${f.dataset.name}</div>`).join('') +
    '<div class="tip"><b>Try it:</b> drag frames, scroll to pan, pinch or ⌘/Ctrl + scroll to zoom, press <b>H</b> for hand, <b>0</b> to fit.</div>';
  $$('.layer').forEach(l => {
    const f = frames.find(x => x.dataset.name === l.dataset.name);
    l.onclick = () => { select(f); flyTo(f); };
    l.onmouseenter = () => { l.classList.add('hover'); f.classList.add('hover'); };
    l.onmouseleave = () => { l.classList.remove('hover'); f.classList.remove('hover'); };
  });
  $$('[data-fly]').forEach(p => p.onclick = e => { e.stopPropagation(); const f = frames.find(x => x.dataset.name === p.dataset.fly); select(f); flyTo(f); });

  // ---- Links between hero and frames ----
  const hero = frames[0];
  function center(f) { const r = rect(f); return [r.x + r.w / 2, r.y + r.h / 2]; }
  function drawLinks() {
    const [hx, hy] = center(hero), off = 3000;
    linksSvg.innerHTML = frames.slice(1).map(f => {
      const [x, y] = center(f), mx = (hx + x) / 2;
      return `<path d="M${hx + off} ${hy + off} C ${mx + off} ${hy + off}, ${mx + off} ${y + off}, ${x + off} ${y + off}"/>`;
    }).join('');
  }

  // ---- Dragging / panning ----
  let drag = null, pan = null;
  vp.addEventListener('pointerdown', e => {
    const fr = e.target.closest('.frame');
    const interactive = e.target.closest('button,input,.cell,.tile,.job,.chip,.var,.pill,a');
    if (tool === 'hand' || spaceDown || !fr) {
      pan = { x: e.clientX, y: e.clientY, X, Y }; vp.classList.add('panning'); vp.setPointerCapture(e.pointerId);
      if (!fr && tool === 'move') select(null);
      return;
    }
    select(fr);
    if (interactive && !e.target.closest('.nm')) return;
    drag = { fr, x: e.clientX, y: e.clientY, l: fr.offsetLeft, t: fr.offsetTop };
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', e => {
    if (pan) { X = pan.X + e.clientX - pan.x; Y = pan.Y + e.clientY - pan.y; apply(); }
    else if (drag) {
      drag.fr.style.left = drag.l + (e.clientX - drag.x) / Z + 'px';
      drag.fr.style.top = drag.t + (e.clientY - drag.y) / Z + 'px'; drawLinks(); drawMini();
    }
  });
  const end = () => { drag = null; pan = null; vp.classList.remove('panning'); };
  vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const b = vp.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - b.left, e.clientY - b.top, Math.exp(-e.deltaY * 0.01));
    else { X -= e.deltaX; Y -= e.deltaY; apply(); }
  }, { passive: false });

  // ---- Toolbar & keys ----
  function setTool(t) { tool = t; $('#tMove').classList.toggle('on', t === 'move'); $('#tHand').classList.toggle('on', t === 'hand'); vp.classList.toggle('hand', t === 'hand'); }
  $('#tMove').onclick = () => setTool('move'); $('#tHand').onclick = () => setTool('hand');
  $('#zIn').onclick = () => zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, 1.25);
  $('#zOut').onclick = () => zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, 0.8);
  $('#zVal').onclick = fit;
  addEventListener('keydown', e => {
    if (e.target.matches('input')) return;
    const k = e.key.toLowerCase();
    if (k === 'v') setTool('move'); else if (k === 'h') setTool('hand');
    else if (k === '=' || k === '+') $('#zIn').click(); else if (k === '-') $('#zOut').click();
    else if (k === '0') fit(); else if (k === '1') tween(X, Y, 1, 300);
    else if (e.code === 'Space') { spaceDown = true; vp.classList.add('hand'); e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; if (tool !== 'hand') vp.classList.remove('hand'); } });

  // ---- Minimap ----
  const mini = $('#mini');
  function drawMini() {
    const rs = frames.map(rect), x0 = Math.min(...rs.map(r => r.x)) - 80, y0 = Math.min(...rs.map(r => r.y)) - 80;
    const x1 = Math.max(...rs.map(r => r.x + r.w)) + 80, y1 = Math.max(...rs.map(r => r.y + r.h)) + 80;
    const s = Math.min(190 / (x1 - x0), 130 / (y1 - y0));
    mini._m = { x0, y0, s };
    mini.innerHTML = frames.map((f, i) => `<i class="${f === selected ? 'sel' : ''}" style="left:${(rs[i].x - x0) * s}px;top:${(rs[i].y - y0) * s}px;width:${rs[i].w * s}px;height:${rs[i].h * s}px"></i>`).join('') +
      `<b style="left:${(-X / Z - x0) * s}px;top:${(-Y / Z - y0) * s}px;width:${vp.clientWidth / Z * s}px;height:${vp.clientHeight / Z * s}px"></b>`;
  }
  mini.onclick = e => {
    const b = mini.getBoundingClientRect(), m = mini._m;
    const wx = (e.clientX - b.left) / m.s + m.x0, wy = (e.clientY - b.top) / m.s + m.y0;
    tween(vp.clientWidth / 2 - wx * Z, vp.clientHeight / 2 - wy * Z, Z, 450);
  };

  // ---- Fake collaborator cursors ----
  const c1 = $('#c1'), c2 = $('#c2');
  (function roam(t) {
    const w = innerWidth - 300, h = innerHeight - 160;
    c1.style.transform = `translate(${260 + w * (0.5 + 0.38 * Math.sin(t / 2300))}px,${80 + h * (0.5 + 0.35 * Math.cos(t / 1900))}px)`;
    c2.style.transform = `translate(${260 + w * (0.5 + 0.4 * Math.cos(t / 3100 + 1))}px,${80 + h * (0.5 + 0.38 * Math.sin(t / 2700 + 2))}px)`;
    requestAnimationFrame(roam);
  })(0);

  // ---- Hero counters ----
  $$('[data-n]').forEach(el => {
    const n = parseFloat(el.dataset.n), dec = n % 1 ? 1 : 0, t0 = performance.now();
    (function s(now) { const p = Math.min(1, (now - t0) / 1600); el.textContent = (n * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (p < 1) requestAnimationFrame(s); })(t0);
  });

  // ---- Experience accordion ----
  $$('.job').forEach(j => j.onclick = () => { const o = j.classList.contains('open'); $$('.job').forEach(x => x.classList.remove('open')); if (!o) j.classList.add('open'); });

  // ---- Travel map ----
  const ell = [[-100,45,40,22],[-42,72,14,8],[-60,-15,17,28],[15,52,22,12],[20,5,25,32],[90,45,50,22],[78,22,10,12],[110,10,14,12],[135,-25,20,12],[138,37,4,8]];
  const cities = { Delhi: [77.2, 28.6], London: [-0.1, 51.5], Copenhagen: [12.6, 55.7], Zurich: [8.5, 47.4], Tokyo: [139.7, 35.7], Dubai: [55.3, 25.2] };
  const px = ([lo, la]) => [(lo + 180), (90 - la)];
  let dots = '';
  for (let lo = -178; lo < 180; lo += 4) for (let la = 84; la > -60; la -= 4)
    if (ell.some(([cx, cy, rx, ry]) => ((lo - cx) / rx) ** 2 + ((la - cy) / ry) ** 2 <= 1)) { const [x, y] = px([lo, la]); dots += `<circle cx="${x}" cy="${y}" r="1" fill="#3b4268"/>`; }
  $('#map').innerHTML = dots + Object.entries(cities).map(([n, c]) => { const [x, y] = px(c); return `<g id="m-${n}"><circle cx="${x}" cy="${y}" r="2.6" fill="#c8ff3d"/><circle class="ping" cx="${x}" cy="${y}" r="3" fill="none" stroke="#c8ff3d" style="display:none"/></g>`; }).join('');
  $('#chips').innerHTML = Object.keys(cities).map(n => `<span class="chip" data-c="${n}">${n}</span>`).join('');
  $$('#chips .chip').forEach(c => {
    const ping = () => $('#m-' + c.dataset.c + ' .ping').style.display = 'block', off = () => $('#m-' + c.dataset.c + ' .ping').style.display = 'none';
    c.onmouseenter = ping; c.onmouseleave = off; c.onclick = () => { c.classList.toggle('on'); };
  });

  // ---- Photography ----
  const grads = [['#ff9a8b', '#ff6a88'], ['#a1c4fd', '#c2e9fb'], ['#fbc2eb', '#a6c1ee'], ['#f6d365', '#fda085'], ['#84fab0', '#8fd3f4'], ['#cfd9df', '#667eea']];
  const caps = ['Old city, golden hour', 'Harbour in the mist', 'Monsoon on the terrace', 'Desert road', 'Quiet canal', 'Night market'];
  $('#tiles').innerHTML = grads.map((g, i) => `<div class="tile" data-i="${i}" style="background:linear-gradient(135deg,${g[0]},${g[1]})"><span>${caps[i]}</span></div>`).join('');
  $$('.tile').forEach(t => t.onclick = () => { $$('.tile').forEach(x => x.classList.remove('act')); t.classList.add('act'); $('#cap').textContent = `“${caps[t.dataset.i]}” · Sample caption`; });

  // ---- Poetry ----
  const poems = ['Between the rain and the train,\nthe city keeps its own time.\nI count the beats of passing wheels\nand call it a rhythm of mine.', 'Maps are only promises\nthe road has yet to keep.\nI fold mine small, put it away,\nand walk until I sleep.'];
  let pi = 0, tmr;
  function type(text) { clearInterval(tmr); const el = $('#poem'); let i = 0; tmr = setInterval(() => { el.innerHTML = text.slice(0, ++i).replace(/</g, '&lt;') + '<span class="cursor"></span>'; if (i >= text.length) clearInterval(tmr); }, 38); }
  $('#readPoem').onclick = () => type(poems[pi]);
  $('#nextPoem').onclick = () => { pi = (pi + 1) % poems.length; type(poems[pi]); };
  $('#heart').onclick = e => { const h = $('#hc'); const on = e.currentTarget.dataset.on !== '1'; e.currentTarget.dataset.on = on ? 1 : 0; h.textContent = +h.textContent + (on ? 1 : -1); e.currentTarget.firstChild.textContent = on ? '♥ ' : '♡ '; };
  type(poems[0]);

  // ---- Drum machine ----
  const rows = ['Kick', 'Snare', 'Hat'], steps = 8, grid = rows.map((_, r) => Array(steps).fill(0));
  grid[0][0] = grid[0][4] = grid[1][2] = grid[1][6] = 1; for (let i = 0; i < 8; i += 2) grid[2][i] = 1;
  const seq = $('#seq'); let ac;
  seq.innerHTML = rows.map((r, ri) => `<label>${r}</label>` + grid[ri].map((v, ci) => `<div class="cell ${v ? 'on' : ''}" data-r="${ri}" data-c="${ci}"></div>`).join('')).join('');
  function hit(r) {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
    if (r === 2) { const b = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = ac.createBufferSource(), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; s.buffer = b; s.connect(f); f.connect(g); g.gain.setValueAtTime(.35, t); s.start(t); }
    else if (r === 1) { const b = ac.createBuffer(1, ac.sampleRate * .15, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = ac.createBufferSource(); s.buffer = b; s.connect(g); g.gain.setValueAtTime(.5, t); s.start(t); }
    else { const o = ac.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); o.connect(g); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.start(t); o.stop(t + .26); }
  }
  seq.addEventListener('click', e => { const c = e.target.closest('.cell'); if (!c) return; const r = +c.dataset.r, i = +c.dataset.c; grid[r][i] ^= 1; c.classList.toggle('on', !!grid[r][i]); if (grid[r][i]) hit(r); });
  let step = 0, run = null;
  function tick() {
    const cells = $$('#seq .cell'); cells.forEach(c => c.classList.remove('play'));
    rows.forEach((_, r) => { const c = cells[r * steps + step]; c.classList.add('play'); if (grid[r][step]) hit(r); });
    step = (step + 1) % steps;
  }
  const bpm = $('#bpm');
  function restart() { clearInterval(run); if ($('#play').dataset.on === '1') run = setInterval(tick, 60000 / bpm.value / 2); }
  $('#play').onclick = e => { const b = e.currentTarget, on = b.dataset.on !== '1'; b.dataset.on = on ? 1 : 0; b.textContent = on ? '■ Stop' : '▶ Play'; if (!on) $$('#seq .cell').forEach(c => c.classList.remove('play')); step = 0; restart(); };
  bpm.oninput = () => { $('#bpmv').textContent = bpm.value + ' BPM'; restart(); };

  // ---- Skills ----
  const skills = { Product: [['Strategy', 90], ['Roadmapping', 88], ['Experimentation', 84]], 'Data & AI': [['Python / SQL', 85], ['ML modelling', 78], ['Analytics', 90]], Fintech: [['Payments', 92], ['Credit & risk', 80], ['KYC / compliance', 82]] };
  $('#vars').innerHTML = Object.keys(skills).map((k, i) => `<div class="var ${i ? '' : 'on'}" data-k="${k}">${k}</div>`).join('');
  function showSkills(k) { $('#meter').innerHTML = skills[k].map(([n, v]) => `<div><span>${n}</span><span>${v}</span></div><i><b data-w="${v}"></b></i>`).join(''); requestAnimationFrame(() => $$('#meter b').forEach(b => b.style.width = b.dataset.w + '%')); }
  $$('.var').forEach(v => v.onclick = () => { $$('.var').forEach(x => x.classList.remove('on')); v.classList.add('on'); showSkills(v.dataset.k); });
  showSkills('Product');

  // ---- Init ----
  drawLinks();
  const w = vp.clientWidth, h = vp.clientHeight;
  X = w / 2 - 260; Y = h / 2 - 190; Z = 1; apply();
  setTimeout(fit, 300);
  addEventListener('resize', drawMini);
})();
