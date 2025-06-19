// Canvas and context setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// World and viewport sizes
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

// Set canvas size to fill window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Update viewport size dynamically
function getViewportSize() {
  return { width: canvas.width, height: canvas.height };
}

// Player properties
const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  radius: 20,
  angle: 0, // in radians
  vx: 0,
  vy: 0,
  speed: 0, // current speed
  maxSpeed: 6,
  acceleration: 0.2,
  friction: 0.98, // liquid drag
  rotationSpeed: 0.06
};

// Camera position
let camera = {
  x: player.x - getViewportSize().width / 2,
  y: player.y - getViewportSize().height / 2
};

// Input state
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

let entities = [];

// --- Multiplayer Setup ---
let socket;
let otherPlayers = {};
let mySocketId = null;
let connectionStatus = 'connecting'; // 'connecting', 'connected', 'disconnected'
let playerCount = 1;

if (typeof io !== 'undefined') {
  socket = io();

  socket.on('connect', () => {
    mySocketId = socket.id;
    connectionStatus = 'connected';
    // Send initial state
    socket.emit('move', {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius
    });
  });
  socket.on('disconnect', () => {
    connectionStatus = 'disconnected';
  });

  // Register 'players' handler only once
  socket.on('players', (players) => {
    if (!mySocketId) return;
    otherPlayers = { ...players };
    if (otherPlayers[mySocketId]) {
      delete otherPlayers[mySocketId];
    }
    playerCount = Object.keys(players).length;
  });

  // Listen for entities from the server
  socket.on('entities', (serverEntities) => {
    entities = serverEntities;
  });
}

// Throttle sending player state to server
let lastMoveSent = 0;
const MOVE_SEND_INTERVAL = 50; // ms, 20Hz

// --- Joystick for Mobile Devices ---
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystick-knob');
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickValue = { x: 0, y: 0 };

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function showJoystickIfMobile() {
  if (isTouchDevice()) {
    joystick.style.display = 'block';
  }
}
showJoystickIfMobile();

joystick.addEventListener('touchstart', function(e) {
  e.preventDefault();
  joystickActive = true;
  const rect = joystick.getBoundingClientRect();
  const touch = e.touches[0];
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });

joystick.addEventListener('touchmove', function(e) {
  e.preventDefault();
  if (!joystickActive) return;
  const touch = e.touches[0];
  updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });

joystick.addEventListener('touchend', function(e) {
  e.preventDefault();
  joystickActive = false;
  joystickValue = { x: 0, y: 0 };
  joystickKnob.style.left = '40px';
  joystickKnob.style.top = '40px';
}, { passive: false });

function updateJoystick(x, y) {
  // Calculate relative to center
  let dx = x - joystickCenter.x;
  let dy = y - joystickCenter.y;
  // Clamp to radius 50px
  const maxDist = 50;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }
  joystickKnob.style.left = (40 + dx) + 'px';
  joystickKnob.style.top = (40 + dy) + 'px';
  joystickValue = { x: dx / maxDist, y: dy / maxDist };
}

function update() {
  // --- Joystick input (overrides keyboard if active) ---
  if (joystickActive || Math.abs(joystickValue.x) > 0.1 || Math.abs(joystickValue.y) > 0.1) {
    // Calculate magnitude and direction
    const mag = Math.sqrt(joystickValue.x * joystickValue.x + joystickValue.y * joystickValue.y);
    if (mag > 0.1) {
      // Joystick direction: atan2(-y, x) because y is inverted (screen coords)
      const joyAngle = Math.atan2(joystickValue.y, joystickValue.x);
      player.angle = joyAngle;
      // Set velocity directly, scale by maxSpeed and magnitude
      player.vx = Math.cos(joyAngle) * player.maxSpeed * mag;
      player.vy = Math.sin(joyAngle) * player.maxSpeed * mag;
    } else {
      // If joystick is near center, slow down
      player.vx *= player.friction;
      player.vy *= player.friction;
    }
  } else {
    // Keyboard input (original logic)
    if (keys['ArrowLeft'] || keys['a']) player.angle -= player.rotationSpeed;
    if (keys['ArrowRight'] || keys['d']) player.angle += player.rotationSpeed;
    if (keys['ArrowUp'] || keys['w']) {
      player.vx += Math.cos(player.angle) * player.acceleration;
      player.vy += Math.sin(player.angle) * player.acceleration;
    }
    if (keys['ArrowDown'] || keys['s']) {
      player.vx *= 0.96;
      player.vy *= 0.96;
    }
    // Apply friction (liquid drag)
    player.vx *= player.friction;
    player.vy *= player.friction;
    // Clamp speed
    const velocity = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (velocity > player.maxSpeed) {
      player.vx = (player.vx / velocity) * player.maxSpeed;
      player.vy = (player.vy / velocity) * player.maxSpeed;
    }
  }

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // Clamp player to world bounds
  player.x = Math.max(player.radius, Math.min(WORLD_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(WORLD_HEIGHT - player.radius, player.y));

  // Camera follows player, but doesn't go outside world
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  camera.x = player.x - VIEWPORT_WIDTH / 2;
  camera.y = player.y - VIEWPORT_HEIGHT / 2;
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, camera.y));

  // Send player state to server (throttled)
  if (socket && socket.connected) {
    const now = Date.now();
    if (now - lastMoveSent > MOVE_SEND_INTERVAL) {
      socket.emit('move', {
        x: player.x,
        y: player.y,
        angle: player.angle,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius
      });
      lastMoveSent = now;
    }
  }
}

// Draw a circular entity with a direction indicator
function drawEntity(ctx, entity, fillStyle = '#fff', strokeStyle = '#fff') {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(entity.x, entity.y);
  ctx.lineTo(
    entity.x + Math.cos(entity.angle) * entity.radius,
    entity.y + Math.sin(entity.angle) * entity.radius
  );
  ctx.stroke();
  ctx.restore();
}

function draw() {
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw world background (simple grid)
  ctx.strokeStyle = '#444';
  for (let x = 0; x <= WORLD_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }

  // Draw other entities
  for (const entity of entities) {
    drawEntity(ctx, entity, '#f55', '#fff');
  }

  // Draw other players
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    drawEntity(ctx, p, '#09f', '#fff');
  }

  // Draw player
  drawEntity(ctx, player, '#0f0', '#fff');

  ctx.restore();

  // Draw player coordinates in the top-left corner (overlay)
  ctx.save();
  ctx.font = '20px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const coordText = `X: ${player.x.toFixed(0)}  Y: ${player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  // Draw player count
  ctx.fillText(`Players: ${playerCount}`, 12, 36);
  // Draw connection status overlay if not connected
  if (connectionStatus !== 'connected') {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';
    ctx.font = '40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected',
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.restore();
  }
  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();