import json
import os
from datetime import date, datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workos.types.user_management import User

from .models import AgentCreds

CREDS = {
    'openai_api_key': os.getenv("OPENAI_API_KEY"),
    'openai_api_base': os.getenv("OPENAI_API_BASE"),
    'openai_api_model': os.getenv("OPENAI_API_MODEL"),
}

DEFAULT_POSTHOG_USAGE_URL = (
    "https://us.posthog.com/api/environments/341888/endpoints/"
    "fetch-usage-info-for-user/run")


class UsageInfoRequest(BaseModel):
    user_id: str
    n_days_window: int | None = None


def _effective_n_days_window(n_days_window: int) -> int:
    if n_days_window == -1:
        today_utc = datetime.now(timezone.utc).date()
        start = date(2026, 1, 1)
        return max(1, (today_utc - start).days + 1)
    return n_days_window


def _normalize_posthog_string_cell(val: object) -> str:
    """PostHog JSONExtractRaw can return JSON-encoded strings (extra quotes)."""
    if val is None:
        return ""
    s = str(val).strip()
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        try:
            parsed = json.loads(s)
            return str(parsed) if parsed is not None else ""
        except json.JSONDecodeError:
            return s[1:-1]
    return s


def _reshape_posthog_usage_rows(body: dict) -> list[dict]:
    """Map PostHog `columns` + `results` into {user_id, ai_model, generations, total_cost}."""
    results = body.get("results")
    columns = body.get("columns")
    if not isinstance(results, list) or not isinstance(columns, list) or not columns:
        return []
    col_index = {name: i for i, name in enumerate(columns)}
    keys = ("user_id", "ai_model", "generations", "total_cost")
    if not all(k in col_index for k in keys):
        return []
    out: list[dict] = []
    for row in results:
        if not isinstance(row, (list, tuple)) or len(row) != len(columns):
            continue
        uid = row[col_index["user_id"]]
        model = row[col_index["ai_model"]]
        gens = row[col_index["generations"]]
        cost = row[col_index["total_cost"]]
        out.append({
            "user_id": "" if uid is None else str(uid),
            "ai_model": _normalize_posthog_string_cell(model),
            "generations": int(gens) if gens is not None else 0,
            "total_cost": float(cost) if cost is not None else 0.0,
        })
    return out


router = APIRouter()


@router.post("/usage-info")
async def usage_info(request: UsageInfoRequest):
    api_key = os.getenv("POSTHOG_READ_API_KEY_USER_USAGE_INFO")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="POSTHOG_READ_API_KEY_USER_USAGE_INFO is not configured",
        )

    raw = request.n_days_window if request.n_days_window is not None else 30
    n_days = _effective_n_days_window(raw)

    url = os.getenv("POSTHOG_USAGE_ENDPOINT_URL", DEFAULT_POSTHOG_USAGE_URL)
    payload = {
        "variables": {
            "user_id": request.user_id,
            "n_days_window": n_days,
        }
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"PostHog request failed: {e}",
        ) from e

    if not resp.is_success:
        detail = resp.text[:2000] if resp.text else resp.reason_phrase
        raise HTTPException(
            status_code=502,
            detail=f"PostHog error {resp.status_code}: {detail}",
        )

    try:
        data = resp.json()
    except Exception:
        data = {"raw": resp.text}

    rows = _reshape_posthog_usage_rows(data) if isinstance(data, dict) else []
    return {"success": True, "data": {"data": rows}}


def validate_and_fetch_creds(user: User):
    if not user:
        raise ValueError("User is required to fetch credentials")

    # TODO: Check usage limits for the user

    return AgentCreds(
        **CREDS,
        user_email=user.email,
    )
