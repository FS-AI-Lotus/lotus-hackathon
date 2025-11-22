-- Supabase Schema for Coordinator Microservice
-- Run this SQL in your Supabase SQL Editor

-- Create the registered_services table
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

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_registered_services_updated_at 
  BEFORE UPDATE ON registered_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional, adjust based on your needs
ALTER TABLE registered_services ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
-- For production, you should create more restrictive policies
CREATE POLICY "Allow all operations for authenticated users" 
  ON registered_services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Or if you want public read access but authenticated write access:
-- CREATE POLICY "Public read access" 
--   ON registered_services
--   FOR SELECT
--   USING (true);
-- 
-- CREATE POLICY "Authenticated write access" 
--   ON registered_services
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE registered_services IS 'Stores registered microservices in the Coordinator system';
COMMENT ON COLUMN registered_services.id IS 'Unique identifier for the service';
COMMENT ON COLUMN registered_services.service_name IS 'Name of the microservice';
COMMENT ON COLUMN registered_services.version IS 'Version of the microservice';
COMMENT ON COLUMN registered_services.endpoint IS 'Base URL endpoint of the microservice';
COMMENT ON COLUMN registered_services.health_check IS 'Health check endpoint path';
COMMENT ON COLUMN registered_services.migration_file IS 'Migration schema/configuration as JSON';
COMMENT ON COLUMN registered_services.status IS 'Current status: active, inactive, etc.';


