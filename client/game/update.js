// Game update logic
import { gameState } from './state.js';
import { player } from './player.js';
import { camera } from './camera.js';
import { socket, sendMove } from '../network/socket.js';
import { joystickActive, joystickValue } from '../ui/joystick.js';
import { otherPlayers, connectionStatus } from '../network/events.js';
import { entities } from './entities.js';
import { planets } from './planets.js';
import {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp
} from './math.js';

// Input state
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
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

function updatePlayerMovement() {
  // Joystick input
  if (
    joystickActive ||
    Math.abs(joystickValue.x) > 0.1 ||
    Math.abs(joystickValue.y) > 0.1
  ) {
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
    player.vx *= player.friction;
    player.vy *= player.friction;
    const velocity = magnitude(player.vx, player.vy);
    if (velocity > player.maxSpeed) {
      player.vx = (player.vx / velocity) * player.maxSpeed;
      player.vy = (player.vy / velocity) * player.maxSpeed;
    }
  }
}

function updatePlayerPosition() {
  player.x += player.vx;
  player.y += player.vy;
  player.x = clamp(player.x, player.radius, 6000 - player.radius);
  player.y = clamp(player.y, player.radius, 6000 - player.radius);
}

function updateCamera() {
  camera.update(player.x, player.y);
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = camera.getViewport();
  camera.x = clamp(camera.x, 0, 6000 - VIEWPORT_WIDTH);
  camera.y = clamp(camera.y, 0, 6000 - VIEWPORT_HEIGHT);
}

function updateFollowEntity() {
  const followIndex = gameState.getFollowEntityIndex();
  if (followIndex !== null && entities[followIndex]) {
    const target = entities[followIndex];
    const followDist = target.radius + player.radius + gameState.ENTITY_FOLLOW_PADDING;
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
  }
}

function updateTravel() {
  if (gameState.isTraveling() && gameState.getSelectedPlanet()) {
    const planet = gameState.getSelectedPlanet();

    if (gameState.travelTurning) {
      const now = Date.now();
      const t = Math.min(1, (now - gameState.travelTurnStart) / gameState.travelTurnDuration);
      let delta = normalizeAngle(gameState.travelTargetAngle - gameState.travelInitialAngle);
      player.angle = normalizeAngle(gameState.travelInitialAngle + delta * t);
      if (t >= 1) {
        gameState.travelTurning = false;
      }
    } else if (!isManualInputActive()) {
      const dist = distance(player, planet);
      const angleToPlanet = angleTo(player, planet);
      const slowRadius = Math.max(
        gameState.ARRIVAL_RADIUS + planet.radius,
        planet.radius * 2
      );
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

    const dist = distance(player, planet);
    if (dist < planet.radius) {
      player.vx = 0;
      player.vy = 0;
      gameState.stopTravel();
    }
  }
}

function updateNetwork() {
  if (socket && socket.connected) {
    sendMove(socket, {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius,
    });
  }
}

export function update() {
  updateFollowEntity();
  updateTravel();
  updatePlayerMovement();
  updatePlayerPosition();
  updateCamera();
  updateNetwork();
}