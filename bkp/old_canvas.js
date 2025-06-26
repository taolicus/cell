// Canvas and drawing logic
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

export function getViewportSize() {
  return { width: canvas.width, height: canvas.height };
}