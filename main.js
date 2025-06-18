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

// Number of random entities
const NUM_ENTITIES = 2; // Change this value to tweak the number of entities

// Other entities (random movers)
function createEntity() {
  return {
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: 18,
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2, // for gradual turning
    vx: 0,
    vy: 0,
    speed: 0,
    targetSpeed: Math.random() * 3, // for gradual speed change
    maxSpeed: 3,
    acceleration: 0.1,
    friction: 0.98,
    rotationSpeed: 0.04, // similar to player
    changeDirCooldown: 0
  };
}

const entities = Array.from({ length: NUM_ENTITIES }, createEntity);

// --- Multiplayer Setup ---
let socket;
let otherPlayers = {};

if (typeof io !== 'undefined') {
  socket = io();

  // Receive other players' states
  socket.on('players', (players) => {
    otherPlayers = { ...players };
    if (socket.id && otherPlayers[socket.id]) {
      delete otherPlayers[socket.id];
    }
  });
}

function update() {
  // Rotate player
  if (keys['ArrowLeft'] || keys['a']) player.angle -= player.rotationSpeed;
  if (keys['ArrowRight'] || keys['d']) player.angle += player.rotationSpeed;

  // Thrust forward/backward
  if (keys['ArrowUp'] || keys['w']) {
    player.vx += Math.cos(player.angle) * player.acceleration;
    player.vy += Math.sin(player.angle) * player.acceleration;
  }
  if (keys['ArrowDown'] || keys['s']) {
    player.vx *= 0.96; // stronger drag when braking
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

  // Update entities (random movement)
  for (const entity of entities) {
    // Randomly pick a new target angle and speed every 30-90 frames
    if (entity.changeDirCooldown <= 0) {
      entity.targetAngle = Math.random() * Math.PI * 2;
      entity.targetSpeed = Math.random() * entity.maxSpeed;
      entity.changeDirCooldown = 30 + Math.random() * 60;
    } else {
      entity.changeDirCooldown--;
    }
    // Gradually rotate toward targetAngle
    let angleDiff = entity.targetAngle - entity.angle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    if (Math.abs(angleDiff) < entity.rotationSpeed) {
      entity.angle = entity.targetAngle;
    } else {
      entity.angle += Math.sign(angleDiff) * entity.rotationSpeed;
    }
    // Gradually change speed toward targetSpeed
    entity.speed += (entity.targetSpeed - entity.speed) * 0.05;
    // Accelerate in current direction based on current speed
    entity.vx += Math.cos(entity.angle) * entity.acceleration * entity.speed / entity.maxSpeed;
    entity.vy += Math.sin(entity.angle) * entity.acceleration * entity.speed / entity.maxSpeed;
    // Clamp speed
    let v = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (v > entity.maxSpeed) {
      entity.vx = (entity.vx / v) * entity.maxSpeed;
      entity.vy = (entity.vy / v) * entity.maxSpeed;
    }
    // Apply friction
    entity.vx *= entity.friction;
    entity.vy *= entity.friction;
    // Update position
    entity.x += entity.vx;
    entity.y += entity.vy;
    // Clamp to world bounds
    entity.x = Math.max(entity.radius, Math.min(WORLD_WIDTH - entity.radius, entity.x));
    entity.y = Math.max(entity.radius, Math.min(WORLD_HEIGHT - entity.radius, entity.y));
  }

  // Send player state to server
  if (socket && socket.connected) {
    socket.emit('move', {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius
    });
  }
}

function draw() {
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Draw world background (simple grid)
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
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
  ctx.fillStyle = '#f55';
  for (const entity of entities) {
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw direction indicator for entity
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);
    ctx.lineTo(
      entity.x + Math.cos(entity.angle) * entity.radius,
      entity.y + Math.sin(entity.angle) * entity.radius
    );
    ctx.stroke();
  }

  // Draw player
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw direction indicator (radius line)
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(
    player.x + Math.cos(player.angle) * player.radius,
    player.y + Math.sin(player.angle) * player.radius
  );
  ctx.stroke();

  // Draw other players
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.fillStyle = '#09f';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius || 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(
      p.x + Math.cos(p.angle) * (p.radius || 20),
      p.y + Math.sin(p.angle) * (p.radius || 20)
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();