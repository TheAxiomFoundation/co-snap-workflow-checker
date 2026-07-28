#!/usr/bin/env python3
"""Verify that every proof excerpt in public/rulespec/ appears verbatim in
axiom-corpus provision bodies.

Comparison is exact after collapsing whitespace runs (corpus bodies contain
line breaks; module excerpts are single-line). Set AXIOM_CORPUS to point at a
checkout of axiom-corpus (default: ~/axiom-corpus).
"""

import glob
import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_ROOT = os.environ.get(
    "AXIOM_CORPUS", os.path.expanduser("~/axiom-corpus")
)

PROVISION_FILES = [
    "data/corpus/provisions/us-ny/manual/2026-05-27-ny-snap-source-book.jsonl",
    "data/corpus/provisions/us-co/regulation/2026-07-16-10-ccr-2506-1.jsonl",
]


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def load_bodies() -> dict[str, str]:
    bodies: dict[str, str] = {}
    for relative in PROVISION_FILES:
        path = os.path.join(CORPUS_ROOT, relative)
        if not os.path.exists(path):
            sys.exit(f"missing corpus provisions file: {path}")
        with open(path) as handle:
            for line in handle:
                row = json.loads(line)
                bodies[row["citation_path"]] = norm(row.get("body") or "")
    return bodies


def collect_excerpts() -> list[tuple[str, str, str]]:
    pattern = re.compile(
        r'corpus_citation_path:\s*(\S+)(?:\n\s*excerpt:\s*"((?:[^"\\]|\\.)*)")?'
    )
    excerpts = []
    for module_path in glob.glob(
        os.path.join(REPO_ROOT, "public/rulespec/**/*.yaml"), recursive=True
    ):
        text = open(module_path).read()
        name = module_path.split("/rulespec/")[1]
        for match in pattern.finditer(text):
            citation_path, excerpt = match.group(1), match.group(2)
            if excerpt:
                excerpts.append((name, citation_path, excerpt))
    return excerpts


def main() -> int:
    bodies = load_bodies()
    excerpts = collect_excerpts()
    failures = 0
    for module_name, citation_path, excerpt in excerpts:
        candidates = [
            body
            for path, body in bodies.items()
            if path == citation_path
            or path.startswith(citation_path + "/")
            or path.startswith(citation_path + ".")
        ]
        found = any(norm(excerpt) in body for body in candidates)
        status = "VERBATIM " if found else "NOT FOUND"
        if not found:
            failures += 1
        preview = excerpt if len(excerpt) <= 60 else excerpt[:60] + "..."
        print(f'{status} | {module_name} | {citation_path} | "{preview}"')
    print(f"\n{len(excerpts)} excerpts checked, {failures} not found verbatim")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
