// UI updates (buttons, overlays, etc.)
import { gameState } from '../game/state.js';
import { player } from '../game/player.js';
import { entities } from '../game/entities.js';
import { planets } from '../game/planets.js';
import { camera } from '../game/camera.js';
import { magnitude } from '../game/math.js';
import { canvas } from '../utils/canvas.js';

export const planetTravelBtns = document.getElementById("planetTravelBtns");
export const stopTravelBtn = document.getElementById("stopTravelBtn");

export function updatePlanetTravelButtons() {
  // Clear existing
  planetTravelBtns.innerHTML = "";

  if (!gameState.isTraveling()) {
    planets.forEach((planet) => {
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
      btn.onclick = () => startTravel(planet);
      planetTravelBtns.appendChild(btn);
    });
    planetTravelBtns.style.display = "flex";
  } else {
    planetTravelBtns.style.display = "none";
  }
}

function startTravel(planet) {
  if (!gameState.isTraveling()) {
    gameState.startTravel(planet);
    stopTravelBtn.style.display = "block";
    updatePlanetTravelButtons();
  }
}

// Setup click handlers
function setupClickHandlers() {
  // Add click handler for canvas to support click-to-travel/follow
  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + camera.x;
    const clickY = e.clientY - rect.top + camera.y;

    // Check planets first
    for (const planet of planets) {
      if (magnitude(clickX - planet.x, clickY - planet.y) < planet.radius + 10) {
        if (!gameState.isTraveling()) {
          startTravel(planet);
        }
        gameState.stopFollowingEntity();
        updatePlanetTravelButtons();
        return;
      }
    }

    // Check entities
    let foundEntity = false;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (magnitude(clickX - entity.x, clickY - entity.y) < entity.radius + 10) {
        gameState.startFollowingEntity(i);
        foundEntity = true;
        gameState.stopTravel();
        stopTravelBtn.style.display = "none";
        updatePlanetTravelButtons();
        break;
      }
    }

    if (!foundEntity) {
      gameState.stopFollowingEntity(); // click on empty space stops following
      updatePlanetTravelButtons();
    }
  });

  // Stop travel button handler
  stopTravelBtn.addEventListener("click", () => {
    gameState.stopTravel();
    stopTravelBtn.style.display = "none";
    updatePlanetTravelButtons();
  });
}

// Initialize UI
window.addEventListener("DOMContentLoaded", () => {
  setupClickHandlers();
  updatePlanetTravelButtons();
});
