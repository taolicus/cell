// UI updates (buttons, overlays, etc.)
import { State } from '../game/state.js';
import Planets from '../game/planets.js';
import { Camera } from '../game/camera.js';
import { magnitude } from '../game/math.js';
import { canvas } from '../utils/canvas.js';

const Ui = {
  planetTravelBtns: document.getElementById("planetTravelBtns"),
  stopTravelBtn: document.getElementById("stopTravelBtn"),

  updatePlanetTravelButtons() {
    // Clear existing
    Ui.planetTravelBtns.innerHTML = "";

    if (!State.isTraveling()) {
      Planets.planets.forEach((planet) => {
        const btn = document.createElement("button");
        btn.textContent = `Travel to ${planet.name}`;
        btn.style.padding = "12px 20px";
        btn.style.fontSize = "20px";
        btn.style.background = planet.color;
        btn.style.color = "#fff";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.boxShadow = "0 2px 8px #0008";
        btn.style.cursor = "pointer";
        btn.id = `travelBtn_${planet.name}`;
        btn.onclick = () => Ui.startTravel(planet);
        Ui.planetTravelBtns.appendChild(btn);
      });
      Ui.planetTravelBtns.style.display = "flex";
    } else {
      Ui.planetTravelBtns.style.display = "none";
    }
  },

  startTravel(planet) {
    if (!State.isTraveling()) {
      State.startTravel(planet);
      Ui.stopTravelBtn.style.display = "block";
      Ui.updatePlanetTravelButtons();
    }
  },

  setupClickHandlers() {
    // Add click handler for canvas to support click-to-travel/follow
    canvas.addEventListener("click", function (e) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + Camera.x;
      const clickY = e.clientY - rect.top + Camera.y;

      // Check planets first
      for (const planet of Planets.planets) {
        if (magnitude(clickX - planet.x, clickY - planet.y) < planet.radius + 10) {
          if (!State.isTraveling()) {
            Ui.startTravel(planet);
          }
          State.stopFollowingEntity();
          Ui.updatePlanetTravelButtons();
          return;
        }
      }

      // Check entities
      let foundEntity = false;
      for (let i = 0; i < State.getEntities().length; i++) {
        const entity = State.getEntities()[i];
        if (magnitude(clickX - entity.x, clickY - entity.y) < entity.radius + 10) {
          State.startFollowingEntity(i);
          foundEntity = true;
          State.stopTravel();
          Ui.stopTravelBtn.style.display = "none";
          Ui.updatePlanetTravelButtons();
          break;
        }
      }

      if (!foundEntity) {
        State.stopFollowingEntity(); // click on empty space stops following
        Ui.updatePlanetTravelButtons();
      }
    });

    // Stop travel button handler
    Ui.stopTravelBtn.addEventListener("click", () => {
      State.stopTravel();
      Ui.stopTravelBtn.style.display = "none";
      Ui.updatePlanetTravelButtons();
    });
  },

  init() {
    Ui.setupClickHandlers();
    Ui.updatePlanetTravelButtons();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  Ui.init();
});

export default Ui;
