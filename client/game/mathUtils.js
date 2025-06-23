// Math utility functions for game logic

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function normalizeAngle(angle) {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}

export function magnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}