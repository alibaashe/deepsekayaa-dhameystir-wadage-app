const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '../wadaage_db_store.json');

if (!fs.existsSync(storePath)) {
  console.log('wadaage_db_store.json file not found at:', storePath);
  process.exit(0);
}

const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));

if (!Array.isArray(storeData.drivers)) {
  console.log('No drivers array found in store.');
  process.exit(0);
}

console.log(`Initial drivers count: ${storeData.drivers.length}`);

const phoneGroups = {};

storeData.drivers.forEach((driver) => {
  const cleanPhone = driver.phone ? driver.phone.replace(/\D/g, '') : '';
  const key = cleanPhone || driver.id;
  if (!phoneGroups[key]) {
    phoneGroups[key] = [];
  }
  phoneGroups[key].push(driver);
});

let duplicatesFound = 0;
let mergedCount = 0;
const driverIdRemap = {};

const primaryDrivers = [];

Object.keys(phoneGroups).forEach((key) => {
  const group = phoneGroups[key];
  if (group.length === 1) {
    primaryDrivers.push(group[0]);
  } else {
    duplicatesFound += group.length - 1;
    // Primary is the oldest or first record
    const primary = group[0];
    primaryDrivers.push(primary);

    for (let i = 1; i < group.length; i++) {
      const dup = group[i];
      driverIdRemap[dup.id] = primary.id;
      mergedCount++;
      console.log(`Merging duplicate driver [${dup.name} - ${dup.phone} (${dup.id})] into primary [${primary.id}]`);
    }
  }
});

// Remap references in rides if any
if (Array.isArray(storeData.rides)) {
  storeData.rides.forEach((ride) => {
    if (ride.assignedDriverId && driverIdRemap[ride.assignedDriverId]) {
      ride.assignedDriverId = driverIdRemap[ride.assignedDriverId];
    }
    if (ride.driver_id && driverIdRemap[ride.driver_id]) {
      ride.driver_id = driverIdRemap[ride.driver_id];
    }
  });
}

// Remap references in wallet_transactions if any
if (Array.isArray(storeData.wallet_transactions)) {
  storeData.wallet_transactions.forEach((tx) => {
    if (tx.driverId && driverIdRemap[tx.driverId]) {
      tx.driverId = driverIdRemap[tx.driverId];
    }
    if (tx.user_id && driverIdRemap[tx.user_id]) {
      tx.user_id = driverIdRemap[tx.user_id];
    }
  });
}

storeData.drivers = primaryDrivers;

fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');

console.log(`Deduplication finished.`);
console.log(`Duplicates merged: ${mergedCount}`);
console.log(`Final drivers count: ${storeData.drivers.length}`);
