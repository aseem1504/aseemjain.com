---
title: GPS device health scorecard
order: 6
repo: gps-device-health-scorecard
problem: Every tracker fault looks like "GPS not working", but each one needs a different fix from a different team.
built: A nightly job scores every device on 50 metrics, rolls them up by model, SIM network and installer, and says replace, escalate or leave alone.
result: A one-line speed check cut false "replace device" calls on healthy trucks from 70 of 72 to 3 of 72.
tags: [Python, AWS Lambda, pandas, Ops analytics]
steps:
  - label: "Nightly Lambda"
    sub: "100 vehicles per call"
  - label: "A 50-metric row"
    sub: "per device per day"
  - label: "Scorecard"
    sub: "model, SIM, installer"
  - label: "Rules"
    sub: "replace or escalate"
  - label: "Health score"
    sub: "one sortable number"
visual:
  kind: compare
  unit: ""
  beforeLabel: Original jump metric
  afterLabel: Speed-checked jump metric
  caption: Fake fleet of 100 trucks over 6 days, with five device models that each have a planted flaw.
  rows:
    - { label: Healthy trucks told to replace the device (of 72), before: 70, after: 3, max: 72 }
    - { label: Devices blacklisted, before: 36, after: 14, max: 36, note: "All 14 truly jumpy devices were caught both times. The original also flagged 22 healthy ones." }
workLink: At WheelsEye I was a founding member of the IoT and Labs team, working on device intelligence, network reliability and field diagnostics across a 200,000-truck fleet. This is a public rebuild of the kind of problem that team dealt with, on a fake fleet.
---

## Why it matters

A GPS business lives or dies on one promise: the dot on the map is right, and it is live. Every tracker that goes quiet becomes a support call, and often a lost customer.

Trackers fail for very different reasons. Some hardware models have weak GPS chips that throw the truck kilometres off the road. Some store data and upload it late, so the live map runs minutes behind. Some SIM networks drop out in parts of the country. Some installers wire devices badly. Each needs a different fix from a different team, and without a daily per-device view they all look the same.

## How it works

1. **A daily job (AWS Lambda).** It takes a batch of vehicle ids, finds each last ping, looks back 24 hours, and picks one of four paths: location plus heartbeat, location only, heartbeat only, or no data. A deployable SAM template runs it on a nightly schedule.
2. **One health row per device per day.** Fifty columns: ping counts and gaps, satellites and signal strength, server delay, GPS jumps over 500 m, driving and stopped time, blackouts.
3. **A scorecard.** Rows roll up by device model, SIM network and installer. That answers which hardware is failing, which SIM partner, and which installer.
4. **Actions.** If GPS jumps are more than 20% of a device's distance over more than 3 days, swap the device. Few wiring flags but jumpy GPS means replace. Repeated wiring flags mean send an installer.

## The key code

The fix. A hop over 500 m only counts as a GPS error if the truck would have needed more than 150 km/h to make it.

```python
df['speed_self_cal'] = df['distance'] / df['time_diff_cons_pings']   # m/s
# added: a >500 m hop only counts as a GPS error if the truck would have needed >150 km/h
impossible = df[(df['distance'] > 500) & (df['speed_self_cal'] > 150 / 3.6)]['distance'].sum()
```

## What it found

**The jump metric was measuring two different things.** The original counts any hop over 500 m between two pings as a jump. But when a truck loses network for an hour and reconnects 40 km down the highway, that is also a hop over 500 m. So it mixed bad GPS with bad network. Every device model scored 13 to 16%, and the truly jumpy one only stood out at 40%. Both action rules ran on that number, so healthy trucks were told to replace a good device. On a real fleet, a false "replace device" is a technician visit plus a new tracker. Getting this metric wrong is a cost line, not a rounding error.

**A single score hides what a customer feels.** One model scores 84, close to the best, but its pings reach the server almost 3 minutes late. A fleet owner watching the live map would call it broken. Before a score like this goes on a dashboard, someone has to decide what "healthy" means to the customer, and then the weights should follow that decision.

**Network beats hardware more often than people expect.** Health scores split as much by SIM network (76 against 89) as by device model, and a few installers fit most of the weak network's SIMs. A per-device view finds root causes like this. A per-ticket view never does.

## What I would do next

Set the health-score weights from what customers actually complain about, and show server delay on the same screen as the score.
