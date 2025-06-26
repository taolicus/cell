// Canvas utilities
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
  const { width, height } = getViewportSize();
  canvas.width = width;
  canvas.height = height;
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

export { canvas, ctx, getViewportSize, resizeCanvas };