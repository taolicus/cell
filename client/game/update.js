// Game update logic
import { State } from './state.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config.js';
import { socket, sendMove } from '../network/socket.js';
import { Input } from './input.js';
import {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp
} from '../utils/math.js';

Input.setup();

function isManualInputActive() {
  // Keyboard
  const keys = Input.keys;
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
    Input.joystickActive ||
    Math.abs(Input.joystickValue.x) > 0.1 ||
    Math.abs(Input.joystickValue.y) > 0.1
  )
    return true;
  return false;
}

function updateTravel() {
  if (State.isTraveling() && State.getSelectedPlanet()) {
    const planet = State.getSelectedPlanet();

    if (State.travelTurning) {
      const now = Date.now();
      const t = Math.min(1, (now - State.travelTurnStart) / State.travelTurnDuration);
      let delta = normalizeAngle(State.travelTargetAngle - State.travelInitialAngle);
      Player.angle = normalizeAngle(State.travelInitialAngle + delta * t);
      if (t === 1) {
        State.travelTurning = false;
      }
    } else if (!isManualInputActive()) {
      const dist = distance(Player, planet);
      const angleToPlanet = angleTo(Player, planet);
      const slowRadius = Math.max(
        State.ARRIVAL_RADIUS + planet.radius,
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
      State.stopTravel();
    }
  }
}

function updateCamera() {
  Camera.update(Player.x, Player.y);
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = Camera.getViewport();

  // Use server defaults as fallback if world dimensions not yet received
  const worldWidth = WORLD_WIDTH || 1000;
  const worldHeight = WORLD_HEIGHT || 800;

  Camera.x = clamp(Camera.x, 0, worldWidth - VIEWPORT_WIDTH);
  Camera.y = clamp(Camera.y, 0, worldHeight - VIEWPORT_HEIGHT);
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
  Player.updateMovement(Input.keys, Input.joystickActive, Input.joystickValue);
  Player.updatePosition();
  updateCamera();
  updateNetwork();
}