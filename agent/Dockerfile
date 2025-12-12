FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src src

ENV PYTHONUNBUFFERED=1

# Default port can be overridden with PORT env var
CMD ["uvicorn", "src.adk_api:app", "--host", "0.0.0.0", "--port", "10000"]
