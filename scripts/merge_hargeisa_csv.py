#!/usr/bin/env python3
"""
Merge a Wadaage Hargeisa CSV export (OSM / government register) into the master
place database used by BOTH apps (rider + driver).

What it does
------------
1. Reads the CSV (osm_id, registered_name, area_xaafad, district,
   category_group, specific_type, latitude, longitude, ...).
2. De-duplicates by osm_id.
3. **Re-derives every record's category from its name + specific_type.**
   The CSV's own `category_group` column is NOT trusted: in the supplied export
   it files 147 power-plant / viewpoint records under "Hotels & Hospitality",
   which would put electric substations in the hotel list. Categories are
   therefore resolved against the app's real category vocabulary.
4. Splices the new records into:
     - src/data/hargeisaPlaces.ts            (bundled into both APKs)
     - public/hargeisa_locations_10650.json  (reference copy)
     - public/hargeisa_locations_1650.json   (loaded by server.ts master DB)
     - public/hargeisa_locations_1550.json   (reference copy)
   The new real, named POIs are placed FIRST so search surfaces them ahead of
   the procedurally generated "Blooka NNNN" filler records.

Usage:  python scripts/merge_hargeisa_csv.py <input.csv> [--dry-run]
"""

import csv
import json
import re
import sys
import os
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS_PATH = os.path.join(ROOT, 'src', 'data', 'hargeisaPlaces.ts')
JSON_PATHS = [
    os.path.join(ROOT, 'public', 'hargeisa_locations_10650.json'),
    os.path.join(ROOT, 'public', 'hargeisa_locations_1650.json'),
    os.path.join(ROOT, 'public', 'hargeisa_locations_1550.json'),
]

# ---------------------------------------------------------------------------
# Category vocabulary - must match the strings already used by the apps.
# ---------------------------------------------------------------------------
CAT = {
    'hospital':   ('Hospitals & Healthcare',      'hospital',        'Activity',      'Health',                 'Cusbitaallada'),
    'pharmacy':   ('Hospitals & Healthcare',      'pharmacy',        'Activity',      'Health',                 'Cusbitaallada'),
    'university': ('Universities & Colleges',     'university',      'GraduationCap', 'Education',              'Jaamacadaha'),
    'school':     ('Schools & Academies',          'school',          'GraduationCap', 'Education',              'Dugsiyada'),
    'mosque':     ('Mosques (Masaajidda)',        'place_of_worship','Moon',          'Worship',                'Masaajidda'),
    'market':     ('Supermarkets & Malls',        'mall',            'ShoppingBag',   'Commercial & Shopping',  'Suuqyada & Malls'),
    'fuel':       ('Fuel Stations (Kaalmaha)',    'fuel',            'Fuel',          'Fuel & Energy',          'Kaalmaha Shidaalka'),
    'transit':    ('Transport & Terminals',       'transit_station', 'Navigation',    'Transport',              'Istaannada & Gaadiidka'),
    'ngo':        ('NGOs & Agencies',             'ngo',             'Globe',         'Humanitarian',           "Hay'adaha Caalami ah"),
    'road':       ('Road Corridors',              'highway',         'Compass',       'Roads & Corridors',      'Wadooyinka'),
    'dining':     ('Restaurants & Cafes',         'restaurant',      'Utensils',      'Dining',                 'Maqaayadaha'),
    'hotel':      ('Hotels & Hospitality',        'hotel',           'Hotel',         'Hotels & Lodging',       'Huteellada'),
    'bank':       ('Banks & Financial',           'bank',            'Landmark',      'Banking & Remittance',   'Bangiyada & Xawaaladaha'),
    'corporate':  ('Corporate & Utilities',       'utility',         'Zap',           'Utilities & Power',      'Shirkadaha & Korontada'),
    'government': ('Government & Civic',          'government',      'Landmark',      'Government',             "Hay'adaha Dowladda"),
    'landmark':   ('Landmarks & Attractions',     'attraction',      'Camera',        'Tourism & Landmarks',    'Goobaha Dalxiiska'),
}

# specific_type -> category key
TYPE_MAP = {
    'ministry': 'government', 'government_office': 'government',
    'local_government': 'government', 'diplomatic': 'government',
    'police': 'government', 'embassy': 'government', 'courthouse': 'government',
    'hospital': 'hospital', 'clinic': 'hospital', 'pharmacy': 'pharmacy',
    'dentist': 'hospital', 'doctors': 'hospital',
    'school': 'school', 'kindergarten': 'school', 'college': 'school',
    'university': 'university',
    'place_of_worship': 'mosque',
    'fuel': 'fuel',
    'supermarket': 'market', 'mall': 'market', 'marketplace': 'market',
    'commercial': 'market', 'department_store': 'market',
    'restaurant': 'dining', 'cafe': 'dining', 'fast_food': 'dining',
    'hotel': 'hotel', 'guest_house': 'hotel', 'hostel': 'hotel',
    'apartment': 'hotel', 'alpine_hut': 'hotel', 'caravan_site': 'hotel',
    'motel': 'hotel', 'chalet': 'hotel',
    'bank': 'bank', 'atm': 'bank', 'bureau_de_change': 'bank',
    'bus_stop': 'transit', 'bus_station': 'transit', 'aerodrome': 'transit',
    'taxi': 'transit', 'ferry_terminal': 'transit',
    'power_plant': 'corporate', 'substation': 'corporate', 'company': 'corporate',
    'office': 'corporate', 'industrial': 'corporate', 'service': 'corporate',
    'museum': 'landmark', 'library': 'landmark', 'attraction': 'landmark',
    'artwork': 'landmark', 'viewpoint': 'landmark', 'monument': 'landmark',
    'community_centre': 'landmark', 'theatre': 'landmark', 'cinema': 'landmark',
    'residential': 'landmark', 'neighbourhood': 'landmark', 'yes': 'landmark',
}

