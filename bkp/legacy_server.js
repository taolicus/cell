const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp,
  lerp,
} = require("./math");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (index.html, main.js)
app.use(express.static(__dirname));

// World size constants for player spawn
const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 6000;

// Store player states
let players = {};

// --- Entities (non-player) ---
const NUM_ENTITIES = 20;
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
    changeDirCooldown: 0,
    followTargetId: null, // index of entity or 'player:<socketId>'
    followCooldown: 0,
  };
}
let entities = Array.from({ length: NUM_ENTITIES }, createEntity);

function updateEntities() {
  // Gather all possible targets (players and entities)
  const playerList = Object.entries(players).map(([id, p]) => ({
    ...p,
    id: "player:" + id,
  }));
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    // Handle follow cooldown
    if (entity.followCooldown > 0) {
      entity.followCooldown--;
    }
    // Decide whether to start/stop following
    if (entity.followCooldown <= 0) {
      // 20% chance to start/stop following every 2-4 seconds
      if (Math.random() < 0.2) {
        // Find nearest target (player or other entity, not self)
        let nearest = null;
        let nearestDist = Infinity;
        // Check players
        for (const p of playerList) {
          const dist = distance(entity, p);
          if (dist < 400 && dist < nearestDist) {
            // only follow if within 400 units
            nearest = p.id;
            nearestDist = dist;
          }
        }
        // Check other entities
        for (let j = 0; j < entities.length; j++) {
          if (j === i) continue;
          const e2 = entities[j];
          const dist = distance(entity, e2);
          if (dist < 400 && dist < nearestDist) {
            nearest = j;
            nearestDist = dist;
          }
        }
        if (nearest !== null) {
          entity.followTargetId = nearest;
        } else {
          entity.followTargetId = null;
        }
      } else {
        // Sometimes stop following
        entity.followTargetId = null;
      }
      // Set next followCooldown (2-4 seconds)
      entity.followCooldown = 40 + Math.floor(Math.random() * 40);
    }
    // If following, set targetAngle toward target
    if (entity.followTargetId !== null) {
      let target = null;
      if (
        typeof entity.followTargetId === "string" &&
        entity.followTargetId.startsWith("player:")
      ) {
        const pid = entity.followTargetId.slice(7);
        if (players[pid]) target = players[pid];
      } else if (
        typeof entity.followTargetId === "number" &&
        entities[entity.followTargetId]
      ) {
        target = entities[entity.followTargetId];
      }
      if (target) {
        entity.targetAngle = angleTo(entity, target);
        entity.targetSpeed = entity.maxSpeed * (0.7 + 0.3 * Math.random());
      }
    } else {
      // Wander as before
      if (entity.changeDirCooldown <= 0) {
        entity.targetAngle = Math.random() * Math.PI * 2;
        entity.targetSpeed = Math.random() * entity.maxSpeed;
        entity.changeDirCooldown = 30 + Math.random() * 60;
      } else {
        entity.changeDirCooldown--;
      }
    }
    let angleDiff = entity.targetAngle - entity.angle;
    angleDiff = normalizeAngle(angleDiff);
    if (Math.abs(angleDiff) < entity.rotationSpeed) {
      entity.angle = entity.targetAngle;
    } else {
      entity.angle += Math.sign(angleDiff) * entity.rotationSpeed;
    }
    entity.speed += (entity.targetSpeed - entity.speed) * 0.05;
    entity.vx +=
      (Math.cos(entity.angle) * entity.acceleration * entity.speed) /
      entity.maxSpeed;
    entity.vy +=
      (Math.sin(entity.angle) * entity.acceleration * entity.speed) /
      entity.maxSpeed;
    let v = magnitude(entity.vx, entity.vy);
    if (v > entity.maxSpeed) {
      entity.vx = (entity.vx / v) * entity.maxSpeed;
      entity.vy = (entity.vy / v) * entity.maxSpeed;
    }
    entity.vx *= entity.friction;
    entity.vy *= entity.friction;
    entity.x += entity.vx;
    entity.y += entity.vy;
    entity.x = clamp(entity.x, entity.radius, WORLD_WIDTH - entity.radius);
    entity.y = clamp(entity.y, entity.radius, WORLD_HEIGHT - entity.radius);
  }
}

// --- Entity update loop ---
setInterval(() => {
  updateEntities();
  io.emit("entities", entities);
}, 50);

app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => res.send("OK"));

// --- Rate limiting for move events ---
const MOVE_INTERVAL_MS = 33; // ~30Hz
const lastMoveTimestamps = {};

io.on("connection", (socket) => {
  // Send world size to the client
  socket.emit("worldSize", { width: WORLD_WIDTH, height: WORLD_HEIGHT });
  // Spawn all players at the center
  players[socket.id] = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 20,
  };

  // Send all players to everyone
  io.emit("players", players);
  // Send current entities to the new client
  socket.emit("entities", entities);

  socket.on("move", (data) => {
    const now = Date.now();
    if (
      !lastMoveTimestamps[socket.id] ||
      now - lastMoveTimestamps[socket.id] > MOVE_INTERVAL_MS
    ) {
      players[socket.id] = { ...players[socket.id], ...data };
      io.emit("players", players);
      lastMoveTimestamps[socket.id] = now;
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    delete lastMoveTimestamps[socket.id];
    io.emit("players", players);
  });
});

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
