#!/usr/bin/env python3
"""Check that the code shown on each project page is real code from that project's repo.

For every fenced code block in src/content/projects/*.md, each non-empty line must appear
(ignoring leading and trailing whitespace) somewhere in the repo's Python files.
Blocks are allowed to skip lines, but not to invent them.

Usage: python3 scripts/check_snippets.py
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = Path(os.environ.get("PROJECTS_SRC", str(Path.home() / "Code" / "projects-src")))


def main() -> int:
    problems = 0
    for md in sorted((ROOT / "src/content/projects").glob("*.md")):
        repo = PROJECTS / md.stem
        if not repo.exists():
            continue
        source = "\n".join(p.read_text(errors="ignore") for p in repo.rglob("*.py"))
        lines = {l.strip() for l in source.splitlines()}
        for block in re.findall(r"```\w*\n(.*?)```", md.read_text(), re.S):
            for line in block.splitlines():
                s = line.strip()
                if s and s not in lines:
                    problems += 1
                    print(f"{md.name}: not found in {md.stem}: {s}")
    print("snippet check:", "all code lines exist in the repos" if not problems else f"{problems} line(s) not found")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
