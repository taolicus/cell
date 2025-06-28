// Game rendering logic
import { canvas, ctx } from '../utils/canvas.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { WORLD_WIDTH, WORLD_HEIGHT, ENERGY_BAR_LOW, ENERGY_BAR_HIGH, ENERGY_BAR_ALPHA_LOW, ENERGY_BAR_ALPHA_HIGH, worldSizeReceived } from '../config.js';
import Planets from './planets.js';
import { State } from './state.js';
import { otherPlayers, playerCount, connectionStatus } from '../network/events.js';
import Entities from './entities.js';
import Resources from './resources.js';

const showEnergy = false;

function drawLoadingScreen() {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#fff";
  ctx.font = "24px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let mainText = "Loading world...";
  let subText = "Waiting for server data";

  if (connectionStatus === "connecting") {
    mainText = "Connecting to server...";
    subText = "Establishing connection";
  } else if (connectionStatus === "disconnected") {
    mainText = "Connection lost";
    subText = "Attempting to reconnect...";
  }

  ctx.fillText(mainText, canvas.width / 2, canvas.height / 2);
  ctx.font = "16px monospace";
  ctx.fillText(subText, canvas.width / 2, canvas.height / 2 + 40);
  ctx.restore();
}

function drawGrid() {
  // Only draw grid if world size has been received from server
  if (!worldSizeReceived) return;

  const worldWidth = WORLD_WIDTH;
  const worldHeight = WORLD_HEIGHT;

  ctx.strokeStyle = "#444";
  for (let x = 0; x <= worldWidth; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, worldHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= worldHeight; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldWidth, y);
    ctx.stroke();
  }
}

function drawUI() {
  ctx.save();
  ctx.font = "20px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const coordText = `X: ${Player.x.toFixed(0)}  Y: ${Player.y.toFixed(0)}`;
  ctx.fillText(coordText, 12, 12);
  ctx.fillText(`Players: ${playerCount}`, 12, 36);

  // Energy display
  if (showEnergy && Player.energy !== undefined) {
    const energyPercent = Math.round((Player.energy / Player.maxEnergy) * 100);
    let energyColor = "#0f0"; // Green when healthy
    if (energyPercent <= ENERGY_BAR_LOW) energyColor = "#f00"; // Red when low
    else if (energyPercent <= ENERGY_BAR_HIGH) energyColor = "#ff0"; // Yellow when medium
    let alpha = ENERGY_BAR_ALPHA_HIGH;
    if (energyPercent <= ENERGY_BAR_LOW) alpha = ENERGY_BAR_ALPHA_LOW;
    ctx.globalAlpha = alpha;
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
    ctx.fillRect(barX, barY, barWidth * (Player.energy / Player.maxEnergy), barHeight);

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
  const { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } = Camera.getViewport();

  // Clear canvas
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Show loading screen if world size hasn't been received yet
  if (!worldSizeReceived) {
    drawLoadingScreen();
    return;
  }

  // Set up camera transform
  ctx.save();
  ctx.translate(-Camera.x, -Camera.y);

  // Draw world
  drawGrid();

  // Draw resources (under entities)
  Resources.drawResources(ctx);

  // Draw entities
  for (const entity of State.getEntities()) {
    Entities.drawEntity(ctx, entity, "#f55", "#fff");
  }

  // Draw other players
  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    Entities.drawEntity(ctx, p, "#09f", "#fff");
  }

  // Draw player
  Entities.drawEntity(ctx, Player, "#f00", "#fff");

  // Draw planets and distances
  Planets.drawPlanets(ctx);
  Planets.drawPlanetDistances(ctx);

  // Restore camera transform
  ctx.restore();

  // Draw UI overlays
  Planets.drawTravelProgress(ctx, canvas, Player);
  drawUI();
  drawConnectionStatus();
}