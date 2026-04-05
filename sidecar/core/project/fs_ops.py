from pathlib import Path


def _resolved_under_root(root: Path, relative: str) -> Path:
    """Return absolute path for `relative` if it stays under `root`; else raise ValueError."""
    root_r = root.resolve()
    candidate = (root_r / relative).resolve()
    try:
        candidate.relative_to(root_r)
    except ValueError as e:
        raise ValueError(f"Path escapes project root: {relative!r}") from e
    return candidate


def delete_file(root: Path, relative: str) -> None:
    path = _resolved_under_root(root, relative)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {relative}")
    if not path.is_file():
        raise ValueError(f"Path is not a file: {relative}")
    path.unlink()


def rename_file(root: Path, from_relative: str, to_relative: str) -> None:
    src = _resolved_under_root(root, from_relative)
    dst = _resolved_under_root(root, to_relative)
    if not src.exists():
        raise FileNotFoundError(f"File not found: {from_relative}")
    if not src.is_file():
        raise ValueError(f"Path is not a file: {from_relative}")
    if src == dst:
        return
    if dst.exists():
        raise ValueError(f"Destination already exists: {to_relative}")
    dst.parent.mkdir(parents=True, exist_ok=True)
    src.rename(dst)
