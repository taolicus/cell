// Server-side planet management
const { WORLD_WIDTH, WORLD_HEIGHT } = require('../config');

const Planets = {
  planets: [],

  generatePlanets() {
    const planetData = [
      { name: 'Terra', radius: 60, color: '#4af' },
      { name: 'Vega', radius: 50, color: '#fa4' },
      { name: 'Zyra', radius: 70, color: '#a4f' }
    ];
    return planetData.map(planet => ({
      ...planet,
      x: Math.random() * (WORLD_WIDTH - 200) + 100, // Keep 100 units from edges
      y: Math.random() * (WORLD_HEIGHT - 200) + 100  // Keep 100 units from edges
    }));
  },

  init() {
    Planets.planets = Planets.generatePlanets();
  },

  getPlanets() {
    return [...Planets.planets];
  }
};

Planets.init();

module.exports = Planets;