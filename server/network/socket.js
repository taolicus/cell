// Socket.io setup only
const { Server } = require('socket.io');
const { handleConnection, setupTimeoutCleanup, setupGameLoop } = require('./handlers');

function setupSocket(server) {
  const io = new Server(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Set up connection handler
  io.on('connection', (socket) => {
    handleConnection(io, socket);
  });

  // Set up background processes
  setupTimeoutCleanup(io);
  setupGameLoop(io);

  return io;
}

module.exports = setupSocket;