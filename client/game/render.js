// Game rendering logic
import { canvas, ctx } from '../utils/canvas.js';
import { camera } from './camera.js';
import { player } from './player.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import { entities } from './entities.js';
import { planets } from './planets.js';
import { gameState } from './state.js';
import { otherPlayers, playerCount, connectionStatus } from '../network/events.js';
import { distance } from './math.js';

function drawEntity(ctx, entity, fillStyle = "#fff", strokeStyle = "#fff") {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(entity.x, entity.y);
  ctx.lineTo(
    entity.x + Math.cos(entity.angle) * entity.radius,
    entity.y + Math.sin(entity.angle) * entity.radius
  );
  ctx.stroke();
  ctx.restore();
}

function drawGrid() {
  ctx.strokeStyle = "#444";
  for (let x = 0; x <= WORLD_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }
}

function drawPlanets() {
  for (const planet of planets) {
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
}

function drawPlanetDistances() {
  for (const planet of planets) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(planet.x, planet.y);
    ctx.strokeStyle = "#fff6";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    const dist = distance(player, planet);
    const midX = player.x + (planet.x - player.x) * 0.5;
    const midY = player.y + (planet.y - player.y) * 0.5;
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${dist.toFixed(0)} units`, midX, midY - 8);
    ctx.restore();
  }
}

function drawTravelProgress() {
  if (gameState.isTraveling() && gameState.getSelectedPlanet() && gameState.travelFrom) {
    const planet = gameState.getSelectedPlanet();
    const distToCenter = distance(player, planet);
    const distToBorder = Math.max(0, distToCenter - planet.radius);
    const estSeconds = Math.ceil(distToBorder / (player.maxSpeed / 2));
    const origDistToCenter = distance(gameState.travelFrom, planet);
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

function drawUI() {
  ctx.save();
  ctx.font = "20px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const coordText = `X: ${player.x.toFixed(0)}  Y: ${player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  ctx.fillText(`Players: ${playerCount}`, 12, 36);
  ctx.restore();
}

function drawConnectionStatus() {
  if (connectionStatus !== "connected") {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#fff";
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      connectionStatus === "connecting" ? "Connecting..." : "Disconnected",
      canvas.width / 2,
      canvas.height / 2
    );
    ctx.restore();
  }
}

export function render() {
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = camera.getViewport();

  // Clear canvas
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Set up camera transform
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw world
  drawGrid();

  // Draw entities
  for (const entity of entities) {
    drawEntity(ctx, entity, "#f55", "#fff");
  }

  // Draw other players
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    drawEntity(ctx, p, "#09f", "#fff");
  }

  // Draw player
  drawEntity(ctx, player, "#0f0", "#fff");

  // Draw planets and distances
  drawPlanets();
  drawPlanetDistances();

  // Restore camera transform
  ctx.restore();

  // Draw UI overlays
  drawTravelProgress();
  drawUI();
  drawConnectionStatus();
}