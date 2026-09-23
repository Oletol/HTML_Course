/* ==================================================================
   colors.js – разбор цветов CSS и расчёт контраста по WCAG 2.

   parseColor(str)  – { r, g, b, a } или null. Понимает:
                      названия (148 цветов CSS), #rgb, #rgba, #rrggbb,
                      #rrggbbaa, rgb()/rgba(), hsl()/hsla() в записи
                      через запятые и через пробелы.
   colorFormat(str) – 'name' | 'hex' | 'rgb' | 'hsl' | null
   parseStyle(str)  – { свойство: значение } из атрибута style
   contrast(fg, bg) – коэффициент контраста 1..21 (прозрачность
                      учитывается наложением на белый фон)
   Используется в шаге «Цвет» и пригодится в модуле CSS.
   ================================================================== */

const NAMED_RAW = 'aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32';

export const NAMED = Object.fromEntries(NAMED_RAW.split(' ').map(p => p.split(':')));
NAMED.transparent = '00000000';

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function channel(token) {
  token = token.trim();
  if (token.endsWith('%')) return clamp(parseFloat(token) * 2.55, 0, 255);
  const v = parseFloat(token);
  return Number.isFinite(v) ? clamp(v, 0, 255) : NaN;
}

function alpha(token) {
  if (token == null) return 1;
  token = token.trim();
  const v = token.endsWith('%') ? parseFloat(token) / 100 : parseFloat(token);
  return Number.isFinite(v) ? clamp(v, 0, 1) : NaN;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function fromHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = i => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

function args(str) {
  const inner = str.slice(str.indexOf('(') + 1, str.lastIndexOf(')'));
  if (inner.includes(',')) return inner.split(',').map(s => s.trim());
  const [main, a] = inner.split('/');
  const parts = main.trim().split(/\s+/);
  if (a != null) parts.push(a.trim());
  return parts;
}

export function colorFormat(str) {
  const s = String(str || '').trim().toLowerCase();
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return 'hex';
  if (/^rgba?\(/.test(s)) return 'rgb';
  if (/^hsla?\(/.test(s)) return 'hsl';
  if (s in NAMED) return 'name';
  return null;
}

export function parseColor(str) {
  const s = String(str || '').trim().toLowerCase();
  const fmt = colorFormat(s);
  if (!fmt) return null;
  if (fmt === 'hex') return fromHex(s);
  if (fmt === 'name') return fromHex(NAMED[s]);
  if (!s.endsWith(')')) return null;
  const a = args(s);
  if (a.length < 3 || a.length > 4) return null;
  let rgb;
  if (fmt === 'rgb') rgb = a.slice(0, 3).map(channel);
  else {
    const h = parseFloat(a[0]), sat = parseFloat(a[1]), l = parseFloat(a[2]);
    if (![h, sat, l].every(Number.isFinite)) return null;
    rgb = hslToRgb(h, clamp(sat, 0, 100), clamp(l, 0, 100));
  }
  const al = alpha(a[3]);
  if (rgb.some(Number.isNaN) || Number.isNaN(al)) return null;
  return { r: rgb[0], g: rgb[1], b: rgb[2], a: al };
}

export function parseStyle(str) {
  const out = {};
  String(str || '').split(';').forEach(decl => {
    const i = decl.indexOf(':');
    if (i === -1) return;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const value = decl.slice(i + 1).trim().replace(/\s*!important$/i, '');
    if (prop) out[prop] = value;
  });
  return out;
}

function over(top, bottom) {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = k => (top[k] * top.a + bottom[k] * bottom.a * (1 - top.a)) / a;
  return { r: mix('r'), g: mix('g'), b: mix('b'), a };
}

function luminance({ r, g, b }) {
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

export function contrast(fg, bg) {
  const back = over(bg, WHITE);
  const front = over(fg, back);
  const L1 = luminance(front), L2 = luminance(back);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
