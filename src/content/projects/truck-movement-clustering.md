---
title: Truck movement clustering
order: 2
repo: truck-movement-clustering
problem: Registration data says nothing about where a truck runs, and a GPS trail is millions of points.
built: Groups trucks by the places they really visit, tags each with the regions it covers, and finds the workshops where trucks get serviced.
result: On synthetic data it finds the hidden lanes with 0.95 agreement, where K-Means scores 0.86, and finds all 8 workshops within 60 m.
tags: [Python, DBSCAN, HDBSCAN, Geospatial]
steps:
  - label: "GPS footprints"
    sub: "top 10 places per truck"
  - label: "Truck by place"
    sub: "a grid of 0s and 1s"
  - label: "Two-layer DBSCAN"
    sub: "lanes, then sub-lanes"
  - label: "Region tags"
    sub: "every region above 20%"
  - label: "Workshop hubs"
    sub: "HDBSCAN, 5+ trucks"
visual:
  kind: map-india
  caption: The ten hidden lanes and eight workshops in the demo's synthetic fleet, drawn from its own output.
workLink: At WheelsEye the analytics work fed lenders. I engineered behavioural features such as round-trip frequency and city-level routes that they used as risk inputs for an asset class with no reliable credit history. Knowing which regions a truck actually works in is the same kind of signal.
---

## Why it matters

Truck owners describe their business in lanes: "Delhi to Mumbai", "local in Pune", "anything going east". But registration data says nothing about where a truck runs, and a GPS trail is millions of points. The business needed movement profiles for three jobs: knowing which lanes the fleet really serves, telling lenders which regions a financed truck works in, and placing installers and service partners where trucks actually stop.

## How it works

- **Movement similarity (two-layer DBSCAN).** Every truck has its top 10 most visited location clusters. Turn that into a truck-by-cluster matrix of 0s and 1s and run DBSCAN so trucks with nearly the same footprint group together. Then run DBSCAN again inside each group to split big lanes into sub-lanes.
- **Region profile.** Add up each truck's time share by region and tag it with every region above 20%. A Delhi to Mumbai truck becomes `NORTH + WEST`.
- **Maintenance hubs (HDBSCAN).** Take the hour of slow pings before every "battery disconnected" event and cluster them with real distances on the globe. Dense spots used by many trucks are workshops. They are also the places to watch for tampering.

## The key code

The hub finder. One line of it is a product decision, not maths.

```python
def find_hubs(pings, min_cluster_size=15, min_vehicles=5):
    import hdbscan
    p = pings[pings['speed'] < 5].copy()
    lonlat = np.array(p['location'].tolist())
    rads = np.radians(lonlat[:, ::-1])  # -> [lat, lon]
    clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric='haversine').fit(rads)
    p['cluster'] = clusterer.labels_
    hubs = (p[p.cluster >= 0].groupby('cluster')
            .agg(latitude=('latitude', 'median'), longitude=('longitude', 'median'),
                 pings=('time', 'size'), vehicles=('vehicleId', 'nunique'))
            .sort_values('vehicles', ascending=False).reset_index())
    # one truck parked for a long time is not a hub; ask for several distinct trucks
    hubs = hubs[hubs.vehicles >= min_vehicles].reset_index(drop=True)
    return hubs, p
```

## What it found

The demo builds 1,200 trucks on 10 hidden lanes, plus pre-disconnect pings around 8 hidden workshops.

- Two-layer DBSCAN finds 18 groups and leaves 2% of trucks as noise. Agreement with the hidden lanes is 0.95 on the adjusted Rand index, where 1.0 is perfect. K-Means, even when told the right number of lanes, scores 0.86.
- Region tags come out right for every lane. Delhi to Kolkata trucks read `NORTH + EAST`.
- All 8 workshops are found, each within 60 m, once you ask for at least 5 different trucks per hub.

DBSCAN beat K-Means without being told how many lanes exist, which matters because nobody knows the real number of lanes in a fleet. It also leaves odd trucks as noise instead of forcing them into a group. A truck that does random trips should not be sold as a Delhi to Mumbai regular.

Without the "at least 5 different trucks" rule, HDBSCAN returns 96 hubs, most of them a single truck parked for a long time. Clustering finds dense spots. Deciding which dense spots matter is a business call.

## What I would do next

Reverse-geocode each hub to a place name, which the original left in a notebook because it needed an internal collection, and test how stable the lanes are as trucks change routes over a season.
