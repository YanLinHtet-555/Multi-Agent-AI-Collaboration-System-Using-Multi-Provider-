# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python backend ───────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Copy built React app from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Serve API + React UI on port 8000
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]
