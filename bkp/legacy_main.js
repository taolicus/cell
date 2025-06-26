import {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp,
} from "./game/math.js";

// Canvas and context setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// World and viewport sizes
let WORLD_WIDTH = 6000;
let WORLD_HEIGHT = 6000;

// Set canvas size to fill window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
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
  rotationSpeed: 0.06,
};

// Camera position
let camera = {
  x: player.x - getViewportSize().width / 2,
  y: player.y - getViewportSize().height / 2,
};

// Input state
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

let entities = [];

// --- Multiplayer Setup ---
let socket;
let otherPlayers = {};
let mySocketId = null;
let connectionStatus = "connecting"; // 'connecting', 'connected', 'disconnected'
let playerCount = 1;

if (typeof io !== "undefined") {
  socket = io();

  socket.on("connect", () => {
    mySocketId = socket.id;
    connectionStatus = "connected";
    // Send initial state
    socket.emit("move", {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius,
    });
  });
  socket.on("disconnect", () => {
    connectionStatus = "disconnected";
  });

  // Register 'players' handler only once
  socket.on("players", (players) => {
    if (!mySocketId) return;
    otherPlayers = { ...players };
    if (otherPlayers[mySocketId]) {
      delete otherPlayers[mySocketId];
    }
    playerCount = Object.keys(players).length;
  });

  // Listen for entities from the server
  socket.on("entities", (serverEntities) => {
    entities = serverEntities;
  });

  socket.on("worldSize", (size) => {
    WORLD_WIDTH = size.width;
    WORLD_HEIGHT = size.height;
  });
}

// Throttle sending player state to server
let lastMoveSent = 0;
const MOVE_SEND_INTERVAL = 50; // ms, 20Hz

// --- Joystick for Mobile Devices ---
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystick-knob");
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickValue = { x: 0, y: 0 };

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function showJoystickIfMobile() {
  if (isTouchDevice()) {
    joystick.style.display = "block";
  }
}
showJoystickIfMobile();

joystick.addEventListener(
  "touchstart",
  function (e) {
    e.preventDefault();
    joystickActive = true;
    const rect = joystick.getBoundingClientRect();
    const touch = e.touches[0];
    joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystick(touch.clientX, touch.clientY);
  },
  { passive: false }
);

joystick.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
    if (!joystickActive) return;
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
  },
  { passive: false }
);

joystick.addEventListener(
  "touchend",
  function (e) {
    e.preventDefault();
    joystickActive = false;
    joystickValue = { x: 0, y: 0 };
    joystickKnob.style.left = "40px";
    joystickKnob.style.top = "40px";
  },
  { passive: false }
);

function updateJoystick(x, y) {
  // Calculate relative to center
  let dx = x - joystickCenter.x;
  let dy = y - joystickCenter.y;
  // Clamp to radius 50px
  const maxDist = 50;
  const dist = magnitude(dx, dy);
  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }
  joystickKnob.style.left = 40 + dx + "px";
  joystickKnob.style.top = 40 + dy + "px";
  joystickValue = { x: dx / maxDist, y: dy / maxDist };
}

// --- PLANETS ---
const planets = [
  { name: "Terra", x: 1000, y: 1200, radius: 60, color: "#4af" },
  { name: "Vega", x: 5000, y: 800, radius: 50, color: "#fa4" },
  { name: "Zyra", x: 3200, y: 5000, radius: 70, color: "#a4f" },
];
let selectedPlanet = null;
let isTraveling = false;
let travelStartTime = 0;
let travelDuration = 0;
let travelFrom = null;
const AUTOPILOT_STRENGTH = 0.04; // how strongly autopilot nudges toward planet
const ARRIVAL_RADIUS = 40; // how close to planet center counts as arrived
// Extra buffer when following a moving entity to avoid touching it
const ENTITY_FOLLOW_PADDING = 20;
const stopTravelBtn = document.getElementById("stopTravelBtn");
let travelTurnStart = 0;
let travelTurnDuration = 1000; // ms
let travelInitialAngle = 0;
let travelTargetAngle = 0;
let travelTurning = false;

