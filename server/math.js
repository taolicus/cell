// Math utility functions for server logic

function distance(a, b, c, d) {
  let x1, y1, x2, y2;

  // Handle coordinate-based call: distance(x1, y1, x2, y2)
  if (typeof a === 'number' && typeof b === 'number' && typeof c === 'number' && typeof d === 'number') {
    x1 = a;
    y1 = b;
    x2 = c;
    y2 = d;
  }
  // Handle object-based call: distance(a, b) where a and b have x,y properties
  else if (a && b && typeof a.x === 'number' && typeof a.y === 'number' && typeof b.x === 'number' && typeof b.y === 'number') {
    x1 = a.x;
    y1 = a.y;
    x2 = b.x;
    y2 = b.y;
  }
  // Invalid parameters
  else {
    return Infinity;
  }

  // Handle edge cases
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    return Infinity;
  }

  const dx = x1 - x2;
  const dy = y1 - y2;
  const result = Math.sqrt(dx * dx + dy * dy);

  // Check for NaN result
  if (isNaN(result)) {
    return Infinity;
  }

  return result;
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function magnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

module.exports = {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp,
  lerp
};