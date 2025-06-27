// Planet logic and travel
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import { Player } from './player.js';
import { distance } from './math.js';
import { state } from './state.js';

const Planets = {
  planets: [],

  updatePlanets(serverPlanets) {
    Planets.planets = serverPlanets;
  },

  regeneratePlanets() {
    // Planets are now managed by server, so this function is deprecated
    console.log('Planets are now managed by server - regeneratePlanets() is deprecated');
  },

  drawPlanets(ctx) {
    for (const planet of Planets.planets) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.font = "bold 28px monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 8);
      ctx.restore();
    }
  },

  drawPlanetDistances(ctx) {
    for (const planet of Planets.planets) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(Player.x, Player.y);
      ctx.lineTo(planet.x, planet.y);
      ctx.strokeStyle = "#fff6";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      const dist = distance(Player, planet);
      const midX = Player.x + (planet.x - Player.x) * 0.5;
      const midY = Player.y + (planet.y - Player.y) * 0.5;
      ctx.font = "20px monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${dist.toFixed(0)} units`, midX, midY - 8);
      ctx.restore();
    }
  },

  drawTravelProgress(ctx, canvas, Player) {
    if (state.isTraveling() && state.getSelectedPlanet() && state.travelFrom) {
      const planet = state.getSelectedPlanet();
      const distToCenter = distance(Player, planet);
      const distToBorder = Math.max(0, distToCenter - planet.radius);
      const estSeconds = Math.ceil(distToBorder / (Player.maxSpeed / 2));
      const origDistToCenter = distance(state.travelFrom, planet);
      const origDistToBorder = Math.max(0, origDistToCenter - planet.radius);
      const t = 1 - Math.min(1, distToBorder / (origDistToBorder || 1));
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#222";
      ctx.fillRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(canvas.width / 2 - 180, canvas.height - 60, 360, 40);
      ctx.fillStyle = "#4af";
      ctx.fillRect(canvas.width / 2 - 178, canvas.height - 58, 356 * t, 36);
      ctx.font = "22px monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Traveling to ${planet.name}... ~${estSeconds}s left`,
        canvas.width / 2,
        canvas.height - 40
      );
      ctx.restore();
    }
  }
};

export default Planets;

// Additional travel logic and drawing functions to be added here as needed.