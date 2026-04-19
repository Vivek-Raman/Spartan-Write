# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app

# Hardlinks do not work well across Docker layers; copy wheels instead.
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock README.md ./
COPY api ./api
COPY core ./core

RUN uv sync --frozen --no-dev

ENV PORT=8767
EXPOSE 8767

# Use uvicorn directly so we bind 0.0.0.0 (api.server:main uses 127.0.0.1 only).
CMD ["sh", "-c", "exec uv run uvicorn api.server:app --host 0.0.0.0 --port \"$PORT\""]
