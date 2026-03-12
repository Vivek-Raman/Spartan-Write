import streamlit as st

from .models import DashboardRow, DashboardSummary


def render_dashboard(summary: DashboardSummary) -> None:
    st.set_page_config(page_title="Benchmark Dashboard")
    st.title("Benchmark Dashboard")
    st.caption(f"Directory: `{summary.base_dir}`")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total", summary.total_jobs)
    c2.metric("Completed", summary.completed_jobs)
    c3.metric("Failed", summary.failed_jobs)
    c4.metric("Pending", summary.pending_jobs)

    if not summary.rows:
        st.info("No metadata found in `data/*/metadata.json`.")
        return

    status_options = sorted({row.status for row in summary.rows})
    selected_statuses = st.multiselect("Filter by status",
                                       options=status_options,
                                       default=status_options)
    show_errors_only = st.checkbox("Show only rows with errors", value=False)

    # Collect all score keys across rows so we can show one column per score.
    all_score_keys: set[str] = set()
    for row in summary.rows:
        if row.scores:
            all_score_keys.update(row.scores.keys())
    score_keys = sorted(all_score_keys)

    filtered_rows: list[DashboardRow] = []
    table_rows: list[dict[str, object]] = []
    for row in summary.rows:
        if row.status not in selected_statuses:
            continue
        if show_errors_only and not row.error:
            continue
        filtered_rows.append(row)
        row_dict: dict[str, object] = {
            "job": f"{row.summary}".strip(),
            "status": row.status,
            "error": row.error,
        }
        # Add one column per score key for clearer visibility.
        for key in score_keys:
            col_name = f"score_{key}"
            row_dict[col_name] = (row.scores or {}).get(key)
        table_rows.append(row_dict)

    st.dataframe(table_rows, width="stretch", hide_index=True)
    _render_chat_result_links(filtered_rows)


@st.dialog("Chat Result", width="large")
def _render_chat_result_modal(row: DashboardRow) -> None:
    st.caption(f"Job: `{row.job_id}`")
    if isinstance(row.chat_result, (dict, list)):
        st.json(row.chat_result, expanded=5)
        return
    st.code(str(row.chat_result), language="text")


def _render_chat_result_links(rows: list[DashboardRow]) -> None:
    rows_with_chat = [row for row in rows if row.chat_result is not None]
    if not rows_with_chat:
        return

    st.subheader("Chat Results")

    for row in rows_with_chat:
        left, right = st.columns([6, 1])
        left.write(f"`{row.job_id}` - {row.summary}")
        if right.button("View",
                        key=f"chat-result-{row.job_id}",
                        type="tertiary"):
            _render_chat_result_modal(row)
