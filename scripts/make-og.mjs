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

const C = { paper: '#f6f3ee', ink: '#1b1a17', muted: '#5d594f', line: '#ddd5c8', accent: '#17776e', accentInk: '#0f5d55' };
const el = (type, style, children) => ({ type, props: { style, children } });
const word = (t, extra = {}) => el('span', { marginRight: 16, ...extra }, t);

const headline = [
  ...['I', 'build', 'products', 'where'].map((w) => word(w)),
  ...['money,', 'data'].map((w) => word(w, { fontStyle: 'italic', color: C.accentInk })),
  ...['and', 'trucks', 'meet.'].map((w) => word(w)),
];

const og = el('div', {
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 1200, height: 630,
  background: C.paper, padding: '64px 72px', fontFamily: 'Instrument Serif', color: C.ink,
}, [
  el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
    el('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 88, height: 88, borderRadius: 22, background: C.accent, color: C.paper, fontSize: 58 }, 'aj.'),
    el('div', { fontSize: 32, color: C.muted }, 'aseemjain.com'),
  ]),
  el('div', { display: 'flex', flexDirection: 'column' }, [
    el('div', { fontSize: 150, lineHeight: 1, letterSpacing: -3 }, 'Aseem Jain'),
    el('div', { display: 'flex', flexWrap: 'wrap', fontSize: 53, lineHeight: 1.12, marginTop: 20, maxWidth: 1080 }, headline),
  ]),
  el('div', { display: 'flex', fontSize: 30, color: C.muted }, [
    // Instrument Serif has no rupee glyph, so the image spells it out.
    ...['INR 3,600 Cr FASTag volume', '1.5M vehicles', '72% to 87% payment success'].map((t) =>
      el('div', { display: 'flex', border: `2px solid ${C.line}`, borderRadius: 999, padding: '8px 24px', marginRight: 16 }, t)),
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
  color: C.paper, fontFamily: 'Instrument Serif', fontSize: Math.round(size * 0.62), letterSpacing: -2,
}, 'aj');
await render(icon(180), 180, 180, 'public/apple-touch-icon.png');
await render(icon(32), 32, 32, 'public/favicon-32.png');
