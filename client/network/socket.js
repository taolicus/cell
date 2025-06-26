// Socket.io client logic
import { setupNetworkEvents, sendMove } from './events.js';

export let socket;

if (typeof io !== 'undefined') {
  socket = io();
  setupNetworkEvents(socket);
}

export { sendMove };