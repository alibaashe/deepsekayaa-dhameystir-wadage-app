import { HARGEISA_PLACES, HargeisaPlace } from '../data/hargeisaPlaces';

/**
 * Wadaage Mobility - Hargeisa Spatial Index (Nearest-Landmark Accelerator)
 *
 * WHY THIS EXISTS
 * ---------------
 * HARGEISA_PLACES holds 10,650 landmark records. Historically, "find the nearest
 * landmark" was implemented as a linear scan over the whole array. That was
 * already O(n), but the code then called `calculateDistanceKm()` *inside* the
 * scan loop - and `calculateDistanceKm()` itself scanned the same 10,650 records
 * twice. The result was a nested O(n * 2n) = ~226,000,000 trigonometry
 * operations per lookup, which blocked the main thread for many seconds and made
 * both the rider app and the driver app freeze / stop responding to touch.
 *
 * HOW IT WORKS
 * ------------
 * Landmarks are bucketed into a uniform lat/lng grid (0.01 deg cells, roughly
 * 1.1 km). A nearest-neighbour query then expands ring by ring outwards from the
 * query cell and stops as soon as the current ring cannot physically contain a
 * closer landmark than the best one already found. Typical cost is 9-25 cells
 * instead of 10,650 records, so a lookup drops from seconds to microseconds.
 *
 * The result is EXACTLY the same as the old exhaustive scan:
 * a ring is only abandoned when `minPossibleKm > bestSoFar` (or > maxKm), and
 * the search always runs until the whole indexed bounding box has been covered,
 * so it can never miss a closer landmark.
 *
 * The index is built lazily on first use so app start-up is not penalised, and
 * it is built at most once per page load.
 */

const CELL_DEG = 0.01;

// Conservative kilometres-per-degree used only for the safety bound below.
// The real value is >= 110.6 km/deg for latitude and >= 109 km/deg for longitude
// around Hargeisa (9.5 N). Using a smaller constant can only make the search
// scan MORE cells, never fewer, so the result stays exact.
const KM_PER_DEG_MIN = 109;

export interface NearestPlaceResult {
  place: HargeisaPlace;
  distanceKm: number;
}

type Grid = Map<string, HargeisaPlace[]>;

let grid: Grid | null = null;
let minLat = 0;
let maxLat = 0;
let minLng = 0;
let maxLng = 0;
let minLatCell = 0;
let maxLatCell = 0;
let minLngCell = 0;
let maxLngCell = 0;

/**
 * Hard cap on the ring expansion. 24 cells is ~26 km, comfortably larger than the
 * whole indexed Hargeisa extent, so a genuine in-range query always resolves
 * inside this budget. If the budget is exhausted without proving optimality we
 * fall back to an exhaustive scan, which is still ~20,000x cheaper than the old
 * nested `calculateDistanceKm` scan because it uses a plain local haversine and
 * never re-enters the landmark lookup.
 */
const MAX_RINGS = 24;

function cellKey(latCell: number, lngCell: number): string {
  return `${latCell}:${lngCell}`;
}

function buildIndex(): void {
  if (grid) return;

  const next: Grid = new Map();
  let loLat = Infinity;
  let hiLat = -Infinity;
  let loLng = Infinity;
  let hiLng = -Infinity;

  const places = HARGEISA_PLACES;
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const lat = p && p.lat;
    const lng = p && p.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    if (lat < loLat) loLat = lat;
    if (lat > hiLat) hiLat = lat;
    if (lng < loLng) loLng = lng;
    if (lng > hiLng) hiLng = lng;

    const key = cellKey(Math.floor(lat / CELL_DEG), Math.floor(lng / CELL_DEG));
    const bucket = next.get(key);
    if (bucket) bucket.push(p);
    else next.set(key, [p]);
  }

  minLat = loLat === Infinity ? 0 : loLat;
  maxLat = hiLat === -Infinity ? 0 : hiLat;
  minLng = loLng === Infinity ? 0 : loLng;
  maxLng = hiLng === -Infinity ? 0 : hiLng;
  minLatCell = Math.floor(minLat / CELL_DEG);
  maxLatCell = Math.floor(maxLat / CELL_DEG);
  minLngCell = Math.floor(minLng / CELL_DEG);
  maxLngCell = Math.floor(maxLng / CELL_DEG);
  grid = next;
}

