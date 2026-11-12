---
title: Vehicle make and model normalizer
order: 7
repo: vehicle-make-model-normalizer
problem: The same truck model appears dozens of ways in the registry, which breaks every report that groups by model.
built: Cleans messy registration strings into a make and a model, using fuzzy matching and a regex built from a list of known models.
result: Taking the best fuzzy match instead of the first one lifts make accuracy from 85% to 91%, and makes it independent of a hand-picked threshold.
tags: [Python, Fuzzy matching, Regex, Data cleaning]
steps:
  - label: "Messy string"
    sub: "TATA MOTORS LTD/LPT 2518"
  - label: "Drop the junk"
    sub: "blanks, dates, GVW"
  - label: "Snap the maker"
    sub: "fuzzy match to OEMs"
  - label: "Find the model"
    sub: "regex from a grid"
  - label: "Clean result"
    sub: "TATA 2518"
visual:
  kind: compare
  unit: "%"
  beforeLabel: First match over the threshold (original)
  afterLabel: Best match
  caption: Make accuracy on 4,000 synthetic registry strings, at three fuzzy-match thresholds.
  rows:
    - { label: Threshold 50, before: 82, after: 91 }
    - { label: Threshold 70, before: 85, after: 91 }
    - { label: Threshold 90, before: 91, after: 91 }
workLink: As a data analyst at WheelsEye I developed the VAHAN national vehicle registry pipeline, with a web scraper and pandas cleaning that normalised make and model variants into canonical records. This repo rebuilds the cleaning step on synthetic strings.
---

## Why it matters

Every truck in India has a maker and model entry in the government vehicle registry (VAHAN). It is free text, typed at hundreds of RTOs over decades, so the same truck model shows up dozens of ways: `TATA MOTORS LTD/LPT 2518 TC`, `M/S TATA MOTORS/LPK 2518 TIPPER`, `TATA MOTORS LIMITED / LPT 25.18`.

That breaks anything that groups by model. The business needed clean make and model to compare how different trucks are used, to build utilisation reports for lenders, and to match trucks to the right GPS installation and FASTag class.

## How it works

1. Drop junk rows: blanks, Excel dates sitting in the text column, and "GVW upto ..." range entries.
2. Split on `/` into maker and model.
3. Snap the maker to a known OEM list with fuzzy matching.
4. Pull model codes out with one big regex built from a grid of known models. Four-digit codes also match with any separator, so `25.18`, `25-18` and `25 18` all become `2518`.
5. Clean each match and join.

The grid is a living list. In the original, unmatched strings were pushed to a sheet, a person added the right answer, and the next run picked it up.

## The key code

The original takes the first OEM that clears the bar. The variant takes the best one.

```python
def OEM_categorisation(x, threshold=70):
    """First OEM whose partial fuzzy score beats the threshold wins (order matters)."""
    for i in OEM_LIST:
        if fuzz.partial_ratio(x, i) > threshold:
            return i
    return x

def OEM_best_match(x, threshold=70):
    scores = [(fuzz.partial_ratio(x, i), i) for i in OEM_LIST]
    best = max(scores)
    return best[1] if best[0] > threshold else x
```

## What it found

On 4,000 synthetic strings with known answers, make is correct 85% of the time and model 93%. The misses on model are the newer models left out of the grid on purpose. Junk rows are correctly left without a model every time.

The make errors are more interesting than the score. A Daimler string turned into `VE COMMERCIAL`, because that name sits earlier in the list and scores over 70 on a partial match. That is a rule-order bug: the rule takes the first match over the line, not the best one.

Raising the threshold to 90 looks like a fix, but it only hides the ordering bug by refusing more matches. Best match gets the same score at any threshold, so the result no longer depends on a number someone picked by hand.

The remaining 9% is a list problem, not a scoring one: abbreviations like VECV, and "M/S" prefixes. A short alias table beats any threshold tuning. Model recall is capped by how fresh the grid is, so the review loop that feeds it matters more than the regex.

## What I would do next

Score an LLM-based normalizer against the same 4,000 strings, on accuracy and on cost per string. The labelled set and the baseline are what make that comparison fair.
