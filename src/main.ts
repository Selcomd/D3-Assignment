// Yahir Rico

import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

const style = document.createElement("style");
style.textContent = `
  .token-label {
    background: rgba(255,255,255,0.9);
    border: 1px solid #444;
    border-radius: 4px;
    text-align: center;
    font-size: 0.7rem;
    width: 30px;
    line-height: 16px;
  }
`;
document.head.append(style);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const DRAW_RADIUS = 10;
const INTERACT_RANGE = 3;
const WIN_TOKEN_VALUE = 32;

const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

interface CellState {
  token: number;
}

const modifiedCells = new Map<string, CellState>();

const playerCell = { i: 0, j: 0 };
const playerMarker = leaflet.marker(CLASSROOM_LATLNG).addTo(map);

const cellsLayer = leaflet.layerGroup().addTo(map);
let heldToken: number | null = null;

function updateStatusPanel() {
  statusPanelDiv.innerHTML = heldToken === null
    ? `Held token: none — at (${playerCell.i}, ${playerCell.j})`
    : `Held token: ${heldToken} — at (${playerCell.i}, ${playerCell.j})`;
}

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function cellBounds(i: number, j: number): leaflet.LatLngBounds {
  return leaflet.latLngBounds([
    [
      CLASSROOM_LATLNG.lat + i * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + j * TILE_DEGREES,
    ],
    [
      CLASSROOM_LATLNG.lat + (i + 1) * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + (j + 1) * TILE_DEGREES,
    ],
  ]);
}

function baseTokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j},base`);
  return r < 0.4 ? 1 : 0;
}

function getTokenAt(i: number, j: number): number {
  const key = cellKey(i, j);
  const found = modifiedCells.get(key);
  if (found) return found.token;
  return baseTokenForCell(i, j);
}

function setTokenAt(i: number, j: number, value: number) {
  modifiedCells.set(cellKey(i, j), { token: value });
}

function isCellNearPlayer(i: number, j: number): boolean {
  return Math.max(Math.abs(i - playerCell.i), Math.abs(j - playerCell.j)) <=
    INTERACT_RANGE;
}

function handleCellClick(i: number, j: number) {
  if (!isCellNearPlayer(i, j)) return;
  const cellToken = getTokenAt(i, j);

  if (heldToken === null && cellToken > 0) {
    heldToken = cellToken;
    setTokenAt(i, j, 0);
    updateStatusPanel();
    redrawCells();
    return;
  }

  if (cellToken > 0 && heldToken === cellToken) {
    const newToken = cellToken * 2;
    setTokenAt(i, j, newToken);
    heldToken = null;
    updateStatusPanel();
    redrawCells();

    if (newToken >= WIN_TOKEN_VALUE) {
      alert(`You crafted ${newToken}! GAME OVER.`);
    }
  }
}

function redrawCells() {
  cellsLayer.clearLayers();

  for (let di = -DRAW_RADIUS; di <= DRAW_RADIUS; di++) {
    for (let dj = -DRAW_RADIUS; dj <= DRAW_RADIUS; dj++) {
      const ci = playerCell.i + di;
      const cj = playerCell.j + dj;

      const bounds = cellBounds(ci, cj);
      const token = getTokenAt(ci, cj);
      const near = isCellNearPlayer(ci, cj);

      const rect = leaflet.rectangle(bounds, {
        color: near ? "#2ecc71" : "#888",
        weight: 1,
        fillOpacity: 0,
      });
      rect.on("click", () => handleCellClick(ci, cj));
      rect.addTo(cellsLayer);

      if (token > 0) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        leaflet.marker(
          [(sw.lat + ne.lat) / 2, (sw.lng + ne.lng) / 2],
          {
            interactive: false,
            icon: leaflet.divIcon({
              className: "token-label",
              html: token.toString(),
              iconSize: [30, 16],
            }),
          },
        ).addTo(cellsLayer);
      }
    }
  }
}

function clearOffscreenCells() {
  const visible = new Set<string>();

  for (let di = -DRAW_RADIUS; di <= DRAW_RADIUS; di++) {
    for (let dj = -DRAW_RADIUS; dj <= DRAW_RADIUS; dj++) {
      visible.add(cellKey(playerCell.i + di, playerCell.j + dj));
    }
  }
  for (const key of modifiedCells.keys()) {
    if (!visible.has(key)) modifiedCells.delete(key);
  }
}

function movePlayer(di: number, dj: number) {
  playerCell.i += di;
  playerCell.j += dj;

  const newLat = CLASSROOM_LATLNG.lat + playerCell.i * TILE_DEGREES;
  const newLng = CLASSROOM_LATLNG.lng + playerCell.j * TILE_DEGREES;

  playerMarker.setLatLng([newLat, newLng]);
  map.panTo([newLat, newLng]);
  redrawCells();
  updateStatusPanel();
  clearOffscreenCells();
}

globalThis.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      movePlayer(1, 0);
      break;
    case "arrowdown":
    case "s":
      movePlayer(-1, 0);
      break;
    case "arrowleft":
    case "a":
      movePlayer(0, -1);
      break;
    case "arrowright":
    case "d":
      movePlayer(0, 1);
      break;
  }
});

updateStatusPanel();
redrawCells();
