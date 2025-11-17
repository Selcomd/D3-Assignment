// Yahir Rico
// D3
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
  #modeToggle {
    margin-left: 10px;
    padding: 2px 6px;
    font-size: 0.7rem;
    border: 1px solid #444;
    background: #ddd;
    cursor: pointer;
    border-radius: 4px;
  }
  #resetGame {
    margin-left: 6px;
    padding: 2px 6px;
    font-size: 0.7rem;
    border: 1px solid #444;
    background: #eee;
    cursor: pointer;
    border-radius: 4px;
  }
`;
document.head.append(style);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

const urlParams = new URLSearchParams(globalThis.location.search);
let movementMode = urlParams.get("movement") ??
  localStorage.getItem("movementMode") ??
  "buttons";

movementMode = movementMode === "geolocation" ? "geolocation" : "buttons";
localStorage.setItem("movementMode", movementMode);

function applyMovementMode(mode: string) {
  localStorage.setItem("movementMode", mode);
  const baseUrl = globalThis.location.origin + globalThis.location.pathname;
  globalThis.location.href = `${baseUrl}?movement=${mode}`;
}

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

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const modifiedCells = new Map<string, number>();
const playerCell = { i: 0, j: 0 };
let heldToken: number | null = null;
const playerMarker = leaflet.marker(CLASSROOM_LATLNG).addTo(map);
const cellsLayer = leaflet.layerGroup().addTo(map);

interface GameSave {
  playerCell: { i: number; j: number };
  heldToken: number | null;
  modifiedCells: [string, number][];
  movementMode: string;
}

function saveGameState() {
  const data: GameSave = {
    playerCell: { ...playerCell },
    heldToken,
    modifiedCells: [...modifiedCells.entries()],
    movementMode,
  };
  localStorage.setItem("gameSave", JSON.stringify(data));
}

function loadGameState() {
  const raw = localStorage.getItem("gameSave");
  if (!raw) return;

  try {
    const data: GameSave = JSON.parse(raw);

    playerCell.i = data.playerCell.i;
    playerCell.j = data.playerCell.j;
    heldToken = data.heldToken;
    modifiedCells.clear();
    for (const [k, v] of data.modifiedCells) modifiedCells.set(k, v);

    movementMode = data.movementMode ?? movementMode;
    localStorage.setItem("movementMode", movementMode);

    const lat = CLASSROOM_LATLNG.lat + playerCell.i * TILE_DEGREES;
    const lng = CLASSROOM_LATLNG.lng + playerCell.j * TILE_DEGREES;
    playerMarker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
  } catch {
    localStorage.removeItem("gameSave");
  }
}

function updateStatusPanel() {
  statusPanelDiv.innerHTML = `
    Held token: ${heldToken === null ? "none" : heldToken}
    — at (${playerCell.i}, ${playerCell.j})
    — Mode: ${movementMode}
    <button id="modeToggle">Switch</button>
    <button id="resetGame">Reset</button>
  `;

  document.getElementById("modeToggle")!.addEventListener("click", () => {
    const newMode = movementMode === "buttons" ? "geolocation" : "buttons";
    applyMovementMode(newMode);
  });

  document.getElementById("resetGame")!.addEventListener("click", () => {
    localStorage.removeItem("gameSave");
    const baseUrl = globalThis.location.origin + globalThis.location.pathname;
    globalThis.location.href = `${baseUrl}?movement=buttons`;
  });
}

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function cellBounds(i: number, j: number): leaflet.LatLngBounds {
  return leaflet.latLngBounds(
    [
      CLASSROOM_LATLNG.lat + i * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + j * TILE_DEGREES,
    ],
    [
      CLASSROOM_LATLNG.lat + (i + 1) * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + (j + 1) * TILE_DEGREES,
    ],
  );
}

function baseTokenForCell(i: number, j: number): number {
  const r = luck(`${i},${j},base`);
  return r < 0.4 ? 1 : 0;
}

function getTokenAt(i: number, j: number): number {
  return modifiedCells.get(cellKey(i, j)) ?? baseTokenForCell(i, j);
}

function setTokenAt(i: number, j: number, value: number) {
  modifiedCells.set(cellKey(i, j), value);
  saveGameState();
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
        leaflet.marker([(sw.lat + ne.lat) / 2, (sw.lng + ne.lng) / 2], {
          interactive: false,
          icon: leaflet.divIcon({
            className: "token-label",
            html: token.toString(),
            iconSize: [30, 16],
          }),
        }).addTo(cellsLayer);
      }
    }
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
  saveGameState();
}

interface MovementController {
  start(): void;
}

class ButtonMovementController implements MovementController {
  start(): void {
    globalThis.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          movePlayer(1, 0);
          break;
        case "s":
        case "arrowdown":
          movePlayer(-1, 0);
          break;
        case "a":
        case "arrowleft":
          movePlayer(0, -1);
          break;
        case "d":
        case "arrowright":
          movePlayer(0, 1);
          break;
      }
    });
  }
}

class GeoMovementController implements MovementController {
  lastLat: number | null = null;
  lastLng: number | null = null;

  start(): void {
    if (!navigator.geolocation) {
      new ButtonMovementController().start();
      return;
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (this.lastLat === null || this.lastLng === null) {
          this.lastLat = latitude;
          this.lastLng = longitude;
          return;
        }

        const dLat = latitude - this.lastLat;
        const dLng = longitude - this.lastLng;
        this.lastLat = latitude;
        this.lastLng = longitude;

        const moveI = Math.round(dLat / TILE_DEGREES);
        const moveJ = Math.round(dLng / TILE_DEGREES);
        if (moveI !== 0 || moveJ !== 0) movePlayer(moveI, moveJ);
      },
      () => {
        new ButtonMovementController().start();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300,
        timeout: 4000,
      },
    );
  }
}

const controller: MovementController = movementMode === "geolocation"
  ? new GeoMovementController()
  : new ButtonMovementController();

controller.start();
loadGameState();
updateStatusPanel();
redrawCells();
