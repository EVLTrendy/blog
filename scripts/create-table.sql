-- Create the short_urls table
CREATE TABLE IF NOT EXISTS short_urls (
  short_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the short_id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_short_urls_short_id ON short_urls(short_id); 