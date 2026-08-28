#!/usr/bin/env python3
"""Check data/*.csv against the integrity rules in CLAUDE.md.

Run before opening a pull request that touches data/:

    python scripts/check_data.py

Exits non-zero and prints every failure it finds. Rules encoded here are the
ones CLAUDE.md states in prose, plus two the app depends on that were only
implicit: cards_involved must not repeat a card, and a Board Matching node
needs at least two cards.
"""

import csv
import sys
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
FORMATS = {"A1", "A2", "A3", "A4", "A5", "A7", "B", "C"}

problems = []


def fail(message):
    problems.append(message)


def read(name):
    with open(DATA / name, encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def split(value):
    return [part.strip() for part in (value or "").split("|") if part.strip()]


def main():
    nodes = read("data_curriculum_nodes.csv")
    units = read("data_unit_metadata.csv")
    base = read("data_tarot_cards_base.csv")
    card_keys = {row["card_key"] for row in base}

    # global_play_order is contiguous and unique
    order = [int(row["global_play_order"]) for row in nodes]
    if order != list(range(1, len(order) + 1)):
        duplicates = [n for n, count in Counter(order).items() if count > 1]
        fail(
            "global_play_order is not a contiguous 1..N sequence"
            + (f" (repeated: {sorted(duplicates)})" if duplicates else "")
        )

    seen_ids = set()
    for row in nodes:
        node_id = row["node_id"]

        if node_id in seen_ids:
            fail(f"{node_id}: duplicate node_id")
        seen_ids.add(node_id)

        # node_id matches its unit, section and node numbers
        if row["node_type"] == "standard":
            expected = (
                f"U{row['unit_number']}-S{row['section_number_global']}"
                f"-N{row['node_number']}"
            )
            if node_id != expected:
                fail(f"{node_id}: node_id should be {expected}")

        if row["format_code"] not in FORMATS:
            fail(f"{node_id}: format_code {row['format_code']!r} is not one of "
                 + "/".join(sorted(FORMATS)))

        involved = split(row["cards_involved"])

        for key in involved:
            if key not in card_keys:
                fail(f"{node_id}: cards_involved names unknown card {key!r}")

        if len(set(involved)) != len(involved):
            repeated = sorted(k for k, c in Counter(involved).items() if c > 1)
            fail(f"{node_id}: cards_involved repeats {repeated} — a grid would "
                 "show two identical options")

        # Only standard nodes lead with their own card. A throwback deliberately
        # pulls the stalest cards instead, and carries the section's card_key
        # only as denormalised context.
        if (
            row["node_type"] == "standard"
            and row["card_key"]
            and involved
            and involved[0] != row["card_key"]
        ):
            fail(f"{node_id}: cards_involved should start with the node's own "
                 f"card ({row['card_key']}), got {involved[0]}")

        # Board Matching needs something to match against.
        if row["format_code"] == "C" and len(involved) < 2:
            fail(f"{node_id}: format C with {len(involved)} card(s)")

    # Unit metadata agrees with the nodes it describes
    for unit in units:
        number = unit["unit_number"]
        own = [row for row in nodes if row["unit_number"] == number]
        counts = Counter(row["node_type"] for row in own)

        for column, actual in (
            ("total_node_count", len(own)),
            ("standard_node_count", counts["standard"]),
            ("throwback_node_count", counts["throwback"]),
        ):
            if int(unit[column]) != actual:
                fail(f"unit {number}: {column} says {unit[column]}, nodes say {actual}")

        covered = set(split(unit["card_keys_covered"]))
        if len(covered) != int(unit["card_count"]):
            fail(f"unit {number}: card_count says {unit['card_count']}, "
                 f"card_keys_covered lists {len(covered)}")

        taught = {row["card_key"] for row in own if row["card_key"]}
        if not taught <= covered:
            fail(f"unit {number}: nodes teach cards missing from "
                 f"card_keys_covered: {sorted(taught - covered)}")
        if covered - taught:
            fail(f"unit {number}: card_keys_covered lists cards no node teaches: "
                 f"{sorted(covered - taught)}")

        # The three estimates are 60s / 90s / 150s per node.
        for column, seconds in (
            ("est_completion_minutes_best_case", 60),
            ("est_completion_minutes_typical", 90),
            ("est_completion_minutes_with_mistakes", 150),
        ):
            expected = round(len(own) * seconds / 60)
            if abs(int(unit[column]) - expected) > 1:
                fail(f"unit {number}: {column} says {unit[column]}, "
                     f"{len(own)} nodes at {seconds}s is {expected}")

    # Every card that a symbol-format node teaches must have a symbol
    symbols = {row["card_key"] for row in read("data_major_arcana_symbols.csv")}
    suits = {row["card_key"]: row["suit"] for row in base}
    for row in nodes:
        if row["format_code"] in {"A4", "A5", "A7"}:
            key = row["card_key"]
            has_symbol = key in symbols or (
                key.endswith("_ace") and suits.get(key)
            )
            if not has_symbol:
                fail(f"{row['node_id']}: {row['format_code']} on {key}, which has "
                     "no symbol in data_major_arcana_symbols.csv and is not an Ace")

    # Content every format reads must be present
    for name, key_field, label in (
        ("data_card_keywords.csv", "card_key", "keywords"),
        ("data_card_talking_points.csv", "card_key", "talking points"),
        ("data_card_descriptions.csv", "card_key", "a description"),
    ):
        present = {row[key_field] for row in read(name)}
        missing = sorted(card_keys - present)
        if missing:
            fail(f"{len(missing)} card(s) have no {label}: {missing[:5]}")

    if problems:
        print(f"{len(problems)} problem(s) found:\n")
        for problem in problems:
            print("  " + problem)
        return 1

    print(f"data/ looks consistent — {len(nodes)} nodes, {len(units)} units, "
          f"{len(card_keys)} cards")
    return 0


if __name__ == "__main__":
    sys.exit(main())
