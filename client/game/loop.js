// Game loop and update/draw cycle
import { player, camera } from './player.js';
import { entities } from './entities.js';
import { planets } from './planets.js';
import { canvas, ctx, getViewportSize } from './canvas.js';
import { otherPlayers, playerCount, connectionStatus } from '../network/socket.js';
import { joystickActive, joystickValue } from '../ui/joystick.js';
import { socket } from '../network/socket.js';
import { stopTravelBtn, updatePlanetTravelButtons, planetTravelBtns } from '../ui/ui.js';
import { distance, angleTo, normalizeAngle, magnitude, clamp, lerp } from './mathUtils.js';

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

function drawPlanets(ctx) {
  for (const planet of planets) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 8);
    ctx.restore();
  }
}

function drawPlanetDistances(ctx) {
  for (const planet of planets) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(planet.x, planet.y);
    ctx.strokeStyle = '#fff6';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    const dist = distance(player, planet);
    const midX = player.x + (planet.x - player.x) * 0.5;
    const midY = player.y + (planet.y - player.y) * 0.5;
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${dist.toFixed(0)} units`, midX, midY - 8);
    ctx.restore();
  }
}

// --- Input state ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function isManualInputActive() {
  // Keyboard
  if (keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d'] || keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s']) return true;
  // Joystick
  if (joystickActive || Math.abs(joystickValue.x) > 0.1 || Math.abs(joystickValue.y) > 0.1) return true;
  return false;
}

// --- Update logic ---
function update() {
  // --- Travel, follow, and input logic ---
  // These variables should be moved to a state module or kept here for now
  // For now, define them here for migration
  // (You may want to refactor these into a state module later)
  if (!window._gameState) window._gameState = {};
  const state = window._gameState;
  if (state.initialized !== true) {
    state.selectedPlanet = null;
    state.isTraveling = false;
    state.travelStartTime = 0;
    state.travelDuration = 0;
    state.travelFrom = null;
    state.AUTOPILOT_STRENGTH = 0.04;
    state.ARRIVAL_RADIUS = 40;
    state.ENTITY_FOLLOW_PADDING = 20;
    state.stopTravelBtn = stopTravelBtn;
    state.travelTurnStart = 0;
    state.travelTurnDuration = 1000;
    state.travelInitialAngle = 0;
    state.travelTargetAngle = 0;
    state.travelTurning = false;
    state.playerFollowEntityIndex = null;
    state.lastMoveSent = 0;
    state.MOVE_SEND_INTERVAL = 50;
    state.initialized = true;
  }
  // --- Follow entity logic ---
  if (state.playerFollowEntityIndex !== null && entities[state.playerFollowEntityIndex]) {
    const target = entities[state.playerFollowEntityIndex];
    const followDist = target.radius + player.radius + state.ENTITY_FOLLOW_PADDING;
    const rawAngle = angleTo(player, target);
    const followX = target.x - Math.cos(rawAngle) * followDist;
    const followY = target.y - Math.sin(rawAngle) * followDist;
    const dx = followX - player.x;
    const dy = followY - player.y;
    const dist = magnitude(dx, dy);
    const angleToFollow = Math.atan2(dy, dx);
    const slowRadius = Math.max(followDist * 2, target.radius * 2);
    let slowFactor = Math.min(1, dist / slowRadius);
    const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
    const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
    let delta = normalizeAngle(angleToFollow - player.angle);
    if (Math.abs(delta) > player.rotationSpeed) {
      player.angle += Math.sign(delta) * player.rotationSpeed;
      player.angle = normalizeAngle(player.angle);
    } else {
      player.angle = angleToFollow;
    }
    player.vx += Math.cos(player.angle) * autoAccel;
    player.vy += Math.sin(player.angle) * autoAccel;
    const velocity = magnitude(player.vx, player.vy);
    if (velocity > autoMaxSpeed) {
      player.vx = (player.vx / velocity) * autoMaxSpeed;
      player.vy = (player.vy / velocity) * autoMaxSpeed;
    }
    if (dist < 1) {
      player.vx = 0;
      player.vy = 0;
    }
  } else if (state.isTraveling && state.selectedPlanet) {
    if (state.travelTurning) {
      const now = Date.now();
      const t = Math.min(1, (now - state.travelTurnStart) / state.travelTurnDuration);
      let delta = normalizeAngle(state.travelTargetAngle - state.travelInitialAngle);
      player.angle = normalizeAngle(state.travelInitialAngle + delta * t);
      if (t >= 1) {
        state.travelTurning = false;
      }
    } else if (!isManualInputActive()) {
      const dist = distance(player, state.selectedPlanet);
      const angleToPlanet = angleTo(player, state.selectedPlanet);
      const slowRadius = Math.max(state.ARRIVAL_RADIUS + state.selectedPlanet.radius, state.selectedPlanet.radius * 2);
      let slowFactor = Math.min(1, dist / slowRadius);
      const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
      let delta = normalizeAngle(angleToPlanet - player.angle);
      if (Math.abs(delta) > player.rotationSpeed) {
        player.angle += Math.sign(delta) * player.rotationSpeed;
        player.angle = normalizeAngle(player.angle);
      } else {
        player.angle = angleToPlanet;
      }
      player.vx += Math.cos(player.angle) * autoAccel;
      player.vy += Math.sin(player.angle) * autoAccel;
      const velocity = magnitude(player.vx, player.vy);
      if (velocity > autoMaxSpeed) {
        player.vx = (player.vx / velocity) * autoMaxSpeed;
        player.vy = (player.vy / velocity) * autoMaxSpeed;
      }
    }
    const dist = distance(player, state.selectedPlanet);
    if (dist < state.selectedPlanet.radius) {
      player.vx = 0;
      player.vy = 0;
      state.isTraveling = false;
      state.selectedPlanet = null;
      state.stopTravelBtn.style.display = 'none';
      state.travelTurning = false;
      updateTravelUI();
    }
  }
  // Joystick input
  if (joystickActive || Math.abs(joystickValue.x) > 0.1 || Math.abs(joystickValue.y) > 0.1) {
    const mag = magnitude(joystickValue.x, joystickValue.y);
    if (mag > 0.1) {
      const joyAngle = Math.atan2(joystickValue.y, joystickValue.x);
      player.angle = joyAngle;
      player.vx = Math.cos(joyAngle) * player.maxSpeed * mag;
      player.vy = Math.sin(joyAngle) * player.maxSpeed * mag;
    } else {
      player.vx *= player.friction;
      player.vy *= player.friction;
    }
  } else {
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
    player.vx *= player.friction;
    player.vy *= player.friction;
    const velocity = magnitude(player.vx, player.vy);
    if (velocity > player.maxSpeed) {
      player.vx = (player.vx / velocity) * player.maxSpeed;
      player.vy = (player.vy / velocity) * player.maxSpeed;
    }
  }
  player.x += player.vx;
  player.y += player.vy;
  player.x = clamp(player.x, player.radius, 6000 - player.radius);
  player.y = clamp(player.y, player.radius, 6000 - player.radius);
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  camera.x = player.x - VIEWPORT_WIDTH / 2;
  camera.y = player.y - VIEWPORT_HEIGHT / 2;
  camera.x = clamp(camera.x, 0, 6000 - VIEWPORT_WIDTH);
  camera.y = clamp(camera.y, 0, 6000 - VIEWPORT_HEIGHT);
  if (socket && socket.connected) {
    const now = Date.now();
    if (now - state.lastMoveSent > state.MOVE_SEND_INTERVAL) {
      socket.emit('move', {
        x: player.x,
        y: player.y,
        angle: player.angle,
        vx: player.vx,
        vy: player.vy,
        radius: player.radius
      });
      state.lastMoveSent = now;
    }
  }
}

function draw() {
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = '#444';
  for (let x = 0; x <= 6000; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 6000);
    ctx.stroke();
  }
  for (let y = 0; y <= 6000; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(6000, y);
    ctx.stroke();
  }
  for (const entity of entities) {
    drawEntity(ctx, entity, '#f55', '#fff');
  }
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    drawEntity(ctx, p, '#09f', '#fff');
  }
  drawEntity(ctx, player, '#0f0', '#fff');
  drawPlanets(ctx);
  drawPlanetDistances(ctx);
  ctx.restore();

  // --- Travel Progress Overlay ---
  const state = window._gameState;
  if (state && state.isTraveling && state.selectedPlanet && state.travelFrom) {
    const distToCenter = distance(player, state.selectedPlanet);
    const distToBorder = Math.max(0, distToCenter - state.selectedPlanet.radius);
    const estSeconds = Math.ceil(distToBorder / (player.maxSpeed / 2));
    const origDistToCenter = distance(state.travelFrom, state.selectedPlanet);
    const origDistToBorder = Math.max(0, origDistToCenter - state.selectedPlanet.radius);
    const t = 1 - Math.min(1, distToBorder / (origDistToBorder || 1));
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
    ctx.fillStyle = '#4af';
    ctx.fillRect(canvas.width / 2 - 178, canvas.height - 58, 356 * t, 36);
    ctx.font = '22px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Traveling to ${state.selectedPlanet.name}... ~${estSeconds}s left`, canvas.width / 2, canvas.height - 40);
    ctx.restore();
  }

  ctx.save();
  ctx.font = '20px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const coordText = `X: ${player.x.toFixed(0)}  Y: ${player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  ctx.fillText(`Players: ${playerCount}`, 12, 36);
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

