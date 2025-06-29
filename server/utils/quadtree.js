// Quadtree spatial partitioning for efficient distance calculations
const { distance } = require('./math');

class QuadTree {
  constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
    this.bounds = bounds; // { x, y, width, height }
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.objects = [];
    this.nodes = [];
  }

  // Split the quadtree into 4 sub-nodes
  split() {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes[0] = new QuadTree(
      { x: x + subWidth, y: y, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );

    this.nodes[1] = new QuadTree(
      { x: x, y: y, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );

    this.nodes[2] = new QuadTree(
      { x: x, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );

    this.nodes[3] = new QuadTree(
      { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
  }

  // Determine which node an object belongs to
  getIndex(obj) {
    let index = -1;
    const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    const topQuadrant = (obj.y - obj.radius < horizontalMidpoint && obj.y + obj.radius < horizontalMidpoint);
    const bottomQuadrant = (obj.y - obj.radius > horizontalMidpoint);

    if (obj.x - obj.radius < verticalMidpoint && obj.x + obj.radius < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (obj.x - obj.radius > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }

    return index;
  }

  // Insert an object into the quadtree
  insert(obj) {
    if (this.nodes.length) {
      const index = this.getIndex(obj);
      if (index !== -1) {
        this.nodes[index].insert(obj);
        return;
      }
    }

    this.objects.push(obj);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (!this.nodes.length) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  // Retrieve all objects that could collide with the given object
  retrieve(obj) {
    const index = this.getIndex(obj);
    let returnObjects = this.objects;

    if (this.nodes.length) {
      if (index !== -1) {
        returnObjects = returnObjects.concat(this.nodes[index].retrieve(obj));
      } else {
        for (let i = 0; i < this.nodes.length; i++) {
          returnObjects = returnObjects.concat(this.nodes[i].retrieve(obj));
        }
      }
    }

    return returnObjects;
  }

  // Clear the quadtree
  clear() {
    this.objects = [];
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]) {
        this.nodes[i].clear();
      }
    }
    this.nodes = [];
  }

  // Get all objects in the quadtree
  getAllObjects() {
    let objects = [...this.objects];
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]) {
        objects = objects.concat(this.nodes[i].getAllObjects());
      }
    }
    return objects;
  }
}

// Spatial manager for efficient distance calculations
class SpatialManager {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.quadtree = new QuadTree({
      x: 0,
      y: 0,
      width: worldWidth,
      height: worldHeight
    }, 10, 4);
  }

  // Update the spatial index with current positions
  updateIndex(entities, players) {
    this.quadtree.clear();

    // Add all entities
    for (const entity of entities) {
      if (entity.isAlive) {
        this.quadtree.insert(entity);
      }
    }

    // Add all players
    for (const playerId in players) {
      const player = players[playerId];
      if (player.isAlive) {
        this.quadtree.insert(player);
      }
    }
  }

  // Find nearest target within radius for an entity
  findNearestTarget(entity, maxRadius, entities, players) {
    const candidates = this.quadtree.retrieve(entity);
    let nearest = null;
    let nearestDist = Infinity;

    for (const candidate of candidates) {
      // Skip self
      if (candidate === entity) continue;

      // Skip dead entities
      if (candidate.isAlive === false) continue;

      const dist = distance(entity.x, entity.y, candidate.x, candidate.y);
      if (dist < maxRadius && dist < nearestDist) {
        nearest = candidate;
        nearestDist = dist;
      }
    }

    return { target: nearest, distance: nearestDist };
  }

  // Find all objects within radius of a point
  findObjectsInRadius(x, y, radius, entities, players) {
    const searchObj = { x, y, radius };
    const candidates = this.quadtree.retrieve(searchObj);
    const results = [];

    for (const candidate of candidates) {
      if (candidate.isAlive === false) continue;

      const dist = distance(x, y, candidate.x, candidate.y);
      if (dist < radius) {
        results.push({ object: candidate, distance: dist });
      }
    }

    return results;
  }

  // Check collision between two objects
  checkCollision(obj1, obj2) {
    const dist = distance(obj1.x, obj1.y, obj2.x, obj2.y);
    return dist < (obj1.radius + obj2.radius);
  }
}

module.exports = { QuadTree, SpatialManager };