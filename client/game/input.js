// Centralized input handling

const Input = {
  keys: {},
  joystickActive: false,
  joystickValue: { x: 0, y: 0 },

  setupKeyboard() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  },

  setJoystickActive(active) {
    this.joystickActive = active;
  },

  setJoystickValue(x, y) {
    this.joystickValue = { x, y };
  },

  setup() {
    this.setupKeyboard();
    // Joystick setup should be called from the joystick UI module
  }
};

export { Input };