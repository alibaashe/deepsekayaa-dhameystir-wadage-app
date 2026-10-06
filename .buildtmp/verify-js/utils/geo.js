"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimalSequence = exports.EXCHANGE_RATE_USD_TO_SLSH = exports.BEACON_COLORS = exports.computeRoadBasedFare = exports.fetchRealHargeisaRoadRoute = exports.estimateHargeisaRoadDistance = void 0;
exports.getRandomBeaconColor = getRandomBeaconColor;
exports.calculateVectorOverlap = calculateVectorOverlap;
exports.snapToNearestLandmarkAnchor = snapToNearestLandmarkAnchor;
exports.calculateHaversineDistanceKm = calculateHaversineDistanceKm;
exports.calculateDistanceKm = calculateDistanceKm;
exports.calculateDurationMins = calculateDurationMins;
exports.computeFare = computeFare;
exports.generateRoutePoints = generateRoutePoints;
exports.isLocationSharingAllowed = isLocationSharingAllowed;
exports.isWadaageShareRouteAligned = isWadaageShareRouteAligned;
exports.calculateBearing = calculateBearing;
exports.calculateHeadingDelta = calculateHeadingDelta;
exports.validateWadaageMatch = validateWadaageMatch;
exports.evaluateWadaageShareMatch = evaluateWadaageShareMatch;
exports.calculateRoutePermutations = calculateRoutePermutations;
exports.formatCurrency = formatCurrency;
exports.formatSosOnly = formatSosOnly;
exports.formatUsdOnly = formatUsdOnly;
exports.formatPriceDual = formatPriceDual;
exports.getClosestHargeisaPopularRoad = getClosestHargeisaPopularRoad;
exports.findNearestHargeisaPlace = findNearestHargeisaPlace;
const hargeisaSpatialIndex_1 = require("./hargeisaSpatialIndex");
const hargeisaRoadRouter_1 = require("./hargeisaRoadRouter");
Object.defineProperty(exports, "estimateHargeisaRoadDistance", { enumerable: true, get: function () { return hargeisaRoadRouter_1.estimateHargeisaRoadDistance; } });
Object.defineProperty(exports, "fetchRealHargeisaRoadRoute", { enumerable: true, get: function () { return hargeisaRoadRouter_1.fetchRealHargeisaRoadRoute; } });
Object.defineProperty(exports, "computeRoadBasedFare", { enumerable: true, get: function () { return hargeisaRoadRouter_1.computeRoadBasedFare; } });
// High-Contrast Screen Beacon Color Palette for Last 50 Meters Identification
exports.BEACON_COLORS = [
    {
        id: 'cyan',
        name: 'Neon Cyan',
        somaliName: 'Buluug Dhalaalaya',
        hex: '#06B6D4',
        textHex: '#0891B2',
        bgClass: 'bg-cyan-500',
        badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        accentClass: 'text-cyan-400',
    },
    {
        id: 'purple',
        name: 'Electric Purple',
        somaliName: 'Fiyoleet Dhalaalaya',
        hex: '#8B5CF6',
        textHex: '#7C3AED',
        bgClass: 'bg-purple-500',
        badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        accentClass: 'text-purple-400',
    },
    {
        id: 'emerald',
        name: 'Emerald Green',
        somaliName: 'Cagaar Dhalaalaya',
        hex: '#10B981',
        textHex: '#059669',
        bgClass: 'bg-emerald-500',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        accentClass: 'text-emerald-400',
    },
    {
        id: 'amber',
        name: 'Bright Amber',
        somaliName: 'Huruud Dhalaalaya',
        hex: '#F59E0B',
        textHex: '#D97706',
        bgClass: 'bg-amber-500',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        accentClass: 'text-amber-400',
    },
    {
        id: 'pink',
        name: 'Vivid Pink',
        somaliName: 'Basali Dhalaalaya',
        hex: '#EC4899',
        textHex: '#DB2777',
        bgClass: 'bg-pink-500',
        badgeClass: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
        accentClass: 'text-pink-400',
    },
];
function getRandomBeaconColor(seed) {
    if (seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash |= 0;
        }
        const idx = Math.abs(hash) % exports.BEACON_COLORS.length;
        return exports.BEACON_COLORS[idx];
    }
    const randomIdx = Math.floor(Math.random() * exports.BEACON_COLORS.length);
    return exports.BEACON_COLORS[randomIdx];
}
// Directional Vector Overlap & Alignment Filter
// Prevents matching drivers heading in opposite directions or requiring illegal U-turns
function calculateVectorOverlap(driverHeading, requestHeading) {
    let diff = Math.abs(driverHeading - requestHeading);
    if (diff > 180)
        diff = 360 - diff;
    // Max allowable divergence is 45 degrees
    const isCompatible = diff <= 45;
    // Score: 1.0 (perfect alignment) down to 0.0 (> 45 degrees)
    const score = Math.max(0, Math.round((1 - diff / 45) * 100) / 100);
    return {
        diffDegrees: Math.round(diff),
        isCompatible,
        score,
    };
}
// Smart Landmark Anchoring
// Snaps raw GPS pin to designated paved gates / official stops around Hargeisa
//
// PERFORMANCE-CRITICAL: the previous implementation looped over all 10,650
// landmarks and called `calculateDistanceKm()` for each one - and that call
// itself re-scanned the same 10,650 landmarks twice. One invocation therefore
// cost roughly 226 million trigonometry operations and froze the UI for seconds
// (this ran on every GPS fix and every ride booking). It now uses the O(1)
// spatial grid index, which returns the identical landmark.
function snapToNearestLandmarkAnchor(lat, lng, maxRadiusKm = 0.4) {
    const nearest = (0, hargeisaSpatialIndex_1.getNearestHargeisaPlace)(lat, lng, maxRadiusKm);
    if (!nearest)
        return null;
    const closest = nearest.place;
    return {
        snapped: true,
        landmark: {
            id: closest.id,
            name: `${closest.name} (Main Gate / Safe Stop)`,
            address: closest.address,
            lat: closest.lat,
            lng: closest.lng,
            category: closest.category,
        },
        originalDistMeters: Math.round(nearest.distanceKm * 1000),
    };
}
// Standard Haversine Great-Circle formula for direct spherical distance between two GPS coordinates
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2)
        return 0;
    const R = 6371; // Earth's mean radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.round(dist * 100) / 100;
}
// Real-world Hargeisa urban road network distance (topologically calculated)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const result = (0, hargeisaRoadRouter_1.estimateHargeisaRoadDistance)(lat1, lon1, lat2, lon2);
    return result.distanceKm;
}
// Estimate driving duration in minutes based on Hargeisa road conditions & traffic factor
function calculateDurationMins(distanceKm) {
    const mins = Math.max(4, Math.round((distanceKm / 28) * 60) + 2);
    return mins;
}
// Compute fare for a given vehicle category, distance, duration, surge, and pricing settings
function computeFare(category, distanceKm, durationMins, pricing, seatsBooked = 1, poolingType = 'door_to_door', waitAndSaveTier = 'express') {
    // Find category specific configuration if available
    const catKeyMap = {
        wadaage_share: 'wadaage_share',
        wadaage_car: 'wadaage_car',
        wadaage_taxi: 'wadaage_taxi',
        wadaage_stay: 'wadaage_stay',
    };
    const matchedKey = catKeyMap[category] || category;
    const categoryConfig = pricing.categoryConfigs?.[matchedKey];
    let baseFare = categoryConfig ? categoryConfig.baseFareUsd : pricing.baseFareEconomy;
    if (!categoryConfig) {
        if (category === 'wadaage_taxi' || category === 'wadaage_car')
            baseFare = pricing.baseFareTaxi || 1.20;
        if (category === 'wadaage_share')
            baseFare = pricing.baseFareShared || 0.90;
        if (category === 'wadaage_stay')
            baseFare = 15.00;
    }
    const catSurgeOverride = categoryConfig ? categoryConfig.categorySurgeMultiplier : 1.0;
    const effectiveSurge = Math.round(pricing.currentSurgeMultiplier *
        catSurgeOverride *
        (pricing.weatherSurgeMultiplier || 1.0) *
        (pricing.eventSurgeMultiplier || 1.0) * 100) / 100;
    const perKm = categoryConfig ? categoryConfig.perKmRateUsd : pricing.perKmRate;
    const perMin = categoryConfig ? categoryConfig.perMinuteRateUsd : pricing.perMinuteRate;
    // First start up / first km included in baseFare; each km after 1st km is charged at perKm
    const chargeableKm = Math.max(0, distanceKm - 1);
    const distanceFare = chargeableKm * perKm;
    const timeFare = durationMins * perMin;
    let subtotal = (baseFare + distanceFare + timeFare) * effectiveSurge;
    const isShared = category === 'wadaage_share';
    // Seat booking multiplier for shared ride (1 seat = 1x, 2 seats = 1.6x, 3 seats = 2.1x)
    if (isShared) {
        if (seatsBooked === 2)
            subtotal *= 1.6;
        if (seatsBooked >= 3)
            subtotal *= 2.1;
    }
    let sharedDiscountAmount = 0;
    if (isShared) {
        let discountPercent = pricing.sharedDiscountPercent;
        if (poolingType === 'express_pool') {
            discountPercent += pricing.expressPoolDiscountPercent || 15;
        }
        if (waitAndSaveTier === 'wait_and_save') {
            discountPercent += 20; // Extra 20% saver discount for flexible batching
        }
        sharedDiscountAmount = subtotal * (discountPercent / 100);
    }
    const defaultMin = category === 'wadaage_share' ? 0.90 : category === 'wadaage_taxi' || category === 'wadaage_car' ? 1.20 : 0.50;
    const minFare = categoryConfig ? (waitAndSaveTier === 'wait_and_save' ? Math.max(0.60, categoryConfig.minFareUsd * 0.75) : categoryConfig.minFareUsd) : defaultMin;
    const finalFare = Math.max(minFare, Math.round((subtotal - sharedDiscountAmount) * 100) / 100);
    return {
        baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        surgeMultiplier: effectiveSurge,
        sharedDiscountAmount: Math.round(sharedDiscountAmount * 100) / 100,
        finalFare,
    };
}
// Generate realistic intermediate route coordinates between two points for polyline and animation
function generateRoutePoints(start, end, stepsCount = 20) {
    const points = [];
    // Create a slight curve/jitter to mimic road street navigation rather than straight line
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    const offsetLat = (end.lng - start.lng) * 0.15;
    const offsetLng = (start.lat - end.lat) * 0.15;
    const ctrlPoint = {
        lat: midLat + offsetLat,
        lng: midLng + offsetLng,
    };
    for (let i = 0; i <= stepsCount; i++) {
        const t = i / stepsCount;
        // Quadratic Bezier interpolation
        const lat = (1 - t) * (1 - t) * start.lat +
            2 * (1 - t) * t * ctrlPoint.lat +
            t * t * end.lat;
        const lng = (1 - t) * (1 - t) * start.lng +
            2 * (1 - t) * t * ctrlPoint.lng +
            t * t * end.lng;
        points.push([lat, lng]);
    }
    return points;
}
// Check if location sharing is allowed for Wadaage Share (requires driver on the way or driver within 0.5 km)
function isLocationSharingAllowed(category, driverDistanceKm = 2.0, rideStatus) {
    const isShared = category === 'wadaage_share';
    // Non-shared rides always allow location sharing if a ride is active
    if (!isShared) {
        return {
            allowed: true,
            reason: 'Location sharing is active for private rides.',
        };
    }
    // Active statuses where driver is "on the way"
    const onTheWayStatuses = ['accepted', 'driver_arrived', 'in_progress', 'on_the_way'];
    const isOnTheWay = rideStatus ? onTheWayStatuses.includes(rideStatus) : false;
    const isWithinHalfKm = driverDistanceKm <= 0.5;
    if (isOnTheWay || isWithinHalfKm) {
        return {
            allowed: true,
            reason: isOnTheWay
                ? 'Driver is on the way to your route.'
                : `Driver is within ${driverDistanceKm.toFixed(1)} km (half km rule met).`,
        };
    }
    return {
        allowed: false,
        reason: `Location sharing for Wadaage Share requires driver to be on the way or within 0.5 km (500m). Current distance: ${driverDistanceKm.toFixed(1)} km.`,
    };
}
// Validate that co-passengers in Wadaage Share are within 1.0 km max destination radius
function isWadaageShareRouteAligned(dest1, dest2, maxKm = 1.0) {
    const dist = calculateDistanceKm(dest1.lat, dest1.lng, dest2.lat, dest2.lng);
    return {
        aligned: dist <= maxKm,
        distanceKm: dist,
    };
}
// Calculate bearing angle (heading in degrees 0-360) between two coordinates
function calculateBearing(start, end) {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;
    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
}
// Calculate heading delta difference between two passenger routes (returns degrees difference & boolean if <35°)
function calculateHeadingDelta(routeA, routeB) {
    const headingA = calculateBearing(routeA.start, routeA.end);
    const headingB = calculateBearing(routeB.start, routeB.end);
    let diff = Math.abs(headingA - headingB);
    if (diff > 180)
        diff = 360 - diff;
    return {
        headingA: Math.round(headingA),
        headingB: Math.round(headingB),
        deltaDegrees: Math.round(diff),
        isMatchingDirection: diff <= 35, // Must be <= 35° direction match rule (Strict Corridor Co-directionality)
    };
}
function validateWadaageMatch(currentTrip, newRequest, driverLocation, options) {
    const maxPickupRadiusKm = options?.maxPickupRadiusKm ?? 1.5; // Condition A: <= 1.5km from driver GPS
    const maxDestinationRadiusKm = options?.maxDestinationRadiusKm ?? 2.0; // Condition B: <= 2.0km from 1st rider destination
    const maxHeadingDivergenceDegrees = options?.maxHeadingDivergenceDegrees ?? 45; // Same general direction
    const reasons = [];
    const failures = [];
    // Service Rules: Standard Taxi is locked/exclusive; Wadaage Share is multi-passenger
    const isTripAShare = currentTrip.category === 'wadaage_share' || currentTrip.isShared === true || currentTrip.service_type === 'Wadaage';
    const isTripBShare = newRequest.category === 'wadaage_share' || newRequest.isShared === true || newRequest.service_type === 'Wadaage';
    const isCategoryValid = isTripAShare && isTripBShare;
    if (!isCategoryValid) {
        failures.push('Standard Taxi is a private 1-person ride (Locked) and cannot accept co-riders.');
    }
    else {
        reasons.push('Wadaage Share multi-passenger service verified.');
    }
    // Condition A: Pickup Location <= 1.5km radius of Driver's current real-time GPS location while driving
    const driverPos = driverLocation || { lat: currentTrip.pickup.lat, lng: currentTrip.pickup.lng };
    const pickupDistanceKm = Math.round(calculateDistanceKm(driverPos.lat, driverPos.lng, newRequest.pickup.lat, newRequest.pickup.lng) * 10) / 10;
    const isPickupValid = pickupDistanceKm <= maxPickupRadiusKm;
    if (isPickupValid) {
        reasons.push(`Pickup is within ${pickupDistanceKm} km (<= ${maxPickupRadiusKm} km driver GPS radius).`);
    }
    else {
        failures.push(`Pickup is ${pickupDistanceKm} km away (exceeds ${maxPickupRadiusKm} km driver GPS radius limit).`);
    }
    // Destination resolution (supports both .destination and .dropoff properties)
    const destA = currentTrip.destination || currentTrip.dropoff || currentTrip.pickup;
    const destB = newRequest.destination || newRequest.dropoff || newRequest.pickup;
    // Condition B: Destination <= 2.0km radius of the first rider's destination
    const destinationDistanceKm = Math.round(calculateDistanceKm(destA.lat, destA.lng, destB.lat, destB.lng) * 10) / 10;
    const isDestinationValid = destinationDistanceKm <= maxDestinationRadiusKm;
    if (isDestinationValid) {
        reasons.push(`Destination is within ${destinationDistanceKm} km (<= ${maxDestinationRadiusKm} km destination radius).`);
    }
    else {
        failures.push(`Destination is ${destinationDistanceKm} km away (exceeds ${maxDestinationRadiusKm} km destination radius limit).`);
    }
    // Direction (Bearing): Verify new rider is traveling in same general direction
    const headingA = driverLocation
        ? Math.round(calculateBearing(driverLocation, destA))
        : Math.round(calculateBearing(currentTrip.pickup, destA));
    const headingB = Math.round(calculateBearing(newRequest.pickup, destB));
    let headingDiff = Math.abs(headingA - headingB);
    if (headingDiff > 180)
        headingDiff = 360 - headingDiff;
    const headingDivergenceDegrees = Math.round(headingDiff);
    const isDirectionValid = headingDivergenceDegrees <= maxHeadingDivergenceDegrees;
    if (isDirectionValid) {
        reasons.push(`Same general direction (Bearing divergence: ${headingDivergenceDegrees}° <= ${maxHeadingDivergenceDegrees}° limit).`);
    }
    else {
        failures.push(`Different direction: heading divergence is ${headingDivergenceDegrees}° (exceeds ${maxHeadingDivergenceDegrees}° limit).`);
    }
    const isValid = isCategoryValid && isPickupValid && isDestinationValid && isDirectionValid;
    const notificationMessage = isValid
        ? `New Rider nearby going your way (${pickupDistanceKm}km away, similar destination).`
        : failures.join(' ');
    return {
        isValid,
        pickupDistanceKm,
        destinationDistanceKm,
        headingDivergenceDegrees,
        isPickupValid,
        isDestinationValid,
        isDirectionValid,
        isCategoryValid,
        reasons,
        failures,
        notificationMessage,
    };
}
/**
 * STRICT WADAAGE SHARE MATCHING ENGINE
 * Evaluates Essential Criteria for Shared Taxi Carpooling:
 * 1. Category check: Wadaage Share ONLY (Standard/Normal taxi orders are private 1-person rides and NEVER mixed or matched)
 * 2. Pickup check:
 *    - Initial stationary search / same-place pickup: <= 1.0 km radius (between Rider A pickup and Rider B pickup)
 *    - En-route / While driving search: <= 1.5 km radius from Driver's real-time driving location (driverLoc)
 * 3. Direction vector check: Same direction / corridor travel vector (bearing divergence <= 45°)
 * 4. Destination proximity check: Close destination (<= 2.0 km radius between dropoffs)
 * 5. Detour SLA: Small additional detour (<= 10 mins detour time)
 */
