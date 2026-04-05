import warnings
from pathlib import Path

from core.utils import read_json

from .models import DashboardRow, DashboardSummary
from .utils import row_from_raw_metadata


def _iter_model_roots(base_dir: Path) -> list[tuple[str, Path]]:
    """Return (model_label, root) where root / 'data' holds benchmark runs.

    Expects ``<base_dir>/<model_name>/data/<job>/``. There is no flat
    ``<base_dir>/data/`` layout.
    """
    roots: list[tuple[str, Path]] = []
    if not base_dir.is_dir():
        return roots
    for m in sorted(base_dir.iterdir()):
        if m.is_dir() and (m / "data").is_dir():
            roots.append((m.name, m))
    return roots


def load_dashboard(base_dir: Path) -> DashboardSummary:
    rows: list[DashboardRow] = []

    for model_label, root in _iter_model_roots(base_dir):
        data_dir = root / "data"
        for job_dir in sorted([p for p in data_dir.iterdir() if p.is_dir()]):
            metadata_file = job_dir / "metadata.json"
            if not metadata_file.exists():
                continue

            raw_metadata = read_json(metadata_file)
            try:
                rows.append(
                    row_from_raw_metadata(model_label, job_dir.name, raw_metadata)
                )
            except ValueError as e:
                warnings.warn(
                    f"Skipping {metadata_file}: {e}",
                    UserWarning,
                    stacklevel=1,
                )

    rows.sort(key=lambda r: (r.model, r.job_id))

    completed_jobs = sum(1 for row in rows if row.status == "completed")
    failed_jobs = sum(1 for row in rows if row.status == "failed")
    pending_jobs = len(rows) - completed_jobs - failed_jobs

    return DashboardSummary(
        base_dir=base_dir,
        total_jobs=len(rows),
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        pending_jobs=pending_jobs,
        rows=rows,
    )
