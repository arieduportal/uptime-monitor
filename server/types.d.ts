export interface MonitorReport {
    service: string;
    environment: string;
    total_checks: number;
    uptime_count: number;
    downtime_count: number;
    degraded_count: number;
    uptime_percent: number;
    average_latency_ms: number;
    timestamp: string;
    results: ResultData[];
}

export interface SubmitReportResult {
    id: string;
    created_at: string;
}

interface ResultData {
    domain: string;
    url: URL;
    status: string;
    statusCode: number;
    responseTime: number;
    isSSL: boolean;
    sslExpiry: string;
    sslDaysLeft: string;
    errorMessage: string;
    contentLength: number;
    timestamp: string;
    checkedAt: string;
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
