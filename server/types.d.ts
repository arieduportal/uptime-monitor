export interface MonitorReport {
    id?: string;
    service: string;
    environment?: string;
    total_checks: number;
    uptime_count: number;
    downtime_count: number;
    degraded_count: number;
    uptime_percent: number;
    average_latency_ms: number;
    timestamp: string;
    results: HealthCheckResult[];
}

export interface SubmitReportResult {
    id: string;
    created_at: string;
}

interface HealthCheckResult {
    domain: string;
    url: URL;
    status: "up" | "down" | "degraded";
    status_code: number;
    response_time_ms: number;
    is_ssl: boolean;
    ssl_expiry: string;
    ssl_days_left: string;
    error_message: string;
    content_length: number;
    timestamp: string;
    checked_at: string;
}

export interface QueryInput {
    environment?: string;
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface DailySummary {
    date: string; // e.g. "Jan 01 2024"
    status: "ok" | "error" | "partial"; // daily system health
    title: string; // e.g. "Major Outage", "Partial Outage", "Operational"
    description: string; // human-readable reason or context
    time_down: string;  // formatted downtime duration (e.g. "1h 30m")
}
