// Game update logic
import { State } from './state.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { socket, sendMove } from '../network/socket.js';
import { Input } from './input.js';

Input.setup();

function updateNetwork() {
  if (socket && socket.connected) {
    sendMove(socket, {
      x: Player.x,
      y: Player.y,
      angle: Player.angle,
      vx: Player.vx,
      vy: Player.vy,
      radius: Player.radius,
    });
  }
}

export function update() {
  Player.updateTravel(State);
  Player.updateMovement(Input.keys, Input.joystickActive, Input.joystickValue);
  Player.updatePosition();
  Camera.update(Player.x, Player.y);
  updateNetwork();
}