# Name keywords, checked BEFORE the type map (a name is more specific than an
# OSM tag: "Sompower Central" tagged `viewpoint` is still a utility).
NAME_RULES = [
    ('government', ['ministry', 'ministries', 'wasaarad', 'dowladd', 'police',
                    'immigration', 'attorney general', 'attorney-general',
                    'local government', 'madaxtooyada', 'parliament', 'embassy',
                    'consulate', 'diplomatic', 'customs', 'passport', 'prison',
                    'national headquarters', 'mayor', 'governor', 'court']),
    ('corporate',  ['tec ', 'tec power', 'sompower', 'som power', 'telesom',
                    'somtel', 'tls ', 'taaj ', 'power plant', 'power station',
                    'substation', 'electric', 'koronto', 'generator', 'hormuud',
                    'bank tower']),
    ('hospital',   ['hospital', 'cusbitaal', 'isbitaal', 'clinic', 'pharmacy',
                    'farmasi', 'dental', 'medical center', 'medical centre',
                    'maternity', 'caafimaad']),
    ('university', ['university', 'jaamacad', 'jaamacadda', 'college']),
    ('school',     ['school', 'dugsi', 'dugsiga', 'iskuul', 'academy', 'kindergarten']),
    ('mosque',     ['masjid', 'masjidka', 'mosque', 'jama', 'macaabid']),
    ('fuel',       ['fuel', 'petrol', 'shidaal', 'kaalinta', 'gas station',
                    'petroleum', 'somgas']),
    ('bank',       ['bank', 'hawala', 'xawaalad', 'xawaalada', 'zaad', 'edahab',
                    'dahabshiil', 'premier bank', 'salaam bank', 'atmmm', 'atm']),
    ('dining',     ['restaurant', 'cafe', 'maqaayad', 'maqaayada', 'grill',
                    'pizzeria', 'fast food', 'coffee']),
    ('market',     ['supermarket', 'mall', 'suuq', 'suuqa', 'market', 'store',
                    'shop', 'dukaan', 'bakery', 'pharmacy shop']),
    ('transit',    ['airport', 'garoonka', 'terminal', 'istaan', 'istaanka',
                    'bus station', 'bus stop', 'crossroad', 'isgoyska']),
    ('hotel',      ['hotel', 'huteel', 'huteelka', 'guest house', 'guesthouse',
                    'lodge', 'resort', 'hostel', 'apartment', 'suites']),
    ('ngo',        ['unicef', 'undp', 'unhcr', 'wfp', 'who ', 'ngo',
                    'humanitarian', 'red crescent', 'save the children']),
    ('road',       ['road', 'street', 'wadada', 'jidka', 'avenue', 'highway']),
    ('landmark',   ['museum', 'monument', 'statue', 'artwork', 'viewpoint',
                    'tower', 'stadium', 'park', 'beach', 'camel', 'market square',
                    'square', 'gate', 'bridge', 'xoriyada', 'saylada', 'seylada']),
]


def norm(text: str) -> str:
    return (text or '').strip()


def detect_category(name: str, specific_type: str) -> str:
    hay = f' {name.lower()} '
    st = (specific_type or '').strip().lower()
    for key, words in NAME_RULES:
        if any(w in hay for w in words):
            return key
    if st in TYPE_MAP:
        return TYPE_MAP[st]
    return 'landmark'


def split_area_name(registered_name: str, area: str):
    """'Sha'ab, Ministry of Planning' -> ('Ministry of Planning', "Sha'ab")"""
    raw = norm(registered_name)
    if ',' in raw:
        head, _, tail = raw.partition(',')
        head, tail = head.strip(), tail.strip()
        # Treat the head as an area label when it is short (a place/street name)
        if tail and len(head) <= 40:
            return tail, head
        if head and not tail:
            return head, area
    return raw, area


def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_') or 'place'


