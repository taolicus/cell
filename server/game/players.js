// Player management logic
const { WORLD_WIDTH, WORLD_HEIGHT } = require('../config');

class PlayerManager {
  constructor() {
    this.players = new Map(); // socketId -> player data
    this.lastActivity = new Map(); // socketId -> timestamp
    this.persistentPositions = new Map(); // fingerprint -> position
    this.socketToFingerprint = new Map(); // socketId -> fingerprint
    this.fingerprintToSocket = new Map(); // fingerprint -> socketId
  }

  addPlayer(socketId, fingerprint) {
    // Check if player has a persistent position using fingerprint
    const persistentPos = this.persistentPositions.get(fingerprint);

    const player = {
      x: persistentPos ? persistentPos.x : WORLD_WIDTH / 2,
      y: persistentPos ? persistentPos.y : WORLD_HEIGHT / 2,
      angle: persistentPos ? persistentPos.angle : 0,
      vx: 0,
      vy: 0,
      radius: 20,
      // Energy system
      energy: persistentPos ? (persistentPos.energy || 100) : 100,
      maxEnergy: 100,
      energyConsumptionRate: 1.5, // energy lost per second while moving
      isAlive: true
    };

    this.players.set(socketId, player);
    this.lastActivity.set(socketId, Date.now());
    this.socketToFingerprint.set(socketId, fingerprint);
    this.fingerprintToSocket.set(fingerprint, socketId);

    // Log whether we're restoring a position or creating a new one
    if (persistentPos) {
      console.log(`Restoring position for fingerprint ${fingerprint}: x=${persistentPos.x}, y=${persistentPos.y}`);
    } else {
      console.log(`Creating new position for fingerprint ${fingerprint} at center of world`);
    }

    // Return the player data so we can send it back to the client
    return { ...player };
  }

  removePlayer(socketId) {
    // Store the player's position before removing them
    const player = this.players.get(socketId);
    const fingerprint = this.socketToFingerprint.get(socketId);

    if (player && fingerprint) {
      this.persistentPositions.set(fingerprint, {
        x: player.x,
        y: player.y,
        angle: player.angle,
        energy: player.energy
      });
    }

    this.players.delete(socketId);
    this.lastActivity.delete(socketId);

    if (fingerprint) {
      this.socketToFingerprint.delete(socketId);
      this.fingerprintToSocket.delete(fingerprint);
    }
  }

  updatePlayer(socketId, data) {
    const player = this.players.get(socketId);
    const fingerprint = this.socketToFingerprint.get(socketId);

    if (player) {
      Object.assign(player, data);
      this.lastActivity.set(socketId, Date.now());

      // Update persistent position using fingerprint
      if (fingerprint) {
        this.persistentPositions.set(fingerprint, {
          x: player.x,
          y: player.y,
          angle: player.angle
        });
      }
    }
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getAllPlayers() {
    const result = {};
    for (const [socketId, player] of this.players) {
      result[socketId] = { ...player };
    }
    return result;
  }

  getPlayerCount() {
    return this.players.size;
  }

  getStalePlayers(now, timeoutMs) {
    const stalePlayers = [];
    for (const [socketId, lastActivity] of this.lastActivity) {
      if (now - lastActivity > timeoutMs) {
        stalePlayers.push(socketId);
      }
    }
    return stalePlayers;
  }

  // Check if a fingerprint already has a position
  hasPersistentPosition(fingerprint) {
    return this.persistentPositions.has(fingerprint);
  }
}

module.exports = { PlayerManager };