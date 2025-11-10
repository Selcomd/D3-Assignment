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

leaflet.marker(CLASSROOM_LATLNG).addTo(map);

const cellsLayer = leaflet.layerGroup().addTo(map);

let heldToken: number | null = null;
const modifiedCells = new Map<string, number>();

function updateStatusPanel() {
  statusPanelDiv.innerHTML =
    heldToken === null ? "Held token: none" : `Held token: ${heldToken}`;
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
  if (modifiedCells.has(key)) return modifiedCells.get(key)!;
  return baseTokenForCell(i, j);
}

function setTokenAt(i: number, j: number, value: number) {
  modifiedCells.set(cellKey(i, j), value);
}

function isCellNearPlayer(i: number, j: number): boolean {
  return Math.max(Math.abs(i), Math.abs(j)) <= INTERACT_RANGE;
}

function handleCellClick(i: number, j: number) {
  if (!isCellNearPlayer(i, j)) return;

  const cellToken = getTokenAt(i, j);

  if (heldToken === null && cellToken > 0) {
    heldToken = cellToken;
    setTokenAt(i, j, 0);
    updateStatusPanel();
    redrawCells();
  }
}

function redrawCells() {
  cellsLayer.clearLayers();
  for (let i = -DRAW_RADIUS; i <= DRAW_RADIUS; i++) {
    for (let j = -DRAW_RADIUS; j <= DRAW_RADIUS; j++) {
      const bounds = cellBounds(i, j);
      const token = getTokenAt(i, j);
      const near = isCellNearPlayer(i, j);

      const rect = leaflet.rectangle(bounds, {
        color: near ? "#2ecc71" : "#888",
        weight: 1,
        fillOpacity: 0,
      });
      rect.on("click", () => handleCellClick(i, j));
      rect.addTo(cellsLayer);

      if (token > 0) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const centerLat = (sw.lat + ne.lat) / 2;
        const centerLng = (sw.lng + ne.lng) / 2;
        leaflet
          .marker([centerLat, centerLng], {
            interactive: false,
            icon: leaflet.divIcon({
              className: "token-label",
              html: token.toString(),
              iconSize: [30, 16],
            }),
          })
          .addTo(cellsLayer);
      }
    }
  }
}

updateStatusPanel();
redrawCells();
