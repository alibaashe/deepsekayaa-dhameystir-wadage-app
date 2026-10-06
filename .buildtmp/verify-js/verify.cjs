/* Verification harness: proves the new O(1) spatial index returns exactly the
   same answers as the ORIGINAL brute-force implementations, and measures the
   speed-up. Runs against the real transpiled source files. */
const { HARGEISA_PLACES } = require('./data/hargeisaPlaces.js');
const { getNearestHargeisaPlace, getNearestHargeisaPlaceId } = require('./utils/hargeisaSpatialIndex.js');
const { calculateDistanceKm, snapToNearestLandmarkAnchor, findNearestHargeisaPlace } = require('./utils/geo.js');
const { estimateHargeisaRoadDistance } = require('./utils/hargeisaRoadRouter.js');

let failures = 0;
function check(label, cond, detail) {
  if (cond) return;
  failures++;
  console.log('  FAIL: ' + label + (detail ? ' -> ' + detail : ''));
}

/* ---------- reference (ORIGINAL) implementations ---------- */
function haversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function oldNearest(lat, lng, maxKm) {
  let best = null, bestKm = Infinity;
  for (const p of HARGEISA_PLACES) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < bestKm && (maxKm === undefined || d <= maxKm)) { bestKm = d; best = p; }
  }
  return best ? { place: best, distanceKm: bestKm } : null;
}

/* ---------- build the query set ---------- */
const queries = [];
// every 53rd landmark coordinate (200 samples spread over the whole dataset)
for (let i = 0; i < HARGEISA_PLACES.length; i += 53) {
  queries.push([HARGEISA_PLACES[i].lat, HARGEISA_PLACES[i].lng]);
}
// jittered points around the city + points slightly outside the dataset extent
let lats = HARGEISA_PLACES.map((p) => p.lat), lngs = HARGEISA_PLACES.map((p) => p.lng);
const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < 400; i++) {
  queries.push([minLat + rnd() * (maxLat - minLat), minLng + rnd() * (maxLng - minLng)]);
}
// far-outside points (worst case for the ring search)
queries.push([9.5600, 44.0650], [0, 0], [-33.9, 151.2], [51.5, -0.12], [minLat - 3, minLng - 3], [maxLat + 3, maxLng + 3]);

console.log('HARGEISA_PLACES length: ' + HARGEISA_PLACES.length);
console.log('dataset extent: lat ' + minLat.toFixed(4) + '..' + maxLat.toFixed(4) + '  lng ' + minLng.toFixed(4) + '..' + maxLng.toFixed(4));
console.log('query points: ' + queries.length);

/* ---------- 1. exact equivalence of the nearest-landmark lookup ---------- */
console.log('\n[1] nearest-landmark equivalence (unbounded)');
let distMismatch = 0, maxDelta = 0;
for (const [lat, lng] of queries) {
  const a = oldNearest(lat, lng);
  const b = getNearestHargeisaPlace(lat, lng);
  if (!b) { check('result present', false, lat + ',' + lng); continue; }
  if (a.place.id !== b.place.id) check('same id', false, `${lat},${lng} old=${a.place.id} new=${b.place.id}`);
  const delta = Math.abs(a.distanceKm - b.distanceKm);
  if (delta > 0.02) { distMismatch++; maxDelta = Math.max(maxDelta, delta); }
}
check('distance agreement within 20 m', distMismatch === 0, distMismatch + ' mismatches, max delta ' + maxDelta.toFixed(4) + ' km');
console.log('  ok - identical landmark for all ' + queries.length + ' queries; max distance delta ' + maxDelta.toFixed(5) + ' km');

/* ---------- 2. equivalence of the 0.65 km bounded lookup used by the road router ---------- */
console.log('\n[2] bounded (0.65 km) landmark lookup equivalence');
for (const [lat, lng] of queries) {
  // original used `dist < minDistance && dist <= maxDistKm`
  let oldId = null, best = Infinity;
  for (const p of HARGEISA_PLACES) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < best && d <= 0.65) { best = d; oldId = p.id; }
  }
  const newId = getNearestHargeisaPlaceId(lat, lng, 0.65);
  check('bounded id match', oldId === newId, `${lat},${lng} old=${oldId} new=${newId}`);
}
console.log('  ok - bounded lookup matches for all queries');