// --- PLANET TRAVEL BUTTONS ---
const planetTravelBtns = document.getElementById("planetTravelBtns");
function updatePlanetTravelButtons() {
  // Clear existing
  planetTravelBtns.innerHTML = "";
  if (!isTraveling) {
    planets.forEach((planet, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `Travel to ${planet.name}`;
      btn.style.padding = "12px 20px";
      btn.style.fontSize = "20px";
      btn.style.background = planet.color;
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.borderRadius = "8px";
      btn.style.boxShadow = "0 2px 8px #0008";
      btn.style.cursor = "pointer";
      btn.id = `travelBtn_${planet.name}`;
      btn.onclick = () => {
        selectedPlanet = planet;
        if (!isTraveling) {
          isTraveling = true;
          travelStartTime = Date.now();
          travelFrom = { x: player.x, y: player.y };
          const distToCenter = distance(player, planet);
          const distToBorder = Math.max(0, distToCenter - planet.radius);
          travelDuration = Math.max(10 * 1000, distToBorder * 1000);
          stopTravelBtn.style.display = "block";
          travelTurnStart = Date.now();
          travelTurning = true;
          travelInitialAngle = player.angle;
          travelTargetAngle = angleTo(player, planet);
        }
      };
      planetTravelBtns.appendChild(btn);
    });
    planetTravelBtns.style.display = "flex";
  } else {
    planetTravelBtns.style.display = "none";
  }
}

// --- PLANET DRAWING & DISTANCE ---
function drawPlanets(ctx) {
  for (const planet of planets) {
    // Draw planet
    ctx.save();
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    // Draw name
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 8);
    ctx.restore();
  }
}