/** Exact great-circle distance in km (local copy to avoid a circular import). */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Exact exhaustive fallback: plain local haversine over every record. */
function exhaustiveNearest(lat: number, lng: number, ceiling: number): NearestPlaceResult | null {
  let best: HargeisaPlace | null = null;
  let bestKm = Infinity;
  for (let i = 0; i < HARGEISA_PLACES.length; i++) {
    const place = HARGEISA_PLACES[i];
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') continue;
    const d = haversineKm(lat, lng, place.lat, place.lng);
    if (d < bestKm) {
      bestKm = d;
      best = place;
    }
  }
  if (!best || bestKm > ceiling) return null;
  return { place: best, distanceKm: Math.round(bestKm * 100) / 100 };
}

/**
 * Nearest landmark lookup.
 *
 * @param lat Query latitude
 * @param lng Query longitude
 * @param maxKm Optional hard ceiling. When supplied, landmarks farther than
 *              `maxKm` are ignored and `null` is returned if none qualify -
 *              identical to filtering the old exhaustive scan by `maxDistKm`.
 */
export function getNearestHargeisaPlace(
  lat: number,
  lng: number,
  maxKm: number = Infinity
): NearestPlaceResult | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  buildIndex();
  if (!grid || grid.size === 0) return null;

  const ceiling = maxKm > 0 ? maxKm : Infinity;
  const queryLatCell = Math.floor(lat / CELL_DEG);
  const queryLngCell = Math.floor(lng / CELL_DEG);

  // The ring expansion's "no closer point can exist out here" bound is only valid
  // when the expansion is centred on the QUERY cell. A GPS fix from outside
  // Hargeisa (a different city, or a wild coordinate) would make the unclamped
  // search walk thousands of empty rings - effectively hanging the app. Such
  // queries therefore take the exact exhaustive fallback, which is still fast
  // (one plain haversine per record, no nested landmark lookups).
  const isInsideIndexedCells =
    queryLatCell >= minLatCell &&
    queryLatCell <= maxLatCell &&
    queryLngCell >= minLngCell &&
    queryLngCell <= maxLngCell;

  if (!isInsideIndexedCells) {
    return exhaustiveNearest(lat, lng, ceiling);
  }

  let best: HargeisaPlace | null = null;
  let bestKm = Infinity;
  let provenOptimal = false;

  for (let ring = 0; ring <= MAX_RINGS; ring++) {
    // Closest a landmark in this ring could possibly be: (ring - 1) cells away.
    const minPossibleKm = ring <= 1 ? 0 : (ring - 1) * CELL_DEG * KM_PER_DEG_MIN;
    if (minPossibleKm > Math.min(bestKm, ceiling)) {
      provenOptimal = true;
      break;
    }

    for (let i = -ring; i <= ring; i++) {
      const isRowEdge = Math.abs(i) === ring;
      for (let j = -ring; j <= ring; j++) {
        // Only walk the perimeter once we are past the centre cell.
        if (ring > 0 && !isRowEdge && Math.abs(j) !== ring) continue;

        const bucket = grid.get(cellKey(queryLatCell + i, queryLngCell + j));
        if (!bucket) continue;

        for (let k = 0; k < bucket.length; k++) {
          const place = bucket[k];
          const d = haversineKm(lat, lng, place.lat, place.lng);
          if (d < bestKm) {
            bestKm = d;
            best = place;
          }
        }
      }
    }
  }

  // The ring budget ran out before optimality could be proven (the query point is
  // inside the cell range but far from any recorded landmark). Fall back to the
  // exhaustive scan so the answer is always exactly the same as the old code.
  if (!provenOptimal) {
    return exhaustiveNearest(lat, lng, ceiling);
  }

  if (!best || bestKm > ceiling) return null;
  return { place: best, distanceKm: Math.round(bestKm * 100) / 100 };
}

/**
 * Convenience wrapper returning only the nearest landmark id, matching the
 * historical `findLandmarkIdNear()` contract.
 */
export function getNearestHargeisaPlaceId(lat: number, lng: number, maxKm: number = 0.65): string | null {
  const nearest = getNearestHargeisaPlace(lat, lng, maxKm);
  return nearest ? nearest.place.id : null;
}

/** Diagnostics helper - used by tests/telemetry, never on a hot path. */
export function getHargeisaSpatialIndexStats(): { cells: number; places: number } {
  buildIndex();
  return { cells: grid ? grid.size : 0, places: HARGEISA_PLACES.length };
}