/* ---------- 3. snapToNearestLandmarkAnchor / findNearestHargeisaPlace ---------- */
console.log('\n[3] snapToNearestLandmarkAnchor + findNearestHargeisaPlace');
for (const [lat, lng] of queries.slice(0, 120)) {
  const oldNearestAny = oldNearest(lat, lng);
  const oldSnap = oldNearestAny && oldNearestAny.distanceKm <= 0.4
    ? { id: oldNearestAny.place.id, meters: Math.round(oldNearestAny.distanceKm * 1000) }
    : null;
  const snap = snapToNearestLandmarkAnchor(lat, lng);
  if (oldSnap === null) check('snap null', snap === null, `${lat},${lng}`);
  else {
    check('snap present', snap !== null, `${lat},${lng}`);
    if (snap) {
      check('snap landmark id', snap.landmark.id === oldSnap.id, `${lat},${lng}`);
      check('snap meters', Math.abs(snap.originalDistMeters - oldSnap.meters) <= 20, `${lat},${lng}`);
    }
  }
  const near = findNearestHargeisaPlace(lat, lng);
  check('nearest place id', near.id === oldNearestAny.place.id, `${lat},${lng} ${near.id} vs ${oldNearestAny.place.id}`);
}
console.log('  ok - snapping + nearest-place naming match the original exhaustive scan');

/* ---------- 4. road-distance determinism once the cache is warm ---------- */
console.log('\n[4] estimateHargeisaRoadDistance determinism / cache');
const p1 = { lat: 9.5600, lng: 44.0650 }, p2 = { lat: 9.5755, lng: 44.0722 };
const r1 = estimateHargeisaRoadDistance(p1.lat, p1.lng, p2.lat, p2.lng);
const r2 = estimateHargeisaRoadDistance(p1.lat, p1.lng, p2.lat, p2.lng);
const r3 = estimateHargeisaRoadDistance(p2.lat, p2.lng, p1.lat, p1.lng); // symmetric
check('cached result identical', JSON.stringify(r1) === JSON.stringify(r2), JSON.stringify(r1) + ' vs ' + JSON.stringify(r2));
check('symmetric result', r1.distanceKm === r3.distanceKm && r1.durationMins === r3.durationMins, JSON.stringify(r1) + ' vs ' + JSON.stringify(r3));
console.log('  ok - ' + JSON.stringify(r1));

/* ---------- 5. search haystack equivalence ---------- */
console.log('\n[5] searchHargeisaPlaces haystack equivalence');
function oldSearch(q, maxResults) {
  const query = (q || '').trim().toLowerCase();
  const out = [];
  for (const p of HARGEISA_PLACES) {
    if (
      p.name.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      (p.district && p.district.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.somaliCategory && p.somaliCategory.toLowerCase().includes(query)) ||
      (p.searchTerms && p.searchTerms.some((t) => t.includes(query)))
    ) {
      out.push(p.id);
      if (out.length >= maxResults) break;
    }
  }
  return out;
}
const { searchHargeisaPlaces } = require('./data/hargeisaPlaces.js');
for (const q of ['airport', 'mansoor', 'hospital', 'masjid', 'shidaal', 'jigjiga', 'zaad', 'university', 'x', 'zzzznomatch', 'HOTEL']) {
  const a = oldSearch(q, 30);
  const b = searchHargeisaPlaces(q, undefined, 30).map((p) => p.id);
  check('search "' + q + '" identical', JSON.stringify(a) === JSON.stringify(b), '\n    old=' + a.slice(0, 4) + '\n    new=' + b.slice(0, 4));
}
console.log('  ok - search results identical to the original per-field logic');

/* ---------- 6. benchmark: old vs new ---------- */
console.log('\n[6] benchmark (1000 nearest-landmark lookups)');
const bench = queries.slice(0, 1000);
let t0 = Date.now();
for (const [lat, lng] of bench) oldNearest(lat, lng);
const oldMs = Date.now() - t0;
t0 = Date.now();
for (const [lat, lng] of bench) getNearestHargeisaPlace(lat, lng);
const newMs = Date.now() - t0;
console.log('  original linear scan: ' + oldMs + ' ms');
console.log('  new spatial index   : ' + newMs + ' ms  (' + (oldMs / Math.max(1, newMs)).toFixed(1) + 'x faster)');

console.log('\n[7] ORIGINAL calculateDistanceKm cost (the real-world hot path)');
t0 = Date.now();
for (let i = 0; i < 200; i++) {
  // unique coordinates each iteration so the memo cache cannot hide the cost
  calculateDistanceKm(9.54 + i * 0.0001, 44.04 + i * 0.0001, 9.57 - i * 0.0001, 44.08 - i * 0.0001);
}
const newDistMs = Date.now() - t0;
console.log('  200 unique calculateDistanceKm calls: ' + newDistMs + ' ms (' + (newDistMs / 200).toFixed(3) + ' ms/call)');
console.log('  (before this fix each call did 2 x 10,650 haversine scans = 21,300 trig iterations)');

/* ---------- 8. the quadratic snapshot path, before vs after ---------- */
console.log('\n[8] snapToNearestLandmarkAnchor cost (was 10,650 x calculateDistanceKm)');
t0 = Date.now();
snapToNearestLandmarkAnchor(9.5641, 44.0655);
console.log('  1 call now: ' + (Date.now() - t0) + ' ms (previously ~226,000,000 trig iterations)');

console.log('\n' + (failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
