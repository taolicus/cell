# T O O T H

## Synopsis

**Tooth** is a microscopic multiplayer "space trader" kind of game with a biological twist. Players take on the role of microscopic goblins living inside bacteria cells, navigating through a liquid medium in someone's mouth.

### The Concept
- **Players**: Microscopic goblins that inhabit and control bacteria cells
- **Environment**: A living ecosystem within someone's mouth
- **Planets**: Larger cells or groups of cells that serve as hubs
- **Movement**: Fluid dynamics in a liquid medium
- **Gameplay**: "Space trader" mechanics adapted to a microscopic biological setting

## Background

This project is based on a series of "tooth goblin" comics that explore themes of isolation and communication. The comics follow a goblin living in a big metropolitan bacterial colony within a tooth, who learns to use radio equipment to communicate within and beyond the human host. The main inspiration comes from the song "Stay Tuned" covered by Robert Wyatt.

The game brings this comic world to life as an interactive multiplayer experience, expanding on the themes of connection, isolation, and the search for communication in unexpected places.

---

## Development Roadmap: Living Bacteria Mechanics

### Phase 1: Basic Energy System ✅ COMPLETE
- [x] Add energy property to entities (max energy: 100)
- [x] Energy consumption rate (1.5 energy per second while moving)
- [x] Visual energy indicator (entity size/color changes with energy)
- [x] Death when energy reaches 0

**Current Implementation:**
- Entities start with 100 energy and lose 1.5 energy per second while moving
- Visual feedback: Green (healthy) → Yellow (moderate) → Red (low energy)
- Size scales with energy level (0.5x to 1.2x normal size)
- Dead entities become gray corpses (20% opacity) and remain in the world
- No respawning - creates survival pressure for future resource systems

### Phase 2: Simple Resource System
- [ ] Add resource nodes (nutrient particles scattered around world)
- [ ] Resource consumption (entities gain energy when touching resources)
- [ ] Resource respawning (new resources spawn periodically)
- [ ] Resource competition (multiple entities compete for same resources)

### Phase 3: Growth and Division
- [ ] Growth mechanics (entities grow larger as they gain energy)
- [ ] Division threshold (max energy + size triggers division)
- [ ] Division process (split into two smaller entities with half energy each)
- [ ] Division cooldown (prevent rapid division spam)

### Phase 4: Basic Health System
- [ ] Health property (separate from energy, represents structural integrity)
- [ ] Health decay (entities slowly lose health over time - aging)
- [ ] Health regeneration (heal when excess energy available)
- [ ] Death from low health (entities die if health reaches 0)

### Future Considerations (Not in Current Scope)
- Environmental interactions (pH, temperature, pressure zones)
- Social behavior (colony formation, communication, symbiosis)
- Advanced environmental effects (fluid dynamics, saliva flow, oxygen levels)

---

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Start the server:
   ```sh
   npm start
   ```

3. Open your browser at [http://localhost:3000](http://localhost:3000)
   - Open in multiple tabs or devices to test multiplayer.

## Project Structure
- `server/`: Node.js + Express + Socket.IO server
  - `index.js`: Main server entry point
  - `app.js`: Express app configuration
  - `game/`: Game logic and state management
  - `network/`: Socket.IO event handlers
- `client/`: Client-side code
  - `index.html`: Main HTML file
  - `client.js`: Client entry point
  - `game/`: Game rendering and logic
  - `ui/`: User interface components
  - `network/`: Client-side networking

## Current Gameplay
- **Multiplayer**: Players can join and see each other in real-time
- **Movement**: WASD or arrow keys to move, mouse to look around
- **Entities**: AI-controlled bacteria that consume energy while moving
- **Survival**: Entities die when energy depletes, creating pressure for resource systems
- **Visual Feedback**: Energy levels shown through color and size changes

## Next Steps
- Add more game logic, sync entities, handle disconnects, etc.