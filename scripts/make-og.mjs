// Generates the social share image (1200x630) and the touch icons into public/.
// Run: npm run og
import fs from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const font = (f) => fs.readFileSync(`node_modules/@fontsource/instrument-serif/files/${f}`);
const fonts = [
  { name: 'Instrument Serif', data: font('instrument-serif-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Instrument Serif', data: font('instrument-serif-latin-400-italic.woff'), weight: 400, style: 'italic' },
];

// Dark theme, mint accent.
const C = { paper: '#09090b', ink: '#f4f4f5', muted: '#a1a1aa', line: '#2a2a31', accent: '#8fd3bd', accentInk: '#9fe0cb', onAccent: '#0b1812' };
const el = (type, style, children) => ({ type, props: { style, children } });

const og = el('div', {
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 1200, height: 630,
  background: C.paper, padding: '58px 72px', fontFamily: 'Instrument Serif', color: C.ink,
}, [
  el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
    el('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 20, background: C.accent, color: C.onAccent, fontSize: 54 }, 'aj.'),
    el('div', { fontSize: 32, color: C.muted }, 'aseemjain.com'),
  ]),
  el('div', { display: 'flex', flexDirection: 'column' }, [
    el('div', { fontSize: 52, fontStyle: 'italic', color: C.accentInk, lineHeight: 1.1 }, 'Hi, I am'),
    el('div', { fontSize: 178, lineHeight: 0.98, letterSpacing: -5 }, 'Aseem Jain'),
    el('div', { fontSize: 40, color: C.muted, lineHeight: 1.25, marginTop: 14, maxWidth: 1000 }, 'I build products where money, data and customer insights meet.'),
  ]),
  el('div', { display: 'flex', fontSize: 28, color: C.muted }, [
    // Instrument Serif has no rupee glyph, so the image spells it out.
    ...['INR 3,600 Cr FASTag volume', '1.5M vehicles', '72% to 87% payment success'].map((t) =>
      el('div', { display: 'flex', border: `2px solid ${C.line}`, borderRadius: 999, padding: '7px 22px', marginRight: 16 }, t)),
  ]),
]);

async function render(tree, width, height, out) {
  const svg = await satori(tree, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  fs.writeFileSync(out, png);
  console.log(out, `${Math.round(png.length / 1024)} KB`);
}

await render(og, 1200, 630, 'public/og.png');

const icon = (size) => el('div', {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, background: C.accent,
  color: C.onAccent, fontFamily: 'Instrument Serif', fontSize: Math.round(size * 0.62), letterSpacing: -2,
}, 'aj');
await render(icon(180), 180, 180, 'public/apple-touch-icon.png');
await render(icon(32), 32, 32, 'public/favicon-32.png');
