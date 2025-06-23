// Socket.io client logic
import { player } from '../game/player.js';
import { entities } from '../game/entities.js';

export let socket;
export let otherPlayers = {};
export let mySocketId = null;
export let connectionStatus = 'connecting'; // 'connecting', 'connected', 'disconnected'
export let playerCount = 1;

if (typeof io !== 'undefined') {
  socket = io();

  socket.on('connect', () => {
    mySocketId = socket.id;
    connectionStatus = 'connected';
    // Send initial state
    socket.emit('move', {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius
    });
  });
  socket.on('disconnect', () => {
    connectionStatus = 'disconnected';
  });

  // Register 'players' handler only once
  socket.on('players', (players) => {
    if (!mySocketId) return;
    otherPlayers = { ...players };
    if (otherPlayers[mySocketId]) {
      delete otherPlayers[mySocketId];
    }
    playerCount = Object.keys(players).length;
  });

  // Listen for entities from the server
  socket.on('entities', (serverEntities) => {
    entities.length = 0;
    entities.push(...serverEntities);
  });

  socket.on('worldSize', (size) => {
    // Optionally update world size here
  });
}