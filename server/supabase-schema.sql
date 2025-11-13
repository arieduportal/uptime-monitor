-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
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

-- Create uptime_reports table
CREATE TABLE IF NOT EXISTS uptime_reports (
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

-- Create indexes
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_uptime_reports_environment ON uptime_reports(environment);
CREATE INDEX idx_uptime_reports_timestamp ON uptime_reports(timestamp DESC);
CREATE INDEX idx_uptime_reports_created_at ON uptime_reports(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply trigger to api_keys
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to uptime_reports
CREATE TRIGGER update_uptime_reports_updated_at
  BEFORE UPDATE ON uptime_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_reports ENABLE ROW LEVEL SECURITY;

-- Policies for api_keys (service role only)
CREATE POLICY "Service role full access to api_keys"
  ON api_keys
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for uptime_reports (service role only)
CREATE POLICY "Service role full access to uptime_reports"
  ON uptime_reports
  FOR ALL
  USING (auth.role() = 'service_role');
