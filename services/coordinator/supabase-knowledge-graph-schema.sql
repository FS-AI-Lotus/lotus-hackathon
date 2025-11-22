-- Knowledge Graph Storage Schema for Supabase
-- Run this SQL in your Supabase SQL Editor after the main schema

-- Create knowledge_graph table to store the graph structure
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

-- Create trigger to update updated_at
CREATE TRIGGER update_knowledge_graph_updated_at 
  BEFORE UPDATE ON knowledge_graph
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;

-- Create policy for knowledge graph
CREATE POLICY "Allow all operations for knowledge graph" 
  ON knowledge_graph
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE knowledge_graph IS 'Stores the knowledge graph structure for service routing';
COMMENT ON COLUMN knowledge_graph.graph_data IS 'Complete knowledge graph structure as JSON';
COMMENT ON COLUMN knowledge_graph.version IS 'Version number of the graph';

-- Create function to get latest graph
CREATE OR REPLACE FUNCTION get_latest_knowledge_graph()
RETURNS JSONB AS $$
  SELECT graph_data 
  FROM knowledge_graph 
  ORDER BY version DESC 
  LIMIT 1;
$$ LANGUAGE SQL;


