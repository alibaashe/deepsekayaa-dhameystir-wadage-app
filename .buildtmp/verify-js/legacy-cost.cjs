/* Measures the cost of the ORIGINAL quadratic paths that froze the app, using the
   real shipped functions to stand in for the inner call the old code made. */
const { HARGEISA_PLACES } = require('./data/hargeisaPlaces.js');
const { calculateDistanceKm, snapToNearestLandmarkAnchor, findNearestHargeisaPlace } = require('./utils/geo.js');
const { estimateHargeisaRoadDistance } = require('./utils/hargeisaRoadRouter.js');

// The OLD snapToNearestLandmarkAnchor body, verbatim apart from the loop bound:
//   for (const place of HARGEISA_PLACES) { const d = calculateDistanceKm(...); }
// 10,650 iterations x calculateDistanceKm is what froze the UI. We time a slice
// and extrapolate so this script does not need to run for a minute.
const SAMPLE = 300;
let t0 = Date.now();
for (let i = 0; i < SAMPLE; i++) {
  const place = HARGEISA_PLACES[i];
  calculateDistanceKm(9.5641, 44.0655, place.lat, place.lng);
}
const perCall = (Date.now() - t0) / SAMPLE;
console.log('legacy loop inner cost       : ' + perCall.toFixed(4) + ' ms per landmark');
console.log('legacy snapToNearestLandmarkAnchor (10,650 landmarks): ' + ((perCall * HARGEISA_PLACES.length) / 1000).toFixed(2) + ' s of blocked main thread');
console.log('legacy findNearestHargeisaPlace  (10,650 landmarks): ' + ((perCall * HARGEISA_PLACES.length) / 1000).toFixed(2) + ' s of blocked main thread');

t0 = Date.now();
snapToNearestLandmarkAnchor(9.5641, 44.0655);
const snapNew = Date.now() - t0;
t0 = Date.now();
findNearestHargeisaPlace(9.5641, 44.0655);
const nearNew = Date.now() - t0;
console.log('now: snapToNearestLandmarkAnchor = ' + snapNew + ' ms, findNearestHargeisaPlace = ' + nearNew + ' ms');

// Road-router inner path: ORIGINAL findLandmarkIdNear did a 10,650-record haversine
// scan, called twice per estimateHargeisaRoadDistance call.
function oldFindLandmarkIdNear(lat, lng, maxDistKm) {
  const R = 6371;
  let closestId = null, minDistance = Infinity;
  for (const p of HARGEISA_PLACES) {
    const dLat = ((p.lat - lat) * Math.PI) / 180;
    const dLon = ((p.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    if (dist < minDistance && dist <= maxDistKm) { minDistance = dist; closestId = p.id; }
  }
  return closestId;
}
const N = 300;
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pairs = [];
for (let i = 0; i < N; i++) {
  pairs.push([9.5016 + rnd() * 0.0967, 44.0227 + rnd() * 0.0965, 9.5016 + rnd() * 0.0967, 44.0227 + rnd() * 0.0965]);
}
t0 = Date.now();
for (const [a, b, c, d] of pairs) { oldFindLandmarkIdNear(a, b, 0.65); oldFindLandmarkIdNear(c, d, 0.65); }
const oldRouterMs = (Date.now() - t0) / N;
console.log('\nlegacy estimateHargeisaRoadDistance landmark lookup: ' + oldRouterMs.toFixed(4) + ' ms/call (2 x 10,650 haversines)');

// New path with unique coordinates so the memo cache cannot hide the cost.
seed = 7;
const pairs2 = [];
for (let i = 0; i < N; i++) {
  pairs2.push([9.5016 + rnd() * 0.0967, 44.0227 + rnd() * 0.0965, 9.5016 + rnd() * 0.0967, 44.0227 + rnd() * 0.0965]);
}
t0 = Date.now();
for (const [a, b, c, d] of pairs2) estimateHargeisaRoadDistance(a, b, c, d);
const newRouterMs = (Date.now() - t0) / N;
console.log('new estimateHargeisaRoadDistance (cache miss)      : ' + newRouterMs.toFixed(4) + ' ms/call');
console.log('speed-up on that path: ' + (oldRouterMs / Math.max(0.0001, newRouterMs)).toFixed(0) + 'x');

// Cache hit cost
t0 = Date.now();
for (let i = 0; i < 20000; i++) estimateHargeisaRoadDistance(9.5600, 44.0650, 9.5755, 44.0722);
console.log('\n20,000 cached estimateHargeisaRoadDistance calls: ' + (Date.now() - t0) + ' ms (per-render fare/ETA path)');
