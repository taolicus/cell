// Network event handlers
import { State } from '../game/state.js';
import { Player } from '../game/player.js';
import Planets from '../game/planets.js';
import { Camera } from '../game/camera.js';
import { generatePlayerId } from '../utils/player-id.js';
import { setWorldSize } from '../config.js';

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
    State.entities.length = 0;
    State.entities.push(...serverEntities);
  });

  socket.on('resources', (serverResources) => {
    State.setResources(serverResources);
  });

  socket.on('worldSize', (size) => {
    // Update world size when received from server
    console.log('Received world size from server:', size);
    setWorldSize(size.width, size.height);

    // Only move player to center if server hasn't provided a position yet
    if (!Player.serverPositionReceived && Player.x === 0 && Player.y === 0) {
      Player.x = size.width / 2;
      Player.y = size.height / 2;
      Camera.update(Player.x, Player.y);
    }
  });

  socket.on('planets', (serverPlanets) => {
    // Update planets when received from server
    console.log('Received planets from server:', serverPlanets);
    Planets.updatePlanets(serverPlanets);
  });

  socket.on('playerPosition', (serverPlayerData) => {
    // Update player position with server data
    console.log('Received player position from server:', serverPlayerData);
    Player.x = serverPlayerData.x;
    Player.y = serverPlayerData.y;
    Player.angle = serverPlayerData.angle;
    // Update camera to follow the player
    Camera.update(Player.x, Player.y);
    // Mark that server position has been received
    Player.setServerPositionReceived();
  });
}

export function sendMove(socket, playerData) {
  if (State.canSendMove()) {
    socket.emit('move', playerData);
  }
}

export function updateNetwork(socket, player) {
  if (socket && socket.connected) {
    sendMove(socket, {
      x: player.x,
      y: player.y,
      angle: player.angle,
      vx: player.vx,
      vy: player.vy,
      radius: player.radius,
    });
  }
}