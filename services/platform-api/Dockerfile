# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

# Enterprise hardening labels
LABEL org.opencontainers.image.title="careOS Platform API" \
      org.opencontainers.image.description="Enterprise hardened, HIPAA-aware clinical AI platform API" \
      org.opencontainers.image.source="https://github.com/Anudeepsrib/CareOS" \
      security.non-root="true"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONFAULTHANDLER=1

WORKDIR /app

# System dependencies (minimal; libpq-dev only needed for build of asyncpg/psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user early (principle of least privilege)
RUN groupadd -r appgroup --gid 1001 && \
    useradd -r -g appgroup --uid 1001 --home /app --shell /sbin/nologin appuser && \
    mkdir -p /app /workspace && \
    chown -R appuser:appgroup /app /workspace

# Copy dependency files first for better caching. This Dockerfile is built from
# the repository root so the platform can import sibling service packages.
COPY --chown=appuser:appgroup services/platform-api/requirements.txt ./requirements.txt

# Keep the dependency source of truth in requirements.txt.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code plus sibling service packages used by the platform API.
COPY --chown=appuser:appgroup services/platform-api/ ./
COPY --chown=appuser:appgroup services /workspace/services
ENV PYTHONPATH="/app:/workspace"

# Drop to non-root
USER appuser

EXPOSE 8000

# Use /ready for better readiness signal in k8s/ecs
HEALTHCHECK --interval=30s --timeout=8s --start-period=10s --retries=3 \
    CMD curl -f --max-time 5 http://127.0.0.1:8000/ready || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