function evaluateWadaageShareMatch(rideA, rideB, driverLoc, options) {
    const isEnRoute = options?.isDriverEnRouteWithOneRider ?? (rideA.status === 'in_progress' || rideA.status === 'driver_arrived' || rideA.status === 'accepted');
    const maxInitialPickupRadiusKm = options?.maxPickupRadiusKm ?? 1.0; // Standard 1.0 km pickup radius for same-place matching
    const maxEnRouteRadiusKm = options?.maxEnRoutePickupRadiusKm ?? 1.5; // En-route 1.5 km radius from driver's real driving location
    const maxHeadingDivergenceDegrees = options?.maxHeadingDivergenceDegrees ?? 45; // Direction bearing divergence limit
    const maxDestinationRadiusKm = options?.maxDestinationRadiusKm ?? 2.0; // Destination radius limit
    const maxDetourMins = options?.maxDetourMins ?? 10;
    const reasons = [];
    const failures = [];
    // 0. Same-Rider Prevention & Category Validation:
    // Must NOT be the exact same physical rider/passenger ID or phone number
    const passengerAId = rideA.passengerId || rideA.passenger_id;
    const passengerBId = rideB.passengerId || rideB.passenger_id;
    const passengerAPhone = rideA.passengerPhone || rideA.passenger_phone;
    const passengerBPhone = rideB.passengerPhone || rideB.passenger_phone;
    const isSameRider = (passengerAId && passengerBId && passengerAId === passengerBId) ||
        (passengerAPhone && passengerBPhone && passengerAPhone.replace(/\D/g, '') === passengerBPhone.replace(/\D/g, ''));
    if (isSameRider) {
        failures.push('Same Rider Duplicate: The same physical passenger cannot occupy both Rider 1 and Rider 2 seats.');
    }
    const isRideAShare = rideA.category === 'wadaage_share' || rideA.isShared === true || rideA.service_type === 'Wadaage';
    const isRideBShare = rideB.category === 'wadaage_share' || rideB.isShared === true || rideB.service_type === 'Wadaage';
    const isCategoryValid = isRideAShare && isRideBShare;
    if (!isCategoryValid) {
        failures.push(`Category mismatch: Standard Taxi is a private 1-person ride and strictly cannot be matched or stacked with Wadaage Share.`);
    }
    else {
        reasons.push('Wadaage Share carpooling mode verified for both passengers.');
    }
    // 1. Pickup Check:
    // While driving (en-route with Rider A): Search between driver's REAL driving GPS location and 1.5 km radius.
    // Initial / stationary search (before or at pickup): Search within 1.0 km radius of Rider A's pickup.
    const originAnchor = (isEnRoute && driverLoc) ? driverLoc : (driverLoc || rideA.pickup);
    const pickupDistanceKm = Math.round(calculateDistanceKm(originAnchor.lat, originAnchor.lng, rideB.pickup.lat, rideB.pickup.lng) * 10) / 10;
    const allowedRadius = isEnRoute ? maxEnRouteRadiusKm : maxInitialPickupRadiusKm;
    const isPickupClose = pickupDistanceKm <= allowedRadius;
    const isEnRouteMatch = isEnRoute && isPickupClose;
    if (isPickupClose) {
        if (isEnRoute && driverLoc) {
            reasons.push(`On-the-way pickup matched within ${pickupDistanceKm} km (<= ${maxEnRouteRadiusKm} km radius from driver's real driving location)`);
        }
        else {
            reasons.push(`Initial pickup is within same place (${pickupDistanceKm} km <= ${maxInitialPickupRadiusKm} km radius)`);
        }
    }
    else {
        failures.push(isEnRoute
            ? `Pickup is off-route (${pickupDistanceKm} km > ${maxEnRouteRadiusKm} km radius from driver's real driving location)`
            : `Initial pickup is too far (${pickupDistanceKm} km > ${maxInitialPickupRadiusKm} km radius limit)`);
    }
    // 2. Travel Direction Vector Check (Heading Delta <= 45°)
    const headingA = (isEnRoute && driverLoc)
        ? Math.round(calculateBearing(driverLoc, rideA.dropoff))
        : Math.round(calculateBearing(rideA.pickup, rideA.dropoff));
    const headingB = Math.round(calculateBearing(rideB.pickup, rideB.dropoff));
    let headingDiff = Math.abs(headingA - headingB);
    if (headingDiff > 180)
        headingDiff = 360 - headingDiff;
    const headingDivergenceDegrees = Math.round(headingDiff);
    const isSameDirection = headingDivergenceDegrees <= maxHeadingDivergenceDegrees;
    if (isSameDirection) {
        reasons.push(`Same travel direction (Bearing divergence: ${headingDivergenceDegrees}° <= ${maxHeadingDivergenceDegrees}° limit)`);
    }
    else {
        failures.push(`Different travel direction! Driver is heading ${headingA}°, Rider B is heading ${headingB}°. Divergence is ${headingDivergenceDegrees}° (exceeds ${maxHeadingDivergenceDegrees}° limit)`);
    }
    // 3. Destination Proximity Check (Must be <= 2.0 km radius)
    const destinationDistanceKm = Math.round(calculateDistanceKm(rideA.dropoff.lat, rideA.dropoff.lng, rideB.dropoff.lng !== undefined ? rideB.dropoff.lat : rideA.dropoff.lat, rideB.dropoff.lng !== undefined ? rideB.dropoff.lng : rideA.dropoff.lng) * 10) / 10;
    const isDestinationClose = destinationDistanceKm <= maxDestinationRadiusKm;
    if (isDestinationClose) {
        reasons.push(`Final destination is within shared corridor (${destinationDistanceKm} km <= ${maxDestinationRadiusKm} km radius)`);
    }
    else {
        failures.push(`Final destination is NOT close! Dropoffs are ${destinationDistanceKm} km apart (exceeds strict ${maxDestinationRadiusKm} km radius limit)`);
    }
    // 4. Detour SLA Check (<= 10 mins)
    const directDistA = calculateDistanceKm(isEnRoute && driverLoc ? driverLoc.lat : rideA.pickup.lat, isEnRoute && driverLoc ? driverLoc.lng : rideA.pickup.lng, rideA.dropoff.lat, rideA.dropoff.lng);
    const directTimeA = Math.max(1, rideA.durationMins || calculateDurationMins(directDistA));
    // Calculate shared route: Pick A/Driver -> Pick B -> Drop B / Drop A
    const distWithShared = calculateDistanceKm(originAnchor.lat, originAnchor.lng, rideB.pickup.lat, rideB.pickup.lng) +
        calculateDistanceKm(rideB.pickup.lat, rideB.pickup.lng, rideB.dropoff.lat, rideB.dropoff.lng) +
        calculateDistanceKm(rideB.dropoff.lat, rideB.dropoff.lng, rideA.dropoff.lat, rideA.dropoff.lng);
    const timeWithShared = calculateDurationMins(distWithShared);
    const detourTimeMins = Math.max(0, timeWithShared - directTimeA);
    const detourDistanceKm = Math.max(0, Math.round((distWithShared - directDistA) * 10) / 10);
    const isSmallDetour = detourTimeMins <= maxDetourMins;
    if (isSmallDetour) {
        reasons.push(`Minimal detour (+${detourTimeMins} mins / +${detourDistanceKm} km <= ${maxDetourMins} mins SLA)`);
    }
    else {
        failures.push(`Detour is too large (+${detourTimeMins} mins exceeds ${maxDetourMins} mins SLA limit)`);
    }
    const isMatch = isCategoryValid && isPickupClose && isSameDirection && isDestinationClose && isSmallDetour;
    // Calculate matching quality score 0-100%
    let score = 0;
    if (isCategoryValid) {
        if (isPickupClose)
            score += 25 * Math.max(0, 1 - pickupDistanceKm / allowedRadius);
        if (isSameDirection)
            score += 35 * Math.max(0, 1 - headingDivergenceDegrees / maxHeadingDivergenceDegrees);
        if (isDestinationClose)
            score += 25 * Math.max(0, 1 - destinationDistanceKm / maxDestinationRadiusKm);
        if (isSmallDetour)
            score += 15 * Math.max(0, 1 - detourTimeMins / maxDetourMins);
    }
    score = Math.min(100, Math.round(score));
    // Determine optimal waypoints sequence
    const driverPos = driverLoc || { lat: rideA.pickup.lat, lng: rideA.pickup.lng };
    const initialWaypoints = [
        {
            id: `wp_pick_${rideA.id || 'A'}`,
            type: 'PICKUP',
            passengerId: rideA.id || 'A',
            passengerName: rideA.passengerName || 'Rider A',
            location: rideA.pickup,
            status: 'completed',
            etaMins: 0,
        },
        {
            id: `wp_drop_${rideA.id || 'A'}`,
            type: 'DROPOFF',
            passengerId: rideA.id || 'A',
            passengerName: rideA.passengerName || 'Rider A',
            location: rideA.dropoff,
            status: 'pending',
            etaMins: directTimeA,
        },
    ];
    const { optimalWaypoints, sequenceLabel } = (0, exports.getOptimalSequence)(driverPos, initialWaypoints, {
        id: rideB.id || 'B',
        name: rideB.passengerName || 'Rider B',
        pickup: rideB.pickup,
        dropoff: rideB.dropoff,
    }, maxDetourMins);
    return {
        isMatch,
        score,
        reasons,
        failures,
        isCategoryValid,
        pickupDistanceKm,
        isPickupClose,
        isEnRouteMatch,
        headingA,
        headingB,
        headingDivergenceDegrees,
        isSameDirection,
        destinationDistanceKm,
        isDestinationClose,
        detourTimeMins,
        detourDistanceKm,
        isSmallDetour,
        optimalSequence: optimalWaypoints,
        sequenceLabel,
    };
}
// Permutation Routing Engine (Calculates 3 valid routing sequences & picks optimal minimal detour)
function calculateRoutePermutations(pickA, pickB, dropA, dropB, avgSpeedKmH = 30, maxDetourMins = 12) {
    const dist = (p1, p2) => calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
    const time = (dKm) => Math.round((dKm / avgSpeedKmH) * 60 + 2); // 2 mins stop overhead
    // Baseline Direct Trip A
    const directDistA = dist(pickA, dropA);
    const directTimeA = time(directDistA);
    // Permutation 1: Pick A -> Pick B -> Drop A -> Drop B
    const d1 = dist(pickA, pickB) + dist(pickB, dropA) + dist(dropA, dropB);
    const t1 = time(dist(pickA, pickB)) + time(dist(pickB, dropA)) + time(dist(dropA, dropB));
    const detour1 = Math.max(0, t1 - directTimeA);
    // Permutation 2: Pick A -> Pick B -> Drop B -> Drop A
    const d2 = dist(pickA, pickB) + dist(pickB, dropB) + dist(dropB, dropA);
    const t2 = time(dist(pickA, pickB)) + time(dist(pickB, dropB)) + time(dist(dropB, dropA));
    const detour2 = Math.max(0, t2 - directTimeA);
    // Permutation 3: Pick A -> Drop A -> Pick B -> Drop B
    const d3 = dist(pickA, dropA) + dist(dropA, pickB) + dist(pickB, dropB);
    const t3 = time(dist(pickA, dropA)) + time(dist(dropA, pickB)) + time(dist(pickB, dropB));
    const detour3 = Math.max(0, t3 - directTimeA);
    const rawPermutations = [
        {
            id: 'perm_1',
            sequenceName: 'Pick A ➔ Pick B ➔ Drop A ➔ Drop B',
            order: [`Pick A (${pickA.name})`, `Pick B (${pickB.name})`, `Drop A (${dropA.name})`, `Drop B (${dropB.name})`],
            totalDistanceKm: Math.round(d1 * 10) / 10,
            totalTimeMins: t1,
            detourTimeMins: detour1,
            isOptimal: false,
            isValidDetour: detour1 <= maxDetourMins,
        },
        {
            id: 'perm_2',
            sequenceName: 'Pick A ➔ Pick B ➔ Drop B ➔ Drop A',
            order: [`Pick A (${pickA.name})`, `Pick B (${pickB.name})`, `Drop B (${dropB.name})`, `Drop A (${dropA.name})`],
            totalDistanceKm: Math.round(d2 * 10) / 10,
            totalTimeMins: t2,
            detourTimeMins: detour2,
            isOptimal: false,
            isValidDetour: detour2 <= maxDetourMins,
        },
        {
            id: 'perm_3',
            sequenceName: 'Pick A ➔ Drop A ➔ Pick B ➔ Drop B',
            order: [`Pick A (${pickA.name})`, `Drop A (${dropA.name})`, `Pick B (${pickB.name})`, `Drop B (${dropB.name})`],
            totalDistanceKm: Math.round(d3 * 10) / 10,
            totalTimeMins: t3,
            detourTimeMins: detour3,
            isOptimal: false,
            isValidDetour: detour3 <= maxDetourMins,
        },
    ];
    // Pick permutation with smallest detour
    rawPermutations.sort((a, b) => a.detourTimeMins - b.detourTimeMins);
    rawPermutations[0].isOptimal = true;
    return {
        permutations: rawPermutations,
        optimalPermutation: rawPermutations[0],
    };
}
// Somaliland Shilling Exchange Rate: 1 USD = 10,000 SLSH ($0.90 USD = 9,000 SLSH, $0.40 USD = 4,000 SLSH, $1.20 USD = 12,000 SLSH, $0.70 USD = 7,000 SLSH)
exports.EXCHANGE_RATE_USD_TO_SLSH = 10000;
// Format currency safely in Somaliland Shilling (SLSH)
function formatCurrency(amount) {
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        return '0 SLSH';
    }
    // If input is small USD amount (< 100)
    if (amount < 100) {
        const sos = Math.round(amount * exports.EXCHANGE_RATE_USD_TO_SLSH);
        return `${sos.toLocaleString()} SLSH`;
    }
    else {
        // If input was passed directly as SLSH (>= 100)
        return `${Math.round(amount).toLocaleString()} SLSH`;
    }
}
function formatSosOnly(amountUsd) {
    const sos = Math.round(amountUsd * exports.EXCHANGE_RATE_USD_TO_SLSH);
    return `${sos.toLocaleString()} SLSH`;
}
function formatUsdOnly(amountUsd) {
    return `$${amountUsd.toFixed(2)}`;
}
function formatPriceDual(amountUsd) {
    const sos = Math.round(amountUsd * exports.EXCHANGE_RATE_USD_TO_SLSH);
    return {
        slsh: `${sos.toLocaleString()} SLSH`,
        usd: `$${amountUsd.toFixed(2)} USD`,
    };
}
/**
 * WAYPOINT SORTER LOGIC (Backend & Client Sequencer)
 * Purpose: Determines if it's better to:
 * 1. Pickup B -> Dropoff B -> Dropoff A
 * 2. Pickup B -> Dropoff A -> Dropoff B
 * Enforces a strict maximum 10-minute detour SLA for Passenger A.
 */
