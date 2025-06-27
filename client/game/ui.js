// UI updates (buttons, overlays, etc.)
import { State } from '../game/state.js';
import { Player } from '../game/player.js';
import Planets from '../game/planets.js';
import { Camera } from '../game/camera.js';
import { magnitude } from '../game/math.js';
import { canvas } from '../utils/canvas.js';

// ... existing code ...
    if (!State.isTraveling()) {
      Planets.planets.forEach((planet) => {
        // ... existing code ...
        if (!State.isTraveling()) {
          State.startTravel(planet);
        }
        State.stopFollowingEntity();
        Ui.updatePlanetTravelButtons();
        return;
      });
      Ui.planetTravelBtns.style.display = "flex";
    } else {
      Ui.planetTravelBtns.style.display = "none";
    }
  },
// ... existing code ...
      if (!State.isTraveling()) {
        State.stopFollowingEntity();
        Ui.updatePlanetTravelButtons();
      }
    });

    // Stop travel button handler
    Ui.stopTravelBtn.addEventListener("click", () => {
      State.stopTravel();
      Ui.stopTravelBtn.style.display = "none";
      Ui.updatePlanetTravelButtons();
    });
  }
// ... existing code ...