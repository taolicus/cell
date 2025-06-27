// Socket event handlers
const { PlayerManager } = require('../game/players');
const { WorldManager } = require('../game/world');
const { MOVE_INTERVAL_MS } = require('../config');
const { info, warn } = require('../utils/logger');

const playerManager = new PlayerManager();
const worldManager = new WorldManager();

function handleConnection(io, socket) {
  info(`Socket connected: ${socket.id}`);

  // Send initial world data
  socket.emit('worldSize', worldManager.getWorldSize());
  socket.emit('entities', worldManager.getEntities());
  socket.emit('resources', worldManager.getResources());
  socket.emit('planets', worldManager.getPlanets());

  // Set up event handlers for this socket
  setupSocketHandlers(io, socket);
}

function setupSocketHandlers(io, socket) {
  const lastMoveTimestamps = {};

  // Handle player join with fingerprint
  socket.on('join', (data) => {
    const fingerprint = data.fingerprint || socket.id; // Fallback to socket.id if no fingerprint

    // Check if this fingerprint already has a persistent position
    const hasPosition = playerManager.hasPersistentPosition(fingerprint);
    info(`Player joining - Socket: ${socket.id}, Fingerprint: ${fingerprint}, Has persistent position: ${hasPosition}`);

    // Add player to manager and get their position
    const playerData = playerManager.addPlayer(socket.id, fingerprint);
    socket.emit('playerPosition', playerData);

    io.emit('players', playerManager.getAllPlayers());
    info(`Player joined with fingerprint: ${fingerprint}`);
  });

  socket.on('move', (data) => {
    const now = Date.now();
    if (!lastMoveTimestamps[socket.id] || now - lastMoveTimestamps[socket.id] > MOVE_INTERVAL_MS) {
      playerManager.updatePlayer(socket.id, data);
      io.emit('players', playerManager.getAllPlayers());
      lastMoveTimestamps[socket.id] = now;
    }
  });

  socket.on('disconnecting', (reason) => {
    info(`Socket disconnecting: ${socket.id} Reason: ${reason}`);
  });

  socket.on('disconnect', (reason) => {
    info(`Socket disconnected: ${socket.id} (${reason})`);
    playerManager.removePlayer(socket.id);
    delete lastMoveTimestamps[socket.id];
    io.emit('players', playerManager.getAllPlayers());
    info(`Player count: ${playerManager.getPlayerCount()}`);
  });
}

function setupTimeoutCleanup(io) {
  setInterval(() => {
    const now = Date.now();
    const stalePlayers = playerManager.getStalePlayers(now, 30000); // 30 second timeout

    for (const socketId of stalePlayers) {
      warn(`Forcibly removing stale socket: ${socketId}`);
      if (io.sockets.sockets.get(socketId)) {
        io.sockets.sockets.get(socketId).disconnect(true);
      } else {
        playerManager.removePlayer(socketId);
      }
    }

    if (stalePlayers.length > 0) {
      io.emit('players', playerManager.getAllPlayers());
    }
  }, 10000);
}

function setupGameLoop(io) {
  setInterval(() => {
    worldManager.updateEntities(playerManager.getAllPlayers());
    io.emit('entities', worldManager.getEntities());
    io.emit('resources', worldManager.getResources());
  }, 50);
}

module.exports = {
  handleConnection,
  setupTimeoutCleanup,
  setupGameLoop
};