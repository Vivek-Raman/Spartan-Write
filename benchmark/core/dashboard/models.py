from dataclasses import dataclass
from pathlib import Path


@dataclass
class DashboardRow:
    job_id: str
    summary: str
    status: str
    scores: dict[str, float]
    chat_result: object | None
    error: str


@dataclass
class DashboardSummary:
    base_dir: Path
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    rows: list[DashboardRow]
