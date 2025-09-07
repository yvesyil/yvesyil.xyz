// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if device is mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android/i.test(navigator.userAgent);
}

// Scale by pixel ratio
export function scaleByPixelRatio(input: number): number {
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.floor(input * pixelRatio);
}

// Wrap value between min and max
export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return min;
  return ((value - min) % range) + min;
}

// Clamp value between 0 and 1
export function clamp01(input: number): number {
  return Math.min(Math.max(input, 0), 1);
}

// Hash string to number
export function hashCode(s: string): number {
  if (s.length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// HSV to RGB color conversion
export function HSVtoRGB(h: number, s: number, v: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number, i: number, f: number, p: number, q: number, t: number;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p;
      break;
    case 1:
      r = q; g = v; b = p;
      break;
    case 2:
      r = p; g = v; b = t;
      break;
    case 3:
      r = p; g = q; b = v;
      break;
    case 4:
      r = t; g = p; b = v;
      break;
    case 5:
      r = v; g = p; b = q;
      break;
    default:
      r = g = b = 0;
  }

  return { r, g, b };
}

// Generate random color for fluid simulation
export function generateColor(): { r: number; g: number; b: number } {
  const c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r *= 0.40;
  c.g *= 0.01;
  c.b *= 0.10;
  return c;
}

// Normalize color from 0-255 to 0-1 range
export function normalizeColor(input: { r: number; g: number; b: number }): { r: number; g: number; b: number } {
  return {
    r: input.r / 255,
    g: input.g / 255,
    b: input.b / 255
  };
}
