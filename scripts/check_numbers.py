#!/usr/bin/env python3
"""Check that every number, rupee amount and percentage on the site traces back to a source.

Usage:
  python3 scripts/check_numbers.py          # checks the built site in dist/
  python3 scripts/check_numbers.py --src    # checks src/content, src/pages and src/components

Sources of truth (text is extracted fresh on every run):
  * Work and story figures must appear in the public CV (public/Aseem_Jain_CV.pdf) or the master CV (.docx).
  * Figures inside a project card or project page may also come from that project's own README
    (~/Code/projects-src/<slug>/README.md), because the results are the repo's own demo results.
  * Code blocks (<pre>) are skipped here. scripts/check_snippets.py checks them against the repo source.

Reviewed exceptions live in scripts/number_allowlist.txt, one per line: `token  # reason`.
"""
import html
import os
import re
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_CV = ROOT / "public" / "Aseem_Jain_CV.pdf"
MASTER_CV = Path(os.environ.get(
    "MASTER_CV",
    str(Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Placements/Organised stuff/Resumes/MASTER CV Aseem Jain v3 8th Oct.docx"),
))
PROJECTS = Path(os.environ.get("PROJECTS_SRC", str(Path.home() / "Code" / "projects-src")))
ALLOWLIST = ROOT / "scripts" / "number_allowlist.txt"

# A number with an optional rupee sign and an optional unit.
TOKEN = re.compile(r"₹?\d[\d,]*(?:\.\d+)?(?:%|\s?(?:Cr|L|K|M|x|s|m)\b)?", re.I)
CARD = re.compile(r"<article[^>]*\bproject-card\b[^>]*>.*?</article>", re.S)
PRE = re.compile(r"<pre\b.*?</pre>", re.S)


def norm(t: str) -> str:
    return t.replace("₹", "").replace(",", "").replace(" ", "").lower().rstrip("+")


def tokens(text: str) -> set[str]:
    return {norm(m.group(0)) for m in TOKEN.finditer(text)}


def pdf_text(p: Path) -> str:
    return subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout


def docx_text(p: Path) -> str:
    x = zipfile.ZipFile(p).read("word/document.xml").decode("utf8")
    out = []
    for para in re.findall(r"<w:p[ >].*?</w:p>", x, re.S):
        # Match <w:t> and <w:t xml:space=...> only, never <w:tab/>, <w:tbl> and friends.
        out.append("".join(re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", para, re.S)))
    return html.unescape("\n".join(out))


def visible_text(raw: str) -> str:
    raw = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return html.unescape(raw)


def readme_tokens(slug: str) -> set[str]:
    p = PROJECTS / slug / "README.md"
    if not p.exists():
        print(f"warning: no README for {slug} at {p}")
        return set()
    return tokens(p.read_text())


def main() -> int:
    src = "--src" in sys.argv
    cv = tokens(pdf_text(PUBLIC_CV))
    if MASTER_CV.exists():
        cv |= tokens(docx_text(MASTER_CV))
    else:
        print(f"warning: master CV not found at {MASTER_CV}")

    allowed: set[str] = set()
    if ALLOWLIST.exists():
        for line in ALLOWLIST.read_text().splitlines():
            line = line.split("#")[0].strip()
            if line:
                allowed.add(norm(line))

    bad: dict[str, set[str]] = {}

    def check(text: str, label: str, extra: set[str] = frozenset()):
        for tok in tokens(text):
            if tok in cv or tok in allowed or tok in extra:
                continue
            bad.setdefault(tok, set()).add(label)

    if src:
        for base in ("src/content", "src/pages", "src/components"):
            for p in (ROOT / base).rglob("*"):
                if p.suffix not in {".json", ".md", ".astro", ".mdx"} or "project-data" in p.parts:
                    continue
                raw = p.read_text(errors="ignore")
                slug = p.stem if "projects" in p.parts else None
                check(raw, str(p.relative_to(ROOT)), readme_tokens(slug) if slug else frozenset())
    else:
        for f in sorted((ROOT / "dist").rglob("*.html")):
            rel = f.relative_to(ROOT / "dist")
            raw = PRE.sub(" ", f.read_text(errors="ignore"))
            if rel.parts[:1] == ("projects",) and len(rel.parts) >= 2:
                check(visible_text(raw), str(rel), readme_tokens(rel.parts[1]))
            else:
                for card in CARD.findall(raw):
                    m = re.search(r"/projects/([a-z0-9-]+)", card)
                    slug = m.group(1) if m else ""
                    check(visible_text(card), f"{rel} (card: {slug})", readme_tokens(slug))
                check(visible_text(CARD.sub(" ", raw)), str(rel))

    if not bad:
        print("number check: every figure traces to a CV or the project's own README")
        return 0
    print(f"number check: {len(bad)} figure(s) with no source\n")
    for tok in sorted(bad):
        print(f"  {tok:>10}   {', '.join(sorted(bad[tok]))}")
    print("\nFix the copy, or add a reviewed exception to scripts/number_allowlist.txt")
    return 1


if __name__ == "__main__":
    sys.exit(main())
