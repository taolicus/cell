// Game rendering logic
import { canvas, ctx } from '../utils/canvas.js';
import { camera } from './camera.js';
import { player } from './player.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import Planets from './planets.js';
import { gameState } from './state.js';
import { otherPlayers, playerCount, connectionStatus } from '../network/events.js';
import { distance } from './math.js';
import Entities from './entities.js';
import Resources from './resources.js';

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

function drawUI() {
  ctx.save();
  ctx.font = "20px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const coordText = `X: ${player.x.toFixed(0)}  Y: ${player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  ctx.fillText(`Players: ${playerCount}`, 12, 36);

  // Energy display
  if (player.energy !== undefined) {
    const energyPercent = Math.round((player.energy / player.maxEnergy) * 100);
    let energyColor = "#0f0"; // Green when healthy
    if (energyPercent <= 30) energyColor = "#f00"; // Red when low
    else if (energyPercent <= 70) energyColor = "#ff0"; // Yellow when moderate

    ctx.fillStyle = energyColor;
    ctx.fillText(`Energy: ${energyPercent}%`, 12, 60);

    // Energy bar
    const barWidth = 200;
    const barHeight = 8;
    const barX = 12;
    const barY = 85;

    // Background
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Energy fill
    ctx.fillStyle = energyColor;
    ctx.fillRect(barX, barY, barWidth * (player.energy / player.maxEnergy), barHeight);

    // Border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

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

  // Draw resources (under entities)
  Resources.drawResources(ctx);

  // Draw entities
  for (const entity of gameState.getEntities()) {
    Entities.drawEntity(ctx, entity, "#f55", "#fff");
  }

  // Draw other players
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    Entities.drawEntity(ctx, p, "#09f", "#fff");
  }

  // Draw player
  Entities.drawEntity(ctx, player, "#f00", "#fff");

  // Draw planets and distances
  Planets.drawPlanets(ctx);
  Planets.drawPlanetDistances(ctx);

  // Restore camera transform
  ctx.restore();

  // Draw UI overlays
  Planets.drawTravelProgress(ctx, canvas, player);
  drawUI();
  drawConnectionStatus();
}