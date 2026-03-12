from core.utils import BenchmarkMetadata

from .models import DashboardRow


def build_row(job_id: str, metadata: BenchmarkMetadata) -> DashboardRow:
    return DashboardRow(
        job_id=job_id,
        summary=metadata.summary or "",
        status=metadata.status or "pending",
        scores=getattr(metadata, "scores", {}) or {},
        chat_result=metadata.chat_result,
        error=metadata.error or "",
    )
