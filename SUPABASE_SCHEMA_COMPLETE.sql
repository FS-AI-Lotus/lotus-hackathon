-- ============================================================
-- COMPLETE SUPABASE SCHEMA FOR COORDINATOR SERVICE
-- ============================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Run it to create all required tables and functions
-- ============================================================

-- ============================================================
-- PART 1: REGISTERED SERVICES TABLE
-- ============================================================
-- Stores all registered microservices in the Coordinator system

CREATE TABLE IF NOT EXISTS registered_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  endpoint TEXT NOT NULL,
  health_check VARCHAR(255) DEFAULT '/health',
  migration_file JSONB DEFAULT '{}',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_health_check TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registered_services_service_name ON registered_services(service_name);
CREATE INDEX IF NOT EXISTS idx_registered_services_status ON registered_services(status);
CREATE INDEX IF NOT EXISTS idx_registered_services_registered_at ON registered_services(registered_at DESC);

-- Add comments for documentation
COMMENT ON TABLE registered_services IS 'Stores registered microservices in the Coordinator system';
COMMENT ON COLUMN registered_services.id IS 'Unique identifier for the service';
COMMENT ON COLUMN registered_services.service_name IS 'Name of the microservice';
COMMENT ON COLUMN registered_services.version IS 'Version of the microservice';
COMMENT ON COLUMN registered_services.endpoint IS 'Base URL endpoint of the microservice';
COMMENT ON COLUMN registered_services.health_check IS 'Health check endpoint path';
COMMENT ON COLUMN registered_services.migration_file IS 'Migration schema/configuration as JSON';
COMMENT ON COLUMN registered_services.status IS 'Current status: active, inactive, etc.';

-- ============================================================
-- PART 2: KNOWLEDGE GRAPH TABLE
-- ============================================================
-- Stores the knowledge graph structure for service routing

CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on version for quick access
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_version ON knowledge_graph(version DESC);

-- Add comments
COMMENT ON TABLE knowledge_graph IS 'Stores the knowledge graph structure for service routing';
COMMENT ON COLUMN knowledge_graph.graph_data IS 'Complete knowledge graph structure as JSON';
COMMENT ON COLUMN knowledge_graph.version IS 'Version number of the graph';

-- ============================================================
-- PART 3: HELPER FUNCTIONS
-- ============================================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get latest knowledge graph
CREATE OR REPLACE FUNCTION get_latest_knowledge_graph()
RETURNS JSONB AS $$
  SELECT graph_data 
  FROM knowledge_graph 
  ORDER BY version DESC 
  LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================
-- PART 4: TRIGGERS
-- ============================================================

-- Trigger to automatically update updated_at for registered_services
CREATE TRIGGER update_registered_services_updated_at 
  BEFORE UPDATE ON registered_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for knowledge_graph
CREATE TRIGGER update_knowledge_graph_updated_at 
  BEFORE UPDATE ON knowledge_graph
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE registered_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;

-- Policy for registered_services: Allow all operations
-- ⚠️ For production, you should create more restrictive policies
-- Note: Despite the name, this policy allows ALL operations (not just authenticated)
-- because USING (true) and WITH CHECK (true) bypass authentication checks
CREATE POLICY "Allow all operations for authenticated users" 
  ON registered_services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy for knowledge_graph: Allow all operations
CREATE POLICY "Allow all operations for knowledge_graph" 
  ON knowledge_graph
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- ALTERNATIVE: More Secure Policies (Optional)
-- ============================================================
-- Uncomment these if you want more restrictive access:
-- 
-- -- Drop the permissive policies above first
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON registered_services;
-- DROP POLICY IF EXISTS "Allow all operations for knowledge_graph" ON knowledge_graph;
-- 
-- -- Public read access, authenticated write access
-- CREATE POLICY "Public read access for registered_services" 
--   ON registered_services
--   FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Authenticated write access for registered_services" 
--   ON registered_services
--   FOR INSERT, UPDATE, DELETE
--   USING (true)
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Public read access for knowledge_graph" 
--   ON knowledge_graph
--   FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Authenticated write access for knowledge_graph" 
--   ON knowledge_graph
--   FOR INSERT, UPDATE, DELETE
--   USING (true)
--   WITH CHECK (true);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the tables were created successfully:

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('registered_services', 'knowledge_graph');

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registered_services'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'knowledge_graph'
ORDER BY ordinal_position;

-- ============================================================
-- DONE! ✅
-- ============================================================
-- Your Supabase database is now ready for the Coordinator service!
-- 
-- Next steps:
-- 1. Get your Supabase URL and API key from Settings → API
-- 2. Set environment variables:
--    - SUPABASE_URL
--    - SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
-- 3. Restart your Coordinator service
-- ============================================================

