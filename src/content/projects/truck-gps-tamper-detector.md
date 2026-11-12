---
title: Truck GPS tamper detector
order: 4
repo: truck-gps-tamper-detector
problem: A tracker that goes quiet looks the same whether it is a loose wire or a deliberate cut.
built: A rule engine names the wiring fault from one day of pings, and a model guesses whether the truck moved while it was dark.
result: The first model scored 0.94 accuracy because it could see the answer. With the leak removed, the honest score is 0.71.
tags: [Python, scikit-learn, Rule engine, Target leakage]
steps:
  - label: "Daily pings"
    sub: "power, ignition, voltage"
  - label: "Rule engine"
    sub: "names the wiring fault"
  - label: "Blackout features"
    sub: "known when it goes dark"
  - label: "Model"
    sub: "did the truck move?"
  - label: "Field visit"
    sub: "riskiest first"
visual:
  kind: compare
  unit: ""
  beforeLabel: With the leaky feature (as in the original)
  afterLabel: Honest features
  caption: Logistic regression on 3,000 synthetic blackout events. The leaky feature was the exact distance the target is calculated from.
  rows:
    - { label: Accuracy, before: 0.94, after: 0.71, max: 1 }
    - { label: Precision, before: 1.0, after: 0.72, max: 1 }
    - { label: ROC AUC, before: 0.99, after: 0.78, max: 1 }
workLink: At WheelsEye I was a founding member of the IoT and Labs team, working on device intelligence, network reliability and field diagnostics across a 200,000-truck fleet. This repo is a public rebuild of the kind of problem that team dealt with, on synthetic data.---
---

## Why it matters

A truck tracker is only useful if it stays connected. In practice a lot of trackers go quiet. Some of that is honest: a loose wire, a dead SIM, a truck parked in a garage with the battery pulled. Some of it is not. A driver who wants to run an unofficial trip cuts the power wire and the truck goes dark.

From the dashboard, all of these look the same: "No info". The ops team could not tell a loose wire from a deliberate cut, so every case got the same slow field visit. Fleet owners, and the lenders who financed the trucks, cared about one question. Is this truck really parked, or is someone hiding it?

## How it works

**Step 1. A rule engine reads one day of pings and names the wiring fault.** Each ping carries a few signals: is external power on, is the ignition on, battery voltage, location and time. Each fault leaves a fingerprint. The key move is telling a deliberate cut from a garage repair. Both cut power. Only one happens while the truck is moving.

**Step 2. A model guesses whether the truck moved while it was dark.** For every blackout it builds features from what is known the moment the tracker goes quiet. The target is simple. Was the first ping after the blackout more than 1 km from the last ping before it?

## The key code

An intentional cut and a maintenance cut share two conditions. They differ only in the truck's speed while the power is off.

```python
intentional_wire_cut = (charge_off_Speed > 10 / 3.6) & (wire_cut_time > 3600) & (min_voltage_pct_when_wire_cut < 60)
maintainence_wire_cut = (charge_off_Speed < 2 / 3.6) & (wire_cut_time > 3600) & (min_voltage_pct_when_wire_cut < 60)
wire_loose = fluctuations > 2
```

## What it found

The original notebook got great accuracy. It was fake. The feature list included `displacement_travelled`, which is the exact number the target is calculated from. The model was being shown the answer.

This is called target leakage, and it is easy to miss when the feature list is long and built by many helper functions. The fix is a simple rule: only use what you would know at the moment you need to make the call. The honest model scores lower, and it is the only one that would work in the real world.

It also changes the product question. At 0.72 precision, about 1 in 4 flagged trucks did not actually move. Is that good enough to send a field agent, or to tell a bank a truck might be hidden? That depends on what a wasted visit costs compared with a missed one. A model score alone does not settle it.

The rules overlap too. When the power wire is hooked to ignition, `wire_loose` fires as well, because power toggles with the engine. In production the rules need a priority order before they go to a field team, or one truck gets two different repair tickets.

## What I would do next

Add the priority order between rules, and pair this with the cost-based cut-offs in the blackout predictor, so the output is a visit plan and not a flag.
