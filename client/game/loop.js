// Game loop and update/draw cycle
import { player, camera } from './player.js';
import { entities } from './entities.js';
import { planets } from './planets.js';
import { canvas, ctx, getViewportSize } from './canvas.js';
import { otherPlayers, playerCount, connectionStatus } from '../network/socket.js';
import { joystickActive, joystickValue } from '../ui/joystick.js';
import { socket } from '../network/socket.js';
import { stopTravelBtn } from '../ui/ui.js';

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
    const dx = planet.x - player.x;
    const dy = planet.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = player.x + dx * 0.5;
    const midY = player.y + dy * 0.5;
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
    const rawAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const followX = target.x - Math.cos(rawAngle) * followDist;
    const followY = target.y - Math.sin(rawAngle) * followDist;
    const dx = followX - player.x;
    const dy = followY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleToFollow = Math.atan2(dy, dx);
    const slowRadius = Math.max(followDist * 2, target.radius * 2);
    let slowFactor = Math.min(1, dist / slowRadius);
    const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
    const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
    let delta = angleToFollow - player.angle;
    delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (Math.abs(delta) > player.rotationSpeed) {
      player.angle += Math.sign(delta) * player.rotationSpeed;
      player.angle = ((player.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
    } else {
      player.angle = angleToFollow;
    }
    player.vx += Math.cos(player.angle) * autoAccel;
    player.vy += Math.sin(player.angle) * autoAccel;
    const velocity = Math.hypot(player.vx, player.vy);
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
      let delta = state.travelTargetAngle - state.travelInitialAngle;
      delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
      player.angle = state.travelInitialAngle + delta * t;
      player.angle = ((player.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
      if (t >= 1) {
        state.travelTurning = false;
      }
    } else {
      const dx = state.selectedPlanet.x - player.x;
      const dy = state.selectedPlanet.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angleToPlanet = Math.atan2(dy, dx);
      const slowRadius = Math.max(state.ARRIVAL_RADIUS + state.selectedPlanet.radius, state.selectedPlanet.radius * 2);
      let slowFactor = Math.min(1, dist / slowRadius);
      const autoMaxSpeed = 1.5 + (player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (player.acceleration - 0.05) * slowFactor;
      let delta = angleToPlanet - player.angle;
      delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
      if (Math.abs(delta) > player.rotationSpeed) {
        player.angle += Math.sign(delta) * player.rotationSpeed;
        player.angle = ((player.angle + Math.PI) % (2 * Math.PI)) - Math.PI;
      } else {
        player.angle = angleToPlanet;
      }
      player.vx += Math.cos(player.angle) * autoAccel;
      player.vy += Math.sin(player.angle) * autoAccel;
      const velocity = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (velocity > autoMaxSpeed) {
        player.vx = (player.vx / velocity) * autoMaxSpeed;
        player.vy = (player.vy / velocity) * autoMaxSpeed;
      }
    }
    const dx = state.selectedPlanet.x - player.x;
    const dy = state.selectedPlanet.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < state.selectedPlanet.radius) {
      player.vx = 0;
      player.vy = 0;
      state.isTraveling = false;
      state.selectedPlanet = null;
      state.stopTravelBtn.style.display = 'none';
      state.travelTurning = false;
      // updatePlanetTravelButtons();
    }
  }
  // Joystick input
  if (joystickActive || Math.abs(joystickValue.x) > 0.1 || Math.abs(joystickValue.y) > 0.1) {
    const mag = Math.sqrt(joystickValue.x * joystickValue.x + joystickValue.y * joystickValue.y);
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
    const velocity = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (velocity > player.maxSpeed) {
      player.vx = (player.vx / velocity) * player.maxSpeed;
      player.vy = (player.vy / velocity) * player.maxSpeed;
    }
  }
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(player.radius, Math.min(6000 - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(6000 - player.radius, player.y));
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = getViewportSize();
  camera.x = player.x - VIEWPORT_WIDTH / 2;
  camera.y = player.y - VIEWPORT_HEIGHT / 2;
  camera.x = Math.max(0, Math.min(6000 - VIEWPORT_WIDTH, camera.x));
  camera.y = Math.max(0, Math.min(6000 - VIEWPORT_HEIGHT, camera.y));
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