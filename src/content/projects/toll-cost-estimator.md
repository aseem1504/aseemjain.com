---
title: Toll cost estimator
order: 1
repo: toll-cost-estimator
problem: Fleet owners could not tell what a trip should cost in tolls, or whether they had been charged right.
built: Finds every toll plaza from FASTag debits and GPS pings, then prices any truck's trail with public NHAI fares.
result: Plaza locations land within 8 m at the median. Matching on real distance instead of grid cells cut the median bill error from 5.3% to 0.0%.
tags: [Python, scikit-learn, K-Means, GPS data]
steps:
  - label: "FASTag debits"
    sub: "who paid where, when"
  - label: "Match GPS pings"
    sub: "within 10 s of a debit"
  - label: "Find the plaza"
    sub: "busiest 110 m cell"
  - label: "Spot crossings"
    sub: "slow pings near it"
  - label: "Price the trip"
    sub: "NHAI fare, half on return"
visual:
  kind: map-toll
  caption: Ten plazas on a fictional highway, drawn from the demo's own output. The line is one truck's GPS trail. Circled plazas are crossings the original grid matching missed.
workLink: This connects to the toll anomaly detector I shipped at WheelsEye, which scores every FASTag deduction against a national database of per-plaza, per-vehicle-class prices. Both need to know where each plaza is and what it should charge.
---

## Why it matters

Tolls are one of the biggest running costs for a truck in India. Fleet owners wanted three answers. What will this route cost before a trip? Was I charged right after it? And for a truck with GPS but a FASTag from another provider, what did it likely spend?

All three need the same two facts: where each toll plaza is, and which plazas a truck crossed. Neither was available as clean data. The in-house plaza table had gaps, and public lists did not always match the plaza codes on FASTag transactions.

## How it works

1. **Find the plazas.** Every FASTag debit says "this truck paid at plaza X at time T". If the same truck has GPS, the ping closest to time T says where it was. For each plaza I take pings within 10 seconds of each debit, round them to about 110 m cells and keep the busiest cell, then run K-Means with one cluster on what is left. The centre is the plaza.
2. **Spot crossings on any trail.** Keep the slow pings (under 20 km/h, since trucks queue at the booth) and match them to a plaza. Pings at the same plaza more than an hour apart count as separate crossings.
3. **Price it.** Look up the fare for the truck's FASTag class. A return crossing within 24 hours is charged at half fare, which matches the NHAI return-journey rule.

## The key code

The new part is matching on real distance. The original snapped each ping to a grid cell and asked whether a plaza sat in that cell.

```python
def crossed_plazas_radius(loc, plaza_data, radius_m=400):
    loc = loc[loc['speed'] < 20].copy()
    if loc.empty:
        return None
    P = plaza_data[['plaza_code', 'latitude', 'longitude']].dropna().values
    keys = []
    for lon, lat in loc.location:
        best, best_d = None, radius_m
        for code, plat, plon in P:
            if abs(plat - lat) > 0.01 or abs(plon - lon) > 0.01:
                continue
            d = haversine([lon, lat], [plon, plat])
            if d < best_d:
                best, best_d = code, d
        keys.append(best)
    loc['key'] = keys
    crossed = loc[loc['key'].notna()][['vehicleId', 'time', 'key']]
```

## What it found

The demo simulates 40 trucks on a fictional 700 km highway with 10 plazas. GPS noise, dropped pings and a toll-reader clock that is off by up to a minute are all built in. Fares are real NHAI fares for those plaza codes.

| Matching method | Crossings found | Median bill error | Trucks within 5% | Fleet total |
|---|---|---|---|---|
| Original: 2-decimal grid cell | 94% | 5.3% | 45% | -7.5% |
| Added: real distance, 400 m radius | 100% | 0.0% | 100% | -1.1% |

The grid method has a blind spot. A cell is about 1.1 km wide. When a plaza sits near a cell edge, a truck queuing on the other side of the line lands in the next cell and the crossing is missed. Nothing looks wrong. The bill is just quietly low.

The leftover 1.1% gap is not a matching problem. It comes from the half-fare shortcut. NHAI return fares are close to half, but not exactly half at every plaza. It is a small thing, but it is the kind of rounding a finance team will find before you do.

## What I would do next

Use the fare table's own return column instead of half the single fare, and test the plaza finder on a stretch with plazas packed close together, where a 400 m radius could pick the wrong one.
