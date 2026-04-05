import asyncio
from datetime import datetime, timezone

import click
from pathlib import Path

from core.utils import read_json, do_chat, write_json, BenchmarkMetadata
from core.score import score_benchmark


def run_benchmarks(context: dict) -> None:
    params = context.get("exec_params", {})
    iterations = params.get("iterations", 1)

    with click.progressbar(context["dataset"],
                           length=context["dataset_count"],
                           update_min_steps=1,
                           label='+ Running benchmarks...') as bar:
        for dir_name in bar:
            click.echo("")  # new line
            data_dir = context["model_dir"] / "data" / dir_name
            for run_index in range(iterations):
                asyncio.run(_do_benchmark(context, data_dir, run_index))
    click.echo(
        "+ Benchmarking complete. Please run the dashboard to view the results."
    )


def _metadata_for_run(
    raw_metadata: dict, run_index: int, do_scoring_only: bool
) -> BenchmarkMetadata:
    """Build a BenchmarkMetadata instance for this execution (fresh chat or scoring-only)."""
    if do_scoring_only:
        root = {k: v for k, v in raw_metadata.items() if k != "runs"}
        runs = raw_metadata.get("runs") or []
        if (
            isinstance(runs, list)
            and run_index < len(runs)
            and isinstance(runs[run_index], dict)
        ):
            return BenchmarkMetadata.from_dict({**runs[run_index], **root})
        raise ValueError(
            f"Scoring-only requires metadata.json to have a dict at runs[{run_index}]"
        )
    return BenchmarkMetadata(summary=raw_metadata.get("summary", ""))


async def _do_benchmark(context: dict, data_dir: Path, run_index: int) -> None:
    params = context.get("exec_params", {})
    do_scoring_only = params.get("do_scoring_only", False)

    metadata_path = data_dir / "metadata.json"
    raw_metadata = read_json(metadata_path)
    metadata = _metadata_for_run(raw_metadata, run_index, do_scoring_only)
    summary = metadata.summary or ""
    click.echo(f"  + Test: {summary}")

    try:
        if not do_scoring_only:
            # do chat
            prompt = (data_dir / "prompt.txt").read_text()
            metadata.time_chat_start = _get_timestamp()
            metadata.chat_result = do_chat(context, str(data_dir), prompt)
            metadata.time_chat_end = _get_timestamp()

        # do score
        metadata.time_score_start = _get_timestamp()
        score_benchmark(context, metadata)
        metadata.time_score_end = _get_timestamp()
        metadata.status = "completed"
    except Exception as e:
        click.echo(f"    + Error: {e}")
        metadata.error = str(e)
        metadata.status = "failed"
    finally:
        run_dict = metadata.to_dict()
        run_dict.pop("runs", None)
        raw_latest = read_json(metadata_path)
        runs = list(raw_latest.get("runs") or [])
        while len(runs) <= run_index:
            runs.append(None)
        runs[run_index] = run_dict
        write_json(metadata_path, {**raw_latest, "runs": runs})


def _get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
