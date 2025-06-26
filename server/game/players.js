// Player management logic
const { WORLD_WIDTH, WORLD_HEIGHT } = require('../config');

class PlayerManager {
  constructor() {
    this.players = new Map();
    this.lastActivity = new Map();
  }

  addPlayer(socketId) {
    const player = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      angle: 0,
      vx: 0,
      vy: 0,
      radius: 20
    };

    this.players.set(socketId, player);
    this.lastActivity.set(socketId, Date.now());
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.lastActivity.delete(socketId);
  }

  updatePlayer(socketId, data) {
    const player = this.players.get(socketId);
    if (player) {
      Object.assign(player, data);
      this.lastActivity.set(socketId, Date.now());
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