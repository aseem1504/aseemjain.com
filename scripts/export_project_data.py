#!/usr/bin/env python3
"""Export real demo output from the project repos as small JSON files for the site's map visuals.

Run with a Python that has numpy, pandas and scikit-learn:
  ~/Code/venv-proj/bin/python scripts/export_project_data.py

The repos are expected under ~/Code/projects-src/<repo> (clone them with `gh repo clone aseem1504/<repo>`).
Everything here is synthetic data from the repos' own simulators.
"""
import json
import os
import sys
from pathlib import Path

import pandas as pd

SRC = Path.home() / "Code" / "projects-src"
OUT = Path(__file__).resolve().parent.parent / "src" / "content" / "project-data"
OUT.mkdir(parents=True, exist_ok=True)


def toll():
    repo = SRC / "toll-cost-estimator"
    sys.path.insert(0, str(repo))
    os.chdir(repo)
    from toll_estimator import simulate
    from toll_estimator.crossings import crossed_plazas, crossed_plazas_radius
    from toll_estimator.fares import load_fares
    from toll_estimator.geo import haversine
    from toll_estimator.plazas import locate_all

    fares = load_fares()
    plazas, pings, debits, trucks = simulate.fleet(fares)
    found = locate_all(debits, pings)
    chk = found.merge(plazas, on="plaza_code", suffixes=("_est", "_true"))
    chk["err"] = chk.apply(lambda r: haversine([r.longitude_est, r.latitude_est], [r.longitude_true, r.latitude_true]), axis=1)

    # One truck where the original grid matching misses a crossing.
    pick = None
    for t in trucks.itertuples():
        loc = pings[pings.vehicleId == t.vehicle_id]
        g, r = crossed_plazas(loc, found), crossed_plazas_radius(loc, found)
        missed = set(r.plaza_code) - set(g.plaza_code if g is not None else [])
        if missed:
            pick = (t.vehicle_id, loc, sorted(missed))
            break
    vid, loc, missed = pick
    trail = [[round(float(p[1]), 4), round(float(p[0]), 4)] for p in loc.location.iloc[::60]]

    data = {
        "plazas": [
            {
                "code": r.plaza_code, "name": r.plaza_name,
                "lat": round(r.latitude_true, 5), "lon": round(r.longitude_true, 5),
                "estLat": round(r.latitude_est, 5), "estLon": round(r.longitude_est, 5),
                "errM": round(float(r.err)),
            }
            for r in chk.itertuples()
        ],
        "trail": trail,
        "missedByGrid": missed,
        "medianErrM": round(float(chk.err.median())),
        "trucks": int(len(trucks)), "pings": int(len(pings)), "debits": int(len(debits)),
    }
    (OUT / "toll.json").write_text(json.dumps(data, indent=1))
    print("toll.json", len(data["plazas"]), "plazas; trail", len(trail), "; missed", missed, "; median err", data["medianErrM"], "m")
    sys.path.pop(0)


def lanes():
    repo = SRC / "truck-movement-clustering"
    sys.path.insert(0, str(repo))
    os.chdir(repo)
    from movement import simulate
    from movement.clustering import layer1, layer2, one_hot
    from movement.geo import haversine
    from movement.hubs import find_hubs

    hubs = pd.read_csv("data/freight_hubs.csv")
    fp, clusters = simulate.footprints(hubs)
    l2 = layer2(layer1(one_hot(fp, clusters.clusters.max())))
    res = fp[["vehicle_number", "true_lane"]].merge(l2, on="vehicle_number")
    core = res[res.DB_clustered >= 0]
    groups = []
    for gid, g in core.groupby("DB_clustered"):
        vc = g.true_lane.value_counts(normalize=True)
        groups.append({"group": int(gid), "trucks": int(len(g)), "lane": vc.index[0], "purity": round(float(vc.iloc[0]), 2)})

    pings, garages = simulate.disconnect_pings(hubs)
    found, _ = find_hubs(pings)
    ws = []
    for r in found.itertuples():
        err = min(haversine([r.longitude, r.latitude], [g.lon, g.lat]) for g in garages.itertuples())
        ws.append({"lat": round(float(r.latitude), 4), "lon": round(float(r.longitude), 4), "errM": round(float(err))})

    data = {
        "cities": [{"city": r.city, "lat": float(r.lat), "lon": float(r.lon)} for r in hubs.itertuples()],
        "lanes": {k: v for k, v in simulate.LANES.items()},
        "groups": sorted(groups, key=lambda x: -x["trucks"]),
        "workshops": ws,
        "noiseShare": round(float((res.DB_clustered == -1).mean()), 2),
        "trucks": int(len(res)),
    }
    (OUT / "india-lanes.json").write_text(json.dumps(data, indent=1))
    print("india-lanes.json", len(groups), "groups;", len(ws), "workshops; noise", data["noiseShare"])
    sys.path.pop(0)


if __name__ == "__main__":
    toll()
    lanes()
