# D3: World Of Bits

# Game Design Vision

A map-based collecting game where the player is fixed to the classroom location, can only interact with nearby grid cells, and must pick up and combine equal tokens to craft a high-value token. The world is infinite-looking, consistent across reloads, and every cell shows what it contains.

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

## D3.a

- [x] **delete everything in `main.ts`** – start fresh with a blank file
- [x] **add Leaflet map and visible grid cells** – render cells of fixed size around the player
- [x] **use `luck()` for deterministic token spawning** – consistent world each reload
- [x] **limit interaction to nearby cells (range 3)** – highlight reachable cells
- [x] **add player inventory and pickup** – at most one token in hand, remove it from cell
- [x] **add crafting and win detection** – combine equal tokens to double value; alert when ≥ 16

---

## D3.b

- [x] **add player movement controls** – implement buttons or keypresses for N/S/E/W movement, shifting player position by one grid step each time
- [x] **keep cells visible during movement** – when moving, continuously spawn/despawn cells to always fill the screen to its edges
- [x] **make cells memoryless off-screen** – clear old cell data when they move out of range so they reset when revisited
- [x] **raise crafting goal threshold** – increase win condition (≥ 32) to reflect expanded gameplay with movement

---

## D3.c

- [x] **implement cell Flyweight pattern** – avoid storing redundant cell data; only allocate memory for modified cells
- [x] **apply Memento-style persistence** – store and restore modified cell state when scrolled off-screen
- [x] **refactor cell storage using `Map< CellKey, TokenValue>`** – make each cell’s state easily serializable and restorable
- [x] **test persistent modifications** – verify that cells maintain their modified values when leaving and re-entering the visible map

---

## D3.d

- [x] **add movement mode selector** – determine movement system from `movement=buttons` or `?movement=geolocation`
- [x] **add movement controller interface** – hide input system behind a facade so the rest of the game only calls `movement.start()`
- [x] **implement button-based controller** – reuse WASD/arrow key movement inside the new interface
- [x] **implement geolocation-based controller** – move the player when the device’s real-world position changes
- [ ] **persist game state using `localStorage`** – store (player position, modifiedCells, heldToken) and restore on page load
- [ ] **add new-game control** – allow the player to clear saved data and restart fresh
