// Network event handlers
import { gameState } from '../game/state.js';
import { entities } from '../game/entities.js';
import { updateWorldSize, setServerPositionReceived } from '../game/player.js';
import { updatePlanets } from '../game/planets.js';
import { player } from '../game/player.js';
import { camera } from '../game/camera.js';
import { generatePlayerId } from '../utils/player-id.js';

export let otherPlayers = {};
export let mySocketId = null;
export let connectionStatus = 'connecting'; // 'connecting', 'connected', 'disconnected'
export let playerCount = 1;

export function setupNetworkEvents(socket) {
  socket.on('connect', () => {
    mySocketId = socket.id;
    connectionStatus = 'connected';

    // Generate player ID and join the game
    const playerId = generatePlayerId();
    socket.emit('join', { fingerprint: playerId }); // Keep server-side naming for compatibility
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
    // Update world size when received from server
    console.log('Received world size from server:', size);
    updateWorldSize(size.width, size.height);
  });

  socket.on('planets', (serverPlanets) => {
    // Update planets when received from server
    console.log('Received planets from server:', serverPlanets);
    updatePlanets(serverPlanets);
  });

  socket.on('playerPosition', (serverPlayerData) => {
    // Update player position with server data
    console.log('Received player position from server:', serverPlayerData);
    player.x = serverPlayerData.x;
    player.y = serverPlayerData.y;
    player.angle = serverPlayerData.angle;
    // Update camera to follow the player
    camera.update(player.x, player.y);
    // Mark that server position has been received
    setServerPositionReceived();
  });
}

export function sendMove(socket, playerData) {
  if (gameState.canSendMove()) {
    socket.emit('move', playerData);
  }
}