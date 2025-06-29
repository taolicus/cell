// Resource management for nutrient particles
const { WORLD_WIDTH, WORLD_HEIGHT, INITIAL_RESOURCE_COUNT } = require("../config");
const { distance } = require("../utils/math");

const Resources = {
  createResource() {
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: 8,
      energyValue: 25,
      isActive: true,
      respawnTime: 0,
    };
  },

  createInitialResources(count = INITIAL_RESOURCE_COUNT) {
    const resources = [];
    for (let i = 0; i < count; i++) {
      resources.push(this.createResource());
    }
    return resources;
  },

  updateResources(resources, entities, players, spatialManager) {
    // Check for resource consumption by entities
    for (let i = resources.length - 1; i >= 0; i--) {
      const resource = resources[i];
      if (!resource.isActive) {
        resource.respawnTime--;
        if (resource.respawnTime <= 0) {
          resource.isActive = true;
          resource.x = Math.random() * WORLD_WIDTH;
          resource.y = Math.random() * WORLD_HEIGHT;
        }
        continue;
      }

      // Use spatial manager to find nearby entities efficiently
      const nearbyEntities = spatialManager.findObjectsInRadius(resource.x, resource.y, resource.radius + 50, entities, players);

      // Check if any entity is consuming this resource
      for (const { object: entity } of nearbyEntities) {
        if (!entity.isAlive) continue;

        // Validate coordinates before distance calculation
        if (isNaN(resource.x) || isNaN(resource.y) || isNaN(entity.x) || isNaN(entity.y)) {
          continue;
        }

        const dist = distance(resource.x, resource.y, entity.x, entity.y);

        // Check for NaN distance
        if (isNaN(dist)) {
          continue;
        }

        if (dist < (resource.radius + entity.radius)) {
          // Entity consumes the resource
          entity.energy = Math.min(entity.energy + resource.energyValue, entity.maxEnergy);
          // Resource is consumed, start respawn timer
          resource.isActive = false;
          resource.respawnTime = 300 + Math.floor(Math.random() * 300); // 5-10 seconds at 60 FPS
          break; // Only one entity can consume a resource
        }
      }

      // Check if player is consuming this resource (players are also in nearbyEntities)
      for (const { object: player } of nearbyEntities) {
        // Skip if this is an entity, not a player
        if (player.id && !player.id.startsWith('player:')) continue;
        if (!player.isAlive) continue;

        // Validate coordinates before distance calculation
        if (isNaN(resource.x) || isNaN(resource.y) || isNaN(player.x) || isNaN(player.y)) {
          continue;
        }

        const dist = distance(resource.x, resource.y, player.x, player.y);

        // Check for NaN distance
        if (isNaN(dist)) {
          continue;
        }

        if (dist < (resource.radius + player.radius)) {
          // Player consumes the resource
          player.energy = Math.min(player.energy + resource.energyValue, player.maxEnergy);
          // Resource is consumed, start respawn timer
          resource.isActive = false;
          resource.respawnTime = 300 + Math.floor(Math.random() * 300); // 5-10 seconds at 60 FPS
        }
      }
    }
    // Maintain minimum resource count
    const activeResources = resources.filter(r => r.isActive).length;
    const minResources = INITIAL_RESOURCE_COUNT;
    if (activeResources < minResources) {
      const needed = minResources - activeResources;
      for (let i = 0; i < needed; i++) {
        resources.push(this.createResource());
      }
    }
  }
};

module.exports = Resources;