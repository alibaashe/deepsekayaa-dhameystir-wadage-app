import csv, sys, json
sys.path.insert(0, "scripts")
import merge_hargeisa_csv as m
rows = list(csv.DictReader(open(r"C:\Users\Alibaashe admin\Downloads\hargeisa_wadage_database_with_government.csv", encoding="utf-8-sig", newline="")))
seen=set(); recs=[]
for r in rows:
    oid=(r.get("osm_id") or "").strip()
    if oid in seen: continue
    seen.add(oid)
    rec = m.build_record(r, set())
    if rec: recs.append(rec)
print("total", len(recs))
import itertools
for cat in ["Government & Civic","Corporate & Utilities","Hotels & Hospitality","Landmarks & Attractions","Hospitals & Healthcare","Schools & Academies","Fuel Stations (Kaalmaha)","Restaurants & Cafes","Transport & Terminals","Banks & Financial","Supermarkets & Malls","Mosques (Masaajidda)"]:
    sel=[r for r in recs if r["category"]==cat][:3]
    print("\n== "+cat+" ==")
    for r in sel:
        print("  ", r["name"], "|", r["address"], "|", r["lat"], r["lng"], "|", r["subCategory"], "| id:", r["id"][:46])
