FROM ghcr.io/astral-sh/uv:0.12.24 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /uvx /bin/
WORKDIR /app
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    HF_HOME=/root/.cache/huggingface \
    PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --locked --no-dev --no-install-project
COPY src ./src
RUN uv sync --locked --no-dev
# bake in the model so the first request does not need a download.
RUN python -c "from scifind.integrations.model import get_embedding_model; get_embedding_model(device='cpu')"
COPY base-embeddings-1pct.zip /tmp/seeds.zip
RUN python -m zipfile -e /tmp/seeds.zip /app && rm /tmp/seeds.zip \
    && mkdir -p /app/uploads
EXPOSE 8000
CMD ["uvicorn", "scifind.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
