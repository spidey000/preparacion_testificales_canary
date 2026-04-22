function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function canonicalizeColor(color: string) {
  return color.trim().toLowerCase();
}

function parseHexColor(color: string) {
  const value = color.trim().replace('#', '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) return null;

  const expanded = value.length === 3
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function parseRgbColor(color: string) {
  const match = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;

  const [r, g, b] = match[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if ([r, g, b].some((value) => !Number.isFinite(value))) return null;
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) };
}

function parseHslColor(color: string) {
  const match = color.trim().match(/^hsla?\(([^)]+)\)$/i);
  if (!match) return null;

  const parts = match[1].trim().split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;

  const hue = Number.parseFloat(parts[0].replace('deg', ''));
  const saturation = Number.parseFloat(parts[1].replace('%', ''));
  const lightness = Number.parseFloat(parts[2].replace('%', ''));
  if (![hue, saturation, lightness].every(Number.isFinite)) return null;

  return {
    h: ((hue % 360) + 360) % 360,
    s: clamp(saturation, 0, 100),
    l: clamp(lightness, 0, 100),
  };
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

function getRgbColor(color: string) {
  const hsl = parseHslColor(color);
  if (hsl) return hslToRgb(hsl.h, hsl.s, hsl.l);
  return parseHexColor(color) ?? parseRgbColor(color);
}

export function buildRandomAccentColor() {
  return `hsl(${Math.floor(Math.random() * 360)} 70% 58%)`;
}

export function normalizeColorValue(color: string | undefined, fallback = buildRandomAccentColor()) {
  if (!color?.trim()) return fallback;
  return color.trim();
}

export function buildUniqueFactColor(usedColors: string[], requestedColor?: string) {
  const used = new Set(usedColors.map(canonicalizeColor));
  const preferred = requestedColor?.trim();

  if (preferred && !used.has(canonicalizeColor(preferred))) return preferred;

  const hsl = preferred ? parseHslColor(preferred) : null;
  if (hsl) {
    for (let step = 12; step <= 180; step += 12) {
      const plus = `hsl(${Math.round((hsl.h + step) % 360)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
      if (!used.has(canonicalizeColor(plus))) return plus;

      const minus = `hsl(${Math.round((hsl.h - step + 360) % 360)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`;
      if (!used.has(canonicalizeColor(minus))) return minus;
    }
  }

  for (let attempt = 0; attempt < 36; attempt += 1) {
    const candidate = buildRandomAccentColor();
    if (!used.has(canonicalizeColor(candidate))) return candidate;
  }

  return `hsl(${(used.size * 37) % 360} 70% 58%)`;
}

export function getReadableTextColor(backgroundColor: string) {
  const rgb = getRgbColor(backgroundColor);
  if (!rgb) return '#ffffff';

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? '#111827' : '#ffffff';
}
