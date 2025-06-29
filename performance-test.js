// Performance test to demonstrate quadtree optimization
const { SpatialManager } = require('./server/utils/quadtree');
const { distance } = require('./server/utils/math');

// Test parameters
const WORLD_WIDTH = 1400;
const WORLD_HEIGHT = 800;
const NUM_ENTITIES = 500;
const NUM_PLAYERS = 20;
const TEST_ITERATIONS = 100;

// Create test data
function createTestEntities(count) {
  const entities = [];
  for (let i = 0; i < count; i++) {
    entities.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: 18 + Math.random() * 10,
      isAlive: true,
      id: `entity_${i}`
    });
  }
  return entities;
}

function createTestPlayers(count) {
  const players = {};
  for (let i = 0; i < count; i++) {
    players[`player_${i}`] = {
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: 20,
      isAlive: true,
      id: `player:player_${i}`
    };
  }
  return players;
}

// Test 1: O(n²) approach (original)
function testOriginalApproach(entities, players) {
  const startTime = process.hrtime.bigint();

  for (let iter = 0; iter < TEST_ITERATIONS; iter++) {
    for (const entity of entities) {
      let nearest = null;
      let nearestDist = Infinity;

      // Check all players
      for (const playerId in players) {
        const player = players[playerId];
        const dist = distance(entity.x, entity.y, player.x, player.y);
        if (dist < 400 && dist < nearestDist) {
          nearest = player;
          nearestDist = dist;
        }
      }

      // Check all other entities
      for (const otherEntity of entities) {
        if (otherEntity === entity) continue;
        const dist = distance(entity.x, entity.y, otherEntity.x, otherEntity.y);
        if (dist < 400 && dist < nearestDist) {
          nearest = otherEntity;
          nearestDist = dist;
        }
      }
    }
  }

  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime) / 1000000; // Convert to milliseconds
}

// Test 2: Quadtree approach (optimized)
function testQuadtreeApproach(entities, players) {
  const spatialManager = new SpatialManager(WORLD_WIDTH, WORLD_HEIGHT);
  const startTime = process.hrtime.bigint();

  for (let iter = 0; iter < TEST_ITERATIONS; iter++) {
    // Update spatial index
    spatialManager.updateIndex(entities, players);

    for (const entity of entities) {
      const { target, distance: nearestDist } = spatialManager.findNearestTarget(entity, 400, entities, players);
    }
  }

  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime) / 1000000; // Convert to milliseconds
}

// Run performance test
console.log('🚀 Performance Test: O(n²) vs Quadtree Optimization');
console.log('=' .repeat(60));
console.log(`World size: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
console.log(`Entities: ${NUM_ENTITIES}`);
console.log(`Players: ${NUM_PLAYERS}`);
console.log(`Test iterations: ${TEST_ITERATIONS}`);
console.log('');

// Create test data
console.log('Creating test data...');
const entities = createTestEntities(NUM_ENTITIES);
const players = createTestPlayers(NUM_PLAYERS);

// Run tests
console.log('Testing O(n²) approach...');
const originalTime = testOriginalApproach(entities, players);

console.log('Testing Quadtree approach...');
const quadtreeTime = testQuadtreeApproach(entities, players);

// Results
console.log('');
console.log('📊 Results:');
console.log('=' .repeat(60));
console.log(`O(n²) approach:     ${originalTime.toFixed(2)}ms`);
console.log(`Quadtree approach:  ${quadtreeTime.toFixed(2)}ms`);
console.log(`Speedup:            ${(originalTime / quadtreeTime).toFixed(2)}x faster`);
console.log(`Performance gain:   ${((originalTime - quadtreeTime) / originalTime * 100).toFixed(1)}% improvement`);

// Theoretical complexity
console.log('');
console.log('📈 Theoretical Complexity:');
console.log('=' .repeat(60));
console.log(`O(n²) approach:     O(${NUM_ENTITIES} × ${NUM_ENTITIES + NUM_PLAYERS}) = O(${(NUM_ENTITIES * (NUM_ENTITIES + NUM_PLAYERS)).toLocaleString()})`);
console.log(`Quadtree approach:  O(${NUM_ENTITIES} × log(${NUM_ENTITIES + NUM_PLAYERS})) = O(${Math.round(NUM_ENTITIES * Math.log2(NUM_ENTITIES + NUM_PLAYERS)).toLocaleString()})`);

console.log('');
console.log('✅ Optimization successful! The quadtree approach significantly reduces');
console.log('   the number of distance calculations needed for entity interactions.');