-- =============================================================================
-- WARNING: This is a MASKED schema for GitHub.
-- Real table/column names are replaced with 'xxx' for security.
-- Do NOT use in production. Internal documentation only.
-- =============================================================================

-- =============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- =============================================================================
-- 
-- Option 1 — Supabase SQL Editor (Recommended)
--   1. Go to: https://app.supabase.com/project/<your-project>/sql
--   2. Click "New Query"
--   3. Paste the **REAL (unmasked) SQL** from your internal docs
--   4. Click "Run"
--
-- Option 2 — Supabase CLI
--   $ supabase db push --file schema.sql
--   (Use your real schema.sql — not this masked version)
--
-- Option 3 — Programmatically via API
--   curl -X POST https://<your-project>.supabase.co/rest/v1/rpc/execute_sql \
--     -H "apikey: <SUPABASE_SERVICE_KEY>" \
--     -H "Authorization: Bearer <SUPABASE_SERVICE_KEY>" \
--     -H "Content-Type: application/json" \
--     -d '{"sql": "<ESCAPED_REAL_SQL_HERE>"}'
--
-- NEVER commit real schema or service keys to GitHub.
-- =============================================================================


-- ============================
-- 1. Create xxx table (API Key Management)
-- ============================
CREATE TABLE IF NOT EXISTS xxx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xxx_hash ON xxx(key_hash);
CREATE INDEX IF NOT EXISTS idx_xxx_active ON xxx(is_active);

-- ============================
-- 2. Create xxx table (Monitoring Reports)
-- ============================
CREATE TABLE IF NOT EXISTS xxx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(255) NOT NULL,
  environment VARCHAR(100) DEFAULT 'production',
  total_checks INTEGER NOT NULL,
  uptime_count INTEGER NOT NULL,
  downtime_count INTEGER NOT NULL,
  degraded_count INTEGER NOT NULL,
  uptime_percent DECIMAL(5, 2) NOT NULL,
  average_latency_ms DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xxx_environment ON xxx(environment);
CREATE INDEX IF NOT EXISTS idx_xxx_timestamp ON xxx(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_xxx_created_at ON xxx(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xxx_results_domain ON xxx USING GIN ((results ->> 'domain'));

-- ============================
-- 3. Create xxx table (Daily Summary Cache)
-- ============================
CREATE TABLE IF NOT EXISTS xxx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  time_down INTERVAL,
  total_downtime INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, date)
);

CREATE INDEX IF NOT EXISTS idx_xxx_domain_date ON xxx(domain, date);
CREATE INDEX IF NOT EXISTS idx_xxx_status ON xxx(status);

-- ============================
-- 4. Auto-update updated_at trigger
-- ============================
CREATE OR REPLACE FUNCTION update_xxx_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_xxx_updated_at_1
  BEFORE UPDATE ON xxx
  FOR EACH ROW
  EXECUTE FUNCTION update_xxx_updated_at();

CREATE TRIGGER trig_xxx_updated_at_2
  BEFORE UPDATE ON xxx
  FOR EACH ROW
  EXECUTE FUNCTION update_xxx_updated_at();

CREATE TRIGGER trig_xxx_updated_at_3
  BEFORE UPDATE ON xxx
  FOR EACH ROW
  EXECUTE FUNCTION update_xxx_updated_at();

-- ============================
-- 5. Row Level Security (RLS)
-- ============================
ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;
ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;
ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;

-- ============================
-- 6. RLS Policies (Service Role Only)
-- ============================
CREATE POLICY "xxx full access - service_role"
  ON xxx
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "xxx full access - service_role"
  ON xxx
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "xxx full access - service_role"
  ON xxx
  FOR ALL
  USING (auth.role() = 'service_role');