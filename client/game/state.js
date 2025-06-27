// Centralized game state management
import { Player } from './player.js';
import { Camera } from './camera.js';
import Planets from './planets.js';

const State = {
  player: Player,
  camera: Camera,
  entities: [],
  planets: Planets.planets,
  resources: [], // Add resources array

  // Travel state
  selectedPlanet: null,
  _isTraveling: false,
  travelStartTime: 0,
  travelDuration: 0,
  travelFrom: { x: Player.x, y: Player.y },
  travelTurnStart: 0,
  travelTurnDuration: 1000,
  travelInitialAngle: 0,
  travelTargetAngle: 0,
  travelTurning: false,

  // Follow state
  playerFollowEntityIndex: null,

  // Input state
  lastMoveSent: 0,
  MOVE_SEND_INTERVAL: 50,

  // Constants
  AUTOPILOT_STRENGTH: 0.04,
  ARRIVAL_RADIUS: 40,
  ENTITY_FOLLOW_PADDING: 20,

  // Resource methods
  setResources(resources) {
    this.resources = resources;
  },

  getResources() {
    return this.resources;
  },

  // Travel methods
  startTravel(planet) {
    this.selectedPlanet = planet;
    this._isTraveling = true;
    this.travelStartTime = Date.now();
    this.travelFrom = { x: this.player.x, y: this.player.y };
    this.travelDuration = this.calculateTravelDuration(planet);
    this.startTravelTurn(planet);
  },

  stopTravel() {
    this._isTraveling = false;
    this.selectedPlanet = null;
    this.travelTurning = false;
  },

  startTravelTurn(planet) {
    this.travelTurning = true;
    this.travelTurnStart = Date.now();
    this.travelInitialAngle = this.player.angle;
    this.travelTargetAngle = this.calculateAngleToPlanet(planet);
  },

  calculateTravelDuration(planet) {
    const distance = this.calculateDistanceToPlanet(planet);
    return distance * 50; // 50ms per unit
  },

  calculateDistanceToPlanet(planet) {
    const dx = planet.x - this.player.x;
    const dy = planet.y - this.player.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  calculateAngleToPlanet(planet) {
    const dx = planet.x - this.player.x;
    const dy = planet.y - this.player.y;
    return Math.atan2(dy, dx);
  },

  // Follow methods
  startFollowingEntity(entityIndex) {
    this.playerFollowEntityIndex = entityIndex;
  },

  stopFollowingEntity() {
    this.playerFollowEntityIndex = null;
  },

  // Input methods
  canSendMove() {
    const now = Date.now();
    if (now - this.lastMoveSent > this.MOVE_SEND_INTERVAL) {
      this.lastMoveSent = now;
      return true;
    }
    return false;
  },

  // Getters
  getPlayer() {
    return this.player;
  },

  getCamera() {
    return this.camera;
  },

  getEntities() {
    return this.entities;
  },

  getPlanets() {
    return this.planets;
  },

  isTraveling() {
    return this._isTraveling;
  },

  getSelectedPlanet() {
    return this.selectedPlanet;
  },

  getFollowEntityIndex() {
    return this.playerFollowEntityIndex;
  }
};

export { State };