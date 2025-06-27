// Game update logic
import { State } from './state.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { socket, updateNetwork } from '../network/socket.js';
import { Input } from './input.js';

Input.setup();

export function update() {
  Player.updateTravel(State);
  Player.updateMovement(Input.keys, Input.joystickActive, Input.joystickValue);
  Player.updatePosition();
  Camera.update(Player.x, Player.y);
  updateNetwork(socket, Player);
}