export function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Setup travelHandlers for UI buttons
const travelHandlers = {
  onTravel: (planet) => {
    const state = window._gameState;
    if (!state.isTraveling) {
      state.selectedPlanet = planet;
      state.isTraveling = true;
      state.travelStartTime = Date.now();
      state.travelFrom = { x: player.x, y: player.y };
      const distToCenter = distance(player, planet);
      const distToBorder = Math.max(0, distToCenter - planet.radius);
      state.travelDuration = Math.max(10 * 1000, distToBorder * 1000);
      state.stopTravelBtn.style.display = 'block';
      state.travelTurnStart = Date.now();
      state.travelTurning = true;
      state.travelInitialAngle = player.angle;
      state.travelTargetAngle = angleTo(player, planet);
      state.playerFollowEntityIndex = null;
      updatePlanetTravelButtons(planets, state.isTraveling, state.selectedPlanet, travelHandlers);
    }
  }
};

// Initial UI setup
window.addEventListener('DOMContentLoaded', () => {
  const state = window._gameState || {};
  updatePlanetTravelButtons(planets, state.isTraveling, state.selectedPlanet, travelHandlers);
});

// Update UI when travel state changes (call after arrival or stop)
function updateTravelUI() {
  const state = window._gameState;
  updatePlanetTravelButtons(planets, state.isTraveling, state.selectedPlanet, travelHandlers);
}

