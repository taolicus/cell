const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (index.html, main.js)
app.use(express.static(__dirname));

// World size constants for player spawn
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

// Store player states
let players = {};

// --- Entities (non-player) ---
const NUM_ENTITIES = 2;
function createEntity() {
  return {
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: 18,
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2,
    vx: 0,
    vy: 0,
    speed: 0,
    targetSpeed: Math.random() * 3,
    maxSpeed: 3,
    acceleration: 0.1,
    friction: 0.98,
    rotationSpeed: 0.04,
    changeDirCooldown: 0
  };
}
let entities = Array.from({ length: NUM_ENTITIES }, createEntity);

function updateEntities() {
  for (const entity of entities) {
    if (entity.changeDirCooldown <= 0) {
      entity.targetAngle = Math.random() * Math.PI * 2;
      entity.targetSpeed = Math.random() * entity.maxSpeed;
      entity.changeDirCooldown = 30 + Math.random() * 60;
    } else {
      entity.changeDirCooldown--;
    }
    let angleDiff = entity.targetAngle - entity.angle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    if (Math.abs(angleDiff) < entity.rotationSpeed) {
      entity.angle = entity.targetAngle;
    } else {
      entity.angle += Math.sign(angleDiff) * entity.rotationSpeed;
    }
    entity.speed += (entity.targetSpeed - entity.speed) * 0.05;
    entity.vx += Math.cos(entity.angle) * entity.acceleration * entity.speed / entity.maxSpeed;
    entity.vy += Math.sin(entity.angle) * entity.acceleration * entity.speed / entity.maxSpeed;
    let v = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (v > entity.maxSpeed) {
      entity.vx = (entity.vx / v) * entity.maxSpeed;
      entity.vy = (entity.vy / v) * entity.maxSpeed;
    }
    entity.vx *= entity.friction;
    entity.vy *= entity.friction;
    entity.x += entity.vx;
    entity.y += entity.vy;
    entity.x = Math.max(entity.radius, Math.min(WORLD_WIDTH - entity.radius, entity.x));
    entity.y = Math.max(entity.radius, Math.min(WORLD_HEIGHT - entity.radius, entity.y));
  }
}

// --- Entity update loop ---
setInterval(() => {
  updateEntities();
  io.emit('entities', entities);
}, 50);

app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

// --- Rate limiting for move events ---
const MOVE_INTERVAL_MS = 33; // ~30Hz
const lastMoveTimestamps = {};

io.on('connection', (socket) => {
  // Spawn all players at the center
  players[socket.id] = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, angle: 0, vx: 0, vy: 0, radius: 20 };

  // Send all players to everyone
  io.emit('players', players);
  // Send current entities to the new client
  socket.emit('entities', entities);

  socket.on('move', (data) => {
    const now = Date.now();
    if (!lastMoveTimestamps[socket.id] || now - lastMoveTimestamps[socket.id] > MOVE_INTERVAL_MS) {
      players[socket.id] = { ...players[socket.id], ...data };
      io.emit('players', players);
      lastMoveTimestamps[socket.id] = now;
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete lastMoveTimestamps[socket.id];
    io.emit('players', players);
  });
});

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});