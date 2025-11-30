**Uptime Monitor Backend API 📈**

The Uptime Monitor Backend API is a robust and scalable solution for tracking the availability and performance of your services. Built with **Hono** and **Bun**, it provides a secure and efficient way to submit monitoring reports, analyze uptime trends, and manage API keys, all backed by **Supabase** for reliable data storage. Ensure your applications are always up and running! 🚀

### ✨ Key Features

*   **Comprehensive Uptime Tracking**: Monitor service availability, downtime, and degraded performance with detailed health check results.
*   **Real-time Status Checks**: Instantly verify the current operational status of multiple domains.
*   **Secure API Key Management**: Generate, validate, and manage API keys for controlled access to the monitoring system.
*   **Historical Data Visualization**: Query and retrieve past monitoring reports with flexible filtering for analytical dashboards.
*   **Daily Service Summaries**: Generate aggregated daily health summaries for specific domains, providing a quick overview of performance trends.
*   **Robust Data Validation**: Ensures data integrity for all incoming reports and queries using Zod schemas.
*   **API Rate Limiting**: Protects the API from abuse and ensures fair resource distribution among consumers.

### 🛠️ Technologies Used

| Category        | Technology                                                                                                    | Description                                                                 |
| :-------------- | :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------- |
| **Runtime**     | [Bun](https://bun.sh/)                                                                                        | A fast JavaScript runtime, transpiler, and package manager.                 |
| **Framework**   | [Hono.js](https://hono.dev/)                                                                                  | A lightweight, ultra-fast web framework for the edge and Node.js environments. |
| **Database**    | [Supabase](https://supabase.com/)                                                                             | Open-source Firebase alternative providing a PostgreSQL database.           |
| **Validation**  | [Zod](https://zod.dev/)                                                                                       | TypeScript-first schema declaration and validation library.                 |
| **Middleware**  | [Hono/CORS](https://hono.dev/middleware/builtin/cors)                                                         | Configures Cross-Origin Resource Sharing.                                   |
|                 | [Hono/Logger](https://hono.dev/middleware/builtin/logger)                                                     | Request logging middleware.                                                 |
|                 | [Hono/Secure Headers](https://hono.dev/middleware/builtin/secure-headers)                                     | Enhances security by setting various HTTP response headers.                 |
|                 | [Hono/Timing](https://hono.dev/middleware/builtin/timing)                                                     | Provides server-side timing information for performance analysis.           |
| **Type Safety** | [TypeScript](https://www.typescriptlang.org/)                                                                 | Strongly typed programming language that builds on JavaScript.              |
| **Date Handling**| [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date.html), [date-fns](https://date-fns.org/) | Robust libraries for parsing, formatting, and manipulating dates.           |

# Uptime Monitor Backend API

## Overview
This backend API, built with Hono and Bun, serves as the central hub for ingesting, storing, and retrieving uptime monitoring data. It leverages Supabase as its PostgreSQL database and incorporates robust API key authentication and data validation using Zod schemas to ensure data integrity and secure access.

## Core Backend Features
- `Hono`: Lightweight and fast web framework for handling API routes and middleware.
- `Bun`: High-performance JavaScript runtime for efficient server operations.
- `Supabase`: PostgreSQL-backed data storage for monitoring reports, API keys, and summaries.
- `Zod`: Runtime validation for incoming API payloads, ensuring data correctness and type safety.
- `API Key Authentication`: Bearer token authentication with SHA256 hashing for secure API access.
- `Rate Limiting`: Prevents abuse and ensures fair resource distribution across API consumers.
- `CORS Management`: Configured to allow cross-origin requests for broad client compatibility.

## Getting Started
### Installation
To get this project running on your local machine, follow these steps:

*   📥 **Clone the repository:**
    ```bash
    git clone https://github.com/arinzejustin/uptime-monitor.git
    cd uptime-monitor/server
    ```
*   📦 **Install dependencies:**
    ```bash
    bun install
    ```
*   ➕ **Set up your Supabase database:**
    Ensure you have a Supabase project configured. Create an `.env` file in the `server/` directory based on `.env.example` and fill in your Supabase credentials and desired table names. Then, run the database setup script:
    ```bash
    cp .env.example .env
    # Edit .env with your Supabase credentials and table names (e.g., REPORTS_TABLE=reports, API_KEY_TABLE=api_keys, SUMMARY_TABLE=summary)
    bun run setup-db
    ```
*   🚀 **Start the development server:**
    ```bash
    bun dev
    ```
    The API will be accessible at `http://localhost:3000` by default.

### Environment Variables
*   `SUPABASE_URL`: `https://your-supabase-url.supabase.co` (Required)
*   `SUPABASE_KEY`: `your-supabase-anon-key` (Required)
*   `USER_AGENT`: `Axiolot-Uptime-Bot` (Required, client User-Agent must match this prefix for report submission)
*   `REPORTS_TABLE`: `reports` (Required, database table name for monitoring reports)
*   `API_KEY_TABLE`: `api_keys` (Required, database table name for API keys)
*   `SUMMARY_TABLE`: `summary` (Required, database table name for daily summaries)

## API Documentation
### Base URL
`http://localhost:3000` or `https://[your-deployed-url]`

### Endpoints
#### `GET /health`
**Overview**: Checks the operational status of the API server.
**Request**:
No payload required.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2023-10-27T10:00:00.000Z",
  "version": "1.0.0",
  "env": "development"
}
```

**Errors**:
- None explicitly defined for this endpoint in the code; standard HTTP success/error codes apply.

#### `POST /api/v1/keys/generate`
**Overview**: Generates a new API key for accessing protected endpoints. This endpoint is only available in the `development` environment for security reasons.
**Request**:
```json
{
  "name": "My Monitoring Service Key",
  "description": "API key for submitting uptime reports from my server."
}
```
**Required fields**: `name` (string, min 1, max 10000 characters)
**Optional fields**: `description` (string)

**Response**:
```json
{
  "success": true,
  "message": "API key generated successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "api_key": "axh_f6e7d8c9b0a1234567890abcdef1234567890...",
    "name": "My Monitoring Service Key",
    "key_prefix": "axh_f6e7d8c9b0",
    "created_at": "2023-10-27T10:05:00.000Z",
    "warning": "Store this API key securely. It will not be shown again."
  }
}
```

**Errors**:
- `401 Unauthorized`: Cannot generate API key in production mode.
- `400 Bad Request`: Validation failed (e.g., `name` is missing or exceeds max length).
- `500 Internal Server Error`: Failed to store API key in the database, or an API key already exists (only one key supported in this version).

#### `GET /api/v1/keys/:keyId`
**Overview**: Retrieves metadata for a specific API key using its ID.
**Request**:
Path parameter `keyId` is the UUID of the API key.
No payload required.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "My Monitoring Service Key",
    "description": "API key for submitting uptime reports from my server.",
    "key_prefix": "axh_f6e7d8c9b0",
    "is_active": true,
    "created_at": "2023-10-27T10:05:00.000Z",
    "last_used_at": "2023-10-27T11:30:00.000Z",
    "usage_count": 125
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid `keyId` format or length.
- `404 Not Found`: API key with the specified ID does not exist.
- `500 Internal Server Error`: Failed to fetch API key information from the database.

#### `POST /api/v1/monitoring/reports`
**Overview**: Submits a detailed monitoring report for a service. Requires API key authentication and a specific `User-Agent` header for enhanced security.
**Request**:
Requires `Authorization: Bearer <API_KEY>` header and a `User-Agent` header that starts with the value of `ALLOWED_USER_AGENT` environment variable (default: `Axiolot-Uptime-Bot`).
```json
{
  "service": "api-gateway",
  "environment": "production",
  "total_checks": 100,
  "uptime_count": 98,
  "downtime_count": 1,
  "degraded_count": 1,
  "uptime_percent": 98.00,
  "average_latency_ms": 150.75,
  "timestamp": "2023-10-27T10:30:00.000Z",
  "results": [
    {
      "domain": "example.com",
      "url": "https://example.com/health",
      "status": "up",
      "status_code": 200,
      "response_time_ms": 120,
      "is_ssl": true,
      "ssl_expiry": "2024-12-31T00:00:00.000Z",
      "ssl_days_left": "400",
      "error_message": "",
      "content_length": 1234,
      "timestamp": "2023-10-27T10:30:00.000Z",
      "checked_at": "2023-10-27T10:30:00.000Z"
    },
    {
      "domain": "api.example.com",
      "url": "https://api.example.com/status",
      "status": "degraded",
      "status_code": 503,
      "response_time_ms": 5000,
      "is_ssl": true,
      "ssl_expiry": "2024-12-31T00:00:00.000Z",
      "ssl_days_left": "400",
      "error_message": "Service unavailable",
      "content_length": 0,
      "timestamp": "2023-10-27T10:30:00.000Z",
      "checked_at": "2023-10-27T10:30:00.000Z"
    }
  ]
}
```
**Required fields**: `service` (string), `environment` (string), `total_checks` (number), `uptime_count` (number), `downtime_count` (number), `degraded_count` (number), `uptime_percent` (number, 0-100), `average_latency_ms` (number), `results` (non-empty array). Each `HealthCheckResult` object within `results` also has required fields (refer to `types.d.ts`).

**Response**:
```json
{
  "success": true,
  "message": "Report stored successfully",
  "data": {
    "id": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
    "created_at": "2023-10-27T10:30:00.000Z"
  }
}
```

**Errors**:
- `429 Too Many Requests`: Rate limit exceeded for the client IP.
- `401 Unauthorized`: Missing or invalid API key, or API key is deactivated.
- `403 Forbidden`: Invalid `User-Agent` header (must start with the configured `ALLOWED_USER_AGENT`).
- `400 Bad Request`: Validation failed (e.g., missing required fields like `service` or `environment`, `uptime_percent` out of range, `results` array is empty).
- `500 Internal Server Error`: Database error or other server-side failure.

#### `POST /api/v1/reports/query/visualization`
**Overview**: Fetches monitoring reports based on specified query parameters, intended for dashboard visualization. Requires API key authentication.
**Request**:
Requires `Authorization: Bearer <API_KEY>` header.
```json
{
  "environment": "production",
  "status": "up",
  "from": "2023-10-01T00:00:00.000Z",
  "to": "2023-10-27T23:59:59.000Z",
  "limit": 50,
  "offset": 0,
  "sortBy": "timestamp",
  "sortOrder": "desc",
  "fetchAll": false
}
```
**Optional fields**:
- `environment` (string)
- `url` (string, valid URL format)
- `status` (string, must be `up` or `down`)
- `from` (string, ISO 8601 date/time string)
- `to` (string, ISO 8601 date/time string)
- `limit` (number, integer 1-1000, default 50)
- `offset` (number, integer >=0, default 0)
- `sortBy` (string, e.g., `timestamp`)
- `sortOrder` (string, must be `asc` or `desc`)
- `fetchAll` (boolean, default `false`. If `true`, `limit` and `offset` are ignored and all matching records are returned.)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-report-1",
      "service": "api-gateway",
      "environment": "production",
      "total_checks": 100,
      "uptime_count": 99,
      "downtime_count": 1,
      "degraded_count": 0,
      "uptime_percent": 99.00,
      "average_latency_ms": 120.50,
      "timestamp": "2023-10-27T10:00:00.000Z",
      "results": [
        {
          "domain": "example.com",
          "url": "https://example.com",
          "status": "up",
          "status_code": 200,
          "response_time_ms": 120,
          "is_ssl": true,
          "ssl_expiry": "2024-12-31T00:00:00.000Z",
          "ssl_days_left": "400",
          "error_message": "",
          "content_length": 1234,
          "timestamp": "2023-10-27T10:00:00.000Z",
          "checked_at": "2023-10-27T10:00:00.000Z"
        }
      ],
      "created_at": "2023-10-27T10:00:00.000Z",
      "updated_at": "2023-10-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```
If `fetchAll` is `true`:
```json
{
  "success": true,
  "data": [
    { /* All MonitorReport objects matching query */ }
  ],
  "pagination": {
    "total": 1000,
    "limit": 1000,
    "offset": 0,
    "hasMore": false
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid API key, or API key is deactivated.
- `400 Bad Request`: Validation failed for query parameters (e.g., invalid `status` value, `limit` out of range).
- `500 Internal Server Error`: Failed to fetch reports from the database.

#### `POST /api/v1/reports/query/summary`
**Overview**: Fetches and summarizes monitoring data for specified domains over a period, with caching capabilities. Requires API key authentication.
**Request**:
Requires `Authorization: Bearer <API_KEY>` header.
```json
{
  "domains": [
    "example.com",
    "api.example.com"
  ],
  "limit": 100,
  "days": 30,
  "useCache": true
}
```
**Required fields**: `domains` (array of strings, must contain at least one domain).
**Optional fields**:
- `limit` (number, integer 1-1000, default 1000)
- `days` (number, integer 1-60, default 60)
- `useCache` (boolean, default `true`)

**Response**:
```json
{
  "success": true,
  "message": "Fetched summary successfully",
  "data": {
    "example.com": [
      {
        "date": "Oct 27 2023",
        "status": "ok",
        "title": "Operational",
        "description": "No issues recorded today",
        "time_down": "0m"
      },
      {
        "date": "Oct 26 2023",
        "status": "warning",
        "title": "Partial Outage",
        "description": "example.com had intermittent downtime (1h 10m).",
        "time_down": "1h 10m"
      }
    ],
    "api.example.com": [
      {
        "date": "Oct 27 2023",
        "status": "error",
        "title": "Major Outage",
        "description": "api.example.com experienced extended downtime (2h 0m).",
        "time_down": "2h 0m"
      }
    ]
  }
}
```

**Errors**:
- `429 Too Many Requests`: Rate limit exceeded for the client IP.
- `401 Unauthorized`: Missing or invalid API key, or API key is deactivated.
- `400 Bad Request`: Validation failed for query parameters (e.g., `domains` array is empty, `days` out of range).
- `500 Internal Server Error`: Failed to fetch or summarize reports from the database.

#### `POST /api/v1/concurrent/status`
**Overview**: Performs a quick HEAD request to verify the current "Up" or "Down" status of multiple domains simultaneously. Requires API key authentication.
**Request**:
Requires `Authorization: Bearer <API_KEY>` header.
```json
{
  "domains": "example.com,api.example.com,down.example.org"
}
```
**Required fields**: `domains` (string, comma-separated list of domain names).

**Response**:
```json
{
  "success": true,
  "message": "down.example.org is down, another.domain.com is down",
  "data": {
    "example.com": "Up",
    "api.example.com": "Up",
    "down.example.org": "Down"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid API key, or API key is deactivated.
- `400 Bad Request`: Validation failed (e.g., `domains` field is empty).
- `500 Internal Server Error`: Failed to perform status checks.

#### `POST /api/v1/dashboard/data`
**Overview**: Retrieves data optimized for dashboard display, including a paginated list of reports and aggregate statistics. Requires API key authentication.
**Request**:
Requires `Authorization: Bearer <API_KEY>` header.
```json
{
  "environment": "production",
  "limit": 50,
  "offset": 0,
  "fetchAll": false
}
```
**Optional fields**:
- `environment` (string)
- `limit` (number, integer -1 to 1000, default -1. If -1, fetches all records unless `fetchAll` is explicitly false and pagination limits are used).
- `offset` (number, integer >=0, default 0)
- `fetchAll` (boolean, default `false`. If `true`, `limit` and `offset` are ignored and all matching records are returned.)

**Response**:
```json
{
  "success": true,
  "message": "Fetched dashboard data successfully",
  "data": {
    "data": [
      {
        "id": "uuid-report-1",
        "service": "api-gateway",
        "environment": "production",
        "total_checks": 100,
        "uptime_count": 99,
        "downtime_count": 1,
        "degraded_count": 0,
        "uptime_percent": 99.00,
        "average_latency_ms": 120.50,
        "timestamp": "2023-10-27T10:00:00.000Z",
        "results": [
          { /* HealthCheckResult object */ }
        ],
        "created_at": "2023-10-27T10:00:00.000Z",
        "updated_at": "2023-10-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 500,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    },
    "stats": {
      "avgUptime": 99.85,
      "avgLatency": 105.2,
      "totalIncidents": 15,
      "reportCount": 500,
      "startDate": { "year": 2023, "month": 9, "day": 1 }
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid API key, or API key is deactivated.
- `400 Bad Request`: Validation failed for query parameters.
- `500 Internal Server Error`: Failed to fetch dashboard data.

### 🚀 API Usage Examples

Below are `cURL` examples demonstrating how to interact with some of the core API endpoints. Remember to replace placeholder values like `<YOUR_API_KEY>` and adjust JSON bodies as needed.

#### 1. Generate an API Key (Development Mode Only)

```bash
curl -X POST \
  http://localhost:3000/api/v1/keys/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Monitoring Client",
    "description": "Key for my custom uptime monitoring script."
  }'
```

#### 2. Submit a Monitoring Report

First, ensure you have an API key and set your `USER_AGENT` environment variable to `Axiolot-Uptime-Bot`.

```bash
curl -X POST \
  http://localhost:3000/api/v1/monitoring/reports \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_KEY>' \
  -H 'User-Agent: Axiolot-Uptime-Bot' \
  -d '{
    "service": "my-web-app",
    "environment": "production",
    "total_checks": 1,
    "uptime_count": 1,
    "downtime_count": 0,
    "degraded_count": 0,
    "uptime_percent": 100.00,
    "average_latency_ms": 75.5,
    "timestamp": "2023-10-27T15:00:00.000Z",
    "results": [
      {
        "domain": "mywebapp.com",
        "url": "https://mywebapp.com/",
        "status": "up",
        "status_code": 200,
        "response_time_ms": 75,
        "is_ssl": true,
        "ssl_expiry": "2024-11-01T00:00:00.000Z",
        "ssl_days_left": "365",
        "error_message": "",
        "content_length": 5120,
        "timestamp": "2023-10-27T15:00:00.000Z",
        "checked_at": "2023-10-27T15:00:00.000Z"
      }
    ]
  }'
```

#### 3. Query Reports for Visualization

```bash
curl -X POST \
  http://localhost:3000/api/v1/reports/query/visualization \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_KEY>' \
  -d '{
    "environment": "production",
    "limit": 10,
    "sortBy": "timestamp",
    "sortOrder": "desc"
  }'
```

#### 4. Get Concurrent Status of Domains

```bash
curl -X POST \
  http://localhost:3000/api/v1/concurrent/status \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_API_KEY>' \
  -d '{
    "domains": "google.com,supabase.com,example.com"
  }'
```

### 🧑‍💻 Author Info

*   **Axiolot Hub**: [LinkedIn](https://linkedin.com/in/yourprofile) | [Twitter](https://twitter.com/axiolothub) | [Website](https://axiolot.com.ng)

---

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-007bff?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Supabase](https://img.shields.io/badge/Supabase-17181F?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/arinzejustin/uptime-monitor/main.yml?branch=main&style=for-the-badge)](https://github.com/arieduca/uptime-monitor/actions)
