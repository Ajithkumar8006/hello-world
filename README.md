from flask import Flask
import psycopg2

app = Flask(__name__)

# 🔐 DB credentials (for local dev only)
DB_USER = 'dbadmin'
DB_PASS = 'StrongPassword123!'
DB_NAME = 'mydatabase'
DB_HOST = '34.60.45.59'  # Cloud SQL public IP for PostgreSQL
DB_PORT = 5432

@app.route("/")
def index():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME,
            sslmode='require'  # Cloud SQL enforces SSL
        )
        with conn.cursor() as cursor:
            cursor.execute("SELECT NOW();")
            result = cursor.fetchone()
        conn.close()
        return f"✅ SQL Connected - Time: {result[0]}"
    except Exception as e:
        return f"❌ DB Error: {e}", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
    -----

    # Use official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py .

# Run the Flask app
CMD ["python", "app.py"]

cat requirements.txt 
flask
psycopg2-binary

gcloud builds submit --tag us-central1-docker.pkg.dev/apigee-test-0002-demo/splunk-test/my-splunk-logger/flask-postgres-app:v2

------

#!/bin/bash

INSTANCE_NAME="test-sql-instance"
PROJECT_ID="apigee-test-0002-demo"

while true; do
  # 1. Check app connectivity
  RESPONSE=$(curl -i -s https://flask-postgres-service-741169614600.us-central1.run.app)
  STATUS=$(echo "$RESPONSE" | head -n 1)
  MESSAGE=$(echo "$RESPONSE" | tail -n 1 | tr -d '\n')

  # 2. Get Cloud SQL primary zone
  PRIMARY_ZONE=$(gcloud sql instances describe "$INSTANCE_NAME" \
    --project="$PROJECT_ID" \
    --format="value(gceZone)")

  # 3. Print formatted output
  echo "$(date '+%Y-%m-%d %H:%M:%S') | Primary Zone: ${PRIMARY_ZONE} - ${MESSAGE}${STATUS}"

  sleep 1
done
