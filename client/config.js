// Unified game configuration and constants

// World size will be set by server - no client defaults needed
export let WORLD_WIDTH;
export let WORLD_HEIGHT;
export let worldSizeReceived = false;

// Functions to update world size (to avoid read-only binding issues)
export function setWorldSize(width, height) {
  WORLD_WIDTH = width;
  WORLD_HEIGHT = height;
  worldSizeReceived = true;
}

// Player constants
export const PLAYER_RADIUS = 20;
export const PLAYER_MAX_SPEED = 6;
export const PLAYER_ACCELERATION = 0.2;
export const PLAYER_FRICTION = 0.98;
export const PLAYER_ROTATION_SPEED = 0.06;
export const PLAYER_MAX_ENERGY = 100;
export const PLAYER_ENERGY_CONSUMPTION_RATE = 1.5;

// Game mechanics
export const AUTOPILOT_STRENGTH = 0.04;
export const ARRIVAL_RADIUS = 40;
export const ENTITY_FOLLOW_PADDING = 20;
export const TRAVEL_TURN_DURATION = 1000;
export const MOVE_SEND_INTERVAL = 50;
export const TRAVEL_DURATION_PER_UNIT = 50;

// Input/Joystick
export const JOYSTICK_DEADZONE = 0.1;
export const JOYSTICK_MAX_DIST = 50;

// UI/Display
export const ENERGY_BAR_LOW = 30;
export const ENERGY_BAR_HIGH = 70;
export const ENERGY_BAR_ALPHA_LOW = 0.3;
export const ENERGY_BAR_ALPHA_HIGH = 0.7;

// Resources
export const RESOURCE_PULSE_MIN = 0.8;
export const RESOURCE_PULSE_MAX = 1.0;
export const RESOURCE_PULSE_SPEED = 400;