def build_record(row, seen_ids):
    osm_id = norm(row.get('osm_id'))
    registered = norm(row.get('registered_name')) or norm(row.get('registered_name_original'))
    if not registered:
        return None

    try:
        lat = round(float(row.get('latitude')), 5)
        lng = round(float(row.get('longitude')), 5)
    except (TypeError, ValueError):
        return None
    # Hargeisa bounding box guard - never let a bad coordinate into the DB
    if not (9.35 <= lat <= 9.75 and 43.85 <= lng <= 44.25):
        return None

    area = norm(row.get('area_xaafad'))
    csv_district = norm(row.get('district'))
    specific_type = norm(row.get('specific_type'))

    name, derived_area = split_area_name(registered, area)
    area = area or derived_area
    if not area or area.lower() == 'hargeisa':
        area = ''
    if not csv_district or csv_district.lower() == 'hargeisa':
        csv_district = ''
    if area and csv_district and area.lower() == csv_district.lower():
        area = ''

    name = re.sub(r'\s+', ' ', name).strip(' ,-')
    if not name:
        name = registered

    cat_key = detect_category(f'{name} {registered}', specific_type)
    category, sub_category, icon, general, somali = CAT[cat_key]

    # Address: most specific first
    parts = [p for p in (area, csv_district, 'Hargeisa', 'Somaliland') if p and p.lower() != 'hargeisa']
    if not parts or parts[0] != 'Hargeisa':
        parts = [p for p in (area, csv_district) if p] + ['Hargeisa', 'Somaliland']
    address = ', '.join(parts)

    district = area or csv_district or 'Hargeisa'

    base_id = f'wda_{slugify(name)[:44]}'
    place_id = f'{base_id}_{osm_id}' if osm_id else base_id
    suffix = 1
    while place_id in seen_ids:
        suffix += 1
        place_id = f'{base_id}_{osm_id}_{suffix}' if osm_id else f'{base_id}_{suffix}'
    seen_ids.add(place_id)

    # Search terms: words from every field, the raw OSM type, plus Somali synonyms
    raw_terms = re.split(r'[^0-9A-Za-z\u0600-\u06FF]+',
                         f'{name} {registered} {area} {csv_district} {category} {general} {somali} {specific_type}')
    terms = sorted({t.lower() for t in raw_terms if len(t) > 1})
    if specific_type:
        terms = sorted(set(terms) | {specific_type.lower()})
    # keep the DB compact - same shape as the existing records
    terms = terms[:26]

    return {
        'id': place_id,
        'name': name,
        'address': address,
        'lat': lat,
        'lng': lng,
        'category': category,
        'subCategory': sub_category,
        'district': district,
        'popular': False,
        'iconName': icon,
        'generalCategory': general,
        'somaliCategory': somali,
        'searchTerms': terms,
    }


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry_run = '--dry-run' in sys.argv
    if not args:
        print('usage: merge_hargeisa_csv.py <input.csv> [--dry-run]')
        return 2
    csv_path = args[0]

    with open(csv_path, 'r', encoding='utf-8-sig', newline='') as fh:
        rows = list(csv.DictReader(fh))
    print(f'CSV rows read            : {len(rows)}')

    # --- de-duplicate by osm_id ---
    seen_osm, unique_rows, dupes = set(), [], 0
    for row in rows:
        oid = norm(row.get('osm_id'))
        key = oid or norm(row.get('registered_name')).lower()
        if key in seen_osm:
            dupes += 1
            continue
        seen_osm.add(key)
        unique_rows.append(row)
    print(f'duplicate osm_id skipped : {dupes}')
    print(f'unique CSV rows          : {len(unique_rows)}')

    # --- build records ---
    with open(TS_PATH, 'r', encoding='utf-8') as fh:
        ts_source = fh.read()

    start_marker = 'export const HARGEISA_PLACES: HargeisaPlace[] = '
    start = ts_source.index(start_marker) + len(start_marker)
    end = ts_source.index('export interface CategoryMeta')
    array_text = ts_source[start:end]
    close = array_text.rindex('];')
    existing = json.loads(array_text[:close + 1])
    print(f'existing master records  : {len(existing)}')

    seen_ids = {p['id'] for p in existing}
    new_records, skipped = [], 0
    for row in unique_rows:
        rec = build_record(row, seen_ids)
        if rec is None:
            skipped += 1
            continue
        new_records.append(rec)
    print(f'new records built        : {len(new_records)}  (skipped {skipped})')

    from collections import Counter
    dist = Counter(r['category'] for r in new_records)
    print('\n--- new records per category (re-derived, CSV category_group ignored) ---')
    for cat, n in dist.most_common():
        print(f'  {n:4d}  {cat}')

    merged = new_records + existing
    print(f'\nmerged master records    : {len(merged)}')

    if dry_run:
        print('\n[dry-run] nothing written')
        return 0

    # --- write the TS data file (array literal only; helpers preserved) ---
    new_source = (
        ts_source[:start]
        + json.dumps(merged, ensure_ascii=False, separators=(', ', ': '))
        + ts_source[start + close + 1:]
    )
    with open(TS_PATH, 'w', encoding='utf-8') as fh:
        fh.write(new_source)
    print(f'wrote {TS_PATH}')

    for jp in JSON_PATHS:
        with open(jp, 'w', encoding='utf-8') as fh:
            json.dump(merged, fh, ensure_ascii=False, indent=2)
        print(f'wrote {jp}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
