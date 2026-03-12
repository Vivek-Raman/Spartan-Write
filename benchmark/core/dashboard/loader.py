from pathlib import Path

from core.utils import BenchmarkMetadata, read_json

from .models import DashboardRow, DashboardSummary
from .utils import build_row


def load_dashboard(base_dir: Path) -> DashboardSummary:
    data_dir = base_dir / "data"
    rows: list[DashboardRow] = []

    if not data_dir.exists():
        return DashboardSummary(
            base_dir=base_dir,
            total_jobs=0,
            completed_jobs=0,
            failed_jobs=0,
            pending_jobs=0,
            rows=[],
        )

    for job_dir in sorted([p for p in data_dir.iterdir() if p.is_dir()]):
        metadata_file = job_dir / "metadata.json"
        if not metadata_file.exists():
            continue

        raw_metadata = read_json(metadata_file)
        metadata = BenchmarkMetadata.from_dict(raw_metadata)
        rows.append(build_row(job_dir.name, metadata))

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
