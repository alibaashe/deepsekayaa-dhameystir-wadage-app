const { HARGEISA_PLACES, HARGEISA_CATEGORIES, searchHargeisaPlaces } = require('./data/hargeisaPlaces.js');
console.log('total records :', HARGEISA_PLACES.length);
const c = (id) => (HARGEISA_CATEGORIES.find(x => x.id === id) || {}).count;
console.log('category counts -> hospital:%s school:%s gov:%s fuel:%s dining:%s market:%s uni:%s mosque:%s ngo:%s road:%s hotel:%s transit:%s bank:%s district:%s corporate:%s landmark:%s',
  c('hospital'), c('school'), c('government'), c('fuel'), c('dining'), c('market'), c('university'), c('mosque'), c('ngo'), c('corridor'), c('hotel'), c('transit'), c('bank'), c('district'), c('corporate'), c('landmark'));
for (const q of ['Ministry of Planning','Adna Adan','ASSOD Hotel','TEC Power','Immigration','Sompower','Dugsiga Hoose']) {
  const r = searchHargeisaPlaces(q, undefined, 3);
  console.log('\nquery "' + q + '" -> ' + r.length + ' hits');
  r.forEach(p => console.log('   ' + p.name + '  [' + p.category + ']  ' + p.address));
}
console.log('\n-- category filter: Landmark --');
searchHargeisaPlaces('', 'Landmark', 4).forEach(p => console.log('   ' + p.name + ' [' + p.category + '/' + p.subCategory + ']'));
console.log('\n-- category filter: Corporate (utilities) --');
searchHargeisaPlaces('', 'Corporate', 4).forEach(p => console.log('   ' + p.name + ' [' + p.category + '/T' + p.subCategory + ']'));
console.log('\n-- category filter: Government --');
searchHargeisaPlaces('', 'Government', 4).forEach(p => console.log('   ' + p.name + ' [' + p.category + ']'));
