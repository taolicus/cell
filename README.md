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

## Next Steps
- Add more game logic, sync entities, handle disconnects, etc.