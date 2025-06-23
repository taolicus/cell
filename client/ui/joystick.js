// Joystick and input handling
export const joystick = document.getElementById('joystick');
export const joystickKnob = document.getElementById('joystick-knob');
export let joystickActive = false;
export let joystickCenter = { x: 0, y: 0 };
export let joystickValue = { x: 0, y: 0 };

import { magnitude } from '../game/mathUtils.js';

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function showJoystickIfMobile() {
  if (isTouchDevice()) {
    joystick.style.display = 'block';
  }
}
showJoystickIfMobile();

joystick.addEventListener('touchstart', function(e) {
  e.preventDefault();
  joystickActive = true;
  const rect = joystick.getBoundingClientRect();
  const touch = e.touches[0];
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });

joystick.addEventListener('touchmove', function(e) {
  e.preventDefault();
  if (!joystickActive) return;
  const touch = e.touches[0];
  updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });

joystick.addEventListener('touchend', function(e) {
  e.preventDefault();
  joystickActive = false;
  joystickValue = { x: 0, y: 0 };
  joystickKnob.style.left = '40px';
  joystickKnob.style.top = '40px';
}, { passive: false });

export function updateJoystick(x, y) {
  // Calculate relative to center
  let dx = x - joystickCenter.x;
  let dy = y - joystickCenter.y;
  // Clamp to radius 50px
  const maxDist = 50;
  const dist = magnitude(dx, dy);
  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }
  joystickKnob.style.left = (40 + dx) + 'px';
  joystickKnob.style.top = (40 + dy) + 'px';
  joystickValue = { x: dx / maxDist, y: dy / maxDist };
}