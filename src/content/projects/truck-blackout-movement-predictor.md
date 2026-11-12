---
title: Truck blackout movement predictor
order: 5
repo: truck-blackout-movement-predictor
problem: When a tracker goes dark, ops cannot visit every case. Is the truck parked, or hidden?
built: A readable logistic regression gives every blackout a chance of movement, then turns it into a visit plan by capacity or by cost.
result: Visiting the riskiest 10% finds a truck that really moved 90% of the time, against 55% for a random visit.
tags: [Python, Logistic regression, Odds ratios, Decision cut-offs]
steps:
  - label: "A blackout"
    sub: "tracker goes quiet"
  - label: "Honest features"
    sub: "no peeking at the answer"
  - label: "Logistic model"
    sub: "odds ratios in words"
  - label: "Risk score"
    sub: "chance the truck moved"
  - label: "Visit plan"
    sub: "by capacity or cost"
visual:
  kind: compare
  unit: "%"
  beforeLabel: Random visit
  afterLabel: Model's riskiest picks
  caption: Share of visited trucks that really moved, on 3,000 synthetic blackout events where 55% of trucks moved.
  rows:
    - { label: Visit the riskiest 10%, before: 55, after: 90 }
    - { label: Visit the riskiest 20%, before: 55, after: 85 }
    - { label: Visit the riskiest 30%, before: 55, after: 80 }
    - { label: Visit the riskiest 50%, before: 55, after: 74 }
workLink: This is the same family of problem as my IoT engineer work at WheelsEye, where I built a logistic regression to predict GPS no-info-zone exit across a 200K-truck fleet. Here the model is rebuilt in public on synthetic data.
---

## Why it matters

Trackers go quiet all the time. Most of it is honest: a truck sits in a garage, a SIM dies, a wire works loose. Some of it is not. A driver cuts the power wire to run an unofficial trip, or to hide a truck the bank wants back.

On the dashboard both look the same. Ops could not visit every blackout. Lenders who financed the trucks cared about one thing: is this truck really parked, or is someone hiding it? The model gives every blackout a probability that the truck moved while dark, and ops visits the riskiest ones first.

## How it works

**The target.** Take the last ping before the blackout and the first ping after it. If they are more than 1 km apart, the truck moved while hidden.

**The features.** Only what is known the moment the tracker goes quiet: device model, SIM network, wiring flags from the last few days, how many blackouts the truck had in the last 30 days, whether it was driving or parked just before, and the time of day.

**The model.** Logistic regression. I chose it because ops has to trust it. Every coefficient turns into a plain sentence, like "a power cut while driving makes the odds of movement 3.7 times higher". A random forest sits in the repo as a yardstick, and it does not beat the simple model.

## The key code

The odds ratio is e raised to the power of the coefficient. Above 1 pushes toward "moved". Below 1 pushes toward "parked".

```python
def odds_ratios(X, y):
    pipe = honest_pipeline(X).fit(X, y)
    names = pipe.named_steps['prep'].get_feature_names_out()
    names = [n.split('__', 1)[1] for n in names]
    coef = pipe.named_steps['lr'].coef_[0]
    out = pd.DataFrame({'feature': names, 'coef': coef, 'odds_ratio': np.exp(coef)})
    return out.reindex(out.coef.abs().sort_values(ascending=False).index).reset_index(drop=True).round(3)
```

## What it found

| Feature | Odds ratio | In plain words |
|---|---|---|
| Parked just before going dark | 0.25 | Odds of movement drop to a quarter |
| Power cut while driving | 3.7 | Odds go up 3.7 times |
| Ignition wire cut | 2.3 | Odds more than double |
| Went dark at night | 1.5 | Odds up by half |

The original 2020 notebook reported 98% accuracy. It was fake. The feature list included the exact distance the target is built from. Rerun that recipe on the synthetic data and it scores 99.7%. Take that one column out and the same recipe drops to 62%.

A model score is not a decision, so the demo shows two ways to decide. When visits are capped, send agents to the top of the list: the top 10% finds a truck that moved 90% of the time. When they are not capped, pick the cut-off from what each mistake costs. If a missed hidden truck costs three times a wasted visit, the best cut-off flags 89% of all blackouts. At that point the model is not saving visits. The better product move is a cheaper first check, like an automated call to the driver, before a field visit. The model tells you when that is worth building.

All data is synthetic, so the results show how the method behaves, not how well it did in production.

## What I would do next

Test the cost-based cut-off with real visit costs, and build the cheap first check the model points to.
