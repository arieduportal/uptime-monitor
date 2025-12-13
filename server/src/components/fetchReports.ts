import { supabase, REPORTS_TABLE } from "../config/config.js";
import { summarizeDomainData } from "../utils/summarizer.js";
import {
  getCachedSummaries,
  saveSummariesToCache,
} from "../utils/cacheSummary.js";
import type { HealthCheckResult } from "../../types.d.js";

export async function fetchReports(query: {
  domains?: string[];
  days?: number;
  useCache?: boolean;
}) {
  const days = query.days ?? 60;
  const domains = query.domains ?? [];

  if (query.useCache && domains.length > 0) {
    const cached = await getCachedSummaries(domains, days);
    if (cached.length > 0) {
      return groupByDomain(cached);
    }
  }

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase.rpc("get_reports_since", {
    days_back: days,
  });

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  const filteredData = data.map((row: any) => ({
    ...row,
    results: row.results.filter(
      (r: HealthCheckResult) =>
        domains.length === 0 || domains.includes(r.domain),
    ),
  }));

  const summaries = summarizeDomainData(filteredData, domains);

  if (query.useCache && domains.length > 0) {
    await saveSummariesToCache(summaries);
  }
  console.log("sinceDate:", sinceDate.toISOString());
  console.log("rows fetched:", data.length);
  console.log("first row timestamp:", data[0]?.timestamp);
  console.log("last row timestamp:", data[data.length - 1]?.timestamp);

  return summaries;
}

function groupByDomain(records: any[]) {
  const grouped: Record<string, any[]> = {};
  for (const rec of records) {
    if (!grouped[rec.domain]) grouped[rec.domain] = [];
    grouped[rec.domain]!.push({
      date: rec.date,
      status: rec.status,
      title: rec.title,
      description: rec.description,
      time_down: rec.time_down,
    });
  }
  return grouped;
}
