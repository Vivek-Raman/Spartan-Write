#!/usr/bin/env python3
"""Update project version across frontend, Rust, and Python packages."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def _replace_in_file(path: Path, pattern: str, replacement: str) -> bool:
    content = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
    if count == 0:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def set_version(version: str) -> list[str]:
    changed: list[str] = []

    targets: list[tuple[Path, str, str]] = [
        (
            ROOT / "frontend" / "package.json",
            r'^(\s*"version"\s*:\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "frontend" / "src-tauri" / "tauri.conf.json",
            r'^(\s*"version"\s*:\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "frontend" / "src-tauri" / "Cargo.toml",
            r'^(version\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "server" / "pyproject.toml",
            r'^(version\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "sidecar" / "pyproject.toml",
            r'^(version\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "user-guide" / "pyproject.toml",
            r'^(version\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "server" / "core" / "__init__.py",
            r'^(__version__\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "sidecar" / "core" / "__init__.py",
            r'^(__version__\s*=\s*")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
        (
            ROOT / "user-guide" / "uv.lock",
            r'(\[\[package\]\]\nname = "spartan-write-user-guide"\nversion = ")[^"]+(")',
            rf'\g<1>{version}\2',
        ),
    ]

    for path, pattern, replacement in targets:
        if _replace_in_file(path, pattern, replacement):
            changed.append(str(path.relative_to(ROOT)))

    return changed


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Update Spartan Write version across project files."
    )
    parser.add_argument("version", help='Semantic version, e.g. "1.0.0"')
    args = parser.parse_args()

    if not re.fullmatch(r"\d+\.\d+\.\d+", args.version):
        raise SystemExit("Version must be in MAJOR.MINOR.PATCH format (e.g. 1.0.0)")

    changed = set_version(args.version)
    if not changed:
        print("No files changed.")
        return

    print(f"Updated version to {args.version} in:")
    for rel_path in changed:
        print(f"- {rel_path}")


if __name__ == "__main__":
    main()