// Add click handler for canvas to support click-to-travel/follow
canvas.addEventListener('click', function(e) {
  const state = window._gameState;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left + camera.x;
  const clickY = e.clientY - rect.top + camera.y;
  // Check planets first
  for (const planet of planets) {
    if (magnitude(clickX - planet.x, clickY - planet.y) < planet.radius + 10) {
      if (!state.isTraveling) {
        travelHandlers.onTravel(planet);
      }
      state.playerFollowEntityIndex = null;
      updateTravelUI();
      return;
    }
  }
  // Check entities
  let foundEntity = false;
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    if (magnitude(clickX - entity.x, clickY - entity.y) < entity.radius + 10) {
      state.playerFollowEntityIndex = i;
      foundEntity = true;
      state.selectedPlanet = null;
      state.isTraveling = false;
      state.stopTravelBtn.style.display = 'none';
      updateTravelUI();
      break;
    }
  }
  if (!foundEntity) {
    state.playerFollowEntityIndex = null; // click on empty space stops following
    updateTravelUI();
  }
});

// Patch: update UI when travel ends (arrival or stop)
// Call updateTravelUI() in the travel arrival logic and stopTravelBtn handler

// Patch stopTravelBtn to update UI when clicked
stopTravelBtn.addEventListener('click', () => {
  const state = window._gameState;
  state.isTraveling = false;
  state.selectedPlanet = null;
  state.stopTravelBtn.style.display = 'none';
  state.travelTurning = false;
  updateTravelUI();
});