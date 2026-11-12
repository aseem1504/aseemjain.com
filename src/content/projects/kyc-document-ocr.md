---
title: KYC document OCR
order: 3
repo: kyc-document-ocr
problem: Owners uploaded the wrong document, the wrong side or a blurry photo, and every rejection meant another call.
built: Reads Aadhaar, PAN, voter ID and licence images, checks the type and the fields, and sends only the hard cases to a person.
result: PAN extraction went from 40% to 100% once I matched the shape of the value, and 87% of records go straight to the bank.
tags: [Python, OCR, Regex, Human-in-the-loop]
steps:
  - label: "Read the image"
    sub: "OCR, any engine"
  - label: "Check the type"
    sub: "keyword rules"
  - label: "Pull out fields"
    sub: "regex on value shape"
  - label: "Validate"
    sub: "checksum, then mask"
  - label: "Route"
    sub: "bank or manual review"
visual:
  kind: compare
  unit: "%"
  beforeLabel: Original rule (line after the label)
  afterLabel: Shape-based regex
  caption: PAN number extraction on 105 generated specimen documents. Nothing here is a real identity document.
  rows:
    - { label: PAN number found, before: 40, after: 100 }
workLink: At WheelsEye I co-ran KYC document verification at 1.5M-vehicle scale, using OCR batch extraction for Aadhaar and PAN and a manual-verification queue routed by extraction confidence. This is a small public rebuild of that idea on specimen data.
---

## Why it matters

To issue a FASTag through a partner bank, every truck owner needs KYC, usually Aadhaar and PAN. Owners upload photos from the field. Many uploads were the wrong document, the wrong side, too blurry or missing a field. The bank rejected those records, and every rejection meant another call to the owner.

Checking by hand did not scale across tens of thousands of records. The goal was to automate the easy cases and send people only the hard ones.

## How it works

1. **OCR** each image. The original used Google Vision. The demo uses Tesseract so it runs for free on any laptop.
2. **Check the document type** with keyword rules. "Unique Identification" points to Aadhaar back, "Election Commission" to voter ID, "Driving Licence" to a licence.
3. **Pull out fields** with regex: number, date of birth and gender from the front, pincode and phone from the back, PAN number and date of birth from the PAN card.
4. **Stitch front and back** into one image, so a vendor that charges per image reads both sides in one call.
5. **Route** each owner. Complete and valid records go to the bank. The rest go to manual review.

No real identity documents are in the repo. Every image is a generated specimen with a red "SPECIMEN - NOT A REAL DOCUMENT" banner.

## The key code

The fix for PAN, and the routing rule. The Aadhaar check uses the number's built-in Verhoeff check digit, which catches OCR misreads before the bank does.

```python
def pan_from_text(text):
    out = front_pan_card(text)
    m = re.findall(r'\b[A-Z]{5}\d{4}[A-Z]\b', text)
    if m:
        out['pan_number'] = m[-1]
    return out

def aadhaar_ok(number):
    n = re.sub(r'\s', '', number or '')
    return len(n) == 12 and n.isdigit() and verhoeff_ok(n)

def route_record(aadhaar_number, pan_number, address):
    if aadhaar_ok(aadhaar_number) and pan_ok(pan_number) and address:
        return 'send_to_bank'
    return 'manual_review'
```

## What it found

The demo renders 105 specimen images with slight tilt and blur, runs OCR on them and scores everything against the known answers. Document type, Aadhaar number, date of birth, gender, pincode and phone are all 100%. Routing sends 87% straight to the bank. The rest are the specimens planted with a bad Aadhaar checksum, which get caught and sent to review.

The PAN drop is the lesson. The original rule took "the line after Permanent Account Number". That worked on Google Vision, which returns tight lines. Tesseract puts a blank line between blocks, so the rule read an empty string 6 times out of 10. Same image, same rule, different OCR engine, and the result falls apart.

Rules that depend on layout break quietly when you change vendors. Rules that depend on the shape of the value itself, five letters, four digits, one letter, do not.

Only the last four digits of an Aadhaar number are kept for display. Storing full numbers creates a liability nobody needs.

## What I would do next

Return a confidence score for each field and route on that, instead of only on valid or invalid. That is closer to how the production queue worked, and it lets a person look at the uncertain ones first.
