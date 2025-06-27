// Entity logic and update loop
const { WORLD_WIDTH, WORLD_HEIGHT } = require("../config");
const {
  distance,
  angleTo,
  normalizeAngle,
  magnitude,
  clamp,
  lerp,
} = require("../math");

function createEntity() {
  return {
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: 18,
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2,
    vx: 0,
    vy: 0,
    speed: 0,
    targetSpeed: Math.random() * 3,
    maxSpeed: 3,
    acceleration: 0.1,
    friction: 0.98,
    rotationSpeed: 0.04,
    changeDirCooldown: 0,
    followTargetId: null, // index of entity or 'player:<socketId>'
    followCooldown: 0,
    // Energy system
    energy: 100,
    maxEnergy: 100,
    energyConsumptionRate: 1.5, // energy lost per second while moving
    isAlive: true,
  };
}

function updateEntities(entities, players) {
  // Gather all possible targets (players and entities)
  const playerList = Object.entries(players).map(([id, p]) => ({
    ...p,
    id: "player:" + id,
  }));

  // Update player energy consumption
  for (const [playerId, player] of Object.entries(players)) {
    // Energy consumption based on movement
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;
    if (isMoving) {
      player.energy -= player.energyConsumptionRate / 60; // Assuming 60 FPS
    }

    // Death check
    if (player.energy <= 0) {
      player.isAlive = false;
      player.energy = 0;
    }
  }

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    // Skip dead entities
    if (!entity.isAlive) continue;

    // Energy consumption based on movement
    const isMoving = Math.abs(entity.vx) > 0.1 || Math.abs(entity.vy) > 0.1;
    if (isMoving) {
      entity.energy -= entity.energyConsumptionRate / 60; // Assuming 60 FPS
    }

    // Death check
    if (entity.energy <= 0) {
      entity.isAlive = false;
      continue; // Skip further updates for dead entities
    }

    // Handle follow cooldown
    if (entity.followCooldown > 0) {
      entity.followCooldown--;
    }
    // Decide whether to start/stop following
    if (entity.followCooldown <= 0) {
      // 20% chance to start/stop following every 2-4 seconds
      if (Math.random() < 0.2) {
        // Find nearest target (player or other entity, not self)
        let nearest = null;
        let nearestDist = Infinity;
        // Check players
        for (const p of playerList) {
          const dist = distance(entity.x, entity.y, p.x, p.y);
          if (dist < 400 && dist < nearestDist) {
            // only follow if within 400 units
            nearest = p.id;
            nearestDist = dist;
          }
        }
        // Check other entities
        for (let j = 0; j < entities.length; j++) {
          if (j === i) continue;
          const e2 = entities[j];
          if (!e2.isAlive) continue; // Skip dead entities
          const dist = distance(entity.x, entity.y, e2.x, e2.y);
          if (dist < 400 && dist < nearestDist) {
            nearest = j;
            nearestDist = dist;
          }
        }
        if (nearest !== null) {
          entity.followTargetId = nearest;
        } else {
          entity.followTargetId = null;
        }
      } else {
        // Sometimes stop following
        entity.followTargetId = null;
      }
      // Set next followCooldown (2-4 seconds)
      entity.followCooldown = 40 + Math.floor(Math.random() * 40);
    }
    // If following, set targetAngle toward target
    if (entity.followTargetId !== null) {
      let target = null;
      if (
        typeof entity.followTargetId === "string" &&
        entity.followTargetId.startsWith("player:")
      ) {
        const pid = entity.followTargetId.slice(7);
        if (players[pid]) target = players[pid];
      } else if (
        typeof entity.followTargetId === "number" &&
        entities[entity.followTargetId] &&
        entities[entity.followTargetId].isAlive
      ) {
        target = entities[entity.followTargetId];
      }
      if (target) {
        entity.targetAngle = angleTo(entity, target);
        entity.targetSpeed = entity.maxSpeed * (0.7 + 0.3 * Math.random());
      }
    } else {
      // Wander as before
      if (entity.changeDirCooldown <= 0) {
        entity.targetAngle = Math.random() * Math.PI * 2;
        entity.targetSpeed = Math.random() * entity.maxSpeed;
        entity.changeDirCooldown = 30 + Math.random() * 60;
      } else {
        entity.changeDirCooldown--;
      }
    }
    let angleDiff = entity.targetAngle - entity.angle;
    angleDiff = normalizeAngle(angleDiff);
    if (Math.abs(angleDiff) < entity.rotationSpeed) {
      entity.angle = entity.targetAngle;
    } else {
      entity.angle += Math.sign(angleDiff) * entity.rotationSpeed;
    }
    entity.speed += (entity.targetSpeed - entity.speed) * 0.05;
    entity.vx +=
      (Math.cos(entity.angle) * entity.acceleration * entity.speed) /
      entity.maxSpeed;
    entity.vy +=
      (Math.sin(entity.angle) * entity.acceleration * entity.speed) /
      entity.maxSpeed;
    let v = magnitude(entity.vx, entity.vy);
    if (v > entity.maxSpeed) {
      entity.vx = (entity.vx / v) * entity.maxSpeed;
      entity.vy = (entity.vy / v) * entity.maxSpeed;
    }
    entity.vx *= entity.friction;
    entity.vy *= entity.friction;
    entity.x += entity.vx;
    entity.y += entity.vy;
    entity.x = clamp(entity.x, entity.radius, WORLD_WIDTH - entity.radius);
    entity.y = clamp(entity.y, entity.radius, WORLD_HEIGHT - entity.radius);
  }
}

module.exports = {
  createEntity,
  updateEntities
};