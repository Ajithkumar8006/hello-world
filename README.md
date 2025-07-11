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
---
https://flask-postgres-service-741169614600.us-central1.run.app

--------

DOTNET

-----

HaFailoverTestApp.csproj

<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Npgsql" Version="7.0.3" />
  </ItemGroup>

</Project>

----

Program.cs

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 🔐 DB credentials (for local dev/testing)
string DB_USER = "dbadmin";
string DB_PASS = "StrongPassword123!";
string DB_NAME = "mydatabase";
string DB_HOST = "35.224.175.122";
int DB_PORT = 5432;

app.MapGet("/", async context =>
{
    // Updated SSL config to trust self-signed certs
    string connString = $"Host={DB_HOST};Port={DB_PORT};Username={DB_USER};Password={DB_PASS};Database={DB_NAME};Ssl Mode=Require;Trust Server Certificate=true";

    try
    {
        await using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand("SELECT NOW();", conn);
        var result = await cmd.ExecuteScalarAsync();

        await context.Response.WriteAsync($"SQL DB Connected - Time: {result}");
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync($"❌ DB Error: {ex.Message}");
    }
});

app.Run("http://0.0.0.0:8080"); // Required for Cloud Run

------

Dockerfile

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy and restore
COPY *.csproj ./
RUN dotnet restore

# Copy source and publish
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Match your project name's DLL
ENTRYPOINT ["dotnet", "HaFailoverTestApp.dll"]


-----
.dockerignore

**/bin/
**/obj/
