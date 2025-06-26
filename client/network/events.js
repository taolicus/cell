// Network event handlers
import { gameState } from '../game/state.js';
import { entities } from '../game/entities.js';

export let otherPlayers = {};
export let mySocketId = null;
export let connectionStatus = 'connecting'; // 'connecting', 'connected', 'disconnected'
export let playerCount = 1;

export function setupNetworkEvents(socket) {
  socket.on('connect', () => {
    mySocketId = socket.id;
    connectionStatus = 'connected';

    // Send initial state
    const player = gameState.getPlayer();
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

  socket.on('players', (players) => {
    if (!mySocketId) return;
    otherPlayers = { ...players };
    if (otherPlayers[mySocketId]) {
      delete otherPlayers[mySocketId];
    }
    playerCount = Object.keys(players).length;
  });

  socket.on('entities', (serverEntities) => {
    entities.length = 0;
    entities.push(...serverEntities);
  });

  socket.on('worldSize', (size) => {
    // Optionally update world size here
  });
}

export function sendMove(socket, playerData) {
  if (gameState.canSendMove()) {
    socket.emit('move', playerData);
  }
}