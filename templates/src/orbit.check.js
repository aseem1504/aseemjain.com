
(() => {
  const $ = s => document.querySelector(s);
  const DATA = [
    { id: 'work', label: 'Work', ic: '◆', c: '#c8ff3d', kids: [
      ['FASTag & Payments', 'WheelsEye · 2022–25', 'Owned FASTag strategy and the payments platform across ₹3,600 Cr of annual volume, 1.5M vehicles and a 12-person pod.', ['Fintech', 'Roadmap', 'Payments']],
      ['Credit product', '0 → 1 in 60 days', 'Launched postpaid FASTag credit with a bank partner. ₹2.5 Cr ARR by month 3 at roughly 0.3% NPA.', ['Credit', '0→1', 'Partnerships']],
      ['PCL Health', 'London · 2021–22', 'Remote-care pilots across 10 NHS-affiliated hospitals and an OCR device reader on Google Vision.', ['HealthTech', 'Pilots', 'OCR']],
      ['Data & IoT', 'WheelsEye · 2018–20', 'A signal-loss model at 96.7% accuracy across 200K trucks, plus risk analytics that onboarded two lenders.', ['Python', 'ML', 'Telematics']] ] },
    { id: 'travel', label: 'Travel', ic: '✈', c: '#fbbf24', kids: [
      ['India', 'Home base', 'Sample: roads, railway platforms and the food of a dozen states. Replace with your own story.', ['Home', 'Food', 'Trains']],
      ['United Kingdom', 'London', 'Sample: a year in London working with NHS hospitals. Replace with your own notes.', ['London', 'Work']],
      ['Denmark', 'Sample entry', 'Sample: a city built around bikes and canals. Replace with your own story.', ['Cities', 'Design']],
      ['Japan', 'Sample entry', 'Sample: quiet streets and loud arcades. Replace with your own story.', ['Culture', 'Street']] ] },
    { id: 'photo', label: 'Photography', ic: '◉', c: '#2dd4bf', kids: [
      ['Street', 'Series · sample', 'Sample series about people in motion. Photos go here, with captions and the story behind each.', ['People', 'Light']],
      ['Landscapes', 'Series · sample', 'Sample series on mountains and coasts, shot in the first and last hour of daylight.', ['Nature', 'Golden hour']],
      ['Night', 'Series · sample', 'Sample series of city lights and long exposures.', ['Long exposure', 'City']] ] },
    { id: 'poetry', label: 'Poetry', ic: '✎', c: '#a78bfa', kids: [
      ['Monsoon', 'Poem · sample', 'Between the rain and the train, the city keeps its own time. (Sample lines. Add your poem here.)', ['Rain', 'City']],
      ['Maps', 'Poem · sample', 'Maps are only promises the road has yet to keep. (Sample lines. Add your poem here.)', ['Travel', 'Time']],
      ['Rhythm', 'Poem · sample', 'I count the beats of passing wheels and call it a rhythm of mine. (Sample lines.)', ['Music', 'Trains']] ] },
    { id: 'perc', label: 'Percussion', ic: '♪', c: '#fb7185', kids: [
      ['Live sets', 'Video · sample', 'Sample: embed your performance videos here. Tap play to see the sound visualiser.', ['Live', 'Stage'], 'eq'],
      ['Practice', 'Video · sample', 'Sample: practice sessions and rhythm exercises.', ['Practice', 'Rudiments'], 'eq'],
      ['Collaborations', 'Sample entry', 'Sample: jams and projects with other musicians.', ['Jam', 'Band'], 'eq'] ] },
    { id: 'beyond', label: 'Beyond', ic: '✦', c: '#60a5fa', kids: [
      ['Public speaking', 'Toastmasters', 'Speaking since the VIT Toastmasters days. Add talks, panels and recordings here.', ['Talks', 'Panels']],
      ['Research', 'IIM Ahmedabad', 'AI-based credit risk for small businesses, with a focus on when to automate and when to ask for human judgement.', ['AI', 'Credit', 'SMBs']],
      ['Mentoring', 'Sample entry', 'Sample: helping people break into product and data roles.', ['Careers', 'Product']],
      ['Reading', 'Sample entry', 'Sample: a shelf of books that changed how I think.', ['Books', 'Ideas']] ] }
  ];

  // ---- Geometry ----
  const CX = 600, CY = 480, R1 = 235, R2 = 465;
  const stage = $('#stage'), lines = $('#lines'), view = $('#view');
  const prim = DATA.map((d, i) => { d.a = -Math.PI / 2 + i * (2 * Math.PI / DATA.length) + .2; d.x = CX + R1 * Math.cos(d.a); d.y = CY + R1 * Math.sin(d.a) * .88; return d; });
  let open = null, current = null; // current = [pi, ki]

  prim.forEach(d => {
    const b = document.createElement('button');
    b.className = 'node p'; b.style.cssText = `left:${d.x}px;top:${d.y}px;--c:${d.c}`;
    b.innerHTML = `<span class="ic">${d.ic}</span>${d.label}`; b.onclick = e => { e.stopPropagation(); toggle(d); };
    d.el = b; stage.appendChild(b);
    d.kidEls = d.kids.map((k, i) => {
      const n = document.createElement('button');
      n.className = 'node k hide'; n.textContent = k[0]; n.style.cssText = `left:${d.x}px;top:${d.y}px;--c:${d.c}`;
      n.onclick = e => { e.stopPropagation(); showKid(d, i); };
      stage.appendChild(n); return n;
    });
  });
  function kidPos(d, i) { const n = d.kids.length, ang = d.a + (i - (n - 1) / 2) * .27; return [CX + R2 * Math.cos(ang), CY + R2 * Math.sin(ang) * .88 + 8]; }

  function drawLines() {
    let h = '';
    prim.forEach(d => { h += `<path d="M${CX} ${CY} L${d.x} ${d.y}" stroke="${d.c}" style="opacity:${open && open !== d ? .12 : .5}"/>`; });
    if (open) open.kids.forEach((k, i) => { const [x, y] = kidPos(open, i); h += `<path d="M${open.x} ${open.y} L${x} ${y}" stroke="${open.c}" style="animation-delay:${i * .06}s"/>`; });
    lines.innerHTML = h;
  }
  function toggle(d) {
    const was = open === d;
    if (open) open.kidEls.forEach(n => { n.classList.add('hide'); n.style.left = open.x + 'px'; n.style.top = open.y + 'px'; n.classList.remove('act'); });
    prim.forEach(p => p.el.classList.remove('open'));
    open = was ? null : d;
    if (open) {
      d.el.classList.add('open');
      d.kidEls.forEach((n, i) => setTimeout(() => { const [x, y] = kidPos(d, i); n.classList.remove('hide'); n.style.left = x + 'px'; n.style.top = y + 'px'; }, 40 + i * 70));
    } else closeDrawer();
    prim.forEach(p => p.el.classList.toggle('dim', !!open && p !== open));
    drawLines();
  }

  // ---- Drawer ----
  const dr = $('#drawer');
  function showKid(d, i) {
    if (open !== d) toggle(d);
    current = [prim.indexOf(d), i];
    d.kidEls.forEach((n, j) => n.classList.toggle('act', j === i));
    const k = d.kids[i]; dr.style.setProperty('--c', d.c);
    $('#dEye').textContent = `${d.label} · ${k[1]}`; $('#dTitle').textContent = k[0]; $('#dText').textContent = k[2];
    $('#dTags').innerHTML = k[3].map(t => `<span>${t}</span>`).join('');
    $('#dVis').innerHTML = k[4] === 'eq' ? `<div class="vis">${Array.from({ length: 22 }, (_, j) => `<b style="animation-delay:${(j * .11) % 1.1}s;animation-duration:${.7 + (j % 5) * .16}s"></b>`).join('')}</div>` : `<div class="vis photo">Image / video placeholder</div>`;
    dr.classList.add('open');
  }
  function closeDrawer() { dr.classList.remove('open'); current = null; }
  function step(dir) {
    if (!current) return; let [p, k] = current; const n = prim[p].kids.length; k += dir;
    if (k < 0) { p = (p + prim.length - 1) % prim.length; toggle(prim[p]); k = prim[p].kids.length - 1; }
    else if (k >= n) { p = (p + 1) % prim.length; toggle(prim[p]); k = 0; }
    showKid(prim[p], k);
  }
  $('#dx').onclick = closeDrawer; $('#dPrev').onclick = () => step(-1); $('#dNext').onclick = () => step(1);
  addEventListener('keydown', e => { if (e.target.matches('input')) return; if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'Escape') { closeDrawer(); if (open) toggle(open); } });

  // ---- Search ----
  $('#q').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { prim.forEach(p => { p.el.classList.remove('dim'); p.kidEls.forEach(n => n.classList.remove('dim')); }); return; }
    const hit = prim.find(p => p.label.toLowerCase().includes(q) || p.kids.some(k => (k.join(' ')).toLowerCase().includes(q)));
    prim.forEach(p => { const m = p.label.toLowerCase().includes(q) || p.kids.some(k => k.join(' ').toLowerCase().includes(q)); p.el.classList.toggle('dim', !m); p.kidEls.forEach((n, i) => n.classList.toggle('dim', !p.kids[i].join(' ').toLowerCase().includes(q))); });
    if (hit && open !== hit) toggle(hit);
  });

  // ---- Camera: pan & zoom ----
  let X = 0, Y = 0, Z = 1;
  const apply = () => stage.style.transform = `translate(${X}px,${Y}px) scale(${Z})`;
  function fit(animate) {
    const w = innerWidth - (innerWidth > 760 ? 0 : 0), h = innerHeight, z = Math.min(w / 1180, (h - 20) / 940);
    const tx = w / 2 - 600 * z, ty = h / 2 - 480 * z;
    if (!animate) { X = tx; Y = ty; Z = z; return apply(); }
    const sx = X, sy = Y, sz = Z, t0 = performance.now();
    (function s(now) { const t = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - t, 3); X = sx + (tx - sx) * e; Y = sy + (ty - sy) * e; Z = sz + (tz(sz, z, e)); apply(); if (t < 1) requestAnimationFrame(s); })(t0);
    function tz(a, b, e) { return (b - a) * e; }
  }
  function zoomAt(cx, cy, f) { const nz = Math.min(2.2, Math.max(.35, Z * f)); f = nz / Z; X = cx - (cx - X) * f; Y = cy - (cy - Y) * f; Z = nz; apply(); }
  let pan = null; const pts = new Map(); let pinch = null;
  view.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (e.target.closest('.node')) return; view.setPointerCapture(e.pointerId); pan = { x: e.clientX, y: e.clientY, X, Y }; view.classList.add('pan'); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  view.addEventListener('pointermove', e => {
    $('#spot').style.setProperty('--mx', e.clientX + 'px'); $('#spot').style.setProperty('--my', e.clientY + 'px');
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / pinch); pinch = d; }
    else if (pan) { X = pan.X + e.clientX - pan.x; Y = pan.Y + e.clientY - pan.y; apply(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { pan = null; view.classList.remove('pan'); } };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  view.addEventListener('click', e => { if (!e.target.closest('.node') && open && !pan) { /* keep open on background click */ } });
  view.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018))); }, { passive: false });
  $('#zi').onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1.2); $('#zo').onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, .83); $('#zf').onclick = () => fit(true);
  addEventListener('resize', () => fit(false));

  drawLines(); fit(false);
  setTimeout(() => toggle(prim[0]), 700);
})();
