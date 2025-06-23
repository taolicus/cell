// Socket.io setup and events
const { entities, updateEntities } = require('./entities');
const { players } = require('./players');
const { WORLD_WIDTH, WORLD_HEIGHT, MOVE_INTERVAL_MS } = require('./config');

function setupSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  const lastMoveTimestamps = {};

  setInterval(() => {
    const now = Date.now();
    for (const socketId in lastMoveTimestamps) {
      if (now - lastMoveTimestamps[socketId] > 30000) {
        console.log(`[TIMEOUT] Forcibly removing stale socket: ${socketId}`);
        if (io.sockets.sockets.get(socketId)) {
          io.sockets.sockets.get(socketId).disconnect(true);
        } else {
          delete lastMoveTimestamps[socketId];
          delete players[socketId];
          io.emit('players', players);
        }
      }
    }
  }, 10000);

  io.on('connection', (socket) => {
    console.log(`[CONNECT] Socket connected: ${socket.id}`);
    socket.emit('worldSize', { width: WORLD_WIDTH, height: WORLD_HEIGHT });
    players[socket.id] = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, angle: 0, vx: 0, vy: 0, radius: 20 };
    io.emit('players', players);
    socket.emit('entities', entities);
    lastMoveTimestamps[socket.id] = Date.now();

    socket.on('move', (data) => {
      const now = Date.now();
      if (!lastMoveTimestamps[socket.id] || now - lastMoveTimestamps[socket.id] > MOVE_INTERVAL_MS) {
        players[socket.id] = { ...players[socket.id], ...data };
        io.emit('players', players);
        lastMoveTimestamps[socket.id] = now;
      }
    });

    socket.on('disconnecting', (reason) => {
      console.log(`[DISCONNECTING] Socket: ${socket.id} Reason: ${reason}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[DISCONNECT] Socket disconnected: ${socket.id} (${reason})`);
      delete players[socket.id];
      delete lastMoveTimestamps[socket.id];
      io.emit('players', players);
      console.log('[PLAYERS]', Object.keys(players));
    });
  });

  setInterval(() => {
    updateEntities(players);
    io.emit('entities', entities);
  }, 50);
}

module.exports = setupSocket;