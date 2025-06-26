// Player management logic
const { WORLD_WIDTH, WORLD_HEIGHT } = require('../config');

class PlayerManager {
  constructor() {
    this.players = new Map();
    this.lastActivity = new Map();
    this.persistentPositions = new Map(); // Store positions across sessions
  }

  addPlayer(socketId) {
    // Check if player has a persistent position
    const persistentPos = this.persistentPositions.get(socketId);

    const player = {
      x: persistentPos ? persistentPos.x : WORLD_WIDTH / 2,
      y: persistentPos ? persistentPos.y : WORLD_HEIGHT / 2,
      angle: persistentPos ? persistentPos.angle : 0,
      vx: 0,
      vy: 0,
      radius: 20
    };

    this.players.set(socketId, player);
    this.lastActivity.set(socketId, Date.now());

    // Return the player data so we can send it back to the client
    return { ...player };
  }

  removePlayer(socketId) {
    // Store the player's position before removing them
    const player = this.players.get(socketId);
    if (player) {
      this.persistentPositions.set(socketId, {
        x: player.x,
        y: player.y,
        angle: player.angle
      });
    }

    this.players.delete(socketId);
    this.lastActivity.delete(socketId);
  }

  updatePlayer(socketId, data) {
    const player = this.players.get(socketId);
    if (player) {
      Object.assign(player, data);
      this.lastActivity.set(socketId, Date.now());

      // Update persistent position
      this.persistentPositions.set(socketId, {
        x: player.x,
        y: player.y,
        angle: player.angle
      });
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
}

module.exports = { PlayerManager };