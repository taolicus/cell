// Player state and movement logic
import { Camera } from './camera.js';
import { Input } from './input.js';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_MAX_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_FRICTION,
  PLAYER_ROTATION_SPEED,
  PLAYER_MAX_ENERGY,
  PLAYER_ENERGY_CONSUMPTION_RATE,
  JOYSTICK_DEADZONE,
  worldSizeReceived
} from '../config.js';
import { magnitude, clamp, normalizeAngle, distance, angleTo } from '../utils/math.js';

const Player = {
  x: 0, // Will be set by server
  y: 0, // Will be set by server
  radius: PLAYER_RADIUS,
  angle: 0, // Will be set by server
  vx: 0,
  vy: 0,
  speed: 0, // current speed
  maxSpeed: PLAYER_MAX_SPEED,
  acceleration: PLAYER_ACCELERATION,
  friction: PLAYER_FRICTION, // liquid drag
  rotationSpeed: PLAYER_ROTATION_SPEED,
  // Energy system
  energy: PLAYER_MAX_ENERGY,
  maxEnergy: PLAYER_MAX_ENERGY,
  energyConsumptionRate: PLAYER_ENERGY_CONSUMPTION_RATE, // energy lost per second while moving
  isAlive: true,
  serverPositionReceived: false,

  setServerPositionReceived() {
    this.serverPositionReceived = true;
  },

  updateMovement(keys, joystickActive, joystickValue) {
    // Joystick input
    if (
      joystickActive ||
      Math.abs(joystickValue.x) > JOYSTICK_DEADZONE ||
      Math.abs(joystickValue.y) > JOYSTICK_DEADZONE
    ) {
      const mag = magnitude(joystickValue.x, joystickValue.y);
      if (mag > JOYSTICK_DEADZONE) {
        const joyAngle = Math.atan2(joystickValue.y, joystickValue.x);
        this.angle = joyAngle;
        this.vx = Math.cos(joyAngle) * this.maxSpeed * mag;
        this.vy = Math.sin(joyAngle) * this.maxSpeed * mag;
      } else {
        this.vx *= this.friction;
        this.vy *= this.friction;
      }
    } else {
      if (keys["ArrowLeft"] || keys["a"]) this.angle -= this.rotationSpeed;
      if (keys["ArrowRight"] || keys["d"]) this.angle += this.rotationSpeed;
      if (keys["ArrowUp"] || keys["w"]) {
        this.vx += Math.cos(this.angle) * this.acceleration;
        this.vy += Math.sin(this.angle) * this.acceleration;
      }
      if (keys["ArrowDown"] || keys["s"]) {
        this.vx *= 0.96;
        this.vy *= 0.96;
      }
      this.vx *= this.friction;
      this.vy *= this.friction;
      const velocity = magnitude(this.vx, this.vy);
      if (velocity > this.maxSpeed) {
        this.vx = (this.vx / velocity) * this.maxSpeed;
        this.vy = (this.vy / velocity) * this.maxSpeed;
      }
    }
  },

  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;

    // Only apply world boundaries if world size has been received from server
    if (worldSizeReceived) {
      this.x = clamp(this.x, this.radius, WORLD_WIDTH - this.radius);
      this.y = clamp(this.y, this.radius, WORLD_HEIGHT - this.radius);
    }
  },

  updateTravel(travelState) {
    if (travelState.isTraveling && travelState.selectedPlanet) {
      const planet = travelState.selectedPlanet;

      if (travelState.travelTurning) {
        const now = Date.now();
        const t = Math.min(1, (now - travelState.travelTurnStart) / travelState.travelTurnDuration);
        let delta = normalizeAngle(travelState.travelTargetAngle - travelState.travelInitialAngle);
        this.angle = normalizeAngle(travelState.travelInitialAngle + delta * t);
        if (t === 1) {
          travelState.travelTurning = false;
        }
      } else if (!this.isManualInputActive()) {
        const dist = distance(this, planet);
        const angleToPlanet = angleTo(this, planet);
        const slowRadius = Math.max(
          travelState.ARRIVAL_RADIUS + planet.radius,
          planet.radius * 2
        );
        let slowFactor = Math.min(1, dist / slowRadius);
        const autoMaxSpeed = 1.5 + (this.maxSpeed - 1.5) * slowFactor;
        const autoAccel = 0.05 + (this.acceleration - 0.05) * slowFactor;
        let delta = normalizeAngle(angleToPlanet - this.angle);
        if (Math.abs(delta) > this.rotationSpeed) {
          this.angle += Math.sign(delta) * this.rotationSpeed;
          this.angle = normalizeAngle(this.angle);
        } else {
          this.angle = angleToPlanet;
        }
        this.vx += Math.cos(this.angle) * autoAccel;
        this.vy += Math.sin(this.angle) * autoAccel;
        const velocity = magnitude(this.vx, this.vy);
        if (velocity > autoMaxSpeed) {
          this.vx = (this.vx / velocity) * autoMaxSpeed;
          this.vy = (this.vy / velocity) * autoMaxSpeed;
        }
      }

      const dist = distance(this, planet);
      if (dist < planet.radius) {
        this.vx = 0;
        this.vy = 0;
        travelState.stopTravel();
      }
    }
  },

  isManualInputActive() {
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
};

export { Player };