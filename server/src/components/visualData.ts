import { CalendarDate, parseDateTime, today, getLocalTimeZone } from '@internationalized/date'
import { supabase, REPORTS_TABLE } from '../config/config.js';
import type { QueryInput } from '../../types.js';

export async function fetchVisualization(query: QueryInput) {
    let supabaseQuery = supabase
        .from(REPORTS_TABLE)
        .select('*', { count: 'exact' });

    if (query.environment) {
        supabaseQuery = supabaseQuery.eq('environment', query.environment);
    }

    if (query.from) {
        supabaseQuery = supabaseQuery.gte('timestamp', query.from);
    }

    if (query.to) {
        supabaseQuery = supabaseQuery.lte('timestamp', query.to);
    }

    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    const fetchAll = query.fetchAll === true;

    if (!fetchAll) {
        const limit = Math.min(query.limit || 50, 100);
        const offset = query.offset || 0;
        supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

        const { data, error, count } = await supabaseQuery;

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Database error: ${error.message}`);
        }

        const stats = await getStats(query.environment);
        const startDate = await getFirstReportDate(query.environment);
        if (startDate) {
            stats.startDate = startDate;
        }

        return {
            data: data || [],
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            },
            stats
        };
    } else {
        const { data, error, count } = await supabaseQuery;

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Database error: ${error.message}`);
        }

        const stats = await getStats(query.environment);
        const startDate = await getFirstReportDate(query.environment);
        if (startDate) {
            stats.startDate = startDate;
        }

        return {
            data: data || [],
            pagination: {
                total: count || 0,
                limit: count || 0, // Total records when fetching all
                offset: 0,
                hasMore: false
            },
            stats
        };
    }
}

async function getStats(environment?: string) {
    let query = supabase
        .from(REPORTS_TABLE)
        .select('uptime_percent, uptime_count, average_latency_ms, downtime_count, degraded_count');

    if (environment) {
        query = query.eq('environment', environment);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
        return {
            avgUptime: 0,
            avgLatency: 0,
            totalDowntimeIncidents: 0,
            reportCount: 0,
            startDate: today(getLocalTimeZone())
        };
    }

    const avgUptime = data.reduce((sum, r) => sum + r.uptime_percent, 0) / data.length;
    const avgLatency = data.reduce((sum, r) => sum + r.average_latency_ms, 0) / data.length;
    const totalDowntime = data.reduce((sum, r) => sum + r.downtime_count, 0);
    const totalDegraded = data.reduce((sum, r) => sum + (r.degraded_count || 0), 0);
    const totalUptime = data.reduce((sum, r) => sum + (r.uptime_count || 0), 0);
    const totalIncidents = totalDowntime + totalDegraded;

    return {
        avgUptime: Math.round(avgUptime * 100) / 100,
        avgLatency: Math.round(avgLatency * 100) / 100,
        totalIncidents,
        reportCount: data.length,
        startDate: today(getLocalTimeZone()),
        totalUptime,
        totalDegraded,
        totalDowntime
    };
}

async function getFirstReportDate(environment?: string) {
    let query = supabase
        .from(REPORTS_TABLE)
        .select('timestamp')
        .order('timestamp', { ascending: true })
        .limit(1);

    if (environment) {
        query = query.eq('environment', environment);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching first report date:', error);
        return null;
    }

    if (data && data.length > 0) {
        try {
            const parsed = parseDateTime(data[0]!.timestamp.split('T')[0]);
            return new CalendarDate(parsed.year, parsed.month, parsed.day);
        } catch (parseError) {
            console.error('Error parsing date:', parseError);
            return null;
        }
    }
    return null;
}