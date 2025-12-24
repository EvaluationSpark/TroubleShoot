FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway provides PORT env variable
ENV PORT=8001

# Start command - uses PORT from environment
CMD uvicorn server:app --host 0.0.0.0 --port $PORT