function getClosestHargeisaPopularRoad(lat, lng) {
    // Road 1: Jigjiga Yar / North-East corridor (lat >= 9.565, lng >= 44.070)
    if (lat >= 9.565 && lng >= 44.070) {
        return 'Road 1 (Jigjiga-Yar Road)';
    }
    // Road 2: Wadada Wadnaha / Central commercial corridor (lat 9.552-9.570, lng 44.048-44.085)
    if (lat >= 9.552 && lat <= 9.570 && lng >= 44.048 && lng <= 44.085) {
        return 'Road 2 (Wadada Wadnaha)';
    }
    // Airport Road (lat < 9.550, lng >= 44.070)
    if (lat < 9.550 && lng >= 44.070) {
        return 'Airport Road (Wadada Garoonka)';
    }
    // Independence Ave (lat 9.555-9.565, lng 44.055-44.070)
    if (lat >= 9.555 && lat <= 9.565 && lng >= 44.055 && lng <= 44.070) {
        return 'Independence Ave (Wadada Xorriyadda)';
    }
    // 150 Ring Road (north or south outskirts)
    if (lat > 9.575 || lat < 9.535) {
        return '150 Ring Road (Wadada 150-ka)';
    }
    return 'Road 2 (Wadada Wadnaha Arterial)';
}
/**
 * Nearest Hargeisa landmark for a coordinate.
 *
 * PERFORMANCE-CRITICAL: the old body scanned all 10,650 landmarks while calling
 * `calculateDistanceKm()` per landmark (which itself re-scanned all 10,650
 * landmarks twice) => ~226 million trigonometry operations per map tap, which
 * froze the map screen. The spatial index returns the identical landmark in
 * constant time.
 */
