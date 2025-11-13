import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_KEY = process.env.SUPABASE_KEY!;
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const REPORTS_TABLE = process.env.REPORTS_TABLE || 'reports';
export const API_KEYS_TABLE = process.env.API_KEYS_TABLE || 'api_keys';
export const UPTIME_TABLE = process.env.UPTIME_TABLE || 'uptime_reports';