function drawPlanetDistances(ctx) {
  for (const planet of planets) {
    // Draw line from player to planet
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(planet.x, planet.y);
    ctx.strokeStyle = "#fff6";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Draw distance label
    const dx = planet.x - player.x;
    const dy = planet.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = player.x + dx * 0.5;
    const midY = player.y + dy * 0.5;
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${dist.toFixed(0)} units`, midX, midY - 8);
    ctx.restore();
  }
}

// --- PLANET CLICK HANDLER ---
let playerFollowEntityIndex = null; // index in entities[]

canvas.addEventListener("click", function (e) {
  // Convert click to world coordinates
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left + camera.x;
  const clickY = e.clientY - rect.top + camera.y;
  // Check planets first
  for (const planet of planets) {
    if (magnitude(clickX - planet.x, clickY - planet.y) < planet.radius + 10) {
      selectedPlanet = planet;
      // Start travel
      if (!isTraveling) {
        isTraveling = true;
        travelStartTime = Date.now();
        travelFrom = { x: player.x, y: player.y };
        const distToCenter = distance(player, planet);
        const distToBorder = Math.max(0, distToCenter - planet.radius);
        travelDuration = Math.max(10 * 1000, distToBorder * 1000);
        stopTravelBtn.style.display = "block";
        travelTurnStart = Date.now();
        travelTurning = true;
        travelInitialAngle = player.angle;
        travelTargetAngle = angleTo(player, planet);
      }
      playerFollowEntityIndex = null; // stop following entity if planet clicked
      return;
    }
  }
  // Check entities
  let foundEntity = false;
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (magnitude(clickX - entity.x, clickY - entity.y) < entity.radius + 10) {
      playerFollowEntityIndex = i;
      foundEntity = true;
      selectedPlanet = null;
      isTraveling = false;
      stopTravelBtn.style.display = "none";
      break;
    }
  }
  if (!foundEntity) {
    playerFollowEntityIndex = null; // click on empty space stops following
  }
});

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    playerFollowEntityIndex = null;
  }
});

// --- STOP TRAVEL BUTTON HANDLER ---
stopTravelBtn.addEventListener("click", function () {
  isTraveling = false;
  selectedPlanet = null;
  stopTravelBtn.style.display = "none";
  travelTurning = false;
  updatePlanetTravelButtons();
});

function isManualInputActive() {
  // Keyboard
  if (
    keys["ArrowLeft"] ||
    keys["a"] ||
    keys["ArrowRight"] ||
    keys["d"] ||
    keys["ArrowUp"] ||
    keys["w"] ||
    keys["ArrowDown"] ||
    keys["s"]
  )
    return true;
  // Joystick
  if (
    joystickActive ||
    Math.abs(joystickValue.x) > 0.1 ||
    Math.abs(joystickValue.y) > 0.1
  )
    return true;
  return false;
}

function update() {
  if (playerFollowEntityIndex !== null && entities[playerFollowEntityIndex]) {
    const target = entities[playerFollowEntityIndex];
    // Compute a follow point just outside the entity to maintain a gap
    const followDist = target.radius + player.radius + ENTITY_FOLLOW_PADDING;
    const rawAngle = angleTo(player, target);
    const followX = target.x - Math.cos(rawAngle) * followDist;
    const followY = target.y - Math.sin(rawAngle) * followDist;
    const dx = followX - player.x;
    const dy = followY - player.y;
    const dist = magnitude(dx, dy);
    const angleToFollow = Math.atan2(dy, dx);
    // Slow down as we approach the follow point
    const slowRadius = Math.max(followDist * 2, target.radius * 2);
    let slowFactor = Math.min(1, dist / slowRadius);
    // Interpolate maxSpeed and acceleration
    const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
    const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
    // Rotate toward the follow point
    let delta = normalizeAngle(angleToFollow - player.angle);
    if (Math.abs(delta) > player.rotationSpeed) {
      player.angle += Math.sign(delta) * player.rotationSpeed;
      player.angle = normalizeAngle(player.angle);
    } else {
      player.angle = angleToFollow;
    }
    // Accelerate forward toward follow point
    player.vx += Math.cos(player.angle) * autoAccel;
    player.vy += Math.sin(player.angle) * autoAccel;
    // Clamp speed
    const velocity = magnitude(player.vx, player.vy);
    if (velocity > autoMaxSpeed) {
      player.vx = (player.vx / velocity) * autoMaxSpeed;
      player.vy = (player.vy / velocity) * autoMaxSpeed;
    }
    // Stop when close enough to the follow distance
    if (dist < 1) {
      player.vx = 0;
      player.vy = 0;
    }
    // Friction is applied below as usual
  } else if (isTraveling && selectedPlanet) {
    // Smoothly turn toward destination at start of travel
    if (travelTurning) {
      const now = Date.now();
      const t = Math.min(1, (now - travelTurnStart) / travelTurnDuration);
      // Interpolate angle shortest way
      let delta = normalizeAngle(travelTargetAngle - travelInitialAngle);
      player.angle = normalizeAngle(travelInitialAngle + delta * t);
      if (t >= 1) {
        travelTurning = false;
      }
    } else if (!isManualInputActive()) {
      // --- AUTOPILOT: use normal movement mechanics, but slow down near planet ---
      const dist = distance(player, selectedPlanet);
      const angleToPlanet = angleTo(player, selectedPlanet);
      // Slow down as we approach
      const slowRadius = Math.max(
        ARRIVAL_RADIUS + selectedPlanet.radius,
        selectedPlanet.radius * 2
      );
      let slowFactor = Math.min(1, dist / slowRadius); // 1 far, 0 at center
      // Interpolate maxSpeed and acceleration
      const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
      // Rotate toward target at normal speed
      let delta = normalizeAngle(angleToPlanet - player.angle);
      if (Math.abs(delta) > player.rotationSpeed) {
        player.angle += Math.sign(delta) * player.rotationSpeed;
        player.angle = normalizeAngle(player.angle);
      } else {
        player.angle = angleToPlanet;
      }
      // Accelerate forward as if holding up, but scaled
      player.vx += Math.cos(player.angle) * autoAccel;
      player.vy += Math.sin(player.angle) * autoAccel;
      // Clamp speed
      const velocity = magnitude(player.vx, player.vy);
      if (velocity > autoMaxSpeed) {
        player.vx = (player.vx / velocity) * autoMaxSpeed;
        player.vy = (player.vy / velocity) * autoMaxSpeed;
      }
      // Friction is applied below as usual
    }
    // Arrival check (always)
    const dist = distance(player, selectedPlanet);
    // If within planet radius, stop at center
    if (dist < selectedPlanet.radius) {
      player.vx = 0;
      player.vy = 0;
      isTraveling = false;
      selectedPlanet = null;
      stopTravelBtn.style.display = "none";
      travelTurning = false;
      updatePlanetTravelButtons();
    }
  }
  // --- Joystick input (overrides keyboard if active) ---
  if (
    joystickActive ||
    Math.abs(joystickValue.x) > 0.1 ||
    Math.abs(joystickValue.y) > 0.1
  ) {
    // Calculate magnitude and direction
    const mag = magnitude(joystickValue.x, joystickValue.y);
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
    if (keys["ArrowLeft"] || keys["a"]) player.angle -= player.rotationSpeed;
    if (keys["ArrowRight"] || keys["d"]) player.angle += player.rotationSpeed;
    if (keys["ArrowUp"] || keys["w"]) {
      player.vx += Math.cos(player.angle) * player.acceleration;
      player.vy += Math.sin(player.angle) * player.acceleration;
    }
    if (keys["ArrowDown"] || keys["s"]) {
      player.vx *= 0.96;
      player.vy *= 0.96;
    }
    // Apply friction (liquid drag)
    player.vx *= player.friction;
    player.vy *= player.friction;
    // Clamp speed
    const velocity = magnitude(player.vx, player.vy);
    if (velocity > player.maxSpeed) {
      player.vx = (player.vx / velocity) * player.maxSpeed;
      player.vy = (player.vy / velocity) * player.maxSpeed;
    }
  }

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // Clamp player to world bounds
  player.x = clamp(player.x, player.radius, WORLD_WIDTH - player.radius);
  player.y = clamp(player.y, player.radius, WORLD_HEIGHT - player.radius);

  // Camera follows player, but doesn't go outside world
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  camera.x = player.x - VIEWPORT_WIDTH / 2;
  camera.y = player.y - VIEWPORT_HEIGHT / 2;
  camera.x = clamp(camera.x, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  camera.y = clamp(camera.y, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);

  // Send player state to server (throttled)
  if (socket && socket.connected) {
    const now = Date.now();
    if (now - lastMoveSent > MOVE_SEND_INTERVAL) {
      socket.emit("move", {
        x: player.x,
        y: player.y,
        angle: player.angle,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius,
      });
      lastMoveSent = now;
    }
  }
}

// Draw a circular entity with a direction indicator
function drawEntity(ctx, entity, fillStyle = "#fff", strokeStyle = "#fff") {
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

// --- TRAVEL PROGRESS OVERLAY ---
function drawTravelOverlay(ctx) {
  if (isTraveling && selectedPlanet) {
    // Estimate time left based on distance and average speed
    const dx = selectedPlanet.x - player.x;
    const dy = selectedPlanet.y - player.y;
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    const distToBorder = Math.max(0, distToCenter - selectedPlanet.radius);
    // Estimate: time left = distToBorder / (player.maxSpeed/2) (rough guess)
    const estSeconds = Math.ceil(distToBorder / (player.maxSpeed / 2));
    // Draw overlay bar (show as percent of original border distance)
    const origDistToCenter = Math.sqrt(
      (selectedPlanet.x - travelFrom.x) ** 2 +
        (selectedPlanet.y - travelFrom.y) ** 2
    );
    const origDistToBorder = Math.max(
      0,
      origDistToCenter - selectedPlanet.radius
    );
    const t = 1 - Math.min(1, distToBorder / (origDistToBorder || 1));
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#222";
    ctx.fillRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
    // Progress bar
    ctx.fillStyle = "#4af";
    ctx.fillRect(canvas.width / 2 - 178, canvas.height - 58, 356 * t, 36);
    // Text
    ctx.font = "22px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Traveling to ${selectedPlanet.name}... ~${estSeconds}s left`,
      canvas.width / 2,
      canvas.height - 40
    );
    ctx.restore();
  }
}

function draw() {
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw world background (simple grid)
  ctx.strokeStyle = "#444";
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
    drawEntity(ctx, entity, "#f55", "#fff");
  }

  // Draw other players
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    drawEntity(ctx, p, "#09f", "#fff");
  }

  // Draw player
  drawEntity(ctx, player, "#0f0", "#fff");

  // Draw planets and distances
  drawPlanets(ctx);
  drawPlanetDistances(ctx);

  ctx.restore();

  // Draw player coordinates in the top-left corner (overlay)
  ctx.save();
  ctx.font = "20px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const coordText = `X: ${player.x.toFixed(0)}  Y: ${player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  // Draw player count
  ctx.fillText(`Players: ${playerCount}`, 12, 36);
  // Draw connection status overlay if not connected
  if (connectionStatus !== "connected") {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#fff";
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      connectionStatus === "connecting" ? "Connecting..." : "Disconnected",
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.restore();
  }
  ctx.restore();

  drawTravelOverlay(ctx);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Call updatePlanetTravelButtons on load
updatePlanetTravelButtons();