function findNearestHargeisaPlace(lat, lng) {
    const popularRoad = getClosestHargeisaPopularRoad(lat, lng);
    const nearest = (0, hargeisaSpatialIndex_1.getNearestHargeisaPlace)(lat, lng);
    if (!nearest) {
        return {
            id: `pin_${Date.now()}`,
            name: `${popularRoad}`,
            address: `${popularRoad}, Hargeisa (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
            lat,
            lng,
            distanceKm: 0,
        };
    }
    const closest = nearest.place;
    const minDistance = nearest.distanceKm;
    // If within 350 meters of a known landmark, use the exact landmark name with popular road
    if (minDistance < 0.35) {
        return {
            id: closest.id,
            name: closest.name,
            address: closest.address || `${popularRoad}, ${closest.district || 'Hargeisa'}, Somaliland`,
            lat,
            lng,
            distanceKm: minDistance,
        };
    }
    // If within 900 meters, note "Near <Landmark> on <Popular Road>"
    if (minDistance < 0.9) {
        return {
            id: `near_${closest.id}_${Date.now()}`,
            name: `Near ${closest.name} (${popularRoad})`,
            address: `${popularRoad}, ${closest.district || 'Hargeisa'}, Somaliland`,
            lat,
            lng,
            distanceKm: minDistance,
        };
    }
    // Clean formatted GPS coordinate pin along closest popular road
    return {
        id: `pin_${Date.now()}`,
        name: `${popularRoad}`,
        address: `${popularRoad}, Hargeisa (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
        lat,
        lng,
        distanceKm: minDistance,
    };
}
const getOptimalSequence = (driverLoc, existingWaypoints, newPassenger, maxDetourMins = 10) => {
    const pB = {
        id: `wp_pick_${newPassenger.id}`,
        type: 'PICKUP',
        passengerId: newPassenger.id,
        passengerName: newPassenger.name,
        passengerPhone: newPassenger.phone,
        location: newPassenger.pickup,
        status: 'pending',
        etaMins: 3,
        profitBonusUsd: 1.50,
        beaconColor: newPassenger.beaconColor,
    };
    const dB = {
        id: `wp_drop_${newPassenger.id}`,
        type: 'DROPOFF',
        passengerId: newPassenger.id,
        passengerName: newPassenger.name,
        passengerPhone: newPassenger.phone,
        location: newPassenger.dropoff,
        status: 'pending',
        etaMins: 8,
        beaconColor: newPassenger.beaconColor,
    };
    // Separate already completed waypoints from pending waypoints
    const completedWaypoints = existingWaypoints.filter((w) => w.status === 'completed');
    const pendingWaypoints = existingWaypoints.filter((w) => w.status !== 'completed');
    const pendingPA = pendingWaypoints.find((w) => w.type === 'PICKUP');
    const pendingDA = pendingWaypoints.find((w) => w.type === 'DROPOFF') || existingWaypoints.find((w) => w.type === 'DROPOFF');
    if (!pendingDA) {
        return {
            optimalWaypoints: [...completedWaypoints, ...pendingWaypoints, pB, dB],
            detourMins: 0,
            sequenceLabel: 'Direct Append (No Prior Dropoff)',
        };
    }
    // Calculate direct baseline distance from driver location to Passenger A dropoff
    const directDistA = calculateDistanceKm(driverLoc.lat, driverLoc.lng, pendingDA.location.lat, pendingDA.location.lng);
    const directTimeA = calculateDurationMins(directDistA);
    // If Passenger A pickup is still pending, we must do both pickups before dropoffs
    let pickupsOrder = [];
    if (pendingPA) {
        const distToPA = calculateDistanceKm(driverLoc.lat, driverLoc.lng, pendingPA.location.lat, pendingPA.location.lng);
        const distToPB = calculateDistanceKm(driverLoc.lat, driverLoc.lng, pB.location.lat, pB.location.lng);
        if (distToPB < distToPA) {
            pickupsOrder = [pB, pendingPA];
        }
        else {
            pickupsOrder = [pendingPA, pB];
        }
    }
    else {
        pickupsOrder = [pB];
    }
    const lastPickupLoc = pickupsOrder[pickupsOrder.length - 1].location;
    // Evaluate candidate dropoff sequences:
    // Dropoff Sequence 1: dB then pendingDA
    const distDropSeq1 = calculateDistanceKm(lastPickupLoc.lat, lastPickupLoc.lng, dB.location.lat, dB.location.lng) +
        calculateDistanceKm(dB.location.lat, dB.location.lng, pendingDA.location.lat, pendingDA.location.lng);
    const timeDropSeq1 = calculateDurationMins(distDropSeq1);
    const detourSeq1 = Math.max(0, timeDropSeq1 - directTimeA);
    // Dropoff Sequence 2: pendingDA then dB
    const distDropSeq2 = calculateDistanceKm(lastPickupLoc.lat, lastPickupLoc.lng, pendingDA.location.lat, pendingDA.location.lng) +
        calculateDistanceKm(pendingDA.location.lat, pendingDA.location.lng, dB.location.lat, dB.location.lng);
    const timeDropSeq2 = calculateDurationMins(distDropSeq2);
    const detourSeq2 = Math.max(0, timeDropSeq2 - directTimeA);
    let dropoffsOrder = [];
    let chosenDetour = detourSeq2;
    let label = '';
    if (distDropSeq1 <= distDropSeq2 && detourSeq1 <= maxDetourMins) {
        dropoffsOrder = [dB, pendingDA];
        chosenDetour = detourSeq1;
        label = `Pickups ➔ Drop ${newPassenger.name} ➔ Drop ${pendingDA.passengerName}`;
    }
    else {
        dropoffsOrder = [pendingDA, dB];
        chosenDetour = detourSeq2;
        label = `Pickups ➔ Drop ${pendingDA.passengerName} ➔ Drop ${newPassenger.name}`;
    }
    // Compute realistic sequential ETAs
    let runningLoc = driverLoc;
    let runningTime = 0;
    const finalSequence = [...completedWaypoints, ...pickupsOrder, ...dropoffsOrder];
    for (const wp of finalSequence) {
        if (wp.status === 'completed')
            continue;
        const legDist = calculateDistanceKm(runningLoc.lat, runningLoc.lng, wp.location.lat, wp.location.lng);
        const legTime = calculateDurationMins(legDist);
        runningTime += legTime;
        wp.etaMins = runningTime;
        runningLoc = wp.location;
    }
    return {
        optimalWaypoints: finalSequence,
        detourMins: chosenDetour,
        sequenceLabel: label,
    };
};
exports.getOptimalSequence = getOptimalSequence;
