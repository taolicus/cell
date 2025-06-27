// Game update logic
import { state } from './state.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import { socket, sendMove } from '../network/socket.js';
import { joystickActive, joystickValue } from '../ui/joystick.js';
import { otherPlayers, connectionStatus } from '../network/events.js';
import Planets from './planets.js';
import {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp
} from './math.js';
import Entities from './entities.js';

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

function updateTravel() {
  if (state.isTraveling() && state.getSelectedPlanet()) {
    const planet = state.getSelectedPlanet();

    if (state.travelTurning) {
      const now = Date.now();
      const t = Math.min(1, (now - state.travelTurnStart) / state.travelTurnDuration);
      let delta = normalizeAngle(state.travelTargetAngle - state.travelInitialAngle);
      Player.angle = normalizeAngle(state.travelInitialAngle + delta * t);
      if (t === 1) {
        state.travelTurning = false;
      }
    } else if (!isManualInputActive()) {
      const dist = distance(Player, planet);
      const angleToPlanet = angleTo(Player, planet);
      const slowRadius = Math.max(
        state.ARRIVAL_RADIUS + planet.radius,
        planet.radius * 2
      );
      let slowFactor = Math.min(1, dist / slowRadius);
      const autoMaxSpeed = 1.5 + (Player.maxSpeed - 1.5) * slowFactor;
      const autoAccel = 0.05 + (Player.acceleration - 0.05) * slowFactor;
      let delta = normalizeAngle(angleToPlanet - Player.angle);
      if (Math.abs(delta) > Player.rotationSpeed) {
        Player.angle += Math.sign(delta) * Player.rotationSpeed;
        Player.angle = normalizeAngle(Player.angle);
      } else {
        Player.angle = angleToPlanet;
      }
      Player.vx += Math.cos(Player.angle) * autoAccel;
      Player.vy += Math.sin(Player.angle) * autoAccel;
      const velocity = magnitude(Player.vx, Player.vy);
      if (velocity > autoMaxSpeed) {
        Player.vx = (Player.vx / velocity) * autoMaxSpeed;
        Player.vy = (Player.vy / velocity) * autoMaxSpeed;
      }
    }

    const dist = distance(Player, planet);
    if (dist < planet.radius) {
      Player.vx = 0;
      Player.vy = 0;
      state.stopTravel();
    }
  }
}

function updateCamera() {
  Camera.update(Player.x, Player.y);
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = Camera.getViewport();
  Camera.x = clamp(Camera.x, 0, WORLD_WIDTH - VIEWPORT_WIDTH);
  Camera.y = clamp(Camera.y, 0, WORLD_HEIGHT - VIEWPORT_HEIGHT);
}

function updateNetwork() {
  if (socket && socket.connected) {
    sendMove(socket, {
      x: Player.x,
      y: Player.y,
      angle: Player.angle,
      vx: Player.vx,
      vy: Player.vy,
      radius: Player.radius,
    });
  }
}

export function update() {
  updateTravel();
  Player.updateMovement(keys, joystickActive, joystickValue);
  Player.updatePosition();
  updateCamera();
  updateNetwork();
}