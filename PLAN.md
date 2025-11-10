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

- [x] **delete everything in `main.ts`** – start fresh with a blank file
- [x] **add Leaflet map and visible grid cells** – render cells of fixed size around the player
- [x] **use `luck()` for deterministic token spawning** – consistent world each reload
- [x] **limit interaction to nearby cells (range 3)** – highlight reachable cells
- [x] **add player inventory and pickup** – at most one token in hand, remove it from cell
- [x] **add crafting and win detection** – combine equal tokens to double value; alert when ≥ 16

---
