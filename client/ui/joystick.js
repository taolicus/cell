// Joystick and input handling
import { Input } from '../game/input.js';
import { JOYSTICK_MAX_DIST } from '../config.js';

const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

export function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function showJoystickIfMobile() {
  if (isTouchDevice()) {
    joystick.style.display = "block";
  }
}
showJoystickIfMobile();

joystick.addEventListener(
  "touchstart",
  function (e) {
    e.preventDefault();
    Input.setJoystickActive(true);
    const rect = joystick.getBoundingClientRect();
    const touch = e.touches[0];
    const joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystick(touch.clientX, touch.clientY, joystickCenter);
  },
  { passive: false }
);

joystick.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
    const rect = joystick.getBoundingClientRect();
    const touch = e.touches[0];
    const joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystick(touch.clientX, touch.clientY, joystickCenter);
  },
  { passive: false }
);

joystick.addEventListener(
  "touchend",
  function () {
    Input.setJoystickActive(false);
    Input.setJoystickValue(0, 0);
    joystickKnob.style.left = "40px";
    joystickKnob.style.top = "40px";
  },
  { passive: false }
);

function updateJoystick(clientX, clientY, joystickCenter) {
  const dx = clientX - joystickCenter.x;
  const dy = clientY - joystickCenter.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx);
  if (dist > JOYSTICK_MAX_DIST) dist = JOYSTICK_MAX_DIST;
  const normX = Math.cos(angle) * (dist / JOYSTICK_MAX_DIST);
  const normY = Math.sin(angle) * (dist / JOYSTICK_MAX_DIST);
  Input.setJoystickValue(normX, normY);
  joystickKnob.style.left = 40 + normX * JOYSTICK_MAX_DIST + "px";
  joystickKnob.style.top = 40 + normY * JOYSTICK_MAX_DIST + "px";
}
