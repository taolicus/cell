// Centralized game state management
import { player } from './player.js';
import { camera } from './camera.js';
import { entities } from './entities.js';
import { planets } from './planets.js';

class GameState {
  constructor() {
    this.player = player;
    this.camera = camera;
    this.entities = entities;
    this.planets = planets;
    this.resources = []; // Add resources array

    // Travel state
    this.selectedPlanet = null;
    this._isTraveling = false;
    this.travelStartTime = 0;
    this.travelDuration = 0;
    this.travelFrom = null;
    this.travelTurnStart = 0;
    this.travelTurnDuration = 1000;
    this.travelInitialAngle = 0;
    this.travelTargetAngle = 0;
    this.travelTurning = false;

    // Follow state
    this.playerFollowEntityIndex = null;

    // Input state
    this.lastMoveSent = 0;
    this.MOVE_SEND_INTERVAL = 50;

    // Constants
    this.AUTOPILOT_STRENGTH = 0.04;
    this.ARRIVAL_RADIUS = 40;
    this.ENTITY_FOLLOW_PADDING = 20;
  }

  // Resource methods
  setResources(resources) {
    this.resources = resources;
  }

  getResources() {
    return this.resources;
  }

  // Travel methods
  startTravel(planet) {
    this.selectedPlanet = planet;
    this._isTraveling = true;
    this.travelStartTime = Date.now();
    this.travelFrom = { x: this.player.x, y: this.player.y };
    this.travelDuration = this.calculateTravelDuration(planet);
    this.startTravelTurn(planet);
  }

  stopTravel() {
    this._isTraveling = false;
    this.selectedPlanet = null;
    this.travelTurning = false;
  }

  startTravelTurn(planet) {
    this.travelTurning = true;
    this.travelTurnStart = Date.now();
    this.travelInitialAngle = this.player.angle;
    this.travelTargetAngle = this.calculateAngleToPlanet(planet);
  }

  calculateTravelDuration(planet) {
    const distance = this.calculateDistanceToPlanet(planet);
    return distance * 50; // 50ms per unit
  }

  calculateDistanceToPlanet(planet) {
    const dx = planet.x - this.player.x;
    const dy = planet.y - this.player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateAngleToPlanet(planet) {
    const dx = planet.x - this.player.x;
    const dy = planet.y - this.player.y;
    return Math.atan2(dy, dx);
  }

  // Follow methods
  startFollowingEntity(entityIndex) {
    this.playerFollowEntityIndex = entityIndex;
  }

  stopFollowingEntity() {
    this.playerFollowEntityIndex = null;
  }

  // Input methods
  canSendMove() {
    const now = Date.now();
    if (now - this.lastMoveSent > this.MOVE_SEND_INTERVAL) {
      this.lastMoveSent = now;
      return true;
    }
    return false;
  }

  // Getters
  getPlayer() {
    return this.player;
  }

  getCamera() {
    return this.camera;
  }

  getEntities() {
    return this.entities;
  }

  getPlanets() {
    return this.planets;
  }

  isTraveling() {
    return this._isTraveling;
  }

  getSelectedPlanet() {
    return this.selectedPlanet;
  }

  getFollowEntityIndex() {
    return this.playerFollowEntityIndex;
  }
}

// Create singleton instance
export const gameState = new GameState();