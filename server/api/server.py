import dotenv

dotenv.load_dotenv()

import json
import os
from datetime import date, datetime, timezone
from pathlib import Path
import uuid

from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder
from copilotkit import LangGraphAGUIAgent
from core import __version__
from core import agent
from core.auth import AuthError, authenticate_request
from core.usage import validate_and_fetch_creds
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
import httpx
from pydantic import BaseModel


class SafeLangGraphAGUIAgent(LangGraphAGUIAgent):
    """LangGraphAGUIAgent that tolerates None in messages_in_process (ag_ui_langgraph bug)."""

    def set_message_in_progress(self, run_id: str, data):
        current = self.messages_in_process.get(run_id) or {}
        self.messages_in_process[run_id] = {**(current or {}), **(data or {})}


class ChatRequest(BaseModel):
    dir: str
    prompt: str
    user_email: str
    attached_image_path: str | None = None
    openai_api_key: str | None = None
    openai_api_base: str | None = None
    openai_api_model: str | None = None


class UsageInfoRequest(BaseModel):
    user_id: str
    n_days_window: int | None = None


DEFAULT_POSTHOG_USAGE_URL = (
    "https://us.posthog.com/api/environments/341888/endpoints/"
    "fetch-usage-info-for-user/run")


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


app = FastAPI(title="Spartan Write - Server")


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    unauthenticated_paths = {"/health", "/chat", "/usage-info"}
    if request.method == "OPTIONS" or request.url.path in unauthenticated_paths:
        return await call_next(request)

    try:
        request.state.auth = authenticate_request(request)
    except AuthError as exc:
        return JSONResponse(status_code=exc.status_code,
                            content={"detail": exc.detail})

    return await call_next(request)


@app.get("/health")
async def health():
    return {"status": "ok", "version": __version__}


@app.post("/usage-info")
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


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        creds = agent.AgentCreds(openai_api_key=request.openai_api_key,
                                 openai_api_base=request.openai_api_base,
                                 openai_api_model=request.openai_api_model,
                                 user_email=request.user_email)
        folder_path = Path(request.dir)
        graph = agent.create_graph(creds,
                                   folder_path,
                                   request.attached_image_path,
                                   local_execution=True)
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        initial_state = {"messages": [HumanMessage(content=request.prompt)]}
        final_state = graph.invoke(initial_state, config=config)

        # Extract agent's response messages (AIMessages)
        agent_responses = [
            msg for msg in final_state.get("messages", [])
            if isinstance(msg, AIMessage)
        ]

        # Convert AIMessages to serializable format
        response_data = {
            "messages": [{
                "type":
                msg.__class__.__name__,
                "content":
                msg.content,
                "tool_calls": [{
                    "name": tc.get("name"),
                    "args": tc.get("args"),
                    "id": tc.get("id"),
                } for tc in (msg.tool_calls or [])]
                if hasattr(msg, "tool_calls") and msg.tool_calls else [],
            } for msg in agent_responses],
            "full_state":
            final_state,
        }

        return {
            "success": True,
            "data": response_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/copilotkit")
@app.post("/copilotkit/")
@app.post("/copilotkit/{path:path}")
async def copilotkit_handler(request: Request, path: str = ""):
    """Handle both CopilotKit info/discovery and AG-UI agent execution."""

    try:
        body = await request.json()
    except Exception:
        body = {}

    method = body.get("method", "")
    inner = body.get("body", {}) or {}

    # AG-UI execution requests are routed via the "method" envelope
    if method and method != "info":
        # The actual AG-UI payload is nested inside "body"
        input_data = RunAgentInput(**inner)
        forwarded_props = input_data.forwarded_props or {}
        folder_path = Path(forwarded_props.get("folder_path", "."))
        attached_image_path = forwarded_props.get("attached_image_path", None)

        user = request.state.auth.user
        if user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")

        creds = validate_and_fetch_creds(user)
        graph = agent.create_graph(creds, folder_path, attached_image_path)
        agui_agent = SafeLangGraphAGUIAgent(name="0", graph=graph)

        accept_header = request.headers.get("accept")
        encoder = EventEncoder(accept=accept_header)

        async def event_generator():
            async for event in agui_agent.run(input_data):
                yield encoder.encode(event)

        return StreamingResponse(event_generator(),
                                 media_type=encoder.get_content_type())

    # Info / discovery request
    return JSONResponse({
        "agents": [{
            "name": "0",
            "description":
            "A LaTeX chatbot that can read, write, and modify LaTeX files.",
            "type": "langgraph",
        }],
        "actions": [],
        "sdkVersion":
        __version__,
    })


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def main():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8767)


if __name__ == "__main__":
    main()
