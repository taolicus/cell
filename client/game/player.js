// Player state and movement logic
import { Camera } from './camera.js';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  updateWorldSize as updateConfigWorldSize,
  PLAYER_RADIUS,
  PLAYER_MAX_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_FRICTION,
  PLAYER_ROTATION_SPEED,
  PLAYER_MAX_ENERGY,
  PLAYER_ENERGY_CONSUMPTION_RATE,
  JOYSTICK_DEADZONE
} from './config.js';
import { magnitude, clamp, normalizeAngle } from './math.js';

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

  updateWorldSize(width, height) {
    console.log('Updating world size from', WORLD_WIDTH, 'x', WORLD_HEIGHT, 'to', width, 'x', height);
    updateConfigWorldSize(width, height);
    // Only move to center if server hasn't provided a position yet
    if (!this.serverPositionReceived && this.x === 0 && this.y === 0) {
      this.x = WORLD_WIDTH / 2;
      this.y = WORLD_HEIGHT / 2;
      Camera.update(this.x, this.y);
    }
    console.log('World size updated successfully');
  },

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
    this.x = clamp(this.x, this.radius, WORLD_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, WORLD_HEIGHT - this.radius);
  }
};

export { Player };