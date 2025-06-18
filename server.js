const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (index.html, main.js)
app.use(express.static(__dirname));

// Store player states
let players = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  players[socket.id] = { x: 1000, y: 1000, angle: 0, vx: 0, vy: 0, radius: 20 };

  // Send all players to everyone
  io.emit('players', players);

  socket.on('move', (data) => {
    players[socket.id] = { ...players[socket.id], ...data };
    io.emit('players', players);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
    console.log('Player disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});