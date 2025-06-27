// Canvas utilities
let canvas, ctx;

// Initialize canvas when DOM is ready
function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  ctx = canvas.getContext('2d');

  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

// Set canvas size
function resizeCanvas() {
  if (!canvas) return;
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCanvas);
} else {
  initCanvas();
}

export { canvas, ctx, getViewportSize, resizeCanvas, initCanvas };