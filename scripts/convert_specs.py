#!/usr/bin/env python3
"""Convert the Spec_*.pdf archives into readable markdown.

The spec files are ZIP archives of per-page JPEGs, each with a sibling .txt
holding that page's text layer. This pulls the text out in page order and
writes one markdown file per spec into specs/text/.

Markdown is committed so specs are reviewable in pull requests; the original
archives stay in specs/ as the source of truth for layout and screen mockups.

Usage:  python3 scripts/convert_specs.py
"""

import re
import zipfile
from pathlib import Path

SPEC_DIR = Path("specs")
OUT_DIR = SPEC_DIR / "text"


def page_number(name: str) -> int:
    match = re.match(r"(\d+)\.txt$", name)
    return int(match.group(1)) if match else 10**6


def clean(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Headers are letter-spaced in the source ("Z O D I A C"); collapse runs of
    # single characters back into words so the text is searchable.
    text = re.sub(
        r"(?:\b\w\s){3,}\w\b",
        lambda m: m.group(0).replace(" ", ""),
        text,
    )
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def convert(path: Path) -> tuple[Path, int] | None:
    try:
        archive = zipfile.ZipFile(path)
    except zipfile.BadZipFile:
        return convert_real_pdf(path)

    with archive:
        names = sorted(
            (n for n in archive.namelist() if n.endswith(".txt")),
            key=page_number,
        )
        if not names:
            return None

        parts = [f"# {path.stem}\n", f"*Converted from `{path.name}`.*\n"]
        for name in names:
            page = page_number(name)
            body = clean(archive.read(name).decode("utf-8", errors="replace"))
            parts.append(f"\n---\n\n## Page {page}\n\n{body}\n")

    out = OUT_DIR / f"{path.stem}.md"
    out.write_text("".join(parts), encoding="utf-8")
    return out, sum(len(p.split()) for p in parts)


def convert_real_pdf(path: Path) -> tuple[Path, int] | None:
    """Some specs are genuine PDFs rather than image archives."""
    try:
        import pypdf
    except ImportError:
        print(f"skipped {path.name} (pypdf not installed)")
        return None

    try:
        reader = pypdf.PdfReader(str(path))
    except Exception as exc:  # noqa: BLE001 - report and move on
        print(f"skipped {path.name} ({exc})")
        return None

    parts = [f"# {path.stem}\n", f"*Converted from `{path.name}`.*\n"]
    for number, page in enumerate(reader.pages, start=1):
        body = clean(page.extract_text() or "")
        if body:
            parts.append(f"\n---\n\n## Page {number}\n\n{body}\n")

    out = OUT_DIR / f"{path.stem}.md"
    out.write_text("".join(parts), encoding="utf-8")
    return out, sum(len(p.split()) for p in parts)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for path in sorted(SPEC_DIR.glob("*.pdf")):
        result = convert(path)
        if result is None:
            print(f"skipped {path.name} (no text layer)")
            continue
        out, words = result
        print(f"{out.name}: {words} words")


if __name__ == "__main__":
    main()
